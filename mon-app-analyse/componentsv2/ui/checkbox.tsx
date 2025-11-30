"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base
        "peer size-5 shrink-0 rounded-[4px] border bg-transparent transition-colors outline-none",
        // Default state
        "border-primary",
        // Hover state
        "hover:border-primary-hover",
        // Pressed state
        "active:border-primary-pressed",
        // Checked state
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white",
        // Checked + Hover
        "data-[state=checked]:hover:bg-primary-hover data-[state=checked]:hover:border-primary-hover",
        // Checked + Pressed
        "data-[state=checked]:active:bg-primary-pressed data-[state=checked]:active:border-primary-pressed",
        // Disabled state
        "disabled:border-muted disabled:bg-muted disabled:cursor-not-allowed",
        "disabled:data-[state=checked]:bg-muted disabled:data-[state=checked]:border-muted disabled:data-[state=checked]:text-muted-foreground",
        // Focus
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
