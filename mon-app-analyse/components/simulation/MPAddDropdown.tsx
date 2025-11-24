// @ts-nocheck
'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MPOption {
  id: string
  label: string
}

interface MPAddDropdownProps {
  options: MPOption[]
  onAdd: (option: MPOption) => void
  placeholder?: string
}

/**
 * Dropdown pour ajouter une matière première
 */
export function MPAddDropdown({ options, onAdd, placeholder = "Rechercher une MP..." }: MPAddDropdownProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const handleSelect = (currentValue: string) => {
    const selected = options.find(opt => opt.id === currentValue)
    if (selected) {
      onAdd(selected)
      setValue("")
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>Aucune matière première trouvée.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
