// @ts-nocheck
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MPRefSelector } from './MPRefSelector'

type DurationOption = '3m' | '6m' | '1y' | '2y'
type SplitOption = 'none' | 'month' | 'quarter' | 'semester' | 'year'

interface SplitConfig {
  value: SplitOption
  label: string
  count: number
  prefix: string
}

// Configuration des découpages selon la durée
const SPLIT_OPTIONS: Record<DurationOption, SplitConfig[]> = {
  '3m': [
    { value: 'none', label: '3 mois', count: 0, prefix: '' },
    { value: 'month', label: 'Découpage par mois', count: 3, prefix: 'M' },
  ],
  '6m': [
    { value: 'none', label: '6 mois', count: 0, prefix: '' },
    { value: 'month', label: 'Découpage par mois', count: 6, prefix: 'M' },
    { value: 'quarter', label: 'Découpage par trimestre', count: 2, prefix: 'T' },
  ],
  '1y': [
    { value: 'none', label: '1 an', count: 0, prefix: '' },
    { value: 'quarter', label: 'Découpage par trimestre', count: 4, prefix: 'T' },
    { value: 'semester', label: 'Découpage par semestre', count: 2, prefix: 'S' },
  ],
  '2y': [
    { value: 'none', label: '2 ans', count: 0, prefix: '' },
    { value: 'semester', label: 'Découpage par semestre', count: 4, prefix: 'S' },
    { value: 'year', label: 'Découpage par année', count: 2, prefix: 'A' },
  ],
}

interface MPFutureRowProps {
  id: string
  label: string
  code?: string
  onReferenceChange?: (newCode: string, newLabel: string) => void
  duration: DurationOption
  initialPrice: number
  onRemove: () => void
  // Pour stocker/récupérer les valeurs
  totalEvolution: number
  splitValues: number[]
  selectedSplit: SplitOption
  onTotalEvolutionChange: (value: number) => void
  onSplitValuesChange: (values: number[]) => void
  onSplitChange: (split: SplitOption) => void
}

/**
 * Ligne MP pour le mode période future avec découpage
 */
