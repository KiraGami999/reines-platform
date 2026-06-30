// Type definitions that mirror the Prisma User model.
// Use these in components and API routes for type safety without importing Prisma directly.

export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "CLIENT";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
}
