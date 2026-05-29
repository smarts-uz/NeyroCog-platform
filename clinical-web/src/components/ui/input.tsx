import { cn } from "@/lib/utils";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "block w-full h-10 px-3 rounded-md text-sm bg-surface text-ink border border-border-strong placeholder:text-ink-4",
        "transition-[border,box-shadow] duration-150 ease-[var(--ease-confident)]",
        "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20",
        "disabled:bg-surface-2 disabled:text-ink-3 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
