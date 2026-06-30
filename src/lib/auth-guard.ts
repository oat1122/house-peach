import 'server-only';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import type { UserRole } from '@/lib/db/schema/users';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'unauthenticated' | 'forbidden',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireRole(
  roles: readonly UserRole[] = ['admin', 'editor'],
) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user) {
    // No middleware gate exists, so unauthenticated hits land here — send them
    // to login instead of surfacing an uncaught 500. redirect() throws NEXT_REDIRECT.
    redirect('/admin/login');
  }
  if (!role || !roles.includes(role)) {
    throw new AuthError('Forbidden', 'forbidden');
  }
  return { session, role };
}

export async function requireAdmin() {
  return requireRole(['admin']);
}
