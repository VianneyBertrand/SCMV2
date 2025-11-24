// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
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
  onValueChange?: (newValue: number) => void
  onSecondValueChange?: (newValue: number) => void
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
  onValueChange,
  onSecondValueChange,
}: MPRowProps) {
  const [isEditingValue, setIsEditingValue] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [isEditingSecondValue, setIsEditingSecondValue] = useState(false)
  const [editSecondValue, setEditSecondValue] = useState('')
  const secondInputRef = useRef<HTMLInputElement>(null)

  // Extraire le nombre et l'unité de la valeur
  const parseValue = (val: string | number) => {
    const str = String(val)
    const match = str.match(/^([\d.]+)(.*)$/)
    if (match) {
      return { number: match[1], unit: match[2] }
    }
    return { number: str, unit: '' }
  }

  const { number: valueNumber, unit: valueUnit } = parseValue(value)
  const { number: secondValueNumber, unit: secondValueUnit } = secondValue !== undefined ? parseValue(secondValue) : { number: '', unit: '' }

  useEffect(() => {
    if (isEditingValue && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingValue])

  useEffect(() => {
    if (isEditingSecondValue && secondInputRef.current) {
      secondInputRef.current.focus()
      secondInputRef.current.select()
    }
  }, [isEditingSecondValue])

  const handleValueClick = () => {
    if (onValueChange) {
      setEditValue(valueNumber)
      setIsEditingValue(true)
    }
  }

  const handleValueBlur = () => {
    if (onValueChange) {
      const newValue = parseFloat(editValue)
      if (!isNaN(newValue) && newValue >= 0) {
        onValueChange(newValue)
      }
    }
    setIsEditingValue(false)
  }

  const handleValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValueBlur()
    } else if (e.key === 'Escape') {
      setIsEditingValue(false)
    }
  }

  const handleSecondValueClick = () => {
    if (onSecondValueChange) {
      setEditSecondValue(secondValueNumber)
      setIsEditingSecondValue(true)
    }
  }

  const handleSecondValueBlur = () => {
    if (onSecondValueChange) {
      const newValue = parseFloat(editSecondValue)
      if (!isNaN(newValue)) {
        onSecondValueChange(newValue)
      }
    }
    setIsEditingSecondValue(false)
  }

  const handleSecondValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSecondValueBlur()
    } else if (e.key === 'Escape') {
      setIsEditingSecondValue(false)
    }
  }
  return (
    <div className="space-y-1 py-2 border-b border-gray-100 last:border-0">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-[#0970E6] hover:text-[#004E9B] hover:bg-gray-100 active:text-[#003161] active:bg-gray-200"
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
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onIncrement}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onDecrement}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          {valueLabel && <span className="text-xs text-gray-500">{valueLabel}</span>}
        </div>

        <div className="flex items-center gap-1">
          {isEditingValue && onValueChange ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleValueBlur}
              onKeyDown={handleValueKeyDown}
              className="w-20 px-2 py-0.5 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
            />
          ) : (
            <span
              className={`text-sm font-semibold text-gray-900 ${onValueChange ? 'cursor-text hover:bg-gray-100 px-2 py-0.5 rounded border border-gray-300' : ''}`}
              onClick={handleValueClick}
            >
              {valueNumber}
            </span>
          )}
          {valueUnit && <span className="text-sm font-semibold text-gray-900">{valueUnit}</span>}
        </div>
      </div>

      {/* Valeur secondaire (optionnelle) */}
      {secondValue !== undefined && onSecondIncrement && onSecondDecrement && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
                onClick={onSecondIncrement}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
                onClick={onSecondDecrement}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            {secondValueLabel && <span className="text-xs text-gray-500">{secondValueLabel}</span>}
          </div>

          <div className="flex items-center gap-1">
            {isEditingSecondValue && onSecondValueChange ? (
              <input
                ref={secondInputRef}
                type="text"
                value={editSecondValue}
                onChange={(e) => setEditSecondValue(e.target.value)}
                onBlur={handleSecondValueBlur}
                onKeyDown={handleSecondValueKeyDown}
                className="w-20 px-2 py-0.5 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
              />
            ) : (
              <span
                className={`text-sm font-semibold text-gray-900 ${onSecondValueChange ? 'cursor-text hover:bg-gray-100 px-2 py-0.5 rounded border border-gray-300' : ''}`}
                onClick={handleSecondValueClick}
              >
                {secondValueNumber}
              </span>
            )}
            {secondValueUnit && <span className="text-sm font-semibold text-gray-900">{secondValueUnit}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
