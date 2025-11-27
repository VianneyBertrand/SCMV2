// @ts-nocheck
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSimulationStore } from '@/stores/simulationStore'
import { Button } from '@/components/ui/button'
import { X, Eye } from 'lucide-react'

// Générer le titre dynamique
function getSimulationTitle(perimetre: string, label: string): string {
  const perimetreMap: Record<string, string> = {
    'Catégorie': 'de la catégorie',
    'Marché': 'du marché',
    'Fournisseur': 'du fournisseur',
    'Produit': 'du produit',
  }
  const preposition = perimetreMap[perimetre] || `de ${perimetre.toLowerCase()}`
  return `Simulation en cours ${preposition} ${label}`
}

/**
 * Overlay de simulation avec contour rouge fixe et barre de contrôle
 * Visible sur toutes les pages sauf /cours-matieres-premieres
 */
export function SimulationOverlay() {
  const pathname = usePathname()
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)
  const openWindow = useSimulationStore((state) => state.openWindow)
  const currentPerimetre = useSimulationStore((state) => state.currentPerimetre)
  const currentLabel = useSimulationStore((state) => state.currentLabel)

  // État de la modale de confirmation
  const [showConfirmQuit, setShowConfirmQuit] = useState(false)

  // Ne pas afficher sur la page cours des matières premières
  if (pathname === '/cours-matieres-premieres') return null

  // Ne pas afficher si pas en mode simulation
  if (!isSimulationMode) return null

  // Handlers
  const handleViewModify = () => {
    openWindow()
  }

  const handleQuit = () => {
    setShowConfirmQuit(true)
  }

  const handleConfirmQuit = () => {
    setShowConfirmQuit(false)
    exitSimulation()
  }

  const handleCancelQuit = () => {
    setShowConfirmQuit(false)
  }

  return (
    <>
      {/* Contour fixe rouge avec bordure blanche (4px blanc + 2px rouge) */}
      <div
        className="fixed pointer-events-none z-[55]"
        style={{
          top: '64px',
          left: '0',
          right: '0',
          bottom: '0',
          border: '4px solid white',
          boxShadow: 'inset 0 0 0 2px red',
        }}
      />

      {/* Barre de contrôle de simulation */}
      <div className="w-full px-[50px] py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Titre */}
          <h2 className="text-gray-800 font-semibold" style={{ fontSize: '20px' }}>
            {getSimulationTitle(currentPerimetre, currentLabel)}
          </h2>

          {/* Boutons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="px-4 py-2 text-sm border-[#0970E6] text-[#0970E6] hover:bg-blue-50"
              onClick={handleViewModify}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir/modifier la simulation
            </Button>

            <Button
              variant="destructive"
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white"
              onClick={handleQuit}
            >
              <X className="h-4 w-4 mr-2" />
              Quitter la simulation
            </Button>
          </div>
        </div>
      </div>

      {/* Modale de confirmation pour quitter */}
      {showConfirmQuit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quitter la simulation ?
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir quitter la simulation ? Toutes les données de cette simulation seront perdues.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancelQuit}
              >
                Non
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmQuit}
              >
                Oui
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
