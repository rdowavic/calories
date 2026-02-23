import { randomUUID } from 'crypto';
import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';
import { env } from '../config/env';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Recognizes food in an uploaded photo using Claude's vision capability.
 * Returns a list of detected food items with confidence levels.
 */
export async function recognizeFood(req: AuthRequest, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    // Support both multipart file upload AND JSON base64 body
    let imageBase64: string;
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    let fileSize: number;

    if (file) {
      // Multipart upload (from curl, web, etc.)
      imageBase64 = file.buffer.toString('base64');
      mediaType = (file.mimetype || 'image/jpeg') as typeof mediaType;
      fileSize = file.size;
    } else if (req.body?.imageBase64) {
      // JSON base64 upload (from mobile app)
      imageBase64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      mediaType = (req.body.mimeType || 'image/jpeg') as typeof mediaType;
      fileSize = Math.round(imageBase64.length * 0.75);
    } else {
      return res.status(400).json({ success: false, error: 'Image file is required (multipart or base64)' });
    }

    const sessionId = randomUUID();

    logger.info(
      { userId: req.userId, fileSize, mimeType: mediaType },
      'Photo recognition request received'
    );

    let candidates: Array<{ name: string; confidence: number }> = [];

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Identify all food and drink items in this photo. Return ONLY a JSON array of objects with "name" (common food name) and "confidence" (0-1 float). Example: [{"name": "banana", "confidence": 0.95}]. If no food is visible, return []. Return ONLY valid JSON, no other text.',
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        // Extract JSON from the response (Claude might wrap it in markdown)
        let jsonStr = textBlock.text.trim();
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          candidates = parsed
            .filter((c: any) => c.name && typeof c.confidence === 'number')
            .slice(0, 5);
        }
      }
    } catch (visionError) {
      logger.warn({ error: visionError, userId: req.userId }, 'Claude vision recognition failed');
    }

    logger.info(
      { userId: req.userId, candidateCount: candidates.length, sessionId, candidates },
      'Photo recognition complete'
    );

    res.json({
      success: true,
      data: {
        candidates,
        session_id: sessionId,
      },
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Photo recognition failed');
    res.status(500).json({ success: false, error: 'Photo recognition failed' });
  }
}
