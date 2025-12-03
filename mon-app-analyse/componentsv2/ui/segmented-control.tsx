"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * SegmentedControl
 * 
 * A single-select toggle group styled as a segmented control.
 * Always has one item selected (no deselection).
 * 
 * @example
 * <SegmentedControl value={value} onValueChange={setValue} size="md">
 *   <SegmentedControlItem value="total">Total</SegmentedControlItem>
 *   <SegmentedControlItem value="mp">MP</SegmentedControlItem>
 *   <SegmentedControlItem value="emballage">Emballage</SegmentedControlItem>
 * </SegmentedControl>
 */

const segmentedControlVariants = cva(
  "inline-flex items-center gap-0 rounded-lg bg-muted",
  {
    variants: {
      size: {
        sm: "h-8",
        md: "h-10",
        lg: "h-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const segmentedControlItemVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center rounded-md px-4",
    "text-sm font-medium whitespace-nowrap",
    "transition-colors duration-150",
    // Focus styles
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled styles
    "disabled:pointer-events-none disabled:opacity-50",
    // Inactive state
    "text-foreground",
    "hover:bg-[#EBEBEB]",
    "active:bg-[#CCCCCC]",
    // Active state
    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:font-bold",
    "data-[state=on]:hover:bg-primary-hover",
    // Active pressed state
    "data-[state=on]:active:bg-primary-pressed",
  ],
  {
    variants: {
      size: {
        sm: "h-full text-xs",
        md: "h-full text-sm",
        lg: "h-full text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const SegmentedControlContext = React.createContext<{
  size?: "sm" | "md" | "lg"
}>({})

function SegmentedControl({
  className,
  value,
  onValueChange,
  size = "md",
  children,
  defaultValue: _defaultValue,
  ...props
}: Omit<React.ComponentProps<typeof ToggleGroupPrimitive.Root>, "type" | "value" | "onValueChange" | "defaultValue"> &
  VariantProps<typeof segmentedControlVariants> & {
    value: string
    onValueChange: (value: string) => void
    defaultValue?: string
  }) {
  // Prevent deselection by ignoring empty string
  const handleValueChange = (newValue: string) => {
    if (newValue) {
      onValueChange(newValue)
    }
  }

  const resolvedSize = size ?? "md"

  return (
    <SegmentedControlContext.Provider value={{ size: resolvedSize }}>
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={handleValueChange}
        data-slot="segmented-control"
        className={cn(segmentedControlVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    </SegmentedControlContext.Provider>
  )
}

function SegmentedControlItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const { size } = React.useContext(SegmentedControlContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(segmentedControlItemVariants({ size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { SegmentedControl, SegmentedControlItem }
