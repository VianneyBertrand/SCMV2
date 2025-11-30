/**
 * @deprecated Use `Combobox` with `multiple` prop instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration:
 * ```tsx
 * // Before
 * <MultiSelect options={options} value={values} onValueChange={setValues} />
 * 
 * // After
 * <Combobox 
 *   options={options} 
 *   value={values} 
 *   onValueChange={setValues} 
 *   multiple 
 *   showSelectAll 
 * />
 * ```
 */
"use client";

import * as React from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  selectAllLabel?: string;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  maxDisplayItems?: number;
}

/**
 * @deprecated Use `Combobox` with `multiple` prop instead
 */
export function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select options...",
  selectAllLabel = "Select all",
  confirmLabel = "Confirm",
  className,
  disabled,
  error,
  maxDisplayItems = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [tempValue, setTempValue] = React.useState<string[]>(value);

  // Sync tempValue when value prop changes
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleToggle = (optionValue: string) => {
    setTempValue((prev) =>
      prev.includes(optionValue)
        ? prev.filter((v) => v !== optionValue)
        : [...prev, optionValue]
    );
  };

  const handleSelectAll = () => {
    const selectableOptions = options
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.value);
    const allSelected = selectableOptions.every((v) => tempValue.includes(v));

    if (allSelected) {
      setTempValue([]);
    } else {
      setTempValue(selectableOptions);
    }
  };

  const handleConfirm = () => {
    onValueChange?.(tempValue);
    setOpen(false);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter((v) => v !== optionValue);
    onValueChange?.(newValue);
  };

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean) as string[];

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= maxDisplayItems
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  const selectableOptions = options.filter((opt) => !opt.disabled);
  const allSelected =
    selectableOptions.length > 0 &&
    selectableOptions.every((opt) => tempValue.includes(opt.value));

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset temp value if closing without confirming
          setTempValue(value);
        }
        setOpen(newOpen);
      }}
    >
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
            "min-h-10",

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
            value.length === 0 && "text-muted-foreground",

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
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {value.length === 0 ? (
              <span>{placeholder}</span>
            ) : value.length <= maxDisplayItems ? (
              selectedLabels.map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {label}
                  <XIcon
                    className="size-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => handleRemove(value[index], e)}
                  />
                </span>
              ))
            ) : (
              <span>{displayText}</span>
            )}
          </div>
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
        <div className="flex flex-col">
          {/* Select All */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b border-border cursor-pointer hover:bg-accent"
            onClick={handleSelectAll}
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => handleSelectAll()}
            />
            <span className="text-sm font-medium">
              {selectAllLabel}
            </span>
          </div>

          {/* Options */}
          <div className="max-h-[240px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                  option.disabled && "pointer-events-none opacity-50"
                )}
                onClick={() => !option.disabled && handleToggle(option.value)}
              >
                <Checkbox
                  checked={tempValue.includes(option.value)}
                  disabled={option.disabled}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <span className="text-sm">
                  {option.label}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm button */}
          <div className="px-3 py-2 border-t border-border">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
