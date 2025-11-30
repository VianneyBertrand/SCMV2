"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cva, type VariantProps } from "class-variance-authority"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/componentsv2/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentsv2/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentsv2/ui/select"
import { Button } from "@/componentsv2/ui/button"

/* =============================================================================
   DATE PICKER

   Composant unifié pour la sélection de dates :
   - mode="single"  : Sélection d'une date unique via Calendar
   - mode="range"   : Sélection d'une plage de dates via 2 Calendar indépendants
   - mode="month"   : Sélection mois + année via 2 Selects
   - mode="period"  : Sélection période (mois/année → mois/année) via 4 Selects

   Intégration Field (100% shadcn compliant) :
   - size: sm (40px) | md (56px)
   - id: pour lier avec FieldLabel via htmlFor
   - aria-invalid: pour l'accessibilité (propagé depuis Field ou prop error)
   - data-empty: pour styling placeholder (pattern shadcn)
   - Réagit à data-invalid du parent Field via group selectors

   @example
   ```tsx
   <Field>
     <FieldLabel htmlFor="birthdate">Date de naissance</FieldLabel>
     <DatePicker id="birthdate" mode="single" value={date} onValueChange={setDate} />
     <FieldDescription>Sélectionnez votre date</FieldDescription>
   </Field>
   ```

   @example Error state
   ```tsx
   <Field data-invalid={hasError}>
     <FieldLabel htmlFor="birthdate">Date de naissance</FieldLabel>
     <DatePicker id="birthdate" mode="single" error={hasError} />
     <FieldError>Date requise</FieldError>
   </Field>
   ```
   ============================================================================= */

/* =============================================================================
   TYPES
   ============================================================================= */

export interface MonthYear {
  month: number // 0-11
  year: number
}

interface DatePickerBaseProps {
  /** Trigger size */
  size?: "sm" | "md"
  /** Placeholder text */
  placeholder?: string
  /** Optional icon on the left */
  icon?: React.ReactNode
  /** Disabled state */
  disabled?: boolean
  /** Error state - sets aria-invalid and error styling */
  error?: boolean
  /** ID for Field integration (required for FieldLabel htmlFor) */
  id?: string
  /** Locale for formatting (default: fr) */
  locale?: Locale
  /** Additional class name for trigger */
  className?: string
  /** Show validate button at bottom right */
  showValidateButton?: boolean
  /** Validate button label (default: "Valider") */
  validateButtonLabel?: string
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode: "single"
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: (date: Date) => boolean
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: "range"
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: (date: Date) => boolean
}

export interface DatePickerMonthProps extends DatePickerBaseProps {
  mode: "month"
  value?: MonthYear
  onValueChange?: (monthYear: MonthYear | undefined) => void
  minDate?: MonthYear
  maxDate?: MonthYear
}

export interface DatePickerPeriodProps extends DatePickerBaseProps {
  mode: "period"
  value?: { from?: MonthYear; to?: MonthYear }
  onValueChange?: (period: { from?: MonthYear; to?: MonthYear } | undefined) => void
  minDate?: MonthYear
  maxDate?: MonthYear
}

export type DatePickerProps =
  | DatePickerSingleProps
  | DatePickerRangeProps
  | DatePickerMonthProps
  | DatePickerPeriodProps

/* =============================================================================
   TRIGGER STYLES
   ============================================================================= */

