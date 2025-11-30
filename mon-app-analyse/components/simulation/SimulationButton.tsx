// @ts-nocheck
'use client'

import { FlaskConical } from 'lucide-react'
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
      variant="outline"
      size="sm"
      className="gap-2 text-[16px] border-[#0970E6] text-[#0970E6] hover:bg-blue-50 hover:text-[#004E9B] hover:border-[#004E9B] mt-1"
      onClick={handleClick}
      disabled={isSimulationMode}
    >
      <FlaskConical className="w-7 h-7" />
      Simuler
    </Button>
  )
}
