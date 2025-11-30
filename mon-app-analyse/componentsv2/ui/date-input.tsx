"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/* =============================================================================
   DateInput
   Input-style date picker with calendar popover
   Works with Field component for label/description/error
   
   Usage:
   <Field>
     <FieldLabel>Date de naissance</FieldLabel>
     <DateInput 
       value={date} 
       onChange={setDate}
       placeholder="DD/MM/YYYY"
     />
     <FieldDescription>Sélectionnez votre date de naissance</FieldDescription>
   </Field>
   ============================================================================= */

export interface DateInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "size"> {
  /** The selected date */
  value?: Date
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void
  /** Input size */
  size?: "sm" | "md"
  /** Has error state */
  error?: boolean
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Custom date format for display (default: dd/MM/yyyy) */
  displayFormat?: string
  /** Locale for calendar (default: fr) */
  locale?: Locale
  /** Disable specific dates */
  disabledDates?: (date: Date) => boolean
}

function DateInput({
  value,
  onChange,
  size = "md",
  error = false,
  placeholder = "DD/MM/YYYY",
  disabled = false,
  minDate,
  maxDate,
  displayFormat = "dd/MM/yyyy",
  locale = fr,
  disabledDates,
  className,
  id,
  ...props
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sync input value with date prop
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, displayFormat))
    } else {
      setInputValue("")
    }
  }, [value, displayFormat])

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Try to parse the date
    if (newValue.length === displayFormat.length) {
      const parsed = parse(newValue, displayFormat, new Date())
      if (isValid(parsed)) {
        // Check min/max constraints
        if (minDate && parsed < minDate) return
        if (maxDate && parsed > maxDate) return
        if (disabledDates && disabledDates(parsed)) return
        onChange?.(parsed)
      }
    } else if (newValue === "") {
      onChange?.(undefined)
    }
  }

  // Handle blur - validate and format
  const handleInputBlur = () => {
    if (inputValue && value && isValid(value)) {
      setInputValue(format(value, displayFormat))
    } else if (inputValue && !value) {
      // Invalid input, clear it
      setInputValue("")
    }
  }

  // Handle calendar select
  const handleCalendarSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
    inputRef.current?.focus()
  }

  // Combined disabled check for calendar
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    if (disabledDates) return disabledDates(date)
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup size={size} disabled={disabled} className={className}>
        <InputGroupAddon position="left">
          <CalendarIcon className="size-5 text-muted-foreground" />
        </InputGroupAddon>
        
        <InputGroupInput
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          size={size}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error || undefined}
          {...props}
        />

        <InputGroupAddon position="right">
          <PopoverTrigger asChild>
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              aria-label="Ouvrir le calendrier"
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <CalendarIcon className="size-5" />
            </InputGroupButton>
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleCalendarSelect}
          disabled={isDateDisabled}
          locale={locale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateInput }
