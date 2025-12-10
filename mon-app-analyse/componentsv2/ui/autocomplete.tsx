"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { SearchIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Input } from "./input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { ListItemContent } from "./list-item-content"

/* =============================================================================
   AUTOCOMPLETE
   
   Composant de suggestion/complétion :
   - L'utilisateur tape dans un input
   - Les suggestions apparaissent après N caractères (default: 3)
   - Peut garder une valeur libre (pas obligé de sélectionner)
   - Utilise ListItemContent pour le style des items
   
   Intégration Field:
   - size: sm (40px) | md (56px)
   - id: pour lier avec FieldLabel
   - Réagit à data-invalid du parent Field
   
   ============================================================================= */

export interface AutocompleteOption {
  value: string
  label: string
  disabled?: boolean
  /** Optional data for custom rendering */
  data?: Record<string, unknown>
}

export interface AutocompleteProps {
  /** Available options (can be strings or objects) */
  options: AutocompleteOption[] | string[]

  /** Current value */
  value?: string

  /** Change handler */
  onValueChange?: (value: string) => void

  /** Placeholder text */
  placeholder?: string

  /** Empty state message */
  emptyMessage?: string

  /** Minimum characters before showing suggestions */
  minChars?: number

  /** Trigger size - sm (40px) | md (56px) */
  size?: "sm" | "md"

  /** Item size in dropdown */
  itemSize?: "sm" | "md" | "lg"

  /** Custom item renderer */
  renderItem?: (
    option: AutocompleteOption,
    state: { highlighted: boolean }
  ) => React.ReactNode

  /** Additional class name */
  className?: string

  /** Disabled state */
  disabled?: boolean

  /** Error state (standalone usage, without Field) */
  error?: boolean

  /** ID for Field integration (FieldLabel htmlFor) */
  id?: string

  /** Start addon (icon, text) - renders inside InputGroup on the left */
  startAddon?: React.ReactNode

  /** End addon (icon, text) - renders inside InputGroup on the right. Default: SearchIcon */
  endAddon?: React.ReactNode

  /** Hide the default search icon */
  hideSearchIcon?: boolean

  /** Clear input after selection (useful for multi-select with chips) */
  clearOnSelect?: boolean

  /** Selected values - used to show check icon for selected items */
  selectedValues?: string[]

  /** Show check icon for selected items (default: true if selectedValues is provided) */
  showCheckIcon?: boolean
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Tapez pour rechercher...",
  emptyMessage = "Aucun résultat.",
  minChars = 3,
  size = "md",
  itemSize = "sm",
  renderItem,
  className,
  disabled,
  error,
  id,
  startAddon,
  endAddon,
  hideSearchIcon = false,
  clearOnSelect = false,
  selectedValues,
  showCheckIcon,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Sync internal state with external value prop
  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  // Normalize options to always be AutocompleteOption[]
  const normalizedOptions: AutocompleteOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    )
  }, [options])

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (inputValue.length < minChars) return []
    // Si pas de texte de recherche, retourner toutes les options non désactivées
    if (inputValue.length === 0) {
      return normalizedOptions.filter((opt) => !opt.disabled)
    }
    const search = inputValue.toLowerCase()
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(search) && !opt.disabled
    )
  }, [inputValue, normalizedOptions, minChars])

  // Reset highlighted index when options change
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onValueChange?.(newValue)

    // Ouvrir le popover si minChars est atteint (avec minChars=0, toujours ouvert)
    if (newValue.length >= minChars) {
      setOpen(true)
    } else if (minChars > 0) {
      setOpen(false)
    }
  }

  const handleSelect = (option: AutocompleteOption) => {
    if (clearOnSelect) {
      setInputValue("")
    } else {
      setInputValue(option.label)
    }
    onValueChange?.(option.value)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filteredOptions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']")
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex])

  // Default to SearchIcon if no endAddon provided and not hidden
  const resolvedEndAddon = endAddon ?? (hideSearchIcon ? undefined : <SearchIcon />)
  const hasAddons = startAddon || resolvedEndAddon

  const inputProps = {
    id,
    value: inputValue,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    size,
    "aria-invalid": error || undefined,
    "aria-autocomplete": "list" as const,
    "aria-expanded": open,
    "aria-haspopup": "listbox" as const,
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      // Ne fermer que si c'est une demande de fermeture (pas d'ouverture via trigger)
      if (!isOpen) {
        setOpen(false)
      }
    }}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)} onClick={() => {
          // Ouvrir au clic si minChars est atteint
          if (inputValue.length >= minChars) {
            setOpen(true)
          }
        }}>
          {hasAddons ? (
            <InputGroup size={size}>
              {startAddon && (
                <InputGroupAddon align="inline-start">{startAddon}</InputGroupAddon>
              )}
              <InputGroupInput {...inputProps} />
              {resolvedEndAddon && (
                <InputGroupAddon align="inline-end">{resolvedEndAddon}</InputGroupAddon>
              )}
            </InputGroup>
          ) : (
            <Input {...inputProps} />
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <div
          ref={listRef}
          role="listbox"
          className="max-h-[240px] overflow-y-auto p-1"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isHighlighted = index === highlightedIndex
              
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isHighlighted}
                  data-highlighted={isHighlighted || undefined}
                  className={cn(
                    "flex items-center justify-between rounded-sm px-3 cursor-pointer",
                    "hover:bg-muted",
                    isHighlighted && "bg-muted",
                    itemSize === "sm" && "min-h-10 py-2",
                    itemSize === "md" && "min-h-12 py-3",
                    itemSize === "lg" && "min-h-14 py-3"
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center flex-1 text-foreground">
                    {renderItem ? (
                      renderItem(option, { highlighted: isHighlighted })
                    ) : (
                      <ListItemContent size={itemSize}>
                        {option.label}
                      </ListItemContent>
                    )}
                  </div>
                  {(showCheckIcon ?? !!selectedValues) && selectedValues?.includes(option.value) && (
                    <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
