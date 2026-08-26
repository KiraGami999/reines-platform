import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import {
  Apple,
  Bell,
  Check,
  GalleryHorizontal,
  Gift,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  Play,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Reines Project Mate — Client & Project Manager Portals",
  description:
    "Learn how to use the Reines Project Mate portals as a client or project manager — live project tracking, progress galleries, messaging, payments, and loyalty rewards. The mobile app is coming soon on Google Play and the App Store.",
};

const steps = [
  {
    icon: LogIn,
    title: "Sign In to Your Portal",
    body: "Open the Reines portal and sign in with the account Reines created for you. Clients and project managers each land in a role-specific dashboard.",
  },
  {
    icon: LayoutDashboard,
    title: "Open Your Dashboard",
    body: "See every active project, its current stage, and recent activity the moment you sign in — no chasing updates by phone or WhatsApp.",
  },
  {
    icon: GalleryHorizontal,
    title: "Track Progress",
    body: "Browse dated photo updates as your project manager documents work on site. Managers upload; clients review in the same shared gallery.",
  },
  {
    icon: Bell,
    title: "Stay In The Loop",
    body: "Message your counterpart inside the portal, follow milestones, and manage payments — all in one place, on any device with a browser.",
  },
] satisfies { icon: ElementType; title: string; body: string }[];

const features = [
  {
    icon: LayoutDashboard,
    title: "Live Project Dashboard",
    body: "Every active project, its current stage, and what's happening next — updated as work moves forward.",
  },
  {
    icon: GalleryHorizontal,
    title: "Progress Photo Gallery",
    body: "Dated photo updates as your project manager documents progress on site.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    body: "Message your project manager or client inside the portal — no more scattered WhatsApp threads.",
  },
  {
    icon: Wallet,
    title: "Payments & History",
    body: "Clients can review payment history and related balances without visiting the office.",
  },
  {
    icon: Gift,
    title: "Loyalty Rewards",
    body: "Clients earn and track loyalty points, redeemable against future work with Reines.",
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "Stay aware of new messages, milestones, and gallery uploads as they happen.",
  },
] satisfies { icon: ElementType; title: string; body: string }[];

const clientGuide = [
  {
    title: "Sign in as a client",
    body: "Use the email and password issued by Reines. After login you land on your client overview.",
  },
  {
    title: "Review your projects",
    body: "Open My Projects to see status, milestones, and overall progress for every active job.",
  },
  {
    title: "Browse the Progress Gallery",
    body: "Check dated site photos uploaded by your project manager whenever you want an update.",
  },
  {
    title: "Message your manager",
    body: "Use Messages for project questions and clarifications — conversations stay attached to the right project.",
  },
  {
    title: "Payments & Rewards",
    body: "View payment history and loyalty points from your portal account whenever you need them.",
  },
];

const managerGuide = [
  {
    title: "Sign in as a project manager",
    body: "Use your Reines manager credentials. Your dashboard shows only the projects assigned to you.",
  },
  {
    title: "Work from Assigned Projects",
    body: "Open each project for milestones, status, and the latest client activity.",
  },
  {
    title: "Update milestones",
    body: "Mark progress as stages complete so clients always see an accurate picture.",
  },
  {
    title: "Upload gallery photos",
    body: "Add dated site photos from the Progress Gallery so clients can follow work without site visits.",
  },
  {
    title: "Message clients",
    body: "Keep project communication inside Messages so updates stay organised and easy to find later.",
  },
];

function ComingSoonStores() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex cursor-default items-center gap-3 rounded-xl border border-white/15 px-4 py-2.5 opacity-80"
        aria-label="Coming soon on Google Play"
      >
        <Play size={20} className="text-zinc-300" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Coming soon on</span>
          <span className="text-sm font-bold text-zinc-200">Google Play</span>
        </span>
      </div>

      <div
        className="inline-flex cursor-default items-center gap-3 rounded-xl border border-white/15 px-4 py-2.5 opacity-80"
        aria-label="Coming soon to the Apple App Store"
      >
        <Apple size={20} className="text-zinc-300" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Coming soon to</span>
          <span className="text-sm font-bold text-zinc-200">App Store</span>
        </span>
      </div>
    </div>
  );
}

