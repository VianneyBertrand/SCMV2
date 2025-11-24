// @ts-nocheck
'use client'

import { useSimulationStore } from '@/stores/simulationStore'

/**
 * Barre rouge sticky affichée en haut de la page en mode simulation
 */
export function SimulationFeedbackBar() {
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)

  if (!isSimulationMode) return null

  return (
    <div className="sticky top-0 z-50 w-full bg-red-500 text-white py-2 text-center font-medium">
      Mode Simulation
    </div>
  )
}
