import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db, pool } from '@/lib/db';
import { users, userRoleValues, type UserRole } from '@/lib/db/schema/users';

async function prompts(): Promise<{
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
}> {
  // Env-var mode for non-interactive callers (CI, scripts).
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
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

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (await rl.question('Admin email: ')).trim().toLowerCase();
    const name = (await rl.question('Display name: ')).trim() || null;
    const password = await rl.question('Password (min 12 chars): ');
    const roleInput = (await rl.question('Role (admin|editor) [admin]: ')).trim() || 'admin';
    if (!(userRoleValues as readonly string[]).includes(roleInput)) {
      throw new Error('Role must be "admin" or "editor"');
    }
    return { email, name, password, role: roleInput as UserRole };
  } finally {
    rl.close();
  }
}

async function main() {
  const { email, name, password, role } = await prompts();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email');
  }
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ name, role, passwordHash })
      .where(eq(users.id, existing.id));
    console.log(`Updated user #${existing.id} <${email}> (role=${role})`);
  } else {
    const result = await db.insert(users).values({ email, name, role, passwordHash });
    const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
    console.log(`Created user <${email}> (role=${role}) id=${insertId ?? '?'}`);
  }
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
