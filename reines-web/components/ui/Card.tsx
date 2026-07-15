import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold leading-tight tracking-tight dark:text-[var(--foreground)]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-zinc-500 dark:text-[var(--text-muted)]", className)} {...props} />;
}
