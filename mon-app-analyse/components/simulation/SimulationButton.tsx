// @ts-nocheck
'use client'

import { Pencil, X } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useSimulationStore } from '@/stores/simulationStore'

/**
 * Bouton déclencheur de simulation (toggle entre "Simulation" et "Quitter la simulation")
 */
export function SimulationButton() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const openWindow = useSimulationStore((state) => state.openWindow)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)

  const handleClick = () => {
    console.log('SimulationButton clicked, isSimulationMode:', isSimulationMode)
    if (isSimulationMode) {
      exitSimulation()
    } else {
      // Récupérer la position du bouton
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const position = {
          top: rect.top,
          left: rect.right + 40 // Gap de 40px à droite du bouton
        }
        console.log('Calling openWindow() with position:', position)
        openWindow(position)
      } else {
        console.log('Calling openWindow()')
        openWindow()
      }
    }
  }

  if (isSimulationMode) {
    return (
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="gap-2 hover:bg-blue-50 text-[14px]"
        style={{ color: '#0970E6' }}
        onClick={handleClick}
      >
        <X className="w-5 h-5" style={{ color: '#0970E6' }} />
        Quitter la simulation
      </Button>
    )
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="sm"
      className="gap-2 hover:bg-blue-50 text-[14px]"
      style={{ color: '#0970E6' }}
      onClick={handleClick}
    >
      <Pencil className="w-5 h-5" style={{ color: '#0970E6' }} />
      Simulation
    </Button>
  )
}
