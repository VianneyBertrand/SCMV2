import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/componentsv2/ui/spinner";

/**
 * IconButton variants
 * Inherits color variants from Button, with icon-specific sizes
 * 
 * Sizes:
 * - m: 56px (icon 24px)
 * - s: 40px (icon 24px)  
 * - xs: 32px (icon 16px)
 */
const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-all outline-none disabled:pointer-events-none disabled:opacity-50 shrink-0",
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
        "ghost-muted":
          "bg-transparent text-muted-foreground hover:text-foreground active:text-foreground",
      },
      size: {
        m: "size-14", // 56px
        s: "size-10", // 40px
        xs: "size-8", // 32px
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
        className:
          "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
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
        className:
          "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
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
        className:
          "bg-white text-destructive hover:bg-white/90 active:bg-white/80",
      },
      {
        variant: "outline-destructive",
        reversed: true,
        className:
          "ring-white text-white hover:ring-white/80 hover:text-white/80 active:ring-white/60 active:text-white/60",
      },
      {
        variant: "ghost-destructive",
        reversed: true,
        className: "text-white hover:text-white/80 active:text-white/60",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "m",
      reversed: false,
    },
  }
);

/**
 * Icon size classes based on button size
 * m & s → 24px (size-6)
 * xs → 16px (size-4)
 */
const iconSizeMap = {
  m: "size-6", // 24px
  s: "size-6", // 24px
  xs: "size-4", // 16px
} as const;

type IconButtonSize = "m" | "s" | "xs";

export interface IconButtonProps
  extends Omit<React.ComponentProps<"button">, "children">,
    VariantProps<typeof iconButtonVariants> {
  /**
   * Required for accessibility - describes the button action
   * @example "Close dialog", "Add item", "Delete"
   */
  "aria-label": string;
  /**
   * The icon to display
   * Should be a React element (e.g., Lucide icon)
   */
  children: React.ReactElement;
  /**
   * Show loading spinner instead of icon
   */
  loading?: boolean;
  /**
   * Render as a different element (e.g., for links)
   */
  asChild?: boolean;
}

/**
 * IconButton - A button containing only an icon
 *
 * Follows WAI-ARIA button pattern with mandatory aria-label for accessibility.
 * Screen readers will announce the aria-label as the button's accessible name.
 *
 * @example
 * ```tsx
 * <IconButton aria-label="Add new item" size="m">
 *   <PlusIcon />
 * </IconButton>
 *
 * <IconButton aria-label="Delete" variant="destructive" size="s">
 *   <TrashIcon />
 * </IconButton>
 *
 * <IconButton aria-label="Loading..." loading size="xs">
 *   <RefreshIcon />
 * </IconButton>
 * ```
 */
function IconButton({
  className,
  variant,
  size = "m",
  reversed,
  loading = false,
  asChild = false,
  children,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot : "button";
  const iconSize = iconSizeMap[size as IconButtonSize] || iconSizeMap.m;

  // Clone the icon to apply size classes
  const iconElement = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(
          iconSize,
          "pointer-events-none",
          (children as React.ReactElement<{ className?: string }>).props.className
        ),
        "aria-hidden": true,
      })
    : children;

  return (
    <Comp
      data-slot="icon-button"
      type={asChild ? undefined : "button"}
      className={cn(iconButtonVariants({ variant, size, reversed, className }))}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Spinner className={cn(iconSize)} aria-hidden="true" />
      ) : (
        iconElement
      )}
    </Comp>
  );
}

export { IconButton, iconButtonVariants };
