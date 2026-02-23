import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export type AnthropicMessage = Anthropic.MessageParam;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'tool_use';
  text?: string;
  name?: string;
  id?: string;
  input?: unknown;
}

/**
 * Streams a Claude response given a system prompt, message history, and optional tools.
 * Returns an async iterable that yields text and tool_use chunks.
 */
export async function* streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  tools?: Anthropic.Tool[]
): AsyncIterable<StreamChunk> {
  try {
    const params: Anthropic.MessageCreateParams = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
    }

    const stream = anthropic.messages.stream(params);

    let currentToolName: string | undefined;
    let currentToolId: string | undefined;
    let currentToolInput = '';

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          currentToolName = block.name;
          currentToolId = block.id;
          currentToolInput = '';
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (delta.type === 'text_delta') {
          yield { type: 'text', text: delta.text };
        } else if (delta.type === 'input_json_delta') {
          currentToolInput += delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolName && currentToolId) {
          let parsedInput: unknown = {};
          try {
            if (currentToolInput) {
              parsedInput = JSON.parse(currentToolInput);
            }
          } catch {
            logger.warn(
              { toolName: currentToolName, rawInput: currentToolInput },
              'Failed to parse tool input JSON'
            );
          }

          yield {
            type: 'tool_use',
            name: currentToolName,
            id: currentToolId,
            input: parsedInput,
          };

          currentToolName = undefined;
          currentToolId = undefined;
          currentToolInput = '';
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Claude streamChat failed');
    throw error;
  }
}

/**
 * Continues a conversation after tool use by sending tool results back to Claude.
 * Returns an async iterable of text and tool_use chunks (same as streamChat).
 */
export async function* streamWithToolResults(
  systemPrompt: string,
  messages: AnthropicMessage[],
  tools?: Anthropic.Tool[]
): AsyncIterable<StreamChunk> {
  try {
    const params: Anthropic.MessageCreateParams = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
    }

    const stream = anthropic.messages.stream(params);

    let currentToolName: string | undefined;
    let currentToolId: string | undefined;
    let currentToolInput = '';

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          currentToolName = block.name;
          currentToolId = block.id;
          currentToolInput = '';
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (delta.type === 'text_delta') {
          yield { type: 'text', text: delta.text };
        } else if (delta.type === 'input_json_delta') {
          currentToolInput += delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolName && currentToolId) {
          let parsedInput: unknown = {};
          try {
            if (currentToolInput) {
              parsedInput = JSON.parse(currentToolInput);
            }
          } catch {
            logger.warn(
              { toolName: currentToolName, rawInput: currentToolInput },
              'Failed to parse tool input JSON'
            );
          }

          yield {
            type: 'tool_use',
            name: currentToolName,
            id: currentToolId,
            input: parsedInput,
          };

          currentToolName = undefined;
          currentToolId = undefined;
          currentToolInput = '';
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Claude streamWithToolResults failed');
    throw error;
  }
}