function PortalMock() {
  const rows = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: GalleryHorizontal, label: "Progress Gallery" },
    { icon: MessageCircle, label: "Messages" },
    { icon: Wallet, label: "Payments" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#1f3350] p-3 shadow-2xl shadow-black/40">
        <div className="overflow-hidden rounded-[1.35rem] bg-[#141f30]">
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
            <Image
              src="/project-mate-icon.png"
              alt="Reines Project Mate"
              width={36}
              height={36}
              className="rounded-lg shadow-md shadow-black/30"
            />
            <div>
              <p className="text-xs font-semibold text-white">Project Mate</p>
              <p className="text-[10px] text-zinc-400">Client & manager portals</p>
            </div>
          </div>
          <div className="space-y-2 px-4 py-5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8fb9e8]/15 text-[#8fb9e8]">
                  <row.icon size={16} strokeWidth={1.8} />
                </span>
                <span className="text-xs font-medium text-zinc-300">{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-10 hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-lg dark:bg-[var(--surface)] sm:-right-10 sm:flex">
        <Bell size={13} className="text-[#35475D] dark:text-[#8fb9e8]" />
        <span className="text-[11px] font-semibold text-[#35475D] dark:text-[#8fb9e8]">New milestone update</span>
      </div>
    </div>
  );
}

function GuideList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-[var(--border)] dark:bg-[var(--surface)]">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="flex gap-3 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0 dark:border-[var(--border)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#35475D] text-xs font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#35475D] dark:text-[#8fb9e8]">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ProjectMatePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#35475D] py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8fb9e8]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              Client & Project Manager Portals
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Reines Project Mate
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Your online home for live project tracking, progress photos, messaging, payments, and loyalty
              rewards. Sign in to the portal today — the dedicated mobile app for Android and iOS is coming
              soon.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#35475D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <LogIn size={16} strokeWidth={2.2} />
                Sign in to your portal
              </Link>
              <a
                href="#how-to-use"
                className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                How to use the portals
              </a>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Mobile app
              </p>
              <ComingSoonStores />
            </div>
          </div>

          <PortalMock />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14 dark:bg-[var(--background)] sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Getting Started</span>
            <h2 className="mt-2 text-3xl font-bold text-[#35475D] dark:text-[#8fb9e8]">How It Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-[var(--text-muted)]">
              From first sign-in to your latest site update, Project Mate keeps clients and managers aligned.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-[var(--border)] dark:bg-[var(--surface-muted)]">
                <span className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#35475D] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <step.icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-semibold text-[#35475D] dark:text-[#8fb9e8]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to use — client / manager */}
      <section id="how-to-use" className="scroll-mt-24 bg-zinc-50 py-14 dark:bg-[var(--surface-muted)] sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              Portal Guides
            </span>
            <h2 className="mt-2 text-3xl font-bold text-[#35475D] dark:text-[#8fb9e8]">How to Use Your Portal</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-[var(--text-muted)]">
              Follow the path that matches your role. Both portals share the same Reines account system — what
              you see depends on whether you are a client or a project manager.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-[var(--border)] dark:bg-[var(--surface)]">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <Wallet size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#35475D] dark:text-[#8fb9e8]">As a Client</h3>
                  <p className="text-xs text-zinc-500 dark:text-[var(--text-muted)]">Track your build without chasing updates</p>
                </div>
              </div>
              <GuideList items={clientGuide} />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-[var(--border)] dark:bg-[var(--surface)]">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <LayoutDashboard size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#35475D] dark:text-[#8fb9e8]">As a Project Manager</h3>
                  <p className="text-xs text-zinc-500 dark:text-[var(--text-muted)]">Keep assigned projects moving and visible</p>
                </div>
              </div>
              <GuideList items={managerGuide} />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#35475D] px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2A3A4D]"
            >
              <LogIn size={16} strokeWidth={2.2} />
              Go to portal sign-in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-14 dark:bg-[var(--background)] sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Features</span>
            <h2 className="mt-2 text-3xl font-bold text-[#35475D] dark:text-[#8fb9e8]">Everything in One Portal</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-[var(--text-muted)]">
              The same capabilities you&apos;ll get in the mobile app later are already available through the
              web portals today.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-[var(--border)] dark:bg-[var(--surface-muted)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <feature.icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 font-semibold text-[#35475D] dark:text-[#8fb9e8]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile app coming soon + CTA */}
      <section className="bg-[#35475D] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Image
            src="/logo-project-mate.png"
            alt="Reines Project Mate"
            width={720}
            height={163}
            className="mx-auto h-10 w-auto object-contain"
          />
          <h2 className="mt-6 text-3xl font-bold text-white">Use the portals now. Mobile app coming soon.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
            Sign in on any browser to manage projects today. Native apps for Google Play and the App Store are
            on the way — we&apos;ll update this page when they launch.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#35475D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
            >
              <LogIn size={16} strokeWidth={2.2} />
              Sign in to your portal
            </Link>
          </div>
          <div className="mt-8 flex justify-center">
            <ComingSoonStores />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-400">
            <Check size={14} className="text-[#8fb9e8]" strokeWidth={2.4} />
            Same login for web today and the app when it ships
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block text-sm font-semibold text-[#8fb9e8] underline-offset-4 hover:underline"
          >
            Need portal access or have questions? Contact us →
          </Link>
        </div>
      </section>
    </>
  );
}
