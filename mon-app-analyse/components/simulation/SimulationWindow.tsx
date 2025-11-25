// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { X } from 'lucide-react'
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
    // Lancer la simulation même sans changements
    startSimulation()
  }

  const handleQuit = () => {
    exitSimulation()
  }

  // Vérifier si des données sont chargées
  const hasData = simulatedData.mpValues.length > 0 || simulatedData.mpVolumes.length > 0

  if (!isWindowOpen) return null

  // Calculer la position de la fenêtre
  const windowStyle: React.CSSProperties = buttonPosition
    ? {
        top: `${buttonPosition.top}px`,
        left: `${buttonPosition.left}px`,
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }

  return (
    <>
      <Draggable handle=".drag-handle" nodeRef={nodeRef}>
        <div ref={nodeRef} className="fixed w-[1300px] bg-white rounded-lg shadow-2xl border border-gray-300 z-40 flex flex-col max-h-[80vh]" style={windowStyle}>
          {/* Header draggable */}
          <div className="drag-handle px-8 py-3 rounded-t-lg flex items-center justify-between cursor-move">
            <h2 className="text-lg font-semibold text-gray-800">Simulation</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#0970E6] hover:text-[#004E9B] hover:bg-gray-100 active:text-[#003161] active:bg-gray-200"
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
