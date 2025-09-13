import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().min(10),
  OPENAI_BASE_URL: z.string().url().optional(),
  KMA_SERVICE_KEY: z.string().optional(),
  KMA_BASE_URL: z.string().url().optional(),
  WEATHER_API_KEY: z.string().optional(),
  TENANT_ID_DEFAULT: z.string().uuid().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env as any);

export type Env = z.infer<typeof envSchema>;
