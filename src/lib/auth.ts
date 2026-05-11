import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { env } from '@/env';

/**
 * Phase 0 skeleton — Credentials provider scaffolding.
 *
 * DrizzleAdapter + users schema land in Phase 2. Until then `authorize` rejects
 * every login attempt but still performs a dummy bcrypt compare to keep timing
 * constant (defeats user enumeration). Replace DUMMY_HASH and wire the adapter
 * once `src/lib/db/schema/users.ts` exists.
 */
const DUMMY_HASH = '$2a$12$0000000000000000000000000000000000000000000000000000';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const password = String(credentials?.password ?? '');
        await bcrypt.compare(password, DUMMY_HASH);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = (user as { role?: 'admin' | 'editor' }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role && session.user) {
        (session.user as { role?: 'admin' | 'editor' }).role = token.role as
          | 'admin'
          | 'editor';
      }
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === '/admin/login') return true;
      if (pathname.startsWith('/admin')) return Boolean(auth?.user);
      return true;
    },
  },
});