const datePickerTriggerVariants = cva(
  [
    "inline-flex w-full items-center gap-4",
    "rounded-md px-4",
    "text-left",
    "bg-background",
    "ring-1 ring-inset ring-neutral",
    "transition-shadow",
    "cursor-pointer",
    // Hover
    "hover:ring-neutral-hover",
    // Focus
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    // Disabled
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    // Empty state (placeholder) - shadcn pattern
    "data-[empty=true]:text-muted-foreground",
    // Error standalone (aria-invalid) - shadcn pattern
    "aria-[invalid=true]:ring-destructive aria-[invalid=true]:hover:ring-destructive",
    "aria-[invalid=true]:focus-visible:ring-destructive",
    // Error from Field parent (data-invalid) - shadcn pattern
    "group-data-[invalid=true]/field:ring-destructive",
    "group-data-[invalid=true]/field:hover:ring-destructive",
    "group-data-[invalid=true]/field:focus-visible:ring-destructive",
  ],
  {
    variants: {
      size: {
        sm: "h-10 body-m",
        md: "h-14 body-m",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

/* =============================================================================
   CONSTANTS
   ============================================================================= */

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
] as const

const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
] as const

const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_YEAR_RANGE = { start: CURRENT_YEAR - 100, end: CURRENT_YEAR + 10 }

const DEFAULT_PLACEHOLDERS: Record<DatePickerProps["mode"], string> = {
  single: "JJ/MM/AAAA",
  range: "JJ/MM/AAAA - JJ/MM/AAAA",
  month: "MM/AAAA",
  period: "01/MM/AAAA - 01/MM/AAAA",
}

/* =============================================================================
   UTILITIES
   ============================================================================= */

function generateYearRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function formatSingleDate(date: Date | undefined, locale: Locale): string {
  if (!date) return ""
  return format(date, "dd/MM/yyyy", { locale })
}

function formatRangeDate(range: DateRange | undefined, locale: Locale): string {
  if (!range?.from) return ""
  if (!range.to) return format(range.from, "dd/MM/yyyy", { locale })
  return `${format(range.from, "dd/MM/yyyy", { locale })} - ${format(range.to, "dd/MM/yyyy", { locale })}`
}

function formatMonthYear(monthYear: MonthYear | undefined): string {
  if (!monthYear) return ""
  return `${MONTHS[monthYear.month]} ${monthYear.year}`
}

function formatPeriod(period: { from?: MonthYear; to?: MonthYear } | undefined): string {
  if (!period?.from) return ""
  const fromStr = `01/${String(period.from.month + 1).padStart(2, "0")}/${period.from.year}`
  if (!period.to) return fromStr
  const toStr = `01/${String(period.to.month + 1).padStart(2, "0")}/${period.to.year}`
  return `${fromStr} - ${toStr}`
}

function createDate(year: number, month: number): Date {
  return new Date(year, month, 1)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/* =============================================================================
   MONTH/YEAR NAVIGATION COMPONENT
   ============================================================================= */

interface MonthYearNavigationProps {
  month: Date
  onMonthChange: (date: Date) => void
  yearRange: number[]
}

function MonthYearNavigation({ month, onMonthChange, yearRange }: MonthYearNavigationProps) {
  const handlePrevMonth = () => onMonthChange(addMonths(month, -1))
  const handleNextMonth = () => onMonthChange(addMonths(month, 1))

  const handleMonthSelect = (value: string) => {
    onMonthChange(createDate(month.getFullYear(), parseInt(value, 10)))
  }

  const handleYearSelect = (value: string) => {
    onMonthChange(createDate(parseInt(value, 10), month.getMonth()))
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost-accent"
        size="icon-sm"
        onClick={handlePrevMonth}
        aria-label="Mois précédent"
      >
        <ChevronLeftIcon className="size-5" />
      </Button>

      <div className="flex items-center gap-1">
        <Select value={String(month.getMonth())} onValueChange={handleMonthSelect}>
          <SelectTrigger variant="ghost" size="sm" width="auto">
            <SelectValue>{MONTHS[month.getMonth()]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, index) => (
              <SelectItem key={index} value={String(index)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(month.getFullYear())} onValueChange={handleYearSelect}>
          <SelectTrigger variant="ghost" size="sm" width="auto">
            <SelectValue>{month.getFullYear()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {yearRange.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost-accent"
        size="icon-sm"
        onClick={handleNextMonth}
        aria-label="Mois suivant"
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </div>
  )
}

/* =============================================================================
   SINGLE DATE CONTENT
   ============================================================================= */

interface SingleDateContentProps {
  value: Date | undefined
  onSelect: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: (date: Date) => boolean
  locale: Locale
}

function SingleDateContent({
  value,
  onSelect,
  minDate,
  maxDate,
  disabledDates,
  locale,
}: SingleDateContentProps) {
  const [displayedMonth, setDisplayedMonth] = React.useState<Date>(
    () => value ?? new Date()
  )

  const yearRange = React.useMemo(() => {
    const start = minDate?.getFullYear() ?? DEFAULT_YEAR_RANGE.start
    const end = maxDate?.getFullYear() ?? DEFAULT_YEAR_RANGE.end
    return generateYearRange(start, end)
  }, [minDate, maxDate])

  const disabledMatcher = React.useMemo(() => {
    if (!minDate && !maxDate && !disabledDates) return undefined
    return (date: Date) => {
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return disabledDates?.(date) ?? false
    }
  }, [minDate, maxDate, disabledDates])

  return (
    <div className="p-4 flex flex-col gap-8">
      <MonthYearNavigation
        month={displayedMonth}
        onMonthChange={setDisplayedMonth}
        yearRange={yearRange}
      />
      <Calendar
        mode="single"
        month={displayedMonth}
        onMonthChange={setDisplayedMonth}
        selected={value}
        onSelect={onSelect}
        disabled={disabledMatcher}
        locale={locale}
        hideNavigation
        initialFocus
        className="w-full"
        classNames={{ month_caption: "hidden" }}
      />
    </div>
  )
}

/* =============================================================================
   RANGE DATE CONTENT
   ============================================================================= */

interface RangeDateContentProps {
  value: DateRange | undefined
  onSelect: (range: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: (date: Date) => boolean
  locale: Locale
}

function RangeDateContent({
  value,
  onSelect,
  minDate,
  maxDate,
  disabledDates,
  locale,
}: RangeDateContentProps) {
  const [displayedMonth1, setDisplayedMonth1] = React.useState<Date>(
    () => value?.from ?? new Date()
  )
  const [displayedMonth2, setDisplayedMonth2] = React.useState<Date>(
    () => value?.to ?? addMonths(value?.from ?? new Date(), 1)
  )

  const yearRange = React.useMemo(() => {
    const start = minDate?.getFullYear() ?? DEFAULT_YEAR_RANGE.start
    const end = maxDate?.getFullYear() ?? DEFAULT_YEAR_RANGE.end
    return generateYearRange(start, end)
  }, [minDate, maxDate])

  const disabledMatcher = React.useMemo(() => {
    if (!minDate && !maxDate && !disabledDates) return undefined
    return (date: Date) => {
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return disabledDates?.(date) ?? false
    }
  }, [minDate, maxDate, disabledDates])

  return (
    <div className="p-4 flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Date de début</span>
          <MonthYearNavigation
            month={displayedMonth1}
            onMonthChange={setDisplayedMonth1}
            yearRange={yearRange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Date de fin</span>
          <MonthYearNavigation
            month={displayedMonth2}
            onMonthChange={setDisplayedMonth2}
            yearRange={yearRange}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Calendar
          mode="range"
          month={displayedMonth1}
          onMonthChange={setDisplayedMonth1}
          selected={value}
          onSelect={onSelect}
          disabled={disabledMatcher}
          locale={locale}
          hideNavigation
          initialFocus
          classNames={{ month_caption: "hidden" }}
        />
        <Calendar
          mode="range"
          month={displayedMonth2}
          onMonthChange={setDisplayedMonth2}
          selected={value}
          onSelect={onSelect}
          disabled={disabledMatcher}
          locale={locale}
          hideNavigation
          classNames={{ month_caption: "hidden" }}
        />
      </div>
    </div>
  )
}

/* =============================================================================
   MONTH PICKER CONTENT
   ============================================================================= */

interface MonthPickerContentProps {
  value: MonthYear | undefined
  onValueChange: (value: MonthYear | undefined) => void
  minDate?: MonthYear
  maxDate?: MonthYear
}

function MonthPickerContent({
  value,
  onValueChange,
  minDate,
  maxDate,
}: MonthPickerContentProps) {
  const [displayedMonth, setDisplayedMonth] = React.useState<Date>(() => {
    if (value) {
      return createDate(value.year, value.month)
    }
    return new Date()
  })

  // Stable ref for callback to avoid stale closures
  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const yearRange = React.useMemo(() => {
    const start = minDate?.year ?? DEFAULT_YEAR_RANGE.start
    const end = maxDate?.year ?? DEFAULT_YEAR_RANGE.end
    return generateYearRange(start, end)
  }, [minDate, maxDate])

  // Notify parent when month changes
  const handleMonthChange = React.useCallback((date: Date) => {
    setDisplayedMonth(date)
    onValueChangeRef.current?.({ month: date.getMonth(), year: date.getFullYear() })
  }, [])

  return (
    <div className="p-4">
      <MonthYearNavigation
        month={displayedMonth}
        onMonthChange={handleMonthChange}
        yearRange={yearRange}
      />
    </div>
  )
}

/* =============================================================================
   PERIOD PICKER CONTENT
   ============================================================================= */

interface PeriodPickerContentProps {
  value: { from?: MonthYear; to?: MonthYear } | undefined
  onValueChange: (value: { from?: MonthYear; to?: MonthYear } | undefined) => void
  minDate?: MonthYear
  maxDate?: MonthYear
}

function PeriodPickerContent({
  value,
  onValueChange,
  minDate,
  maxDate,
}: PeriodPickerContentProps) {
  const [displayedMonth1, setDisplayedMonth1] = React.useState<Date>(() => {
    if (value?.from) {
      return createDate(value.from.year, value.from.month)
    }
    return new Date()
  })
  const [displayedMonth2, setDisplayedMonth2] = React.useState<Date>(() => {
    if (value?.to) {
      return createDate(value.to.year, value.to.month)
    }
    return addMonths(value?.from ? createDate(value.from.year, value.from.month) : new Date(), 1)
  })

  // Stable ref for callback to avoid stale closures
  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const yearRange = React.useMemo(() => {
    const start = minDate?.year ?? DEFAULT_YEAR_RANGE.start
    const end = maxDate?.year ?? DEFAULT_YEAR_RANGE.end
    return generateYearRange(start, end)
  }, [minDate, maxDate])

  // Helper to compare dates (year + month)
  const isDateBefore = (a: Date, b: Date) => {
    if (a.getFullYear() < b.getFullYear()) return true
    if (a.getFullYear() > b.getFullYear()) return false
    return a.getMonth() < b.getMonth()
  }

  const isDateAfter = (a: Date, b: Date) => {
    if (a.getFullYear() > b.getFullYear()) return true
    if (a.getFullYear() < b.getFullYear()) return false
    return a.getMonth() > b.getMonth()
  }

  // When period 1 (from) changes: if it's after period 2, push period 2 forward
  const handleMonth1Change = React.useCallback((date: Date) => {
    setDisplayedMonth1(date)
    let newMonth2 = displayedMonth2

    // If new "from" is after "to", adjust "to" to be same as "from"
    if (isDateAfter(date, displayedMonth2)) {
      newMonth2 = date
      setDisplayedMonth2(newMonth2)
    }

    const from = { month: date.getMonth(), year: date.getFullYear() }
    const to = { month: newMonth2.getMonth(), year: newMonth2.getFullYear() }
    onValueChangeRef.current?.({ from, to })
  }, [displayedMonth2])

  // When period 2 (to) changes: if it's before period 1, clamp to period 1
  const handleMonth2Change = React.useCallback((date: Date) => {
    let newDate = date

    // If new "to" is before "from", clamp to "from"
    if (isDateBefore(date, displayedMonth1)) {
      newDate = displayedMonth1
    }

    setDisplayedMonth2(newDate)
    const from = { month: displayedMonth1.getMonth(), year: displayedMonth1.getFullYear() }
    const to = { month: newDate.getMonth(), year: newDate.getFullYear() }
    onValueChangeRef.current?.({ from, to })
  }, [displayedMonth1])

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <MonthYearNavigation
          month={displayedMonth1}
          onMonthChange={handleMonth1Change}
          yearRange={yearRange}
        />
        <MonthYearNavigation
          month={displayedMonth2}
          onMonthChange={handleMonth2Change}
          yearRange={yearRange}
        />
      </div>
    </div>
  )
}

/* =============================================================================
   MAIN COMPONENT
   ============================================================================= */

function DatePicker(props: DatePickerProps) {
  const {
    mode,
    size = "md",
    placeholder,
    icon,
    disabled = false,
    error = false,
    id,
    locale = fr,
    className,
    showValidateButton = false,
    validateButtonLabel = "Valider",
  } = props

  const [open, setOpen] = React.useState(false)

  // Compute display value
  const displayValue = React.useMemo(() => {
    switch (mode) {
      case "single":
        return formatSingleDate(props.value, locale)
      case "range":
        return formatRangeDate(props.value, locale)
      case "month":
        return formatMonthYear(props.value)
      case "period":
        return formatPeriod(props.value)
    }
  }, [mode, props, locale])

  const isEmpty = !displayValue
  const placeholderText = placeholder ?? DEFAULT_PLACEHOLDERS[mode]

  // Handlers
  const handleSingleSelect = React.useCallback((date: Date | undefined) => {
    if (mode === "single") {
      props.onValueChange?.(date)
      if (date) setOpen(false)
    }
  }, [mode, props])

  const handleRangeSelect = React.useCallback((range: DateRange | undefined) => {
    if (mode === "range") {
      props.onValueChange?.(range)
    }
  }, [mode, props])

  const handleMonthSelect = React.useCallback((value: MonthYear | undefined) => {
    if (mode === "month") {
      props.onValueChange?.(value)
    }
  }, [mode, props])

  const handlePeriodSelect = React.useCallback((value: { from?: MonthYear; to?: MonthYear } | undefined) => {
    if (mode === "period") {
      props.onValueChange?.(value)
    }
  }, [mode, props])

  // Popover width based on mode
  const popoverWidth = {
    single: "w-[320px]",
    range: "w-[680px]",
    month: "w-[320px]",
    period: "w-[680px]",
  }[mode]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={displayValue || `Sélectionner ${mode === "single" ? "une date" : mode === "range" ? "une plage de dates" : mode === "month" ? "un mois" : "une période"}`}
          data-empty={isEmpty || undefined}
          className={cn(datePickerTriggerVariants({ size }), className)}
        >
          {icon && (
            <span className="text-muted-foreground shrink-0 [&>svg]:size-6">
              {icon}
            </span>
          )}

          <span className="flex-1 truncate">
            {displayValue || placeholderText}
          </span>

          <CalendarIcon className="size-6 shrink-0 text-primary" />
        </button>
      </PopoverTrigger>

      <PopoverContent className={cn("p-0 z-[100]", popoverWidth)} align="start" sideOffset={4}>
        {mode === "single" && (
          <SingleDateContent
            value={props.value}
            onSelect={handleSingleSelect}
            minDate={props.minDate}
            maxDate={props.maxDate}
            disabledDates={props.disabledDates}
            locale={locale}
          />
        )}

        {mode === "range" && (
          <RangeDateContent
            value={props.value}
            onSelect={handleRangeSelect}
            minDate={props.minDate}
            maxDate={props.maxDate}
            disabledDates={props.disabledDates}
            locale={locale}
          />
        )}

        {mode === "month" && (
          <MonthPickerContent
            value={props.value}
            onValueChange={handleMonthSelect}
            minDate={props.minDate}
            maxDate={props.maxDate}
          />
        )}

        {mode === "period" && (
          <PeriodPickerContent
            value={props.value}
            onValueChange={handlePeriodSelect}
            minDate={props.minDate}
            maxDate={props.maxDate}
          />
        )}

        {showValidateButton && (
          <div className="flex justify-end px-4 pb-4">
            <Button size="sm" onClick={() => setOpen(false)}>
              {validateButtonLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { MonthYear }
