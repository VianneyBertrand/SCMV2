// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/componentsv2/ui/icon-button'
import { MPRefSelector } from './MPRefSelector'

interface MPRowProps {
  label: string
  code?: string
  mpId?: string
  onReferenceChange?: (newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => void
  value: string | number
  numericValue?: number  // Valeur numérique réelle pour le calcul d'évolution
  originalValue?: number
  valueLabel?: string
  secondValue?: string | number
  numericSecondValue?: number  // Valeur numérique réelle pour le calcul d'évolution
  originalSecondValue?: number
  secondValueLabel?: string
  thirdValue?: string | number
  numericThirdValue?: number
  originalThirdValue?: number
  thirdValueLabel?: string
  onIncrement01: () => void
  onIncrement1: () => void
  onDecrement01: () => void
  onDecrement1: () => void
  onSecondIncrement01?: () => void
  onSecondIncrement1?: () => void
  onSecondDecrement01?: () => void
  onSecondDecrement1?: () => void
  onThirdIncrement01?: () => void
  onThirdIncrement1?: () => void
  onThirdDecrement01?: () => void
  onThirdDecrement1?: () => void
  onRemove: () => void
  onValueChange?: (newValue: number) => void
  onSecondValueChange?: (newValue: number) => void
  onThirdValueChange?: (newValue: number) => void
}

/**
 * Ligne MP réutilisable avec boutons +/- et supprimer
 */
export function MPRow({
  label,
  code,
  mpId,
  onReferenceChange,
  value,
  numericValue,
  originalValue,
  valueLabel,
  secondValue,
  numericSecondValue,
  originalSecondValue,
  secondValueLabel,
  thirdValue,
  numericThirdValue,
  originalThirdValue,
  thirdValueLabel,
  onIncrement01,
  onIncrement1,
  onDecrement01,
  onDecrement1,
  onSecondIncrement01,
  onSecondIncrement1,
  onSecondDecrement01,
  onSecondDecrement1,
  onThirdIncrement01,
  onThirdIncrement1,
  onThirdDecrement01,
  onThirdDecrement1,
  onRemove,
  onValueChange,
  onSecondValueChange,
  onThirdValueChange,
}: MPRowProps) {
  const [isEditingValue, setIsEditingValue] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [isEditingSecondValue, setIsEditingSecondValue] = useState(false)
  const [editSecondValue, setEditSecondValue] = useState('')
  const secondInputRef = useRef<HTMLInputElement>(null)

  const [isEditingThirdValue, setIsEditingThirdValue] = useState(false)
  const [editThirdValue, setEditThirdValue] = useState('')
  const thirdInputRef = useRef<HTMLInputElement>(null)

  // État pour l'édition de l'évolution totale (ligne 2 uniquement)
  const [isEditingTotalEvolution, setIsEditingTotalEvolution] = useState(false)
  const [editTotalEvolution, setEditTotalEvolution] = useState('')
  const totalEvolutionInputRef = useRef<HTMLInputElement>(null)

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
  const { number: thirdValueNumber, unit: thirdValueUnit } = thirdValue !== undefined ? parseValue(thirdValue) : { number: '', unit: '' }

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
  const currentThirdValue = numericThirdValue !== undefined ? numericThirdValue : parseFloat(thirdValueNumber)

  // Évolution totale : de priceFirst (ligne 1) à priceLast (ligne 2)
  const totalEvolution = currentValue > 0 ? ((currentSecondValue - currentValue) / currentValue) * 100 : 0

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

  useEffect(() => {
    if (isEditingThirdValue && thirdInputRef.current) {
      thirdInputRef.current.focus()
      thirdInputRef.current.select()
    }
  }, [isEditingThirdValue])

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

  const handleThirdValueClick = () => {
    if (onThirdValueChange) {
      setEditThirdValue(thirdValueNumber)
      setIsEditingThirdValue(true)
    }
  }

  const handleThirdValueBlur = () => {
    if (onThirdValueChange) {
      const newValue = parseFloat(editThirdValue)
      if (!isNaN(newValue)) {
        onThirdValueChange(newValue)
      }
    }
    setIsEditingThirdValue(false)
  }

  const handleThirdValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleThirdValueBlur()
    } else if (e.key === 'Escape') {
      setIsEditingThirdValue(false)
    }
  }

  // Handlers pour l'édition de l'évolution totale (ligne 2)
  const handleTotalEvolutionClick = () => {
    if (onSecondValueChange && currentValue > 0) {
      setEditTotalEvolution(totalEvolution.toFixed(2))
      setIsEditingTotalEvolution(true)
    }
  }

  const handleTotalEvolutionBlur = () => {
    if (onSecondValueChange && currentValue > 0) {
      const newEvolution = parseFloat(editTotalEvolution)
      if (!isNaN(newEvolution)) {
        // Calculer priceLast basé sur priceFirst et l'évolution totale
        const newPriceLast = currentValue * (1 + newEvolution / 100)
        onSecondValueChange(Math.max(0, newPriceLast))
      }
    }
    setIsEditingTotalEvolution(false)
  }

  const handleTotalEvolutionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTotalEvolutionBlur()
    } else if (e.key === 'Escape') {
      setIsEditingTotalEvolution(false)
    }
  }

  // Incrémenter/décrémenter l'évolution totale
  const handleTotalEvolutionChange = (delta: number) => {
    if (onSecondValueChange && currentValue > 0) {
      const newEvolution = totalEvolution + delta
      const newPriceLast = currentValue * (1 + newEvolution / 100)
      onSecondValueChange(Math.max(0, newPriceLast))
    }
  }

  // useEffect pour focus sur l'input d'évolution totale
  useEffect(() => {
    if (isEditingTotalEvolution && totalEvolutionInputRef.current) {
      totalEvolutionInputRef.current.focus()
      totalEvolutionInputRef.current.select()
    }
  }, [isEditingTotalEvolution])

  return (
    <div className="pt-6 pb-6 border-b border-gray-200 last:border-b-0 first:pt-0">
      {/* Label et Code */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex flex-col items-start">
          <span className="body-m-bold text-foreground">{label}</span>
          {mpId && onReferenceChange ? (
            <MPRefSelector
              mpId={mpId}
              currentCode={code || ''}
              onReferenceChange={onReferenceChange}
            />
          ) : (
            code && <span className="text-gray-500" style={{ fontSize: '12px' }}>{code}</span>
          )}
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
        {valueLabel && <span className="text-gray-500 w-[110px] mr-4" style={{ fontSize: '14px' }}>{valueLabel}</span>}

        {/* Bouton - (Shift = -1, sinon -0.1) */}
        <IconButton
          variant="outline"
          size="xs"
          aria-label="Diminuer (Shift pour -1)"
          onClick={(e: React.MouseEvent) => {
            if (e.shiftKey) {
              onDecrement1()
            } else {
              onDecrement01()
            }
          }}
        >
          <Minus />
        </IconButton>

        {/* Input avec unité */}
        {isEditingValue && onValueChange ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={handleValueKeyDown}
            className="h-8 w-28 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
        ) : (
          <div
            className={`h-8 w-28 px-2 text-sm font-semibold text-gray-900 text-center rounded border border-gray-300 flex items-center justify-center ${onValueChange ? 'cursor-text hover:bg-gray-100' : ''}`}
            onClick={handleValueClick}
          >
            {valueNumber}{valueUnit}
          </div>
        )}

        {/* Bouton + (Shift = +1, sinon +0.1) */}
        <IconButton
          variant="outline"
          size="xs"
          aria-label="Augmenter (Shift pour +1)"
          onClick={(e: React.MouseEvent) => {
            if (e.shiftKey) {
              onIncrement1()
            } else {
              onIncrement01()
            }
          }}
        >
          <Plus />
        </IconButton>
      </div>

      {/* Valeur secondaire (optionnelle) */}
      {secondValue !== undefined && onSecondIncrement1 && onSecondDecrement1 && (
        <div className="flex items-center gap-1 mt-1">
          {secondValueLabel && <span className="text-gray-500 w-[110px] mr-4" style={{ fontSize: '14px' }}>{secondValueLabel}</span>}

          {/* Bouton - (Shift = -1, sinon -0.1) */}
          <IconButton
            variant="outline"
            size="xs"
            aria-label="Diminuer (Shift pour -1)"
            onClick={(e: React.MouseEvent) => {
              if (e.shiftKey) {
                onSecondDecrement1()
              } else {
                onSecondDecrement01?.()
              }
            }}
          >
            <Minus />
          </IconButton>

          {/* Input avec unité */}
          {isEditingSecondValue && onSecondValueChange ? (
            <input
              ref={secondInputRef}
              type="text"
              value={editSecondValue}
              onChange={(e) => setEditSecondValue(e.target.value)}
              onBlur={handleSecondValueBlur}
              onKeyDown={handleSecondValueKeyDown}
              className="h-8 w-28 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
            />
          ) : (
            <div
              className={`h-8 w-28 px-2 text-sm font-semibold text-gray-900 text-center rounded border border-gray-300 flex items-center justify-center ${onSecondValueChange ? 'cursor-text hover:bg-gray-100' : ''}`}
              onClick={handleSecondValueClick}
            >
              {secondValueNumber}{secondValueUnit}
            </div>
          )}

          {/* Bouton + (Shift = +1, sinon +0.1) */}
          <IconButton
            variant="outline"
            size="xs"
            aria-label="Augmenter (Shift pour +1)"
            onClick={(e: React.MouseEvent) => {
              if (e.shiftKey) {
                onSecondIncrement1()
              } else {
                onSecondIncrement01?.()
              }
            }}
          >
            <Plus />
          </IconButton>

          {/* % d'évolution totale (de priceFirst à priceLast) */}
          <div className="flex items-center gap-1 ml-4">
            <IconButton
              variant="outline"
              size="xs"
              aria-label="Diminuer évolution (Shift pour -1%)"
              onClick={(e: React.MouseEvent) => {
                handleTotalEvolutionChange(e.shiftKey ? -1 : -0.1)
              }}
            >
              <Minus />
            </IconButton>

            {isEditingTotalEvolution ? (
              <input
                ref={totalEvolutionInputRef}
                type="text"
                value={editTotalEvolution}
                onChange={(e) => setEditTotalEvolution(e.target.value)}
                onBlur={handleTotalEvolutionBlur}
                onKeyDown={handleTotalEvolutionKeyDown}
                className="h-8 w-20 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
            ) : (
              <div
                className={`h-8 w-20 px-2 text-sm font-semibold text-center rounded border border-gray-300 flex items-center justify-center cursor-text hover:bg-gray-100 ${
                  totalEvolution === 0
                    ? 'text-gray-500'
                    : totalEvolution > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}
                onClick={handleTotalEvolutionClick}
              >
                {formatEvolution(totalEvolution)}
              </div>
            )}

            <IconButton
              variant="outline"
              size="xs"
              aria-label="Augmenter évolution (Shift pour +1%)"
              onClick={(e: React.MouseEvent) => {
                handleTotalEvolutionChange(e.shiftKey ? 1 : 0.1)
              }}
            >
              <Plus />
            </IconButton>
          </div>
        </div>
      )}

    </div>
  )
}
