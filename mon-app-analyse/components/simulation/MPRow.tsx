// @ts-nocheck
'use client'

import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MPRowProps {
  label: string
  value: string | number
  valueLabel?: string
  secondValue?: string | number
  secondValueLabel?: string
  onIncrement: () => void
  onDecrement: () => void
  onSecondIncrement?: () => void
  onSecondDecrement?: () => void
  onRemove: () => void
}

/**
 * Ligne MP réutilisable avec boutons +/- et supprimer
 */
export function MPRow({
  label,
  value,
  valueLabel,
  secondValue,
  secondValueLabel,
  onIncrement,
  onDecrement,
  onSecondIncrement,
  onSecondDecrement,
  onRemove,
}: MPRowProps) {
  return (
    <div className="space-y-1 py-2 border-b border-gray-100 last:border-0">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Valeur principale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200"
              onClick={onIncrement}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200"
              onClick={onDecrement}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          {valueLabel && <span className="text-xs text-gray-500">{valueLabel}</span>}
        </div>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>

      {/* Valeur secondaire (optionnelle) */}
      {secondValue !== undefined && onSecondIncrement && onSecondDecrement && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200"
                onClick={onSecondIncrement}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200"
                onClick={onSecondDecrement}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            {secondValueLabel && <span className="text-xs text-gray-500">{secondValueLabel}</span>}
          </div>
          <span className="text-sm font-semibold text-gray-900">{secondValue}</span>
        </div>
      )}
    </div>
  )
}
