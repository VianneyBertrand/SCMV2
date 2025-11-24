// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSimulationStore, MPValueItem, MPVolumeItem } from '@/stores/simulationStore'
import { MPValueColumn } from './MPValueColumn'
import { MPVolumeColumn } from './MPVolumeColumn'
import { ConfirmCloseDialog } from './ConfirmCloseDialog'

interface SimulationWindowProps {
  availableMPValues: MPValueItem[]
  availableMPVolumes: MPVolumeItem[]
}

/**
 * Fenêtre de simulation draggable
 */
export function SimulationWindow({ availableMPValues, availableMPVolumes }: SimulationWindowProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const nodeRef = useRef(null)

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
    // Lancer la simulation même sans changements
    startSimulation()
  }

  const handleQuit = () => {
    exitSimulation()
  }

  // Vérifier si des données sont chargées
  const hasData = simulatedData.mpValues.length > 0 || simulatedData.mpVolumes.length > 0

  if (!isWindowOpen) return null

  return (
    <>
      <Draggable handle=".drag-handle" nodeRef={nodeRef}>
        <div ref={nodeRef} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] bg-white rounded-lg shadow-2xl border border-gray-300 z-40 flex flex-col max-h-[calc(70vh-80px)]">
          {/* Header draggable */}
          <div className="drag-handle bg-gray-50 px-4 py-3 rounded-t-lg border-b border-gray-200 flex items-center justify-between cursor-move">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800">Simulation</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Colonnes */}
          <div className="flex gap-4 p-4 flex-1 overflow-hidden">
            <MPValueColumn availableOptions={availableMPValues} />
            <MPVolumeColumn availableOptions={availableMPVolumes} />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center rounded-b-lg bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToOriginal}
            >
              Réinitialiser
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuit}
              >
                Quitter
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
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
