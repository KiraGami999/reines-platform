import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb9e8]/50 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#2d4a6b] text-white hover:bg-[#1a2f4a]":   variant === "primary",
            "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300": variant === "secondary",
            "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900": variant === "ghost",
            "bg-blue-600 text-white hover:bg-blue-700":        variant === "danger",
          },
          {
            "h-8  px-3 text-xs":  size === "sm",
            "h-10 px-4 text-sm":  size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
