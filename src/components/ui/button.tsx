import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold text-sm tracking-tight transition-colors duration-150 ease-[var(--ease-confident)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-xs hover:bg-primary-hover active:bg-primary-press",
        secondary: "bg-surface text-ink border border-border-strong hover:bg-surface-2",
        ghost: "bg-transparent text-ink-2 hover:bg-ink/5",
        danger: "bg-err text-white hover:bg-red-700",
        outline: "border border-border-strong bg-transparent text-ink hover:bg-surface-2",
      },
      size: {
        // Mobile-first: min 44px hit target (Apple HIG), desktop'da zichroq
        sm: "h-9 sm:h-8 px-3 text-[13px] rounded-sm",
        md: "h-11 sm:h-10 px-[18px]",
        lg: "h-12 px-[22px] text-base",
        icon: "h-11 w-11 sm:h-10 sm:w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
