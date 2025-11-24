// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MPRowProps {
  label: string
  code?: string
  value: string | number
  numericValue?: number  // Valeur numérique réelle pour le calcul d'évolution
  originalValue?: number
  valueLabel?: string
  secondValue?: string | number
  numericSecondValue?: number  // Valeur numérique réelle pour le calcul d'évolution
  originalSecondValue?: number
  secondValueLabel?: string
  onIncrement01: () => void
  onIncrement1: () => void
  onDecrement01: () => void
  onDecrement1: () => void
  onSecondIncrement01?: () => void
  onSecondIncrement1?: () => void
  onSecondDecrement01?: () => void
  onSecondDecrement1?: () => void
  onRemove: () => void
  onValueChange?: (newValue: number) => void
  onSecondValueChange?: (newValue: number) => void
}

/**
 * Ligne MP réutilisable avec boutons +/- et supprimer
 */
export function MPRow({
  label,
  code,
  value,
  numericValue,
  originalValue,
  valueLabel,
  secondValue,
  numericSecondValue,
  originalSecondValue,
  secondValueLabel,
  onIncrement01,
  onIncrement1,
  onDecrement01,
  onDecrement1,
  onSecondIncrement01,
  onSecondIncrement1,
  onSecondDecrement01,
  onSecondDecrement1,
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
    const match = str.match(/^([+-]?[\d.]+)(.*)$/)
    if (match) {
      return { number: match[1], unit: match[2] }
    }
    return { number: str, unit: '' }
  }

  const { number: valueNumber, unit: valueUnit } = parseValue(value)
  const { number: secondValueNumber, unit: secondValueUnit } = secondValue !== undefined ? parseValue(secondValue) : { number: '', unit: '' }

  // Calculer le % d'évolution par rapport à la valeur originale
  const calculateEvolution = (current: number, original: number | undefined): number | null => {
    if (original === undefined) return null
    // Si l'original est 0, on affiche la différence absolue (en points de %)
    if (original === 0) {
      return current - original // = current
    }
    return ((current - original) / original) * 100
  }

  // Utiliser numericValue si fourni, sinon parser la valeur affichée
  const currentValue = numericValue !== undefined ? numericValue : parseFloat(valueNumber)
  const currentSecondValue = numericSecondValue !== undefined ? numericSecondValue : parseFloat(secondValueNumber)

  const valueEvolution = calculateEvolution(currentValue, originalValue)
  const secondValueEvolution = calculateEvolution(currentSecondValue, originalSecondValue)

  // Formater l'évolution pour l'affichage
  const formatEvolution = (evolution: number | null): string => {
    if (evolution === null) return '+0.00%'
    const sign = evolution >= 0 ? '+' : ''
    return `${sign}${evolution.toFixed(2)}%`
  }

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
    <div className="space-y-1 py-2">
      {/* Label et Code */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-gray-700" style={{ fontSize: '16px' }}>{label}</span>
          {code && <span className="text-gray-500" style={{ fontSize: '12px' }}>{code}</span>}
        </div>
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
      <div className="flex items-center gap-1">
        {valueLabel && <span className="text-xs text-gray-500 w-10">{valueLabel}</span>}

        {/* Double chevron down (-1%) */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
          onClick={onDecrement1}
        >
          <ChevronsDown className="h-5 w-5" />
        </Button>

        {/* Simple chevron down (-0.1%) */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
          onClick={onDecrement01}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>

        {/* Input avec unité */}
        {isEditingValue && onValueChange ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={handleValueKeyDown}
            className="h-10 w-28 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
        ) : (
          <div
            className={`h-10 w-28 px-2 text-sm font-semibold text-gray-900 text-center rounded border border-gray-300 flex items-center justify-center ${onValueChange ? 'cursor-text hover:bg-gray-100' : ''}`}
            onClick={handleValueClick}
          >
            {valueNumber}{valueUnit}
          </div>
        )}

        {/* Simple chevron up (+0.1%) */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
          onClick={() => {
            console.log('MPRow - ChevronUp clicked for', label)
            onIncrement01()
          }}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>

        {/* Double chevron up (+1%) */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
          onClick={onIncrement1}
        >
          <ChevronsUp className="h-5 w-5" />
        </Button>

        {/* % d'évolution */}
        <span
          className={`ml-4 text-sm font-semibold min-w-[70px] text-left ${
            valueEvolution === null || valueEvolution === 0
              ? 'text-gray-500'
              : valueEvolution > 0
                ? 'text-green-600'
                : 'text-red-600'
          }`}
        >
          {formatEvolution(valueEvolution)}
        </span>
      </div>

      {/* Valeur secondaire (optionnelle) */}
      {secondValue !== undefined && onSecondIncrement1 && onSecondDecrement1 && (
        <div className="flex items-center gap-1">
          {secondValueLabel && <span className="text-xs text-gray-500 w-10">{secondValueLabel}</span>}

          {/* Double chevron down (-1%) */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
            onClick={onSecondDecrement1}
          >
            <ChevronsDown className="h-5 w-5" />
          </Button>

          {/* Simple chevron down (-0.1%) */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
            onClick={onSecondDecrement01}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>

          {/* Input avec unité */}
          {isEditingSecondValue && onSecondValueChange ? (
            <input
              ref={secondInputRef}
              type="text"
              value={editSecondValue}
              onChange={(e) => setEditSecondValue(e.target.value)}
              onBlur={handleSecondValueBlur}
              onKeyDown={handleSecondValueKeyDown}
              className="h-10 w-28 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
            />
          ) : (
            <div
              className={`h-10 w-28 px-2 text-sm font-semibold text-gray-900 text-center rounded border border-gray-300 flex items-center justify-center ${onSecondValueChange ? 'cursor-text hover:bg-gray-100' : ''}`}
              onClick={handleSecondValueClick}
            >
              {secondValueNumber}{secondValueUnit}
            </div>
          )}

          {/* Simple chevron up (+0.1%) */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
            onClick={onSecondIncrement01}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>

          {/* Double chevron up (+1%) */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
            onClick={onSecondIncrement1}
          >
            <ChevronsUp className="h-5 w-5" />
          </Button>

          {/* % d'évolution */}
          <span
            className={`ml-4 text-sm font-semibold min-w-[70px] text-left ${
              secondValueEvolution === null || secondValueEvolution === 0
                ? 'text-gray-500'
                : secondValueEvolution > 0
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
          >
            {formatEvolution(secondValueEvolution)}
          </span>
        </div>
      )}
    </div>
  )
}
