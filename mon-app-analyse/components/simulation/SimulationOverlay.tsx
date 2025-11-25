// @ts-nocheck
'use client'

import { usePathname } from 'next/navigation'
import { useSimulationStore } from '@/stores/simulationStore'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

/**
 * Overlay de simulation avec contour rouge fixe et bouton quitter
 * Visible sur toutes les pages sauf /cours-matieres-premieres
 */
export function SimulationOverlay() {
  const pathname = usePathname()
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)

  // Ne pas afficher sur la page cours des matières premières
  if (pathname === '/cours-matieres-premieres') return null

  // Ne pas afficher si pas en mode simulation
  if (!isSimulationMode) return null

  return (
    <>
      {/* Contour fixe rouge avec bordure blanche (4px blanc + 2px rouge) */}
      <div
        className="fixed pointer-events-none z-[55]"
        style={{
          top: '64px', // juste en dessous du header
          left: '0',
          right: '0',
          bottom: '0',
          border: '4px solid white',
          boxShadow: 'inset 0 0 0 2px red',
        }}
      />

      {/* Bouton quitter la simulation - dans le flux normal, pousse le contenu */}
      <div className="w-full px-[50px] py-3 bg-white">
        <Button
          variant="destructive"
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={exitSimulation}
        >
          <X className="h-4 w-4" />
          Quitter la simulation
        </Button>
      </div>
    </>
  )
}
