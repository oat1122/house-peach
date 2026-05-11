import 'server-only';
import pino from 'pino';

import { env } from '@/env';

export const log = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      'AUTH_SECRET',
      'DATABASE_URL',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        },
      }
    : {}),
});
