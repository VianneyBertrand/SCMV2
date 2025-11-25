// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Draggable from 'react-draggable'
import { X, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSimulationStore, MPValueItem, MPVolumeItem } from '@/stores/simulationStore'
import { MPValueColumn } from './MPValueColumn'
import { MPVolumeColumn } from './MPVolumeColumn'
import { ConfirmCloseDialog } from './ConfirmCloseDialog'
import { fr } from 'date-fns/locale'
import { addMonths, addYears } from 'date-fns'

type PeriodType = 'defined' | 'future'
type DurationOption = '3m' | '6m' | '1y' | '2y'

const DURATION_OPTIONS: { value: DurationOption; label: string; months: number }[] = [
  { value: '3m', label: '3 mois', months: 3 },
  { value: '6m', label: '6 mois', months: 6 },
  { value: '1y', label: '1 an', months: 12 },
  { value: '2y', label: '2 ans', months: 24 },
]

// Formater une date en jj/mm/aaaa
function formatDateToFR(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Calculer la date de fin en fonction de la durée
function calculateEndDate(startDate: Date, months: number): Date {
  return addMonths(startDate, months)
}

// Générer le titre dynamique
function getSimulationTitle(perimetre: string, label: string): string {
  const perimetreMap: Record<string, string> = {
    'Catégorie': 'de la catégorie',
    'Marché': 'du marché',
    'Fournisseur': 'du fournisseur',
    'Produit': 'du produit',
  }
  const preposition = perimetreMap[perimetre] || `de ${perimetre.toLowerCase()}`
  return `Simulation ${preposition} ${label}`
}

interface SimulationWindowProps {
  availableMPValues: MPValueItem[]
  availableMPVolumes: MPVolumeItem[]
  perimetre: string
  label: string
}

/**
 * Fenêtre de simulation draggable
 */
export function SimulationWindow({ availableMPValues, availableMPVolumes, perimetre, label }: SimulationWindowProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const nodeRef = useRef(null)

  // États pour la sélection de période
  const [periodType, setPeriodType] = useState<PeriodType>('defined')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Calculer la date de fin automatiquement
  const endDate = useMemo(() => {
    if (!startDate || !selectedDuration) return undefined
    const durationOption = DURATION_OPTIONS.find(d => d.value === selectedDuration)
    if (!durationOption) return undefined
    return calculateEndDate(startDate, durationOption.months)
  }, [startDate, selectedDuration])

  // Appliquer "Aujourd'hui" comme date de départ
  const handleTodayClick = () => {
    setStartDate(new Date())
    setIsCalendarOpen(false)
  }

  // Sélectionner une durée
  const handleDurationSelect = (duration: DurationOption) => {
    setSelectedDuration(duration)
  }

  // Formater l'affichage de la période
  const getPeriodDisplay = () => {
    if (!startDate) return 'Choisir une date de début'
    if (!endDate) return `À partir du ${formatDateToFR(startDate)}`
    return `${formatDateToFR(startDate)} → ${formatDateToFR(endDate)}`
  }

  // Vérifier si la période future est complète
  const isFuturePeriodComplete = startDate && selectedDuration

  const isWindowOpen = useSimulationStore((state) => state.isWindowOpen)
  const buttonPosition = useSimulationStore((state) => state.buttonPosition)
  const closeWindow = useSimulationStore((state) => state.closeWindow)
  const startSimulation = useSimulationStore((state) => state.startSimulation)
  const resetToOriginal = useSimulationStore((state) => state.resetToOriginal)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)
  const hasChanges = useSimulationStore((state) => state.hasChanges)
  const simulatedData = useSimulationStore((state) => state.simulatedData)

  console.log('SimulationWindow render, isWindowOpen:', isWindowOpen)
  console.log('availableMPValues:', availableMPValues?.length)
  console.log('availableMPVolumes:', availableMPVolumes?.length)
  console.log('simulatedData:', simulatedData)

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true)
    } else {
      closeWindow()
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmDialog(false)
    exitSimulation()
  }

  const handleSimulate = () => {
    // Lancer la simulation avec le contexte (périmètre et label)
    startSimulation(perimetre, label)
  }

  const handleQuit = () => {
    exitSimulation()
  }

  // Vérifier si des données sont chargées
  const hasData = simulatedData.mpValues.length > 0 || simulatedData.mpVolumes.length > 0

  if (!isWindowOpen) return null

  // Calculer la position de la fenêtre (à droite du bouton simulation avec 16px d'écart)
  const windowStyle: React.CSSProperties = buttonPosition
    ? {
        top: `${buttonPosition.top}px`,
        left: `${buttonPosition.left}px`,
      }
    : {
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
      }

  return (
    <>
      <Draggable handle=".drag-handle" nodeRef={nodeRef}>
        <div ref={nodeRef} className="fixed w-[1300px] bg-white rounded-lg shadow-2xl border border-gray-300 z-40 flex flex-col max-h-[80vh]" style={windowStyle}>
          {/* Header draggable */}
          <div className="drag-handle px-8 pt-8 pb-3 rounded-t-lg flex items-center justify-between cursor-move">
            <h2 className="text-lg font-semibold text-gray-800">{getSimulationTitle(perimetre, label)}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#0970E6] hover:text-[#004E9B] hover:bg-gray-100 active:text-[#003161] active:bg-gray-200"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sélection de la période */}
          <div className="px-8 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              {/* Radio: Période définie */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="defined"
                  checked={periodType === 'defined'}
                  onChange={() => setPeriodType('defined')}
                  className="w-4 h-4 text-[#0970E6] border-gray-300 focus:ring-[#0970E6]"
                />
                <span className="text-sm text-gray-700">
                  Période définie <span className="text-gray-500">(01/04/2024 - 01/04/2025)</span>
                </span>
              </label>

              {/* Radio: Période future */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="future"
                  checked={periodType === 'future'}
                  onChange={() => setPeriodType('future')}
                  className="w-4 h-4 text-[#0970E6] border-gray-300 focus:ring-[#0970E6]"
                />
                <span className="text-sm text-gray-700">Période future</span>
              </label>

              {/* Sélecteur de période future */}
              {periodType === 'future' && (
                <div className="ml-7 mt-3 space-y-4">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0970E6] focus:border-transparent transition-colors"
                      >
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>
                          {isFuturePeriodComplete ? getPeriodDisplay() : (startDate ? formatDateToFR(startDate) : 'Sélectionner')}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {/* Raccourci Aujourd'hui */}
                      <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <button
                          type="button"
                          onClick={handleTodayClick}
                          className="flex items-center gap-2 text-sm text-[#0970E6] hover:text-[#004E9B] font-medium"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Aujourd'hui
                        </button>
                      </div>

                      {/* Calendrier */}
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                        }}
                        locale={fr}
                        disabled={(date) => date < new Date()}
                      />

                      {/* Chips de durée */}
                      <div className="p-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">Durée</div>
                        <div className="flex gap-2 flex-wrap">
                          {DURATION_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleDurationSelect(option.value)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                                selectedDuration === option.value
                                  ? 'bg-[#0970E6] text-white border-[#0970E6] shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0970E6] hover:text-[#0970E6]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Colonnes */}
          <div className="flex gap-4 p-4 flex-1 overflow-hidden">
            <MPValueColumn
              availableOptions={availableMPValues}
              periodType={periodType}
              selectedDuration={selectedDuration}
            />
            <MPVolumeColumn
              availableOptions={availableMPVolumes}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
            <Button
              variant="outline"
              className="h-11 px-4 text-sm"
              style={{ fontSize: '14px' }}
              onClick={resetToOriginal}
            >
              Réinitialiser
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="h-11 px-4 text-sm"
                style={{ fontSize: '14px' }}
                onClick={handleQuit}
              >
                Quitter
              </Button>
              <Button
                variant="default"
                className="h-11 px-4 text-sm bg-[#0970E6] hover:bg-[#004E9B] active:bg-[#003161] text-white"
                style={{ fontSize: '14px' }}
                onClick={handleSimulate}
                disabled={!hasData}
              >
                Simuler ✓
              </Button>
            </div>
          </div>
        </div>
      </Draggable>

      <ConfirmCloseDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmClose}
      />
    </>
  )
}
