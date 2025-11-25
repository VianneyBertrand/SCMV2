// @ts-nocheck
'use client'

import { Pencil } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useSimulationStore } from '@/stores/simulationStore'

/**
 * Bouton déclencheur de simulation - disabled quand en mode simulation
 */
export function SimulationButton() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const openWindow = useSimulationStore((state) => state.openWindow)

  const handleClick = () => {
    if (isSimulationMode) return // Ne rien faire si déjà en mode simulation

    console.log('SimulationButton clicked')
    // Récupérer la position du bouton
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const position = {
        top: rect.top,
        left: rect.right + 16 // Gap de 16px à droite du bouton
      }
      console.log('Calling openWindow() with position:', position)
      openWindow(position)
    } else {
      console.log('Calling openWindow()')
      openWindow()
    }
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="sm"
      className="gap-2 hover:bg-blue-50 text-[14px]"
      style={{ color: '#0970E6' }}
      onClick={handleClick}
      disabled={isSimulationMode}
    >
      <Pencil className="w-5 h-5" style={{ color: '#0970E6' }} />
      Simulation
    </Button>
  )
}
