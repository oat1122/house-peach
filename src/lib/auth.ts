import 'server-only';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

import { env } from '@/env';
import { db } from '@/lib/db';
import { users, type UserRole } from '@/lib/db/schema/users';
import { log } from '@/lib/log';

// Constant-time dummy hash used when the requested email doesn't exist —
// keeps `authorize` latency uniform so attackers can't enumerate accounts.
const DUMMY_HASH =
  '$2a$12$CwTycUXWue0Thq9StjUM0uJ8.Q2k.j6yvJ4qz8.GBnW6sQq2T.0py';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
    };
  }
  interface User {
    role?: UserRole;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: UserRole;
    uid?: string;
  }
}

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
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const [row] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
            role: users.role,
            passwordHash: users.passwordHash,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const hash = row?.passwordHash ?? DUMMY_HASH;
        const ok = await bcrypt.compare(password, hash);
        if (!row || !ok || !row.passwordHash) {
          log.warn({ email }, 'sign-in rejected');
          return null;
        }

        return {
          id: String(row.id),
          email: row.email,
          name: row.name ?? undefined,
          image: row.image ?? undefined,
          role: row.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id ? String(user.id) : token.uid;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? '';
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === '/admin/login') return true;
      if (pathname.startsWith('/admin')) {
        return Boolean(auth?.user && (auth.user as { role?: UserRole }).role);
      }
      return true;
    },
  },
});
