import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import bcrypt from 'bcryptjs';

/**
 * Creates an admin user via bcrypt-hashed password.
 *
 * Phase 0 stub — once `users` table lands in Phase 2, swap the TODO block for
 * a drizzle `db.insert(users)` call. Keep the prompt-driven flow: no env-var
 * passwords (they leak to shell history), no plaintext storage, ever.
 */
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (await rl.question('Admin email: ')).trim().toLowerCase();
    const name = (await rl.question('Display name: ')).trim();
    const password = await rl.question('Password (min 12 chars): ');
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }
    const role = ((await rl.question('Role (admin|editor) [admin]: ')) || 'admin').trim();
    if (role !== 'admin' && role !== 'editor') {
      throw new Error('Role must be "admin" or "editor"');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    // TODO(Phase 2): db.insert(users).values({ email, name, role, passwordHash })
    console.log('\nReady to insert:');
    console.log({ email, name, role, passwordHash });
    console.log('\nNote: users schema not yet defined — wire DB insert in Phase 2.');
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
