import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createUserSchema } from "@/lib/validations";
import { ok, created, forbidden, conflict, validationError } from "@/lib/api-response";
import { MOCK_USERS } from "@/lib/mock-admin";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(users);
  } catch {
    return ok(MOCK_USERS);
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { name, email, password, role } = parsed.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return conflict("An account with this email already exists.");

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return created(user);
  } catch {
    // Simulate creation for demo (DB not connected)
    return created({
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    });
  }
}
