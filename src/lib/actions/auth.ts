'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/lib/auth';
import { SignInInput } from '@/lib/validation/auth';

export type SignInResult = { ok: true } | { ok: false; error: string };

/**
 * Server action for /admin/login. On success NextAuth's `signIn` throws the
 * NEXT_REDIRECT sentinel — we let that propagate (Next's runtime turns it
 * into a 303). AuthError (bad credentials) is caught and returned as a UI
 * message; anything else bubbles up so framework errors stay visible.
 */
export async function signInWithCredentials(
  input: unknown,
): Promise<SignInResult> {
  const parsed = SignInInput.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'ข้อมูลไม่ถูกต้อง' };
  }
  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/admin',
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin') {
        return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
      }
      return { ok: false, error: 'เข้าสู่ระบบไม่สำเร็จ' };
    }
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/admin/login' });
}
