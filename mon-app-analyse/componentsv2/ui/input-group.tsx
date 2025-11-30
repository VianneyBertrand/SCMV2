"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/componentsv2/ui/button"
import { Input } from "@/componentsv2/ui/input"
import { Textarea } from "@/componentsv2/ui/textarea"

/* =============================================================================
   InputGroup
   Wrapper for Input with icons, buttons, addons
   API compatible with shadcn/ui official input-group component
   
   Usage:
   <Field>
     <FieldLabel htmlFor="email">Email</FieldLabel>
     <InputGroup>
       <InputGroupAddon><Mail /></InputGroupAddon>
       <InputGroupInput id="email" />
       <InputGroupAddon align="inline-end">@company.com</InputGroupAddon>
     </InputGroup>
     <FieldDescription>Helper text</FieldDescription>
   </Field>
   ============================================================================= */

const inputGroupVariants = cva(
  [
    "group/input-group bg-background dark:bg-input/30 relative flex w-full flex-wrap items-center rounded-md transition-shadow outline-none",
    // Ring 1px neutral (default border)
    "ring-1 ring-inset ring-neutral",
    // No fixed height - inherits from Input inside
    "min-w-0",
    // Adjust input padding based on addon position
    "has-[>[data-align=inline-start]]:[&_[data-slot=input-group-control]]:pl-1",
    "has-[>[data-align=inline-end]]:[&_[data-slot=input-group-control]]:pr-1",
    // Hover state
    "hover:ring-neutral-hover",
    // Focus: ring 2px primary
    "has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-primary",
    // Disabled state (from Field parent or direct)
    "has-[[data-slot=input-group-control]:disabled]:opacity-50 has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed",
    // Invalid state (from Field parent data-invalid or direct aria-invalid)
    "group-data-[invalid=true]/field:ring-destructive group-data-[invalid=true]/field:hover:ring-destructive",
    "group-data-[invalid=true]/field:has-[[data-slot=input-group-control]:focus-visible]:ring-destructive",
    "has-[[aria-invalid=true]]:ring-destructive has-[[aria-invalid=true]]:hover:ring-destructive",
    "has-[[aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-destructive",
  ],
  {
    variants: {
      size: {
        sm: "",
        md: "",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface InputGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupVariants> {
  disabled?: boolean
}

function InputGroup({ className, size, disabled, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      data-disabled={disabled || undefined}
      data-size={size}
      role="group"
      className={cn(inputGroupVariants({ size }), className)}
      {...props}
    />
  )
}

/* =============================================================================
   InputGroupAddon
   Container for icons/text on any side of input or textarea
   
   For InputGroupInput: use align="inline-start" or align="inline-end"
   For InputGroupTextarea: use align="block-start" or align="block-end"
   ============================================================================= */

const inputGroupAddonVariants = cva(
  [
    "flex h-auto cursor-text items-center justify-start gap-2 text-sm font-medium select-none",
    "[&>svg:not([class*='size-'])]:size-6",
    "group-data-[disabled=true]/input-group:opacity-50",
  ],
  {
    variants: {
      align: {
        "inline-start": "order-first pl-4 text-muted-foreground",
        "inline-end": "order-last pr-4 text-primary [&>svg]:text-primary",
        "block-start": "order-first w-full px-4 pb-2 border-b border-neutral text-muted-foreground",
        "block-end": "order-last w-full px-4 pt-2 border-t border-neutral text-muted-foreground",
      },
      // Alias pour compatibilité (position → align)
      position: {
        "left": "",
        "right": "",
      },
    },
    defaultVariants: {
      align: "inline-end",
    },
  }
)

interface InputGroupAddonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupAddonVariants> {
  /** @deprecated Use align instead. position="left" → align="inline-start", position="right" → align="inline-end" */
  position?: "left" | "right"
}

function InputGroupAddon({
  className,
  align,
  position,
  ...props
}: InputGroupAddonProps) {
  // Map position to align for backwards compatibility
  const resolvedAlign = position 
    ? (position === "left" ? "inline-start" : "inline-end")
    : (align ?? "inline-end") // Default: right (inline-end)
  
  return (
    <div
      data-slot="input-group-addon"
      data-align={resolvedAlign}
      className={cn(inputGroupAddonVariants({ align: resolvedAlign }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement
          ?.querySelector<HTMLElement>("[data-slot=input-group-control]")
          ?.focus()
      }}
      {...props}
    />
  )
}

/* =============================================================================
   InputGroupButton
   Button inside InputGroup (clear, show password, etc.)
   ============================================================================= */

const inputGroupButtonVariants = cva(
  "text-sm shadow-none flex gap-2 items-center text-primary",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-6 has-[>svg]:px-2",
        sm: "h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5 [&>svg:not([class*='size-'])]:size-6",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0 [&>svg:not([class*='size-'])]:size-6",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0 [&>svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      size: "icon-xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "icon-xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

/* =============================================================================
   InputGroupText
   Static text inside addon (currency symbol, unit, etc.)
   ============================================================================= */

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/* =============================================================================
   InputGroupInput
   Input primitive styled to work inside InputGroup
   ============================================================================= */

function InputGroupInput({
  className,
  size = "md",
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      size={size}
      className={cn(
        "flex-1 rounded-none bg-transparent shadow-none border-0",
        // Remove ring from Input since InputGroup handles it
        "ring-0 hover:ring-0 active:ring-0 focus-visible:ring-0 focus-visible:border-0",
        "dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

/* =============================================================================
   InputGroupTextarea
   Textarea primitive styled to work inside InputGroup
   ============================================================================= */

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none bg-transparent py-3 shadow-none",
        // Remove border/ring since InputGroup handles it
        "border-0 ring-0 focus-visible:ring-0 focus-visible:border-0",
        "dark:bg-transparent",
        // Full width for textarea to work with block addons
        "w-full",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
