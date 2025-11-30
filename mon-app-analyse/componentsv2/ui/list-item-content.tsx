"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* =============================================================================
   LIST ITEM CONTENT
   
   Composant de LAYOUT UNIQUEMENT pour les items de liste.
   N'a PAS de styles interactifs (hover, focus) - c'est le parent qui gère.
   
   Utilisé par : SelectItem, Combobox, Autocomplete, MenuItem, etc.
   
   Layout:
   ┌─────────────────────────────────────────────────────────────┐
   │  [control]  [start]   Content          [end]     [action]  │
   │  checkbox   icon      label            badge     chevron   │
   │  radio      avatar    + description    tag                 │
   └─────────────────────────────────────────────────────────────┘
   
   Spacing: gap-2 (8px) entre control et label
   Text: toujours text-base (bodym)
   
   ============================================================================= */

const listItemContentVariants = cva(
  [
    "flex w-full items-center gap-2",
    "text-base", // bodym - toujours
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      size: {
        sm: "",  // Height controlled by parent
        md: "",
        lg: "",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
)

export interface ListItemContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemContentVariants> {
  /** Control element on the left (Checkbox, Radio) */
  control?: React.ReactNode
  /** Content after control (Icon, Avatar) */
  startContent?: React.ReactNode
  /** Content before action (Badge, Tag, Count) */
  endContent?: React.ReactNode
  /** Action element on the right (Chevron, IconButton) */
  action?: React.ReactNode
  /** Secondary text below main content */
  description?: React.ReactNode
}

function ListItemContent({
  className,
  size,
  control,
  startContent,
  endContent,
  action,
  description,
  children,
  ...props
}: ListItemContentProps) {
  return (
    <div
      data-slot="list-item-content"
      className={cn(listItemContentVariants({ size }), className)}
      {...props}
    >
      {/* Control slot (checkbox, radio) */}
      {control && (
        <span 
          data-slot="list-item-control" 
          className="flex shrink-0 items-center"
        >
          {control}
        </span>
      )}

      {/* Start content slot (icon, avatar) */}
      {startContent && (
        <span 
          data-slot="list-item-start" 
          className="flex shrink-0 items-center"
        >
          {startContent}
        </span>
      )}

      {/* Main content - takes remaining space */}
      <span 
        data-slot="list-item-text" 
        className="flex min-w-0 flex-1 flex-col"
      >
        <span className="truncate">{children}</span>
        {description && (
          <span className="truncate text-sm text-muted-foreground">
            {description}
          </span>
        )}
      </span>

      {/* End content slot (badge, tag) */}
      {endContent && (
        <span 
          data-slot="list-item-end" 
          className="flex shrink-0 items-center"
        >
          {endContent}
        </span>
      )}

      {/* Action slot (chevron, button) */}
      {action && (
        <span 
          data-slot="list-item-action" 
          className="flex shrink-0 items-center"
        >
          {action}
        </span>
      )}
    </div>
  )
}

export { ListItemContent, listItemContentVariants }
