import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-ink-2 border-border",
        primary: "bg-primary-soft text-primary-press border-primary/20",
        ok: "bg-ok-bg text-green-900 border-ok/20",
        warn: "bg-warn-bg text-amber-900 border-warn/20",
        err: "bg-err-bg text-red-900 border-err/20",
        info: "bg-info-bg text-blue-900 border-info/20",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  dot?: boolean;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className, tone, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(pillVariants({ tone, className }))} {...props}>
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-pill",
            tone === "primary" && "bg-primary",
            tone === "ok" && "bg-ok",
            tone === "warn" && "bg-warn",
            tone === "err" && "bg-err",
            tone === "info" && "bg-info",
            (!tone || tone === "neutral") && "bg-ink-3",
          )}
        />
      ) : null}
      {children}
    </span>
  ),
);
Pill.displayName = "Pill";
