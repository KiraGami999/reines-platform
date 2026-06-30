import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="text-center max-w-md">
        {/* Brand mark */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2d4a6b] mb-6">
          <span className="text-3xl font-black text-[#8fb9e8]">R</span>
        </div>

        <h1 className="text-6xl font-extrabold text-[#2d4a6b]">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-zinc-800">Page not found</h2>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#2d4a6b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
