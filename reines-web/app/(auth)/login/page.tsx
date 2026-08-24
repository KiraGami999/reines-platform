import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthDesktopBrandLogo, AuthMobileBrandLogo } from "@/components/auth/AuthBrandLogo";

/** Server-only flag — avoid importing full auth for a simple env check. */
function isGoogleAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

interface LoginPageProps {
  searchParams: Promise<{ registered?: string; error?: string; callbackUrl?: string }>;
}

export const metadata = { title: "Sign In – Reines Portal" };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const googleEnabled = isGoogleAuthEnabled();

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#2d4a6b] p-12">
        <AuthDesktopBrandLogo />

        <div>
          <blockquote className="text-2xl font-semibold leading-snug text-white">
            &ldquo;Transparency and quality in every build — your project, your vision, our commitment.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-zinc-400">
            — Reines Property Development Limited
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Projects Completed", value: "15+" },
            { label: "Years Experience",   value: "3+"  },
            { label: "Client Satisfaction", value: "98%" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl sm:text-2xl font-extrabold text-[#8fb9e8]">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-zinc-50 px-6 pb-12 pt-20 sm:pt-24 lg:py-12">
        {/* Dark-mode ambient accent — soft brand blue glow behind the form */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-3rem] top-36 hidden h-44 w-44 rounded-full bg-[#8fb9e8]/30 blur-3xl dark:block sm:right-[-2rem] sm:top-40 sm:h-52 sm:w-52"
        />

        <div className="relative z-10 mx-auto w-full max-w-sm">
          <AuthMobileBrandLogo />

          <p className="mb-8 text-sm text-zinc-500">Sign in to access your Reines dashboard.</p>

          {params.registered && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Account created successfully. Sign in with your email and password
              {googleEnabled ? ", or continue with Google." : "."}
            </div>
          )}

          <Suspense>
            <LoginForm googleEnabled={googleEnabled} />
          </Suspense>

          <p className="mt-8 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Reines Property Development Limited
          </p>
        </div>
      </div>
    </div>
  );
}
