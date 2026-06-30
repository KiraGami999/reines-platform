import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role!)) redirect("/dashboard?error=unauthorized");

  return <>{children}</>;
}
