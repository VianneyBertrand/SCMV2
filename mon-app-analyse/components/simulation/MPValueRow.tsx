// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MPValueRowProps {
  label: string
  priceStart: number
  priceEnd: number
  evolution: number
  startDate: string
  endDate: string
  onPriceStartChange: (value: number) => void
  onPriceEndChange: (value: number) => void
  onEvolutionChange: (value: number) => void
  onPriceStartIncrement: () => void
  onPriceStartDecrement: () => void
  onPriceEndIncrement: () => void
  onPriceEndDecrement: () => void
  onEvolutionIncrement: () => void
  onEvolutionDecrement: () => void
  onRemove: () => void
}

/**
 * Ligne MP en Valeur avec 2 inputs de prix (début et fin de période) + évolution
 */
export function MPValueRow({
  label,
  priceStart,
  priceEnd,
  evolution,
  startDate,
  endDate,
  onPriceStartChange,
  onPriceEndChange,
  onEvolutionChange,
  onPriceStartIncrement,
  onPriceStartDecrement,
  onPriceEndIncrement,
  onPriceEndDecrement,
  onEvolutionIncrement,
  onEvolutionDecrement,
  onRemove,
}: MPValueRowProps) {
  // États pour l'édition des prix
  const [isEditingPriceStart, setIsEditingPriceStart] = useState(false)
  const [editPriceStart, setEditPriceStart] = useState('')
  const priceStartRef = useRef<HTMLInputElement>(null)

  const [isEditingPriceEnd, setIsEditingPriceEnd] = useState(false)
  const [editPriceEnd, setEditPriceEnd] = useState('')
  const priceEndRef = useRef<HTMLInputElement>(null)

  const [isEditingEvolution, setIsEditingEvolution] = useState(false)
  const [editEvolution, setEditEvolution] = useState('')
  const evolutionRef = useRef<HTMLInputElement>(null)

  // Focus automatique sur l'input actif
  useEffect(() => {
    if (isEditingPriceStart && priceStartRef.current) {
      priceStartRef.current.focus()
      priceStartRef.current.select()
    }
  }, [isEditingPriceStart])

  useEffect(() => {
    if (isEditingPriceEnd && priceEndRef.current) {
      priceEndRef.current.focus()
      priceEndRef.current.select()
    }
  }, [isEditingPriceEnd])

  useEffect(() => {
    if (isEditingEvolution && evolutionRef.current) {
      evolutionRef.current.focus()
      evolutionRef.current.select()
    }
  }, [isEditingEvolution])

  // Handlers pour le prix de début
  const handlePriceStartClick = () => {
    setEditPriceStart(priceStart.toFixed(3))
    setIsEditingPriceStart(true)
  }

  const handlePriceStartBlur = () => {
    const newValue = parseFloat(editPriceStart)
    if (!isNaN(newValue) && newValue >= 0) {
      onPriceStartChange(newValue)
    }
    setIsEditingPriceStart(false)
  }

  const handlePriceStartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceStartBlur()
    else if (e.key === 'Escape') setIsEditingPriceStart(false)
  }

  // Handlers pour le prix de fin
  const handlePriceEndClick = () => {
    setEditPriceEnd(priceEnd.toFixed(3))
    setIsEditingPriceEnd(true)
  }

  const handlePriceEndBlur = () => {
    const newValue = parseFloat(editPriceEnd)
    if (!isNaN(newValue) && newValue >= 0) {
      onPriceEndChange(newValue)
    }
    setIsEditingPriceEnd(false)
  }

  const handlePriceEndKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceEndBlur()
    else if (e.key === 'Escape') setIsEditingPriceEnd(false)
  }

  // Handlers pour l'évolution
  const handleEvolutionClick = () => {
    setEditEvolution(evolution.toFixed(2))
    setIsEditingEvolution(true)
  }

  const handleEvolutionBlur = () => {
    const newValue = parseFloat(editEvolution)
    if (!isNaN(newValue)) {
      onEvolutionChange(newValue)
    }
    setIsEditingEvolution(false)
  }

  const handleEvolutionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEvolutionBlur()
    else if (e.key === 'Escape') setIsEditingEvolution(false)
  }

  return (
    <div className="space-y-2 py-2 border-b border-gray-100 last:border-0">
      {/* Label et bouton supprimer */}
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

      {/* Ligne Prix avec 2 inputs */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onPriceStartIncrement}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onPriceStartDecrement}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-gray-500">Prix</span>
        </div>

        {/* 2 inputs prix côte à côte */}
        <div className="flex items-start gap-3">
          {/* Prix début */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {isEditingPriceStart ? (
                <input
                  ref={priceStartRef}
                  type="text"
                  value={editPriceStart}
                  onChange={(e) => setEditPriceStart(e.target.value)}
                  onBlur={handlePriceStartBlur}
                  onKeyDown={handlePriceStartKeyDown}
                  className="w-16 h-8 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                />
              ) : (
                <span
                  className="h-8 px-2 text-sm font-semibold text-gray-900 cursor-text hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-end min-w-[64px]"
                  onClick={handlePriceStartClick}
                >
                  {priceStart.toFixed(3)}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900">€/kg</span>
            </div>
            <span className="text-[12px] text-gray-400 mt-0.5">{startDate}</span>
          </div>

          {/* Prix fin */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {isEditingPriceEnd ? (
                <input
                  ref={priceEndRef}
                  type="text"
                  value={editPriceEnd}
                  onChange={(e) => setEditPriceEnd(e.target.value)}
                  onBlur={handlePriceEndBlur}
                  onKeyDown={handlePriceEndKeyDown}
                  className="w-16 h-8 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                />
              ) : (
                <span
                  className="h-8 px-2 text-sm font-semibold text-gray-900 cursor-text hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-end min-w-[64px]"
                  onClick={handlePriceEndClick}
                >
                  {priceEnd.toFixed(3)}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900">€/kg</span>
            </div>
            <span className="text-[12px] text-gray-400 mt-0.5">{endDate}</span>
          </div>
        </div>
      </div>

      {/* Ligne Évolution */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onEvolutionIncrement}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-[#0970E6] text-[#0970E6] hover:border-[#004E9B] hover:text-[#004E9B] hover:bg-white active:border-[#003161] active:text-[#003161] active:bg-white"
              onClick={onEvolutionDecrement}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-gray-500">Évol.</span>
        </div>

        <div className="flex items-center gap-1">
          {isEditingEvolution ? (
            <input
              ref={evolutionRef}
              type="text"
              value={editEvolution}
              onChange={(e) => setEditEvolution(e.target.value)}
              onBlur={handleEvolutionBlur}
              onKeyDown={handleEvolutionKeyDown}
              className="w-16 h-8 px-2 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
            />
          ) : (
            <span
              className="h-8 px-2 text-sm font-semibold text-gray-900 cursor-text hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-end min-w-[64px]"
              onClick={handleEvolutionClick}
            >
              {evolution >= 0 ? '+' : ''}{evolution.toFixed(2)}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900">%</span>
        </div>
      </div>
    </div>
  )
}
