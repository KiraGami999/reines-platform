import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type LogAdminActionInput = {
  actor: AuditActor | null | undefined;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * Append an admin change to AuditLog. Never throws to the caller — logging
 * failures must not break the mutation that just succeeded.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId:    input.actor?.id    ?? null,
        actorName:  input.actor?.name  ?? null,
        actorEmail: input.actor?.email ?? null,
        actorRole:  input.actor?.role  ?? null,
        action:     input.action,
        entityType: input.entityType,
        entityId:   input.entityId ?? null,
        summary:    input.summary,
        metadata:   (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("[audit-log] Failed to record action:", input.action, err);
  }
}

/** Fire-and-forget wrapper for route handlers. */
export function recordAdminAction(input: LogAdminActionInput): void {
  void logAdminAction(input);
}
