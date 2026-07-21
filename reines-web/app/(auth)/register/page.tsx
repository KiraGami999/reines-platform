import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthDesktopBrandLogo, AuthMobileBrandLogo } from "@/components/auth/AuthBrandLogo";
import { ShieldCheck, Eye, MessageSquare } from "lucide-react";

export const metadata = { title: "Create Account – Reines Portal" };

export default function RegisterPage() {
  const benefits = [
    { icon: <Eye size={16} />,          text: "Real-time project progress visibility" },
    { icon: <MessageSquare size={16} />, text: "Direct messaging with your project manager" },
    { icon: <ShieldCheck size={16} />,   text: "Secure, role-based access to your data" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#2d4a6b] p-12">
        <AuthDesktopBrandLogo />

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Your project. Your portal.</h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              The Reines portal gives you full visibility into your work — from foundation to finish.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center /15 text-[#8fb9e8]">
                  {b.icon}
                </div>
                <p className="text-sm text-zinc-300">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8fb9e8] hover:underline">Sign in here.</Link>
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 bg-zinc-50">
        <div className="mx-auto w-full max-w-sm">
          <AuthMobileBrandLogo />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">Create your Reines account to access your project portal.</p>
          </div>

          <RegisterForm />

          <p className="mt-8 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Reines Property Development Limited
          </p>
        </div>
      </div>
    </div>
  );
}
