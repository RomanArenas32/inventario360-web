// Server-only: use exclusively in Server Components and Server Actions
import { cookies } from 'next/headers';

export type Session = {
  role: string;
  isOnboarded: boolean;
} | null;

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const role = cookieStore.get('inv360_role')?.value;

  if (!role) return null;

  return {
    role,
    isOnboarded: cookieStore.get('inv360_onboarded')?.value === 'true',
  };
}
