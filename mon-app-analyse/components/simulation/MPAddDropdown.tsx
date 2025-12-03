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
  buttonLabel?: string
}

/**
 * Dropdown pour ajouter une matière première
 */
export function MPAddDropdown({ options, onAdd, placeholder = "Rechercher une MP...", buttonLabel = "Ajouter" }: MPAddDropdownProps) {
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
          className="w-full h-10 justify-start gap-2 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 z-[70]" align="start" side="top">
        <Command>
          <CommandInput placeholder={placeholder} className="!text-base" />
          <CommandList className="max-h-[250px]">
            <CommandEmpty>Aucun élément trouvé.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.id} ${option.label}`}
                  onSelect={() => handleSelect(option.id)}
                  className="flex items-center py-2 hover:bg-muted hover:text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0 text-[#0970E6]",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="!text-base">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
