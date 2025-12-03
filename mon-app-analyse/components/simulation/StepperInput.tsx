// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperInputProps {
  value: string | number
  unit?: string
  onChange?: (newValue: number) => void
  onIncrement: (shift?: boolean) => void
  onDecrement: (shift?: boolean) => void
  className?: string
  inputClassName?: string
  disabled?: boolean
  min?: number
}

/**
 * Input avec boutons +/- intégrés à l'intérieur du champ
 * - Bouton - à gauche (ghost)
 * - Valeur au centre
 * - Bouton + à droite (ghost)
 */
export function StepperInput({
  value,
  unit = '',
  onChange,
  onIncrement,
  onDecrement,
  className,
  inputClassName,
  disabled = false,
  min,
}: StepperInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Extraire le nombre de la valeur
  const parseValue = (val: string | number) => {
    const str = String(val)
    const match = str.match(/^([+-]?[\d.]+)(.*)$/)
    if (match) {
      return { number: match[1], unit: match[2] || unit }
    }
    return { number: str, unit }
  }

  const { number: displayNumber, unit: displayUnit } = parseValue(value)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (onChange && !disabled) {
      setEditValue(displayNumber)
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    if (onChange) {
      const newValue = parseFloat(editValue)
      if (!isNaN(newValue)) {
        const finalValue = min !== undefined ? Math.max(min, newValue) : newValue
        onChange(finalValue)
      }
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center h-10 rounded-md border border-input bg-background",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Bouton - */}
      <button
        type="button"
        disabled={disabled}
        className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-hover active:text-primary-pressed disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        onClick={(e) => {
          e.stopPropagation()
          onDecrement(e.shiftKey)
        }}
        aria-label="Diminuer (Shift pour -1)"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Valeur centrale */}
      {isEditing && onChange ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 min-w-0 h-full px-1 text-sm font-semibold text-center bg-transparent border-none outline-none focus:ring-0",
            inputClassName
          )}
        />
      ) : (
        <div
          className={cn(
            "flex-1 min-w-0 px-1 text-sm font-semibold text-center truncate",
            onChange && !disabled && "cursor-text",
            inputClassName
          )}
          onClick={handleClick}
        >
          {displayNumber}{displayUnit}
        </div>
      )}

      {/* Bouton + */}
      <button
        type="button"
        disabled={disabled}
        className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-hover active:text-primary-pressed disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        onClick={(e) => {
          e.stopPropagation()
          onIncrement(e.shiftKey)
        }}
        aria-label="Augmenter (Shift pour +1)"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
