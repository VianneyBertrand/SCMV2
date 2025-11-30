"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ListItemContent, type ListItemContentProps } from "./list-item-content"

/* =============================================================================
   SELECT TRIGGER
   ============================================================================= */

const selectTriggerVariants = cva(
  [
    "min-w-0 rounded-md bg-background outline-none transition-shadow",
    "flex items-center justify-between gap-2 whitespace-nowrap",
    "data-[placeholder]:text-muted-foreground",
    "[&_svg:not([class*='text-'])]:text-muted-foreground",
    // Focus: ring 2px primary (keyboard navigation only)
    "focus-visible:ring-2 focus-visible:ring-primary",
    // Disabled
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    // Dark mode
    "dark:bg-input/30",
    // Value styling
    "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          // Ring 1px neutral (default border)
          "ring-1 ring-neutral ring-inset",
          // États hover et pressed
          "hover:ring-neutral-hover",
          "active:ring-neutral-pressed",
          "disabled:hover:ring-neutral",
          // Invalid state from Field parent (data-invalid)
          "group-data-[invalid=true]/field:ring-destructive group-data-[invalid=true]/field:hover:ring-destructive",
          "group-data-[invalid=true]/field:focus-visible:ring-destructive",
          // Invalid state from aria-invalid
          "aria-invalid:ring-destructive aria-invalid:hover:ring-destructive",
          "aria-invalid:focus-visible:ring-destructive",
        ],
        ghost: [
          // No border, bold text
          "ring-0",
          "body-m-bold",
          "hover:bg-muted",
          "active:bg-muted",
        ],
      },
      size: {
        sm: "h-10 body-m",  // 40px, body-m (16px)
        md: "h-14 body-m",  // 56px, body-m (16px)
      },
      width: {
        full: "w-full px-4",        // Default - prend toute la largeur, padding symétrique
        auto: "w-auto pl-4 pr-2",   // S'adapte au contenu (pour InlineField), padding asymétrique
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      width: "full",
    },
  }
)

/* =============================================================================
   SELECT ITEM
   ============================================================================= */

const selectItemVariants = cva(
  [
    "relative flex w-full cursor-default items-center rounded-sm px-3 outline-hidden select-none",
    // Focus state (keyboard navigation) - use muted, not accent (which is black)
    "focus:bg-muted",
    // Disabled
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "min-h-10 py-2 text-sm",   // 40px
        md: "min-h-12 py-3 text-base", // 48px
        lg: "min-h-14 py-3 text-base", // 56px
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
)

/* =============================================================================
   COMPONENTS
   ============================================================================= */

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  variant,
  size,
  width,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> &
  VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ variant, size, width }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-6 text-primary" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-[200] max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

interface SelectItemProps
  extends React.ComponentProps<typeof SelectPrimitive.Item>,
    VariantProps<typeof selectItemVariants>,
    Pick<ListItemContentProps, "control" | "startContent" | "endContent" | "description"> {
  /** Show check indicator when selected (default: true) */
  showIndicator?: boolean
}

function SelectItem({
  className,
  size,
  control,
  startContent,
  endContent,
  description,
  showIndicator = true,
  children,
  ...props
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(selectItemVariants({ size }), className)}
      {...props}
    >
      <ListItemContent
        size={size}
        control={control}
        startContent={startContent}
        endContent={endContent}
        description={description}
        className="gap-2"
      >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </ListItemContent>

      {/* Check indicator */}
      {showIndicator && (
        <span className="ml-auto flex shrink-0 items-center justify-center size-4">
          <SelectPrimitive.ItemIndicator>
            <CheckIcon className="size-4 text-primary" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
