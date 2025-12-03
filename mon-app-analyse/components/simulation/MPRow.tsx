// @ts-nocheck
'use client'

import { Trash2 } from 'lucide-react'
import { IconButton } from '@/componentsv2/ui/icon-button'
import { MPRefSelector } from './MPRefSelector'
import { StepperInput } from './StepperInput'

interface MPRowProps {
  label: string
  code?: string
  mpId?: string
  onReferenceChange?: (newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => void
  value: string | number
  numericValue?: number
  originalValue?: number
  valueLabel?: string
  secondValue?: string | number
  numericSecondValue?: number
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
 * Ligne MP réutilisable avec inputs stepper intégrés
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
  // Extraire le nombre de la valeur pour les calculs
  const parseValue = (val: string | number) => {
    const str = String(val)
    const match = str.match(/^([+-]?[\d.]+)(.*)$/)
    if (match) {
      return { number: parseFloat(match[1]), unit: match[2] }
    }
    return { number: parseFloat(str) || 0, unit: '' }
  }

  const currentValue = numericValue !== undefined ? numericValue : parseValue(value).number
  const currentSecondValue = numericSecondValue !== undefined ? numericSecondValue : parseValue(secondValue || 0).number

  // Évolution totale : de priceFirst (ligne 1) à priceLast (ligne 2)
  const totalEvolution = currentValue > 0 ? ((currentSecondValue - currentValue) / currentValue) * 100 : 0

  // Formater l'évolution pour l'affichage
  const formatEvolution = (evolution: number): string => {
    const sign = evolution >= 0 ? '+' : ''
    return `${sign}${evolution.toFixed(2)}%`
  }

  // Handler pour changer l'évolution totale
  const handleEvolutionChange = (newEvolution: number) => {
    if (onSecondValueChange && currentValue > 0) {
      const newPriceLast = currentValue * (1 + newEvolution / 100)
      onSecondValueChange(Math.max(0, newPriceLast))
    }
  }

  return (
    <div className="pt-2 pb-2 border-b border-gray-200 last:border-b-0 first:pt-0">
      {/* Label et Code */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col items-start">
          <span className="body-m-bold text-foreground">{label}</span>
          {mpId && onReferenceChange ? (
            <MPRefSelector
              mpId={mpId}
              currentCode={code || ''}
              onReferenceChange={onReferenceChange}
            />
          ) : (
            code && <span className="text-gray-500" style={{ fontSize: '14px' }}>{code}</span>
          )}
        </div>
        <IconButton
          variant="ghost"
          size="xs"
          aria-label="Supprimer"
          onClick={onRemove}
          className="text-primary hover:text-primary-hover"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Valeur principale */}
      <div className="flex items-center gap-2">
        {valueLabel && <span className="text-gray-500 w-[110px]" style={{ fontSize: '14px' }}>{valueLabel}</span>}
        <StepperInput
          value={value}
          onChange={onValueChange}
          onIncrement={(shift) => shift ? onIncrement1() : onIncrement01()}
          onDecrement={(shift) => shift ? onDecrement1() : onDecrement01()}
          className="w-40"
          min={0}
        />
      </div>

      {/* Valeur secondaire (optionnelle) */}
      {secondValue !== undefined && onSecondIncrement1 && onSecondDecrement1 && (
        <div className="flex items-center gap-2 mt-2">
          {secondValueLabel && <span className="text-gray-500 w-[110px]" style={{ fontSize: '14px' }}>{secondValueLabel}</span>}
          <StepperInput
            value={secondValue}
            onChange={onSecondValueChange}
            onIncrement={(shift) => shift ? onSecondIncrement1() : onSecondIncrement01?.()}
            onDecrement={(shift) => shift ? onSecondDecrement1() : onSecondDecrement01?.()}
            className="w-40"
            min={0}
          />

          {/* % d'évolution totale (de priceFirst à priceLast) */}
          <StepperInput
            value={formatEvolution(totalEvolution)}
            onChange={(newVal) => handleEvolutionChange(newVal)}
            onIncrement={(shift) => handleEvolutionChange(totalEvolution + (shift ? 1 : 0.1))}
            onDecrement={(shift) => handleEvolutionChange(totalEvolution - (shift ? 1 : 0.1))}
            className="w-40 ml-2"
            inputClassName={
              totalEvolution === 0
                ? 'text-gray-500'
                : totalEvolution > 0
                  ? 'text-red-600'
                  : 'text-green-600'
            }
          />
        </div>
      )}
    </div>
  )
}
