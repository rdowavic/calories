import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  ChatMessage,
  ChatContextType,
  ChatRole,
  ChatSSEActionEvent,
} from '@calories/shared';
import * as claudeClient from './claude.client';
import * as logService from './log.service';

/**
 * Loads recent chat messages for a user, optionally filtered by context type.
 */
export async function getConversationHistory(
  userId: string,
  contextType?: ChatContextType,
  limit: number = 20
): Promise<ChatMessage[]> {
  let query = db('chat_messages')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit);

  if (contextType) {
    query = query.where({ context_type: contextType });
  }

  const messages: ChatMessage[] = await query;
  return messages.reverse(); // Chronological order
}

/**
 * Saves a chat message to the database.
 */
export async function saveMessage(
  userId: string,
  role: ChatRole,
  content: string,
  contextType?: ChatContextType,
  metadata?: Record<string, unknown>,
  foodLogId?: string
): Promise<ChatMessage> {
  const [message] = await db('chat_messages')
    .insert({
      user_id: userId,
      role,
      content,
      context_type: contextType ?? null,
      food_log_id: foodLogId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
    })
    .returning('*');

  return message;
}

/**
 * Builds a system prompt appropriate for the given chat context type.
 */
export function buildSystemPrompt(
  contextType: ChatContextType,
  extraContext?: string
): string {
  const baseInstructions =
    'You are a friendly, knowledgeable calorie tracking assistant. ' +
    'Be concise and helpful. Use metric or imperial units based on user preference. ' +
    'Always confirm actions before taking them.';

  const prompts: Record<ChatContextType, string> = {
    onboarding: `${baseInstructions}

You are helping a new user set up their profile. Collect the following information conversationally, one or two pieces at a time:
- Height (ask in their preferred units)
- Current weight
- Age
- Gender (male, female, or other)
- Activity level (sedentary, lightly active, moderately active, very active, extra active)
- Goal weight

IMPORTANT: Use the set_onboarding_field tool to save EACH field AS SOON as the user provides it — do not wait until the end. For example, when the user tells you their height, immediately call set_onboarding_field with field="height_cm" and the value converted to centimeters. Same for every other field.

Be encouraging and explain briefly why each piece of information is helpful. Keep responses short — 1-2 sentences plus the next question. Validate that values are reasonable (e.g., height between 100-250cm, weight between 30-300kg, age between 13-120). When converting from imperial, use: 1 inch = 2.54 cm, 1 lb = 0.4536 kg.

Once all 6 fields have been collected, congratulate the user and let them know they're all set!`,

    food_logging: `${baseInstructions}

You are helping the user log food. You can:
- Search for foods using the search_food tool
- Suggest portion sizes
- Log food using the log_food tool after the user confirms

When the user describes what they ate:
1. Search for the food to get accurate nutrition data
2. Present the top result(s) with calorie and macro information
3. Ask the user to confirm the food and serving size
4. Only log after explicit confirmation

Do NOT ask the user about meal categories (breakfast, lunch, dinner, snack) — always use "snack" as the default meal_category when logging.

When responding, keep your messages clean and well-formatted. Put each question on its own line. Never concatenate separate questions or sentences without proper spacing.

If the description is ambiguous, ask clarifying questions about the specific food, brand, and preparation method.`,

    photo_narrowing: `${baseInstructions}

The user took a photo of their food and our image recognition identified these candidates:
${extraContext ?? '(no candidates provided)'}

Your job is to help narrow down what the food actually is. Ask specific clarifying questions about:
- The type of food (e.g., "Is this a chicken sandwich or a turkey sandwich?")
- Preparation method (e.g., "Is it grilled, fried, or baked?")
- Portion size (e.g., "How large is the portion?")
- Any sauces, toppings, or sides

Do NOT ask about meal categories — always use "snack" as the default.

Use the ask_narrowing_question tool to structure your questions. Once you have enough information, search for the food and help log it.`,

    general: `${baseInstructions}

You are a general calorie tracking assistant. You can help with:
- Answering nutrition questions
- Providing tips for healthy eating
- Explaining calorie and macro targets
- Discussing weight loss/gain strategies

You cannot make medical claims or provide medical advice. For medical questions, recommend consulting a healthcare professional.`,
  };

  return prompts[contextType] ?? prompts.general;
}

/**
 * Returns the Claude tool definitions for chat interactions.
 */
