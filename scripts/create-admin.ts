import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { pool } from '@/lib/db';
import { userRoleValues, type UserRole } from '@/lib/db/schema/users';
import { adminFromEnv, upsertAdmin, MIN_PASSWORD_LENGTH, type AdminInput } from './_admin';

async function prompts(): Promise<AdminInput> {
  // Env-var mode for non-interactive callers (CI, scripts).
  const fromEnv = adminFromEnv();
  if (fromEnv) return fromEnv;

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (await rl.question('Admin email: ')).trim().toLowerCase();
    const name = (await rl.question('Display name: ')).trim() || null;
    const password = await rl.question(`Password (min ${MIN_PASSWORD_LENGTH} chars): `);
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
  const { id, created } = await upsertAdmin(await prompts());
  console.log(`${created ? 'Created' : 'Updated'} admin user #${id}`);
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
