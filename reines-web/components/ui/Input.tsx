import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:  string;
  error?:  string;
  hint?:   string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-[var(--text-secondary)]">
            {label}
            {required && <span className="ml-0.5 text-blue-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 caret-[#2d4a6b] placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:text-[var(--foreground)]",
            error
              ? "border-blue-400 bg-blue-50/30 focus:border-blue-400 focus:ring-blue-100 dark:bg-[#8fb9e8]/08"
              : "border-zinc-200 bg-white focus:border-[#8fb9e8]/60 focus:ring-[#8fb9e8]/20 dark:border-[var(--border)] dark:bg-[var(--surface)]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-blue-600 dark:text-[#8fb9e8]">{error}</p>}
        {!error && hint && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
