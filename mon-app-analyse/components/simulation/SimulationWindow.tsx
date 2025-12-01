// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { Button as ButtonV2 } from '@/componentsv2/ui/button'
import { InlineField } from '@/componentsv2/ui/inline-field'
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

    // Mettre à jour les découpages pour refléter la nouvelle période
    updateAllDecoupagesForPeriod(newPeriod)
  }

  // États pour les SegmentedControls (MP ou Emballage) - un pour chaque colonne
  const [leftColumnType, setLeftColumnType] = useState<'mp' | 'emballage'>('mp')
  const [rightColumnType, setRightColumnType] = useState<'mp' | 'emballage'>('mp')

  const isWindowOpen = useSimulationStore((state) => state.isWindowOpen)
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const closeWindow = useSimulationStore((state) => state.closeWindow)
  const startSimulation = useSimulationStore((state) => state.startSimulation)
  const resetToOriginal = useSimulationStore((state) => state.resetToOriginal)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)
  const hasChanges = useSimulationStore((state) => state.hasChanges)
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const updateAllDecoupagesForPeriod = useSimulationStore((state) => state.updateAllDecoupagesForPeriod)

  console.log('SimulationWindow render, isWindowOpen:', isWindowOpen)
  console.log('availableMPValues:', availableMPValues?.length)
  console.log('availableMPVolumes:', availableMPVolumes?.length)
  console.log('simulatedData:', simulatedData)

  const handleClose = () => {
    // Si déjà en mode simulation, fermer sans confirmation (les changements sont préservés)
    if (isSimulationMode) {
      closeWindow()
      return
    }
    // Si pas en mode simulation et qu'il y a des changements, demander confirmation
    if (hasChanges()) {
      setShowConfirmDialog(true)
    } else {
      closeWindow()
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmDialog(false)
    // Seulement quitter le mode simulation si on n'est PAS déjà en mode simulation
    // (ce cas ne devrait plus arriver car on ferme directement en mode simulation)
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
        <div className="relative w-[1300px] bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col max-h-[85vh] pointer-events-auto">
          {/* Close button */}
          <ButtonV2
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </ButtonV2>
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <h2 className="title-xs text-foreground">{getSimulationTitle(perimetre, label)}</h2>
          </div>
          <div className="px-8 pb-3">
            <InlineField label="Période">
              <DatePicker
                mode="period"
                size="sm"
                value={period}
                onValueChange={handlePeriodChange}
                minDate={{ month: 0, year: 2020 }}
                maxDate={{ month: 0, year: 2028 }}
                showValidateButton
              />
            </InlineField>
          </div>

          {/* Colonnes */}
          <div className="flex gap-8 p-4 flex-1 overflow-hidden min-h-0">
            {/* Colonne gauche */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="title-xs-regular text-foreground">
                    {leftColumnType === 'emballage' ? 'Evolution du cours des emballages' : 'Evolution du cours des MP'}
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
                    {rightColumnType === 'emballage' ? 'Répartition en volume des emballages' : 'Répartition en volume des MP'}
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
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                resetToOriginal()
                setResetKey(k => k + 1)
              }}
            >
              Réinitialiser
            </ButtonV2>

            <ButtonV2
              variant="default"
              size="sm"
              onClick={handleSimulate}
              disabled={!hasData}
            >
              Simuler
            </ButtonV2>
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
