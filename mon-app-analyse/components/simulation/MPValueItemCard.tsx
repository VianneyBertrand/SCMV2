// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { IconButton } from '@/componentsv2/ui/icon-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentsv2/ui/select'
import { MPRefSelector } from './MPRefSelector'
import { DecoupageType, IntermediatePrice } from '@/stores/simulationStore'

interface MPValueItemCardProps {
  id: string
  label: string
  code: string
  priceFirst: number
  priceLast: number
  decoupage?: DecoupageType
  intermediatePrices?: IntermediatePrice[]
  period?: { from?: { month: number; year: number }; to?: { month: number; year: number } }
  onReferenceChange?: (newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => void
  onPriceFirstChange: (price: number) => void
  onPriceLastChange: (price: number) => void
  onDecoupageChange: (decoupage: DecoupageType) => void
  onIntermediatePriceChange: (periodIndex: number, price: number) => void
  onRemove: () => void
}

// Calculer les options de découpage disponibles selon la durée de la période
function getAvailableDecoupageOptions(period?: { from?: { month: number; year: number }; to?: { month: number; year: number } }) {
  if (!period?.from || !period?.to) {
    return [{ value: 'none', label: 'Aucun découpage' }]
  }

  const fromDate = new Date(period.from.year, period.from.month)
  const toDate = new Date(period.to.year, period.to.month)
  const totalMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())

  const options: { value: DecoupageType; label: string }[] = [
    { value: 'none', label: 'Aucun découpage' }
  ]

  if (totalMonths >= 2) {
    options.push({ value: '1month', label: 'Par mois' })
  }
  if (totalMonths >= 6) {
    options.push({ value: '3months', label: 'Par 3 mois' })
  }
  if (totalMonths >= 12) {
    options.push({ value: '6months', label: 'Par 6 mois' })
  }
  if (totalMonths >= 24) {
    options.push({ value: '1year', label: 'Par 1 an' })
  }

  return options
}

// Formater une date mois/année pour l'affichage
function formatPeriodDate(date?: { month: number; year: number }) {
  if (!date) return ''
  const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  return `01/${monthNames[date.month]}/${date.year}`
}

// Composant pour une ligne de prix
function PriceLine({
  label,
  price,
  previousPrice,
  onPriceChange,
  isFirst = false,
}: {
  label: string
  price: number
  previousPrice?: number
  onPriceChange: (price: number) => void
  isFirst?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [isEditingEvolution, setIsEditingEvolution] = useState(false)
  const [editEvolution, setEditEvolution] = useState('')
  const evolutionInputRef = useRef<HTMLInputElement>(null)

  // Calculer l'évolution par rapport à la ligne précédente
  const evolution = previousPrice !== undefined && previousPrice > 0
    ? ((price - previousPrice) / previousPrice) * 100
    : 0

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (isEditingEvolution && evolutionInputRef.current) {
      evolutionInputRef.current.focus()
      evolutionInputRef.current.select()
    }
  }, [isEditingEvolution])

  const handlePriceClick = () => {
    setEditValue(price.toFixed(3))
    setIsEditing(true)
  }

  const handlePriceBlur = () => {
    const newValue = parseFloat(editValue)
    if (!isNaN(newValue) && newValue >= 0) {
      onPriceChange(newValue)
    }
    setIsEditing(false)
  }

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceBlur()
    else if (e.key === 'Escape') setIsEditing(false)
  }

  const handleEvolutionClick = () => {
    if (previousPrice !== undefined && previousPrice > 0) {
      setEditEvolution(evolution.toFixed(2))
      setIsEditingEvolution(true)
    }
  }

  const handleEvolutionBlur = () => {
    if (previousPrice !== undefined && previousPrice > 0) {
      const newEvolution = parseFloat(editEvolution)
      if (!isNaN(newEvolution)) {
        const newPrice = previousPrice * (1 + newEvolution / 100)
        onPriceChange(Math.max(0, newPrice))
      }
    }
    setIsEditingEvolution(false)
  }

  const handleEvolutionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEvolutionBlur()
    else if (e.key === 'Escape') setIsEditingEvolution(false)
  }

  const handleEvolutionChange = (delta: number) => {
    if (previousPrice !== undefined && previousPrice > 0) {
      const newEvolution = evolution + delta
      const newPrice = previousPrice * (1 + newEvolution / 100)
      onPriceChange(Math.max(0, newPrice))
    }
  }

  const formatEvolution = (evo: number): string => {
    const sign = evo >= 0 ? '+' : ''
    return `${sign}${evo.toFixed(2)}%`
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-gray-500 w-[110px] mr-4" style={{ fontSize: '14px' }}>{label}</span>

      {/* Bouton - */}
      <IconButton
        variant="outline"
        size="xs"
        aria-label="Diminuer (Shift pour -1%)"
        onClick={(e: React.MouseEvent) => {
          if (e.shiftKey) {
            onPriceChange(Math.max(0, price * 0.99))
          } else {
            onPriceChange(Math.max(0, price * 0.999))
          }
        }}
      >
        <Minus />
      </IconButton>

      {/* Input prix */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handlePriceBlur}
          onKeyDown={handlePriceKeyDown}
          className="h-8 w-28 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
        />
      ) : (
        <div
          className="h-8 w-28 px-2 text-sm font-semibold text-gray-900 text-center rounded border border-gray-300 flex items-center justify-center cursor-text hover:bg-gray-100"
          onClick={handlePriceClick}
        >
          {price.toFixed(3)}€/kg
        </div>
      )}

      {/* Bouton + */}
      <IconButton
        variant="outline"
        size="xs"
        aria-label="Augmenter (Shift pour +1%)"
        onClick={(e: React.MouseEvent) => {
          if (e.shiftKey) {
            onPriceChange(price * 1.01)
          } else {
            onPriceChange(price * 1.001)
          }
        }}
      >
        <Plus />
      </IconButton>

      {/* Évolution (seulement si pas la première ligne) */}
      {!isFirst && previousPrice !== undefined && (
        <div className="flex items-center gap-1 ml-4">
          <IconButton
            variant="outline"
            size="xs"
            aria-label="Diminuer évolution (Shift pour -1%)"
            onClick={(e: React.MouseEvent) => {
              handleEvolutionChange(e.shiftKey ? -1 : -0.1)
            }}
          >
            <Minus />
          </IconButton>

          {isEditingEvolution ? (
            <input
              ref={evolutionInputRef}
              type="text"
              value={editEvolution}
              onChange={(e) => setEditEvolution(e.target.value)}
              onBlur={handleEvolutionBlur}
              onKeyDown={handleEvolutionKeyDown}
              className="h-8 w-20 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
            />
          ) : (
            <div
              className={`h-8 w-20 px-2 text-sm font-semibold text-center rounded border border-gray-300 flex items-center justify-center cursor-text hover:bg-gray-100 ${
                evolution === 0
                  ? 'text-gray-500'
                  : evolution > 0
                    ? 'text-red-600'
                    : 'text-green-600'
              }`}
              onClick={handleEvolutionClick}
            >
              {formatEvolution(evolution)}
            </div>
          )}

          <IconButton
            variant="outline"
            size="xs"
            aria-label="Augmenter évolution (Shift pour +1%)"
            onClick={(e: React.MouseEvent) => {
              handleEvolutionChange(e.shiftKey ? 1 : 0.1)
            }}
          >
            <Plus />
          </IconButton>
        </div>
      )}
    </div>
  )
}

