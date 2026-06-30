"use client";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <span className="text-sm font-medium text-zinc-500">Reines Platform</span>
      <div className="flex items-center gap-3">
        {/* User avatar / signout will go here */}
        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </header>
  );
}
