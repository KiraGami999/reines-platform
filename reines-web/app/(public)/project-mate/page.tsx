import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import {
  Apple,
  Bell,
  Download,
  GalleryHorizontal,
  Gift,
  LayoutDashboard,
  MessageCircle,
  Play,
  Wallet,
} from "lucide-react";

/**
 * Play Store URLs are deterministic from the app's package ID, so this link
 * is already correct for when the listing goes live — nothing to update here
 * once Google finishes verification, the app just needs to be published.
 */
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=mw.co.reines.portal";

export const metadata: Metadata = {
  title: "Reines Project Mate — Client & Project Manager App",
  description:
    "Reines Project Mate is the official mobile app for Reines Property Development clients and project managers — live project tracking, progress galleries, direct messaging, payments, and loyalty rewards, right from your phone.",
};

const steps = [
  {
    icon: Download,
    title: "Download & Sign In",
    body: "Install Reines Project Mate and sign in with your existing Reines account — the same login you already use on the web portal. No new sign-up needed.",
  },
  {
    icon: LayoutDashboard,
    title: "Open Your Dashboard",
    body: "See every active project, its current stage, and recent activity the moment you open the app.",
  },
  {
    icon: GalleryHorizontal,
    title: "Track Progress",
    body: "Browse dated photo updates as your project manager documents work on site — no need to visit or call for an update.",
  },
  {
    icon: Bell,
    title: "Stay In The Loop",
    body: "Message your project manager, get push notifications for milestones and updates, and manage payments — all in one place.",
  },
] satisfies { icon: ElementType; title: string; body: string }[];

const features = [
  {
    icon: LayoutDashboard,
    title: "Live Project Dashboard",
    body: "Every active project, its current stage, and what's happening next — updated in real time.",
  },
  {
    icon: GalleryHorizontal,
    title: "Progress Photo Gallery",
    body: "Dated photo updates as your project manager documents progress on site.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    body: "Message your project manager directly inside the app — no more scattered WhatsApp threads.",
  },
  {
    icon: Wallet,
    title: "Payments & History",
    body: "Make payments and review your full payment history without visiting the office.",
  },
  {
    icon: Gift,
    title: "Loyalty Rewards",
    body: "Clients earn and track loyalty points, redeemable against future work with Reines.",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    body: "Get notified the moment there's a new message, milestone, or gallery upload.",
  },
] satisfies { icon: ElementType; title: string; body: string }[];

const clientHighlights = [
  "Track your project's progress and milestones",
  "Browse the photo gallery as work is completed",
  "Message your project manager anytime",
  "Pay and view your full payment history",
  "Earn and redeem Loyalty Rewards points",
];

const managerHighlights = [
  "View every assigned project in one dashboard",
  "Update milestones as work is completed",
  "Upload progress photos straight from your phone",
  "Stay in touch with clients via in-app messaging",
  "Get notified about new assignments and updates",
];

function StoreBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      >
        <Play size={20} className="fill-[#2d4a6b] text-[#2d4a6b]" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Get it on</span>
          <span className="text-sm font-bold text-[#2d4a6b]">Google Play</span>
        </span>
      </a>

      <div
        className="inline-flex cursor-default items-center gap-3 rounded-xl border border-white/15 px-4 py-2.5 opacity-70"
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

function PhoneMock() {
  const rows = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: GalleryHorizontal, label: "Progress Gallery" },
    { icon: MessageCircle, label: "Messages" },
    { icon: Wallet, label: "Payments" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <div className="rounded-[2.5rem] border border-white/10 bg-[#1f3350] p-3 shadow-2xl shadow-black/40">
        <div className="overflow-hidden rounded-[2rem] bg-[#141f30]">
          <div className="flex flex-col items-center gap-3 px-6 pt-9 pb-6">
            <Image
              src="/project-mate-icon.png"
              alt="Reines Project Mate app icon"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg shadow-black/30"
            />
            <p className="text-sm font-semibold text-white">Reines Project Mate</p>
          </div>
          <div className="space-y-2 px-4 pb-7">
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

      <div className="absolute -right-3 top-8 hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-lg sm:-right-10 sm:flex">
        <Bell size={13} className="text-[#2d4a6b]" />
        <span className="text-[11px] font-semibold text-[#2d4a6b]">New milestone update</span>
      </div>
    </div>
  );
}

export default function ProjectMatePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#2d4a6b] py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8fb9e8]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              Your Projects. In Your Pocket.
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Reines Project Mate
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              The official mobile app for Reines clients and project managers. Track progress, browse photo
              updates, message your project manager, and manage payments — all from your phone, using the same
              account you already use on the web portal.
            </p>

            <div className="mt-7">
              <StoreBadges />
              <p className="mt-3 text-xs text-zinc-400">
                We&apos;re currently finishing Google Play&apos;s verification review. If the listing isn&apos;t
                live yet when you tap the button, check back shortly — the link above is already the app&apos;s
                permanent Play Store address.
              </p>
            </div>
          </div>

          <PhoneMock />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Getting Started</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">How It Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              From download to your first update, Reines Project Mate takes minutes to set up.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <span className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#2d4a6b] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <step.icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-semibold text-[#2d4a6b]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Features</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">Everything You Need, On the Go</h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <feature.icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 font-semibold text-[#2d4a6b]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Clients / Project Managers */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Built for Both Sides</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">Made for Clients and Project Managers</h2>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Wallet className="text-[#8fb9e8]" size={22} />
                <h3 className="text-lg font-bold text-[#2d4a6b]">For Clients</h3>
              </div>
              <ul className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
                {clientHighlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 border-b border-zinc-100 pb-3 text-sm font-semibold text-[#2d4a6b] last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/15 text-[#2d4a6b]">
                      <Bell size={12} strokeWidth={2.2} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <LayoutDashboard className="text-[#8fb9e8]" size={22} />
                <h3 className="text-lg font-bold text-[#2d4a6b]">For Project Managers</h3>
              </div>
              <ul className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
                {managerHighlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 border-b border-zinc-100 pb-3 text-sm font-semibold text-[#2d4a6b] last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/15 text-[#2d4a6b]">
                      <Bell size={12} strokeWidth={2.2} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Availability / CTA */}
      <section className="bg-[#2d4a6b] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Image
            src="/logo-project-mate.png"
            alt="Reines Project Mate"
            width={720}
            height={163}
            className="mx-auto h-10 w-auto object-contain"
          />
          <h2 className="mt-6 text-3xl font-bold text-white">Available now on Android. iOS is coming soon.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
            We&apos;re finishing up Google&apos;s app verification process. Download on Google Play below, and
            keep an eye on this page — an App Store link will appear here as soon as the iOS version is ready.
          </p>
          <div className="mt-7 flex justify-center">
            <StoreBadges />
          </div>
          <Link
            href="/contact"
            className="mt-8 inline-block text-sm font-semibold text-[#8fb9e8] underline-offset-4 hover:underline"
          >
            Have questions about the app? Contact us →
          </Link>
        </div>
      </section>
    </>
  );
}
