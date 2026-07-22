import type { ReactNode } from "react";

/**
 * Shared card wrapper used across the project detail page (Scope, Timeline,
 * Updates, Budget, etc). Plain presentational component — safe to import
 * from both server and client components.
 */
export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
  children:  ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
