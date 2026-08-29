/**
 * Hard ceiling on ADMIN accounts (includes the demo seed admin).
 * Safe to import from client components — no server-only deps.
 */
export const MAX_ADMINS = 5;

export const ADMIN_CAP_MESSAGE =
  `You can have at most ${MAX_ADMINS} admin accounts. Demote or delete an existing admin first.`;
