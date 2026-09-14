import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stripe-style buttons: small radius, 500-weight label, depth from a hairline
 * ring plus a one-pixel shadow rather than a heavy border.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-[var(--shadow-brand)] hover:bg-brand-600 active:bg-brand-700",
        secondary:
          "bg-white text-ink-700 shadow-[var(--shadow-button)] hover:bg-ink-25 hover:text-ink-900 active:bg-ink-50",
        ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
        danger:
          "bg-danger text-white shadow-[0_1px_1px_rgb(10_37_64/0.08)] hover:brightness-95 active:brightness-90",
        success:
          "bg-success text-white shadow-[0_1px_1px_rgb(10_37_64/0.08)] hover:brightness-95 active:brightness-90",
        link: "text-brand-600 hover:text-brand-700 hover:underline underline-offset-2",
      },
      size: {
        sm: "h-7 px-2.5 text-[13px]",
        md: "h-8 px-3 text-[13px]",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
