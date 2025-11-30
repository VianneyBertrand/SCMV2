"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { ListItemContent } from "./list-item-content"

/* =============================================================================
   COMBOBOX
   
   Composant unifié pour :
   - Single select avec recherche (ex-SearchableSelect)
   - Multi select avec checkboxes (ex-MultiSelect)
   
   Features:
   - searchable: affiche input de recherche
   - multiple: active checkboxes, chips, confirm button
   - showSelectAll: option "Tout sélectionner"
   - renderItem: customisation des items via ListItemContent
   
   Intégration Field:
   - size: sm (40px) | md (56px)
   - id: pour lier avec FieldLabel
   - Réagit à data-invalid du parent Field
   
   ============================================================================= */

/* =============================================================================
   TYPES
   ============================================================================= */

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
  /** Optional data for custom rendering */
  data?: Record<string, unknown>
}

/* =============================================================================
   TRIGGER STYLES
   ============================================================================= */

const comboboxTriggerVariants = cva(
  [
    "flex w-full items-center justify-between gap-4",
    "rounded-md px-4",
    "text-left",
    "bg-background",
    "ring-1 ring-inset ring-neutral",
    "transition-shadow",
    // Hover
    "hover:ring-neutral-hover",
    // Focus (keyboard navigation only)
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
    // Error standalone (prop error)
    "data-[error=true]:ring-destructive data-[error=true]:hover:ring-destructive",
    // Error from Field parent (data-invalid)
    "group-data-[invalid=true]/field:ring-destructive",
    "group-data-[invalid=true]/field:hover:ring-destructive",
    "group-data-[invalid=true]/field:focus-visible:ring-destructive",
  ],
  {
    variants: {
      size: {
        sm: "min-h-10 body-m",  // 40px, body-m (16px)
        md: "min-h-14 body-m",  // 56px, body-m (16px)
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

/* =============================================================================
   COMPONENT
   ============================================================================= */

export interface ComboboxProps extends VariantProps<typeof comboboxTriggerVariants> {
  /** Available options */
  options: ComboboxOption[]
  
  /** Selected value(s) - string for single, string[] for multiple */
  value?: string | string[]
  
  /** Change handler */
  onValueChange?: (value: string | string[]) => void
  
  /** Enable multi-selection mode */
  multiple?: boolean
  
  /** Show search input (default: true) */
  searchable?: boolean
  
  /** Show "Select all" option (only when multiple) */
  showSelectAll?: boolean
  
  /** Max chips to display before showing count */
  maxDisplayChips?: number
  
  /** Placeholder text */
  placeholder?: string
  
  /** Search input placeholder */
  searchPlaceholder?: string
  
  /** Empty state message */
  emptyMessage?: string
  
  /** Select all label */
  selectAllLabel?: string
  
  /** Confirm button label (multiple mode) */
  confirmLabel?: string
  
  /** Cancel button label (multiple mode) */
  cancelLabel?: string
  
  /** Custom item renderer */
  renderItem?: (
    option: ComboboxOption,
    state: { selected: boolean; disabled: boolean }
  ) => React.ReactNode
  
  /** Item size */
  itemSize?: "sm" | "md" | "lg"
  
  /** Disabled state */
  disabled?: boolean
  
  /** Error state (standalone usage, without Field) */
  error?: boolean
  
  /** ID for Field integration (FieldLabel htmlFor) */
  id?: string
  
  /** Additional class name */
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  multiple = false,
  searchable = true,
  showSelectAll = false,
  maxDisplayChips = 2,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  selectAllLabel = "Tout sélectionner",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  renderItem,
  size,
  itemSize = "sm",
  disabled = false,
  error = false,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  
  // Normalize value to array for internal handling
  const normalizedValue = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : []
    }
    return typeof value === "string" && value ? [value] : []
  }, [value, multiple])
  
  // Temp value for multiple mode (confirm/cancel pattern)
  const [tempValue, setTempValue] = React.useState<string[]>(normalizedValue)
  
  // Sync temp value when value prop changes
  React.useEffect(() => {
    setTempValue(normalizedValue)
  }, [normalizedValue])
  
  // Reset search on close
  React.useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])
  
  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const lowerSearch = search.toLowerCase()
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, search])
  
  // Get selected labels for display
  const selectedLabels = React.useMemo(() => {
    return normalizedValue
      .map((v) => options.find((opt) => opt.value === v)?.label)
      .filter(Boolean) as string[]
  }, [normalizedValue, options])
  
  // Handlers
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      setTempValue((prev) =>
        prev.includes(optionValue)
          ? prev.filter((v) => v !== optionValue)
          : [...prev, optionValue]
      )
    } else {
      onValueChange?.(optionValue)
      setOpen(false)
    }
  }
  
  const handleSelectAll = () => {
    const selectableValues = options
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.value)
    
    const allSelected = selectableValues.every((v) => tempValue.includes(v))
    
    if (allSelected) {
      setTempValue([])
    } else {
      setTempValue(selectableValues)
    }
  }
  
  const handleConfirm = () => {
    onValueChange?.(tempValue)
    setOpen(false)
  }
  
  const handleCancel = () => {
    setTempValue(normalizedValue)
    setOpen(false)
  }
  
  const handleRemoveChip = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = normalizedValue.filter((v) => v !== optionValue)
    onValueChange?.(multiple ? newValue : newValue[0] ?? "")
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && multiple) {
      // Reset temp value on close without confirm
      setTempValue(normalizedValue)
    }
    setOpen(newOpen)
  }
  
  // Check if all selectable options are selected
  const allSelected = React.useMemo(() => {
    const selectableValues = options
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.value)
    return (
      selectableValues.length > 0 &&
      selectableValues.every((v) => tempValue.includes(v))
    )
  }, [options, tempValue])
  
  // Current selection to check (tempValue for multiple, normalizedValue for single)
  const currentSelection = multiple ? tempValue : normalizedValue

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          id={id}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          data-error={error || undefined}
          className={cn(comboboxTriggerVariants({ size }), className)}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 py-1">
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : multiple && selectedLabels.length <= maxDisplayChips ? (
              // Show chips for multiple mode
              selectedLabels.map((label, index) => (
                <span
                  key={normalizedValue[index]}
                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
                >
                  {label}
                  <XIcon
                    className="size-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => handleRemoveChip(normalizedValue[index], e)}
                  />
                </span>
              ))
            ) : multiple && selectedLabels.length > maxDisplayChips ? (
              // Show count for many selections
              <span>{selectedLabels.length} sélectionnés</span>
            ) : (
              // Single mode - show selected label
              <span className="truncate">{selectedLabels[0]}</span>
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              "size-6 shrink-0 text-primary transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search input - InputGroup style with icon right */}
          {searchable && (
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-md bg-background px-3 ring-1 ring-inset ring-neutral transition-shadow hover:ring-neutral-hover focus-within:ring-2 focus-within:ring-primary">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-5" />
                  </button>
                ) : (
                  <SearchIcon className="size-6 text-primary" />
                )}
              </div>
            </div>
          )}
          
          {/* Select all (multiple mode only) */}
          {multiple && showSelectAll && (
            <div
              className="flex items-center gap-3 border-b border-border px-3 py-2 cursor-pointer hover:bg-muted"
              onClick={handleSelectAll}
            >
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">{selectAllLabel}</span>
            </div>
          )}
          
          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = currentSelection.includes(option.value)
                const isDisabled = option.disabled ?? false
                
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    data-selected={isSelected || undefined}
                    data-disabled={isDisabled || undefined}
                    className={cn(
                      "flex items-center rounded-sm px-3 cursor-pointer",
                      "hover:bg-muted",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      itemSize === "sm" && "min-h-10 py-2",
                      itemSize === "md" && "min-h-12 py-3",
                      itemSize === "lg" && "min-h-14 py-3"
                    )}
                    onClick={() => !isDisabled && handleSelect(option.value)}
                  >
                    {renderItem ? (
                      renderItem(option, { selected: isSelected, disabled: isDisabled })
                    ) : (
                      <ListItemContent
                        size={itemSize}
                        control={
                          multiple ? (
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={() => handleSelect(option.value)}
                            />
                          ) : undefined
                        }
                        className="gap-2"
                      >
                        {option.label}
                      </ListItemContent>
                    )}
                    
                    {/* Check indicator for single mode */}
                    {!multiple && isSelected && (
                      <CheckIcon className="ml-auto size-4 shrink-0 text-primary" />
                    )}
                  </div>
                )
              })
            )}
          </div>
          
          {/* Confirm/Cancel buttons (multiple mode only) */}
          {multiple && (
            <div className="flex gap-2 border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={handleCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
