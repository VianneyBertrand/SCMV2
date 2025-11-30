"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        // Base
        "peer size-5 shrink-0 rounded-full border bg-transparent transition-colors outline-none",
        // Default state
        "border-primary",
        // Hover state
        "hover:border-primary-hover",
        // Pressed state
        "active:border-primary-pressed",
        // Checked state
        "data-[state=checked]:border-primary",
        // Checked + Hover
        "data-[state=checked]:hover:border-primary-hover",
        // Checked + Pressed
        "data-[state=checked]:active:border-primary-pressed",
        // Disabled state
        "disabled:border-muted disabled:bg-muted disabled:cursor-not-allowed",
        // Focus
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <CircleIcon className="size-2.5 fill-primary stroke-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
