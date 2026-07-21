import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  FolderKanban,
  LockKeyhole,
  Mail,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata = { title: "Settings - Reines Portal" };

const roleLabels: Record<string, string> = {
  ADMIN:           "Admin",
  PROJECT_MANAGER: "Project Manager",
  CLIENT:          "Client",
};

export default async function SettingsPage() {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2d4a6b]">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Review account access and portal preferences for your Reines dashboard.
        </p>
      </div>

      {/* Appearance — Light / Dark (navy) / System */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center /10 text-[#2d4a6b] dark:bg-zinc-800 dark:text-zinc-400">
              <Moon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Appearance</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                Choose light, dark, or match your device. Dark mode uses a black
                base with Reines navy and light-blue accents so the brand stays
                clear on both the website and the mobile app.
              </p>
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-64">
            <ThemeToggle />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2d4a6b] text-base font-bold text-[#8fb9e8]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-zinc-900">{user.name}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <Mail size={14} />
                {user.email}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <ShieldCheck className="h-5 w-5 text-zinc-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-800">Role-based access</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Your dashboard tools are controlled by the role assigned by an admin.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <LockKeyhole className="h-5 w-5 text-zinc-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-800">Password changes</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                For now, password resets are handled by an admin through user management.
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <Settings className="h-5 w-5 text-zinc-500" />
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">Portal Status</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Appearance syncs across the portal and the mobile app WebViews on this device.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <Bell className="h-5 w-5 text-zinc-500" />
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">Notifications</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Email and in-app notification preferences can be added once delivery rules are confirmed.
            </p>
          </div>
        </aside>
      </div>

      {user.role === "PROJECT_MANAGER" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Project Manager Shortcuts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Assigned projects", href: "/dashboard/manage/projects", icon: FolderKanban },
              { label: "Milestones",        href: "/dashboard/milestones",       icon: ShieldCheck },
              { label: "Messages",          href: "/dashboard/messages",         icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  <Icon size={16} className="text-zinc-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <UserCircle className="mt-0.5 h-5 w-5 text-zinc-500" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Profile Editing</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              This screen currently shows verified account details. Editable profile fields can be added once the client confirms which user details should be self-managed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
