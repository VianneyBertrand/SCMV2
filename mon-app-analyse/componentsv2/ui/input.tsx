import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    "w-full min-w-0 rounded-md bg-background px-4 outline-none transition-shadow",
    // Ring 1px neutral (default border)
    "ring-1 ring-neutral ring-inset",
    "placeholder:text-muted-foreground",
    "selection:bg-primary selection:text-primary-foreground",
    // États hover et pressed
    "hover:ring-neutral-hover",
    "active:ring-neutral-pressed",
    // Focus: ring 2px primary
    "focus-visible:ring-2 focus-visible:ring-primary",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-neutral",
    "file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "dark:bg-input/30",
  ],
  {
    variants: {
      size: {
        sm: "h-10 body-m file:h-7",   // 40px, body-m (16px)
        md: "h-14 body-m file:h-10",  // 56px, body-m (16px)
      },
      error: {
        true: "ring-destructive text-destructive placeholder:text-destructive/60 hover:ring-destructive focus-visible:ring-destructive",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, size, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-error={error || undefined}
      className={cn(inputVariants({ size, error }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
