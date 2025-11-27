// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { getMPReferences, MPReference } from '@/lib/data/mpReferences'

interface MPRefSelectorProps {
  mpId: string
  currentCode: string
  onReferenceChange: (newCode: string, newLabel: string) => void
}

/**
 * Sélecteur de référence MP avec popover et recherche
 */
export function MPRefSelector({ mpId, currentCode, onReferenceChange }: MPRefSelectorProps) {
  const [open, setOpen] = useState(false)
  const references = getMPReferences(mpId)

  // Trier les références : celle en cours en premier
  const sortedReferences = useMemo(() => {
    if (!currentCode) return references
    const currentRef = references.find(ref => ref.code === currentCode)
    if (!currentRef) return references
    const otherRefs = references.filter(ref => ref.code !== currentCode)
    return [currentRef, ...otherRefs]
  }, [references, currentCode])

  // Si pas de références disponibles, afficher juste le code
  if (references.length === 0) {
    return (
      <span className="text-gray-500" style={{ fontSize: '12px' }}>
        {currentCode || '-'}
      </span>
    )
  }

  const handleSelect = (ref: MPReference) => {
    onReferenceChange(ref.code, ref.label)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-[#0970E6] hover:text-[#004E9B] hover:underline cursor-pointer focus:outline-none text-left"
          style={{ fontSize: '12px' }}
        >
          {currentCode || 'Sélectionner'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 z-[70]" align="start" side="bottom">
        <Command>
          <CommandInput placeholder="Rechercher une référence..." />
          <CommandList className="max-h-[250px]">
            <CommandEmpty>Aucune référence trouvée.</CommandEmpty>
            <CommandGroup>
              {sortedReferences.map((ref) => (
                <CommandItem
                  key={ref.code}
                  value={`${ref.code} ${ref.label} ${ref.market}`}
                  onSelect={() => handleSelect(ref)}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0 text-[#0970E6]",
                        currentCode === ref.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{ref.label}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono font-semibold text-[#0970E6]">{ref.code}</span>
                        <span>•</span>
                        <span>{ref.market}</span>
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
