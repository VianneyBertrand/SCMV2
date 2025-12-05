// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { Button as ButtonV2 } from '@/componentsv2/ui/button'
import { IconButton } from '@/componentsv2/ui/icon-button'
import { Field, FieldLabel } from '@/componentsv2/ui/field'
import { DatePicker, type MonthYear } from '@/componentsv2/ui/date-picker'
import { SegmentedControl, SegmentedControlItem } from '@/componentsv2/ui/segmented-control'
import { Tabs, TabsList, TabsTrigger } from '@/componentsv2/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentsv2/ui/tooltip'
import { useSimulationStore, MPValueItem, MPVolumeItem } from '@/stores/simulationStore'
import { usePeriodStore } from '@/stores/periodStore'
import { MPValueColumn } from './MPValueColumn'
import { MPVolumeColumn } from './MPVolumeColumn'
import { ConfirmCloseDialog } from './ConfirmCloseDialog'
import { TotalPercentageDialog } from './TotalPercentageDialog'

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
  const [showPercentageDialog, setShowPercentageDialog] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  // Récupérer la période globale du store (pour initialiser)
  const globalPeriod = usePeriodStore((state) => state.period)

  // Récupérer isWindowOpen en premier pour l'utiliser dans le useEffect
  const isWindowOpen = useSimulationStore((state) => state.isWindowOpen)

  // État local pour la période effective (utilisée par les colonnes)
  const [period, setPeriod] = useState<{ from?: MonthYear; to?: MonthYear } | undefined>(undefined)

  // État temporaire pour la période en cours de sélection dans le DatePicker
  const [pendingPeriod, setPendingPeriod] = useState<{ from?: MonthYear; to?: MonthYear } | undefined>(undefined)

  // Réinitialiser les périodes avec la période globale à chaque ouverture de la fenêtre
  useEffect(() => {
    if (isWindowOpen) {
      const initialPeriod = {
        from: globalPeriod.from,
        to: globalPeriod.to
      }
      setPeriod(initialPeriod)
      setPendingPeriod(initialPeriod)
    }
  }, [isWindowOpen, globalPeriod])

  // Limite pour la période 1 (from) : pas après novembre 2025
  const maxFromDate: MonthYear = { month: 10, year: 2025 } // November 2025 (month is 0-indexed)

  // Handler pour les changements dans le DatePicker (met à jour seulement l'état temporaire)
  const handlePeriodChange = (newPeriod: { from?: MonthYear; to?: MonthYear } | undefined) => {
    if (!newPeriod) {
      setPendingPeriod(newPeriod)
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

    // Met à jour seulement l'état temporaire (pas les colonnes)
    setPendingPeriod(newPeriod)
  }

  // Handler pour la validation du DatePicker (applique la période aux colonnes)
  const handlePeriodValidate = () => {
    if (pendingPeriod) {
      setPeriod(pendingPeriod)
      // Mettre à jour les découpages pour refléter la nouvelle période
      updateAllDecoupagesForPeriod(pendingPeriod)
    }
  }

  // État pour le radio button (simulation des cours ou simulation de la recette)
  const [activeColumn, setActiveColumn] = useState<'cours' | 'recette'>('cours')

  // États pour les SegmentedControls (MP ou Emballage) - un pour chaque colonne
  const [leftColumnType, setLeftColumnType] = useState<'mp' | 'emballage'>('mp')
  const [rightColumnType, setRightColumnType] = useState<'mp' | 'emballage'>('mp')

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
    // Vérifier que les totaux sont à 100% avant de simuler
    if (!areTotalsValid) {
      setShowPercentageDialog(true)
      return
    }
    // Lancer la simulation avec le contexte (périmètre, label et périodes)
    startSimulation(perimetre, label, period, globalPeriod)
  }

  const handleQuit = () => {
    exitSimulation()
  }

  // Vérifier si des données sont chargées
  const hasData = simulatedData.mpValues.length > 0 || simulatedData.mpVolumes.length > 0

  // Calculer les totaux des pourcentages
  const mpVolumeTotal = simulatedData.mpVolumes.reduce((sum, item) => sum + item.percentage, 0)
  const emballageVolumeTotal = simulatedData.emballageVolumes.reduce((sum, item) => sum + item.percentage, 0)
  const hasMPVolumes = simulatedData.mpVolumes.length > 0
  const hasEmballageVolumes = simulatedData.emballageVolumes.length > 0

  // Vérifier si les totaux sont valides (100% avec une tolérance de 0.01%)
  const isMPTotalValid = !hasMPVolumes || Math.abs(mpVolumeTotal - 100) <= 0.01
  const isEmballageTotalValid = !hasEmballageVolumes || Math.abs(emballageVolumeTotal - 100) <= 0.01
  const areTotalsValid = isMPTotalValid && isEmballageTotalValid

  if (!isWindowOpen) return null

  return (
    <>
      {/* Overlay grisé - z-index supérieur au header (z-50) */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose} />

      {/* Dialog centrée */}
      <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
        <div className="relative w-[800px] bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col max-h-[90vh] pointer-events-auto">
          {/* Close button */}
          <IconButton
            variant="ghost-accent"
            size="s"
            aria-label="Fermer"
            className="absolute top-4 right-4"
            onClick={handleClose}
          >
            <X />
          </IconButton>
          {/* Header */}
          <div className="px-8 pt-8 pb-8 text-center">
            <h2 className="title-xs text-foreground">{getSimulationTitle(perimetre, label)}</h2>
          </div>
          <div className="px-8 pb-3 flex flex-col gap-4">
            <div className="flex flex-row gap-4 items-end">
              <Field className="w-auto">
                <FieldLabel className="!body-s !text-accent-hover">Période de simulation</FieldLabel>
                <DatePicker
                  mode="period"
                  size="sm"
                  value={pendingPeriod}
                  onValueChange={handlePeriodChange}
                  onValidate={handlePeriodValidate}
                  minDate={{ month: 0, year: 2020 }}
                  maxDate={{ month: 0, year: 2028 }}
                  showValidateButton
                  quickFromDates={[{ label: "Décembre 2025", date: { month: 11, year: 2025 } }]}
                />
              </Field>
              <Field className="w-auto">
                <FieldLabel className="!body-s !text-accent-pressed">Période de référence</FieldLabel>
                <DatePicker
                  mode="period"
                  size="sm"
                  value={globalPeriod}
                  disabled
                  className="bg-surface-secondary border-border pointer-events-none"
                />
              </Field>
            </div>
            {/* Tabs pour basculer entre les colonnes */}
            <Tabs value={activeColumn} onValueChange={(v) => setActiveColumn(v as 'cours' | 'recette')}>
              <TabsList className="border-b-0">
                <TabsTrigger value="cours">Simulation des cours</TabsTrigger>
                <TabsTrigger value="recette">Simulation de la recette</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Colonnes */}
          <div className="flex gap-8 p-4 flex-1 overflow-hidden min-h-0">
            {/* Colonne Simulation des cours */}
            {activeColumn === 'cours' && (
              <div className="flex-1 flex flex-col min-h-0">
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
            )}

            {/* Colonne Simulation de la recette */}
            {activeColumn === 'recette' && (
              <div className="flex-1 flex flex-col min-h-0">
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
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 flex justify-between items-center rounded-b-lg">
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

      <TotalPercentageDialog
        open={showPercentageDialog}
        onOpenChange={setShowPercentageDialog}
        mpTotal={mpVolumeTotal}
        emballageTotal={emballageVolumeTotal}
        hasMPItems={hasMPVolumes}
        hasEmballageItems={hasEmballageVolumes}
      />
    </>
  )
}
