import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users, userRoleValues, type UserRole } from '@/lib/db/schema/users';

export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 12;

export type AdminInput = {
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
};

/** Read admin credentials from env (ADMIN_*). Returns null if not configured. */
export function adminFromEnv(): AdminInput | null {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return null;
  const role = (process.env.ADMIN_ROLE ?? 'admin') as UserRole;
  if (!(userRoleValues as readonly string[]).includes(role)) {
    throw new Error('ADMIN_ROLE must be "admin" or "editor"');
  }
  return {
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    name: process.env.ADMIN_NAME?.trim() || null,
    password: process.env.ADMIN_PASSWORD,
    role,
  };
}

/** Validate, hash, and upsert (by email) a single admin/editor user. */
export async function upsertAdmin(
  input: AdminInput,
): Promise<{ id: number; created: boolean }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new Error('Invalid email');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ name: input.name, role: input.role, passwordHash })
      .where(eq(users.id, existing.id));
    return { id: existing.id, created: false };
  }

  const result = await db
    .insert(users)
    .values({ email: input.email, name: input.name, role: input.role, passwordHash });
  const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  return { id: insertId ?? 0, created: true };
}
