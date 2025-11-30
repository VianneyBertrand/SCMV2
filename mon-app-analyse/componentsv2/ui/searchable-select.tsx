/**
 * @deprecated Use `Combobox` instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration:
 * ```tsx
 * // Before
 * <SearchableSelect options={options} value={value} onValueChange={setValue} />
 * 
 * // After
 * <Combobox options={options} value={value} onValueChange={setValue} searchable />
 * ```
 */
"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

/**
 * @deprecated Use `Combobox` instead
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled,
  error,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          data-error={error || undefined}
          className={cn(
            // Base layout
            "flex w-full items-center justify-between gap-2",
            "rounded-md",
            "px-3 py-2",
            "h-10",

            // Typography
            "text-sm",
            "leading-normal",
            "font-normal",
            "text-left",

            // Default state
            "ring-1 ring-inset",
            "ring-input",
            "bg-background",
            "text-foreground",

            // Placeholder color when no value
            !selectedOption && "text-muted-foreground",

            // Transition
            "transition-[box-shadow,background-color]",

            // Hover
            "hover:ring-border-hover",
            "hover:bg-accent/50",

            // Focus
            "focus:outline-none focus:ring-2",
            "focus:ring-ring",

            // Open state
            open && "ring-ring",

            // Disabled
            "disabled:pointer-events-none",
            "disabled:opacity-50",
            "disabled:bg-muted",

            // Error
            "data-[error=true]:ring-destructive",

            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0",
              "text-muted-foreground",
              "transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover ring-1 ring-border"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer",
                    "hover:bg-accent",
                    value === option.value && "bg-accent"
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                  {value === option.value && (
                    <CheckIcon className="size-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
