"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface CheckboxFieldProps {
  id: string
  label: string
  error?: string
  description?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function CheckboxField({
  id,
  label,
  error,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : description ? `${id}-description` : undefined
          }
        />
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            disabled && "cursor-not-allowed opacity-70",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
      </div>
      {description && !error && (
        <p id={`${id}-description`} className="text-sm text-muted-foreground ml-7">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive ml-7">
          {error}
        </p>
      )}
    </div>
  )
}
