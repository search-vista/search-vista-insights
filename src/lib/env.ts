import { z } from 'zod'

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PSI_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
