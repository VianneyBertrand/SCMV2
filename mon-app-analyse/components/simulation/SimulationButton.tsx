// @ts-nocheck
'use client'

import { Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSimulationStore } from '@/stores/simulationStore'

/**
 * Bouton déclencheur de simulation (toggle entre "Simulation" et "Quitter la simulation")
 */
export function SimulationButton() {
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const openWindow = useSimulationStore((state) => state.openWindow)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)

  const handleClick = () => {
    console.log('SimulationButton clicked, isSimulationMode:', isSimulationMode)
    if (isSimulationMode) {
      exitSimulation()
    } else {
      console.log('Calling openWindow()')
      openWindow()
    }
  }

  if (isSimulationMode) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        onClick={handleClick}
      >
        <X className="w-5 h-5" />
        Quitter la simulation
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      onClick={handleClick}
    >
      <Pencil className="w-5 h-5" />
      Simulation
    </Button>
  )
}