export function getChatTools(): Anthropic.Tool[] {
  return [
    {
      name: 'log_food',
      description:
        'Log a food item to the user\'s daily food diary. Only call this after the user explicitly confirms the food item and serving size.',
      input_schema: {
        type: 'object' as const,
        properties: {
          food_name: {
            type: 'string',
            description: 'Name of the food item',
          },
          brand_name: {
            type: 'string',
            description: 'Brand name if applicable',
          },
          external_food_id: {
            type: 'string',
            description: 'External food ID from the data source',
          },
          food_source: {
            type: 'string',
            enum: ['fatsecret', 'nutritionix', 'usda', 'manual'],
            description: 'Source of the food data',
          },
          calories: {
            type: 'number',
            description: 'Calorie count',
          },
          protein_g: {
            type: 'number',
            description: 'Protein in grams',
          },
          carbs_g: {
            type: 'number',
            description: 'Carbohydrates in grams',
          },
          fat_g: {
            type: 'number',
            description: 'Fat in grams',
          },
          serving_qty: {
            type: 'number',
            description: 'Number of servings',
          },
          serving_unit: {
            type: 'string',
            description: 'Serving unit (e.g., "cup", "piece", "g")',
          },
          meal_category: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Meal category — always use "snack" as default',
          },
        },
        required: [
          'food_name',
          'food_source',
          'calories',
          'serving_qty',
          'serving_unit',
        ],
      },
    },
    {
      name: 'search_food',
      description:
        'Search for a food item in the database to get accurate nutrition information.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'Food search query (e.g., "grilled chicken breast")',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'ask_narrowing_question',
      description:
        'Ask a clarifying question to narrow down photo recognition results. Use structured question format.',
      input_schema: {
        type: 'object' as const,
        properties: {
          question: {
            type: 'string',
            description: 'The clarifying question to ask the user',
          },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of answer choices for the user',
          },
          category: {
            type: 'string',
            enum: ['food_type', 'preparation', 'portion', 'ingredients'],
            description: 'Category of the clarifying question',
          },
        },
        required: ['question'],
      },
    },
    {
      name: 'set_onboarding_field',
      description:
        'Set a user profile field during onboarding. Call this as you collect each piece of information.',
      input_schema: {
        type: 'object' as const,
        properties: {
          field: {
            type: 'string',
            enum: [
              'height_cm',
              'current_weight_kg',
              'goal_weight_kg',
              'age',
              'gender',
              'activity_level',
            ],
            description: 'The profile field to set',
          },
          value: {
            description: 'The value to set',
          },
        },
        required: ['field', 'value'],
      },
    },
  ];
}

/**
 * Processes the Claude stream response, saves the assistant message to DB,
 * handles tool calls (with continuation), and writes SSE events to the Express Response object.
 *
 * When Claude makes tool calls, we execute them, send results back to Claude,
 * and stream its follow-up response. This loops until Claude responds with just text.
 */
export async function processStreamResponse(
  userId: string,
  stream: AsyncIterable<claudeClient.StreamChunk>,
  contextType: ChatContextType,
  res: Response,
  localDate?: string
): Promise<void> {
  const MAX_TOOL_ROUNDS = 5; // Safety limit to prevent infinite loops
  let allText = '';

  try {
    // Build the current conversation for potential continuation
    const history = await getConversationHistory(userId, contextType);
    const systemPrompt = buildSystemPrompt(contextType);
    const tools = getChatTools();

    // Convert history to Anthropic message format
    const messages: claudeClient.AnthropicMessage[] = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let currentStream = stream;
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      round++;
      let roundText = '';
      const toolCalls: Array<{ name: string; id: string; input: unknown }> = [];

      // Consume the stream
      for await (const chunk of currentStream) {
        if (chunk.type === 'text' && chunk.text) {
          roundText += chunk.text;
          const sseData = JSON.stringify({ text: chunk.text });
          res.write(`event: token\ndata: ${sseData}\n\n`);
        } else if (chunk.type === 'tool_use' && chunk.name) {
          toolCalls.push({
            name: chunk.name,
            id: chunk.id!,
            input: chunk.input,
          });
        }
      }

      allText += roundText;

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        break;
      }

      // Execute tool calls and collect results
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];
      for (const toolCall of toolCalls) {
        const actionResult = await handleToolCall(userId, toolCall, contextType, localDate);

        if (actionResult) {
          const sseData = JSON.stringify(actionResult);
          res.write(`event: action\ndata: ${sseData}\n\n`);
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(actionResult || { success: true }),
        });
      }

      // Build the assistant message content blocks for the API
      const assistantContent: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }> = [];
      if (roundText) {
        assistantContent.push({ type: 'text', text: roundText });
      }
      for (const tc of toolCalls) {
        assistantContent.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      }

      // Add assistant message with tool calls + user message with tool results
      messages.push({ role: 'assistant', content: assistantContent });
      messages.push({ role: 'user', content: toolResults });

      // Continue the conversation with Claude
      currentStream = claudeClient.streamWithToolResults(systemPrompt, messages, tools);
    }

    // Save the full assistant response to DB
    if (allText) {
      await saveMessage(userId, 'assistant', allText, contextType);
    }

    // Send done event
    res.write(`event: done\ndata: {}\n\n`);
  } catch (error) {
    logger.error({ error, userId, contextType }, 'Error processing chat stream');

    const errMsg =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    const sseError = JSON.stringify({ message: errMsg });
    res.write(`event: error\ndata: ${sseError}\n\n`);
  }
}

