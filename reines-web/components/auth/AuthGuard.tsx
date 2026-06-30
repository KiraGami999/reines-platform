"use client";

// Placeholder for client-side route protection.
// Will use NextAuth session to redirect unauthenticated users.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // TODO: add session check with useSession() once auth providers are configured
  return <>{children}</>;
}
