import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-m font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-pressed",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-pressed",
        outline:
          "ring-1 ring-inset ring-primary bg-transparent text-primary hover:ring-primary-hover hover:text-primary-hover active:ring-primary-pressed active:text-primary-pressed",
        "outline-accent":
          "ring-1 ring-inset ring-accent bg-transparent text-accent hover:ring-accent-hover hover:text-accent-hover active:ring-accent-pressed active:text-accent-pressed",
        "outline-destructive":
          "ring-1 ring-inset ring-destructive bg-transparent text-destructive hover:ring-destructive-hover hover:text-destructive-hover active:ring-destructive-pressed active:text-destructive-pressed",
        ghost:
          "bg-transparent text-primary hover:text-primary-hover active:text-primary-pressed",
        "ghost-accent":
          "bg-transparent text-accent hover:text-accent-hover active:text-accent-pressed",
        "ghost-destructive":
          "bg-transparent text-destructive hover:text-destructive-hover active:text-destructive-pressed",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-8 py-4 has-[>svg]:px-8",
        sm: "rounded-md gap-1.5 px-4 py-2 has-[>svg]:px-4",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      reversed: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Primary reversed
      {
        variant: "default",
        reversed: true,
        className: "bg-white text-primary hover:bg-white/90 active:bg-white/80",
      },
      {
        variant: "outline",
        reversed: true,
        className: "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
      },
      {
        variant: "ghost",
        reversed: true,
        className: "text-white hover:text-white/80 active:text-white/60",
      },
      // Accent reversed
      {
        variant: "accent",
        reversed: true,
        className: "bg-white text-accent hover:bg-white/90 active:bg-white/80",
      },
      {
        variant: "outline-accent",
        reversed: true,
        className: "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
      },
      {
        variant: "ghost-accent",
        reversed: true,
        className: "text-white hover:text-white/80 active:text-white/60",
      },
      // Destructive reversed
      {
        variant: "destructive",
        reversed: true,
        className: "bg-white text-destructive hover:bg-white/90 active:bg-white/80",
      },
      {
        variant: "outline-destructive",
        reversed: true,
        className: "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
      },
      {
        variant: "ghost-destructive",
        reversed: true,
        className: "text-white hover:text-white/80 active:text-white/60",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      reversed: false,
    },
  }
);

function Button({
  className,
  variant,
  size,
  reversed,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, reversed, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
