// @ts-nocheck
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSimulationStore } from '@/stores/simulationStore'
import { Button } from '@/components/ui/button'
import { X, Eye, FlaskConical } from 'lucide-react'

/**
 * Banner de simulation avec barre de contrôle
 * Visible sur toutes les pages sauf /cours-matieres-premieres
 */
export function SimulationOverlay() {
  const pathname = usePathname()
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const exitSimulation = useSimulationStore((state) => state.exitSimulation)
  const openWindow = useSimulationStore((state) => state.openWindow)
  const currentPerimetre = useSimulationStore((state) => state.currentPerimetre)
  const currentLabel = useSimulationStore((state) => state.currentLabel)
  const simulationPeriod = useSimulationStore((state) => state.simulationPeriod)
  const referencePeriod = useSimulationStore((state) => state.referencePeriod)

  // Formater une période en texte lisible (format DD/MM/YYYY)
  const formatPeriod = (period: { from?: { month: number; year: number }; to?: { month: number; year: number } } | null): string => {
    if (!period) return ''
    const formatDate = (date: { month: number; year: number }) => {
      const day = '01'
      const month = String(date.month + 1).padStart(2, '0')
      return `${day}/${month}/${date.year}`
    }
    const fromStr = period.from ? formatDate(period.from) : ''
    const toStr = period.to ? formatDate(period.to) : ''
    if (fromStr && toStr) return `${fromStr} - ${toStr}`
    return fromStr || toStr
  }

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
      {/* Banner de simulation */}
      <div className="w-full px-6 py-3 bg-[#CC4010] text-white">
        <div className="flex items-center justify-between">
          {/* Gauche - Titre */}
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5" />
            <span className="font-semibold tracking-wide">SIMULATION EN COURS</span>
            <span className="text-white/60">•</span>
            <span className="text-white/80">{currentLabel}</span>
            {(simulationPeriod || referencePeriod) && (
              <>
                <span className="text-white/60">•</span>
                <span className="text-white text-sm">
                  {referencePeriod && <span>Période de référence : {formatPeriod(referencePeriod)}</span>}
                  {referencePeriod && simulationPeriod && <span className="mx-3">|</span>}
                  {simulationPeriod && <span>Période de simulation : {formatPeriod(simulationPeriod)}</span>}
                </span>
              </>
            )}
          </div>

          {/* Droite - Boutons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="px-4 py-2 text-sm border-white text-white bg-transparent hover:bg-white/10 gap-1"
              onClick={handleViewModify}
            >
              <Eye className="h-4 w-4" />
              Modifier
            </Button>

            <Button
              variant="outline"
              className="px-4 py-2 text-sm bg-white text-[#CC4010] border-[#CC4010] hover:bg-orange-50 gap-1"
              onClick={handleQuit}
            >
              <X className="h-4 w-4" />
              Quitter
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