/**
 * Carte pour un item MP/Emballage avec découpage
 */
export function MPValueItemCard({
  id,
  label,
  code,
  priceFirst,
  priceLast,
  decoupage = 'none',
  intermediatePrices = [],
  period,
  onReferenceChange,
  onPriceFirstChange,
  onPriceLastChange,
  onDecoupageChange,
  onIntermediatePriceChange,
  onRemove,
}: MPValueItemCardProps) {
  const availableOptions = getAvailableDecoupageOptions(period)

  // Déterminer les lignes de prix à afficher
  const getPriceLines = () => {
    if (decoupage === 'none' || intermediatePrices.length === 0) {
      // Mode sans découpage: 2 lignes
      return [
        { periodIndex: 0, date: period?.from, price: priceFirst, isFirst: true },
        { periodIndex: 1, date: period?.to, price: priceLast, previousPrice: priceFirst },
      ]
    }

    // Mode avec découpage: N lignes
    return intermediatePrices.map((ip, index) => ({
      periodIndex: ip.periodIndex,
      date: ip.date,
      price: ip.price,
      isFirst: index === 0,
      previousPrice: index > 0 ? intermediatePrices[index - 1].price : undefined,
    }))
  }

  const priceLines = getPriceLines()

  // Calculer l'évolution totale (entre premier et dernier prix)
  const calculateTotalEvolution = () => {
    if (priceLines.length < 2) return 0
    const firstPrice = priceLines[0].price
    const lastPrice = priceLines[priceLines.length - 1].price
    if (firstPrice === 0) return 0
    return ((lastPrice - firstPrice) / firstPrice) * 100
  }

  const totalEvolution = calculateTotalEvolution()
  const hasDecoupage = decoupage !== 'none' && intermediatePrices.length > 0

  const handlePriceChange = (periodIndex: number, newPrice: number, isNoneMode: boolean) => {
    if (isNoneMode) {
      if (periodIndex === 0) {
        onPriceFirstChange(newPrice)
      } else {
        onPriceLastChange(newPrice)
      }
    } else {
      onIntermediatePriceChange(periodIndex, newPrice)
    }
  }

  return (
    <div className="pt-6 pb-6 border-b border-gray-200 last:border-b-0 first:pt-0">
      {/* Header: Label, Code, Découpage Select, et bouton X */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col items-start flex-1">
          <span className="body-m-bold text-foreground">{label}</span>
          {id && onReferenceChange ? (
            <MPRefSelector
              mpId={id}
              currentCode={code || ''}
              onReferenceChange={onReferenceChange}
            />
          ) : (
            code && <span className="text-gray-500" style={{ fontSize: '14px' }}>{code}</span>
          )}
        </div>

        {/* Select découpage + bouton X */}
        <div className="flex items-center gap-2">
          <Select
            value={decoupage}
            onValueChange={(value) => onDecoupageChange(value as DecoupageType)}
          >
            <SelectTrigger size="sm" width="auto" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lignes de prix */}
      <div className="space-y-1">
        {priceLines.map((line, index) => (
          <PriceLine
            key={`${id}-${line.periodIndex}`}
            label={`Prix ${formatPeriodDate(line.date)}`}
            price={line.price}
            previousPrice={line.previousPrice}
            onPriceChange={(newPrice) => handlePriceChange(line.periodIndex, newPrice, decoupage === 'none' || intermediatePrices.length === 0)}
            isFirst={line.isFirst}
          />
        ))}

        {/* Ligne évolution totale (seulement avec découpage) */}
        {hasDecoupage && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-500 w-[110px] mr-4" style={{ fontSize: '14px' }}>Évolution totale</span>
            <div
              className={`h-8 px-3 text-sm text-center rounded flex items-center justify-center font-bold ${
                totalEvolution === 0
                  ? 'text-gray-900'
                  : totalEvolution > 0
                    ? 'text-red-600'
                    : 'text-green-600'
              }`}
            >
              {totalEvolution >= 0 ? '+' : ''}{totalEvolution.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