/**
 * Handles a tool call from Claude and returns an action event to send via SSE.
 */
async function handleToolCall(
  userId: string,
  toolCall: { name: string; id: string; input: unknown },
  contextType: ChatContextType,
  localDate?: string
): Promise<ChatSSEActionEvent | null> {
  const input = toolCall.input as Record<string, unknown>;

  switch (toolCall.name) {
    case 'log_food': {
      // Use client's local date if provided, otherwise fall back to UTC
      const today = localDate || new Date().toISOString().split('T')[0];
      const log = await logService.createLog(userId, {
        food_name: String(input.food_name ?? ''),
        brand_name: input.brand_name ? String(input.brand_name) : undefined,
        external_food_id: input.external_food_id
          ? String(input.external_food_id)
          : undefined,
        food_source: (input.food_source as 'fatsecret' | 'nutritionix' | 'usda' | 'manual') ?? 'manual',
        calories: Number(input.calories ?? 0),
        protein_g: Number(input.protein_g ?? 0),
        carbs_g: Number(input.carbs_g ?? 0),
        fat_g: Number(input.fat_g ?? 0),
        serving_qty: Number(input.serving_qty ?? 1),
        serving_unit: String(input.serving_unit ?? 'serving'),
        meal_category: (input.meal_category as 'breakfast' | 'lunch' | 'dinner' | 'snack') ?? 'snack',
        logged_date: today,
        input_method: 'search',
      });

      return {
        type: 'log_confirmed',
        data: {
          log_id: log.id,
          food_name: log.food_name,
          calories: log.calories,
          meal_category: log.meal_category,
        },
      };
    }

    case 'search_food': {
      // Import dynamically to avoid circular dependency
      const foodService = await import('./food.service');
      const results = await foodService.searchFoods(
        String(input.query ?? ''),
        0
      );

      return {
        type: 'food_suggestion',
        data: {
          query: input.query,
          results: results.slice(0, 5),
        },
      };
    }

    case 'ask_narrowing_question': {
      return {
        type: 'narrowing_question',
        data: {
          question: String(input.question ?? ''),
          options: input.options ?? [],
          category: input.category ?? 'food_type',
        },
      };
    }

    case 'set_onboarding_field': {
      const field = String(input.field ?? '');
      const value = input.value;

      const allowedFields = [
        'height_cm',
        'current_weight_kg',
        'goal_weight_kg',
        'age',
        'gender',
        'activity_level',
      ];

      if (!allowedFields.includes(field)) {
        logger.warn({ field, userId }, 'Invalid onboarding field');
        return null;
      }

      await db('users')
        .where({ id: userId })
        .update({
          [field]: value,
          updated_at: db.fn.now(),
        });

      // Check if all onboarding fields are now filled
      const user = await db('users').where({ id: userId }).first();
      const requiredFields = ['height_cm', 'current_weight_kg', 'goal_weight_kg', 'age', 'gender', 'activity_level'];
      const allFilled = requiredFields.every((f) => user[f] != null && user[f] !== '');

      if (allFilled && !user.onboarding_completed) {
        await db('users')
          .where({ id: userId })
          .update({
            onboarding_completed: true,
            updated_at: db.fn.now(),
          });

        return {
          type: 'onboarding_complete',
          data: { field, value, onboarding_completed: true },
        };
      }

      return {
        type: 'onboarding_field',
        data: { field, value },
      };
    }

    default:
      logger.warn({ toolName: toolCall.name }, 'Unknown tool call from Claude');
      return null;
  }
}
