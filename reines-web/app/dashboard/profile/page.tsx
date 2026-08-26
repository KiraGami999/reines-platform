import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Settings, ShieldCheck } from "lucide-react";
import { SettingsAccountPanel } from "@/components/dashboard/SettingsAccountPanel";

export const metadata = { title: "My Profile - Reines Portal" };

const roleLabels: Record<string, string> = {
  ADMIN:           "Admin",
  PROJECT_MANAGER: "Project Manager",
  CLIENT:          "Client",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const roleLabel = user.role ? roleLabels[user.role] ?? user.role : "User";
  const initials = (user.name ?? "User")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#35475D]">My Profile</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Your Reines portal identity — update your display name and password below.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#35475D] text-xl font-bold text-[#8fb9e8]">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-zinc-900">{user.name}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
              <Mail size={14} />
              {user.email}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck size={12} />
              {roleLabel}
            </span>
          </div>
        </div>
      </section>

      <SettingsAccountPanel initialName={user.name ?? ""} email={user.email ?? ""} />

      <Link
        href="/dashboard/settings"
        className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:bg-zinc-50"
      >
        <Settings className="mt-0.5 h-5 w-5 text-zinc-500" />
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            Appearance &amp; preferences <ArrowRight size={14} className="text-zinc-300" />
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Theme, notification guidance, and role shortcuts.
          </p>
        </div>
      </Link>
    </div>
  );
}
