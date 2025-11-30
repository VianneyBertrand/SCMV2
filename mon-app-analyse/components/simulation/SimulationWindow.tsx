// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { Button } from '@/componentsv2/ui/button'
import { Field, FieldLabel } from '@/componentsv2/ui/field'
import { DatePicker, type MonthYear } from '@/componentsv2/ui/date-picker'
import { SegmentedControl, SegmentedControlItem } from '@/componentsv2/ui/segmented-control'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/componentsv2/ui/tooltip'
import { useSimulationStore, MPValueItem, MPVolumeItem } from '@/stores/simulationStore'
import { usePeriodStore } from '@/stores/periodStore'
import { MPValueColumn } from './MPValueColumn'
import { MPVolumeColumn } from './MPVolumeColumn'
import { ConfirmCloseDialog } from './ConfirmCloseDialog'

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
 * Dialog modale de simulation
 */
export function SimulationWindow({ availableMPValues, availableMPVolumes, perimetre, label }: SimulationWindowProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  // Récupérer la période globale du store (pour initialiser)
  const globalPeriod = usePeriodStore((state) => state.period)

  // État local pour la période (initialisé avec la période globale, mais indépendant)
  const [period, setPeriod] = useState<{ from?: MonthYear; to?: MonthYear } | undefined>(undefined)

  // Initialiser la période locale avec la période globale au premier rendu
  useEffect(() => {
    if (period === undefined) {
      setPeriod({
        from: globalPeriod.from,
        to: globalPeriod.to
      })
    }
  }, [globalPeriod, period])

  // Limite pour la période 1 (from) : pas après novembre 2025
  const maxFromDate: MonthYear = { month: 10, year: 2025 } // November 2025 (month is 0-indexed)

  // Handler pour valider la période avec contrainte sur "from"
  const handlePeriodChange = (newPeriod: { from?: MonthYear; to?: MonthYear } | undefined) => {
    if (!newPeriod) {
      setPeriod(newPeriod)
      return
    }

    // Vérifier si "from" dépasse la limite
    if (newPeriod.from) {
      const fromValue = newPeriod.from.year * 12 + newPeriod.from.month
      const maxFromValue = maxFromDate.year * 12 + maxFromDate.month
      if (fromValue > maxFromValue) {
        // Plafonner "from" à novembre 2025
        newPeriod = { ...newPeriod, from: maxFromDate }
      }
    }

    setPeriod(newPeriod)
  }

  // États pour les SegmentedControls (MP ou Emballage) - un pour chaque colonne
  const [leftColumnType, setLeftColumnType] = useState<'mp' | 'emballage'>('mp')
  const [rightColumnType, setRightColumnType] = useState<'mp' | 'emballage'>('mp')

  const isWindowOpen = useSimulationStore((state) => state.isWindowOpen)
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

  return (
    <>
      {/* Overlay grisé - z-index supérieur au header (z-50) */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose} />

      {/* Dialog centrée */}
      <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
        <div className="w-[1300px] bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col max-h-[85vh] pointer-events-auto">
          {/* Header */}
          <div className="px-8 pt-8 pb-3 rounded-t-lg flex items-center justify-between">
            <div className="flex flex-col gap-8">
              <h2 className="title-xs text-foreground">{getSimulationTitle(perimetre, label)}</h2>
              <Field className="w-fit flex items-center gap-2">
                <FieldLabel htmlFor="simulation-period" className="mb-0">Période</FieldLabel>
                <DatePicker
                  id="simulation-period"
                  mode="period"
                  value={period}
                  onValueChange={handlePeriodChange}
                  minDate={{ month: 0, year: 2020 }}
                  maxDate={{ month: 0, year: 2028 }}
                  className="w-[320px]"
                />
              </Field>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#0970E6] hover:text-[#004E9B] hover:bg-gray-100 active:text-[#003161] active:bg-gray-200 self-start"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Colonnes */}
          <div className="flex gap-4 p-4 flex-1 overflow-hidden min-h-0">
            {/* Colonne gauche */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="title-xs-regular text-foreground">
                    {leftColumnType === 'emballage' ? 'Emballage en Valeur (€)' : 'MP en Valeur (€)'}
                  </h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{leftColumnType === 'emballage' ? 'Prix des emballages par période' : 'Prix des matières premières par période'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="px-4 mb-4">
                <SegmentedControl
                  value={leftColumnType}
                  onValueChange={(v) => setLeftColumnType(v as 'mp' | 'emballage')}
                >
                  <SegmentedControlItem value="mp">MP</SegmentedControlItem>
                  <SegmentedControlItem value="emballage">Emballage</SegmentedControlItem>
                </SegmentedControl>
              </div>
              <MPValueColumn
                availableOptions={availableMPValues}
                period={period}
                resetKey={resetKey}
                columnType={leftColumnType}
              />
            </div>

            {/* Colonne droite */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="title-xs-regular text-foreground">
                    {rightColumnType === 'emballage' ? 'Emballage en Volume (%)' : 'MP en Volume (%)'}
                  </h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{rightColumnType === 'emballage' ? 'Répartition des emballages en volume' : 'Répartition des matières premières en volume'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="px-4 mb-4">
                <SegmentedControl
                  value={rightColumnType}
                  onValueChange={(v) => setRightColumnType(v as 'mp' | 'emballage')}
                >
                  <SegmentedControlItem value="mp">MP</SegmentedControlItem>
                  <SegmentedControlItem value="emballage">Emballage</SegmentedControlItem>
                </SegmentedControl>
              </div>
              <MPVolumeColumn
                availableOptions={availableMPVolumes}
                availableMPValues={availableMPValues}
                columnType={rightColumnType}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
            <Button
              variant="outline"
              className="h-11 px-4 text-sm"
              style={{ fontSize: '14px' }}
              onClick={() => {
                resetToOriginal()
                setResetKey(k => k + 1)
              }}
            >
              Réinitialiser
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

      <ConfirmCloseDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmClose}
      />
    </>
  )
}
