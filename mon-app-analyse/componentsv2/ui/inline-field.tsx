"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * InlineField - Container visuel compact pour label + control (Select, DatePicker, etc.)
 * Usage: tableaux, listes, filtres, UI dense
 *
 * Width s'adapte automatiquement au contenu (label + control)
 */
interface InlineFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label affiché à gauche */
  label: string;
  /** État erreur */
  error?: boolean;
  /** État désactivé */
  disabled?: boolean;
  /** Control à afficher (Select, DatePicker, Button, etc.) */
  children: React.ReactNode;
}

const InlineField = React.forwardRef<HTMLDivElement, InlineFieldProps>(
  ({ className, label, error, disabled, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="inline-field"
        data-error={error || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          // Layout - inline, width auto
          "inline-flex items-center gap-2", // gap-2 = 8px
          "rounded-md",
          "pl-4 pr-2 py-2",

          // Fond surface-secondary + border neutral
          "bg-surface-secondary",
          "ring-1 ring-inset ring-[#EBEBEB]",

          // Disabled
          "data-[disabled=true]:pointer-events-none",
          "data-[disabled=true]:opacity-50",

          // Error
          "data-[error=true]:ring-destructive",

          className
        )}
        {...props}
      >
        {/* Label */}
        <span className="shrink-0 body-m text-foreground">{label}</span>

        {/* Control (Select, etc.) */}
        {children}
      </div>
    );
  }
);
InlineField.displayName = "InlineField";

export { InlineField };
