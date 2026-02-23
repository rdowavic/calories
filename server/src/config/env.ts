import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID_WEB: z.string().min(1),
  GOOGLE_CLIENT_ID_IOS: z.string().default(''),
  GOOGLE_CLIENT_ID_ANDROID: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().min(1),
  CLARIFAI_PAT: z.string().default(''),
  CLARIFAI_USER_ID: z.string().default(''),
  CLARIFAI_APP_ID: z.string().default(''),
  FATSECRET_CONSUMER_KEY: z.string().default(''),
  FATSECRET_CONSUMER_SECRET: z.string().default(''),
  NUTRITIONIX_APP_ID: z.string().default(''),
  NUTRITIONIX_APP_KEY: z.string().default(''),
  USDA_API_KEY: z.string().default(''),
  ADMIN_EMAILS: z.string().default(''),

  // Feature flags (set to "true" or "false")
  FEATURE_NUTRITIONIX: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_CLARIFAI: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_USDA: z.string().default('true').transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
