import { Response } from 'express';
import { ChatContextType } from '@calories/shared';
import { AuthRequest } from '../middleware/auth';
import * as chatService from '../services/chat.service';
import * as claudeClient from '../services/claude.client';

export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { message, context_type = 'food_logging', local_date } = req.body;
  const ctx = context_type as ChatContextType;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // Save user message
    await chatService.saveMessage(userId, 'user', message, ctx);

    // Build conversation context
    const history = await chatService.getConversationHistory(userId, ctx);
    const systemPrompt = chatService.buildSystemPrompt(ctx);
    const tools = chatService.getChatTools();

    // Create Claude stream
    const stream = claudeClient.streamChat(
      systemPrompt,
      history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      tools
    );

    // Process the stream and write SSE events to the response
    await chatService.processStreamResponse(userId, stream, ctx, res, local_date);
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to process message' })}\n\n`);
  } finally {
    res.end();
  }
}
