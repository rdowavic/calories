import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { PhotoCandidate } from '@calories/shared';

const MIN_CONFIDENCE = 0.3;
const MAX_CANDIDATES = 5;

/**
 * Builds the Clarifai predict API URL for the food-item-recognition model.
 * Uses Clarifai's public community model, not the user's app.
 */
function getModelUrl(): string {
  return 'https://api.clarifai.com/v2/users/clarifai/apps/main/models/food-item-recognition/outputs';
}

/**
 * Recognizes food items in a base64-encoded image using Clarifai's
 * food-item-recognition model.
 *
 * Returns the top candidates (max 5) with confidence above 0.3.
 */
export async function recognizeFood(imageBase64: string): Promise<PhotoCandidate[]> {
  try {
    const response = await axios.post(
      getModelUrl(),
      {
        inputs: [
          {
            data: {
              image: {
                base64: imageBase64,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Key ${env.CLARIFAI_PAT}`,
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      }
    );

    const outputs = response.data?.outputs;
    if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
      logger.warn('Clarifai returned no outputs');
      return [];
    }

    const concepts = outputs[0]?.data?.concepts;
    if (!Array.isArray(concepts)) {
      logger.warn('Clarifai returned no concepts');
      return [];
    }

    const candidates: PhotoCandidate[] = concepts
      .filter((c: Record<string, unknown>) => Number(c.value ?? 0) >= MIN_CONFIDENCE)
      .slice(0, MAX_CANDIDATES)
      .map((c: Record<string, unknown>) => ({
        name: String(c.name ?? ''),
        confidence: Number(c.value ?? 0),
        clarifai_id: String(c.id ?? ''),
      }));

    logger.debug({ candidateCount: candidates.length }, 'Clarifai food recognition complete');
    return candidates;
  } catch (error) {
    logger.error({ error }, 'Clarifai recognizeFood failed');
    throw error;
  }
}