export function MPFutureRow({
  id,
  label,
  code,
  onReferenceChange,
  duration,
  initialPrice,
  onRemove,
  totalEvolution,
  splitValues,
  selectedSplit,
  onTotalEvolutionChange,
  onSplitValuesChange,
  onSplitChange,
}: MPFutureRowProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const splitOptions = SPLIT_OPTIONS[duration] || SPLIT_OPTIONS['1y']
  const currentSplitConfig = splitOptions.find(s => s.value === selectedSplit) || splitOptions[0]
  const isSplitActive = selectedSplit !== 'none'

  // Calculer le total à partir des valeurs de découpage
  const calculatedTotal = useMemo(() => {
    if (!isSplitActive || splitValues.length === 0) return totalEvolution
    return splitValues.reduce((sum, val) => sum + val, 0)
  }, [isSplitActive, splitValues, totalEvolution])

  // Initialiser les valeurs de découpage quand on change de split
  useEffect(() => {
    if (isSplitActive && splitValues.length !== currentSplitConfig.count) {
      onSplitValuesChange(Array(currentSplitConfig.count).fill(0))
    }
  }, [selectedSplit, currentSplitConfig.count])

  // Mettre à jour le total quand les valeurs de split changent
  useEffect(() => {
    if (isSplitActive) {
      onTotalEvolutionChange(calculatedTotal)
    }
  }, [calculatedTotal, isSplitActive])

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus sur l'input quand on commence à éditer
  useEffect(() => {
    if (editingIndex !== null && inputRefs.current[editingIndex]) {
      inputRefs.current[editingIndex]?.focus()
      inputRefs.current[editingIndex]?.select()
    }
  }, [editingIndex])

  const handleSplitSelect = (split: SplitOption) => {
    onSplitChange(split)
    setIsDropdownOpen(false)
  }

  const handleValueClick = (index: number, currentValue: number) => {
    setEditValue(currentValue.toString())
    setEditingIndex(index)
  }

  const handleValueBlur = (index: number) => {
    const newValue = parseFloat(editValue)
    if (!isNaN(newValue)) {
      if (index === -1) {
        // Total evolution
        onTotalEvolutionChange(newValue)
      } else {
        // Split value
        const newValues = [...splitValues]
        newValues[index] = newValue
        onSplitValuesChange(newValues)
      }
    }
    setEditingIndex(null)
  }

  const handleValueKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleValueBlur(index)
    } else if (e.key === 'Escape') {
      setEditingIndex(null)
    }
  }

  const handleIncrement = (index: number, amount: number) => {
    if (index === -1) {
      onTotalEvolutionChange(totalEvolution + amount)
    } else {
      const newValues = [...splitValues]
      newValues[index] = (newValues[index] || 0) + amount
      onSplitValuesChange(newValues)
    }
  }

  const renderValueRow = (
    labelText: string,
    value: number,
    index: number, // -1 for total
    isDisabled: boolean = false
  ) => {
    const isEditing = editingIndex === index
    const calculatedPrice = initialPrice * (1 + value / 100)

    return (
      <div className={`flex items-center gap-1 ${index > 0 ? 'mt-1' : ''}`}>
        <span className="text-gray-500 w-[80px] mr-2" style={{ fontSize: '14px' }}>{labelText}</span>

        {/* Double chevron down (-1%) */}
        <Button
          variant="outline"
          size="sm"
          className={`h-9 w-9 p-0 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white'}`}
          onClick={() => !isDisabled && handleIncrement(index, -1)}
          disabled={isDisabled}
        >
          <ChevronsDown className="h-4 w-4" />
        </Button>

        {/* Simple chevron down (-0.1%) */}
        <Button
          variant="outline"
          size="sm"
          className={`h-9 w-9 p-0 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white'}`}
          onClick={() => !isDisabled && handleIncrement(index, -0.1)}
          disabled={isDisabled}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Input */}
        {isEditing && !isDisabled ? (
          <input
            ref={(el) => { inputRefs.current[index + 1] = el }}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleValueBlur(index)}
            onKeyDown={(e) => handleValueKeyDown(e, index)}
            className="h-9 w-20 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
        ) : (
          <div
            className={`h-9 w-20 px-2 text-sm font-semibold text-center rounded border flex items-center justify-center ${
              isDisabled
                ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-default'
                : 'text-gray-900 border-gray-300 cursor-text hover:bg-gray-50'
            }`}
            onClick={() => !isDisabled && handleValueClick(index, value)}
          >
            {value.toFixed(1)}%
          </div>
        )}

        {/* Simple chevron up (+0.1%) */}
        <Button
          variant="outline"
          size="sm"
          className={`h-9 w-9 p-0 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white'}`}
          onClick={() => !isDisabled && handleIncrement(index, 0.1)}
          disabled={isDisabled}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        {/* Double chevron up (+1%) */}
        <Button
          variant="outline"
          size="sm"
          className={`h-9 w-9 p-0 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white'}`}
          onClick={() => !isDisabled && handleIncrement(index, 1)}
          disabled={isDisabled}
        >
          <ChevronsUp className="h-4 w-4" />
        </Button>

        {/* Prix calculé */}
        <span className="ml-2 text-sm text-gray-600 w-[85px] text-right">
          {calculatedPrice.toFixed(3)}€/kg
        </span>
      </div>
    )
  }

  return (
    <div className="py-3 border-b border-gray-100">
      {/* Header: Label, Code et Bouton supprimer */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col items-start">
          <span className="font-bold text-gray-700" style={{ fontSize: '15px' }}>{label}</span>
          {onReferenceChange ? (
            <MPRefSelector
              mpId={id}
              currentCode={code || ''}
              onReferenceChange={onReferenceChange}
            />
          ) : (
            code && <span className="text-gray-500" style={{ fontSize: '11px' }}>{code}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-[#0970E6] hover:text-[#004E9B] hover:bg-gray-100"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown de découpage */}
      <div className="mb-3 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0970E6]"
        >
          <span className="text-gray-700">{currentSplitConfig.label}</span>
          <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            {splitOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSplitSelect(option.value)}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  selectedSplit === option.value ? 'bg-blue-50 text-[#0970E6] font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ligne d'évolution totale */}
      {renderValueRow(
        isSplitActive ? 'Total' : 'Évolution',
        isSplitActive ? calculatedTotal : totalEvolution,
        -1,
        isSplitActive // Grisé si découpage actif
      )}

      {/* Lignes de découpage */}
      {isSplitActive && (
        <div className="mt-2">
          {Array.from({ length: currentSplitConfig.count }).map((_, index) => (
            renderValueRow(
              `${currentSplitConfig.prefix}${index + 1}`,
              splitValues[index] || 0,
              index,
              false
            )
          ))}
        </div>
      )}
    </div>
  )
}
