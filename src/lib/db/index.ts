import 'server-only';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import { env } from '@/env';
import * as schema from './schema';
import * as relations from './relations';

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

const pool =
  globalThis.__mysqlPool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    connectionLimit: env.DB_POOL_SIZE,
    waitForConnections: true,
    queueLimit: 0,
    charset: 'utf8mb4',
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__mysqlPool = pool;
}

export const db = drizzle(pool, {
  mode: 'default',
  schema: { ...schema, ...relations },
});
export type Database = typeof db;

export { pool };
