import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthDesktopBrandLogo, AuthMobileBrandLogo } from "@/components/auth/AuthBrandLogo";

interface LoginPageProps {
  searchParams: Promise<{ registered?: string; error?: string; callbackUrl?: string }>;
}

export const metadata = { title: "Sign In – Reines Portal" };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

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
      <div className="flex flex-1 flex-col justify-center px-6 py-12 bg-zinc-50">
        <div className="mx-auto w-full max-w-sm">
          <AuthMobileBrandLogo />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in to access your Reines dashboard.</p>
          </div>

          {params.registered && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Account created successfully. Sign in with your email and password.
            </div>
          )}

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Reines Property Development Limited
          </p>
        </div>
      </div>
    </div>
  );
}
