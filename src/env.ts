import 'server-only';
import { z } from 'zod';

const Env = z.object({
  DATABASE_URL: z.string().url(),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  UPLOAD_DIR: z.string().default('public/uploads'),
});

export const env = Env.parse(process.env);
export type Env = z.infer<typeof Env>;
