/**
 * Portal branding — which logo mark to show per authenticated role.
 *
 * - ADMIN (and any other role): Reines Property Development corporate wordmark
 * - CLIENT / PROJECT_MANAGER: Reines Project Mate wordmark
 */

export type PortalLogoMark = "corporate" | "project-mate";

/** Roles that use the Reines Project Mate portal brand. */
const PROJECT_MATE_ROLES = new Set(["CLIENT", "PROJECT_MANAGER"]);

export function getPortalLogoMark(role?: string | null): PortalLogoMark {
  if (role && PROJECT_MATE_ROLES.has(role)) return "project-mate";
  return "corporate";
}
