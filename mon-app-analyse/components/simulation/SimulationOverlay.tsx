// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSimulationStore } from '@/stores/simulationStore'
import { Button } from '@/components/ui/button'
import { X, Eye, Download } from 'lucide-react'

// Liste des périmètres pour l'export
// Hiérarchie principale (poupées russes) : Marché > Marché détaillé > Catégorie > Groupe famille > Famille > Sous famille > Produit
// Indépendants : Fournisseurs, Portefeuille
const EXPORT_PERIMETRES = [
  { id: 'marche', label: 'Marché', level: 0, isHierarchy: true },
  { id: 'marche_detaille', label: 'Tous les marchés détaillés (2)', level: 1, isHierarchy: true },
  { id: 'categorie', label: 'Toutes les catégories [11]', level: 2, isHierarchy: true },
  { id: 'groupe_famille', label: 'Tous les groupes familles [23]', level: 3, isHierarchy: true },
  { id: 'famille', label: 'Toutes les familles [55]', level: 4, isHierarchy: true },
  { id: 'sous_famille', label: 'Toutes les sous familles [89]', level: 5, isHierarchy: true },
  { id: 'produit', label: 'Tous les produits [531]', level: 6, isHierarchy: true },
  { id: 'fournisseurs', label: 'Tous les fournisseurs [2]', level: -1, isHierarchy: false },
  { id: 'portefeuille', label: 'Tous les portefeuilles [9]', level: -1, isHierarchy: false },
]

// Mapping des noms de périmètres vers les IDs
const PERIMETRE_NAME_TO_ID: Record<string, string> = {
  'Marché': 'marche',
  'Marché détaillé': 'marche_detaille',
  'Catégorie': 'categorie',
  'Groupe famille': 'groupe_famille',
  'Famille': 'famille',
  'Sous famille': 'sous_famille',
  'Fournisseur': 'fournisseurs',
  'Fournisseurs': 'fournisseurs',
  'Portefeuille': 'portefeuille',
  'Produit': 'produit',
}

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

  // États des modales
  const [showConfirmQuit, setShowConfirmQuit] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedPerimetres, setSelectedPerimetres] = useState<string[]>([])

  // ID du périmètre de simulation actuel (toujours sélectionné et grisé)
  const currentPerimetreId = PERIMETRE_NAME_TO_ID[currentPerimetre] || ''

  // Réinitialiser la sélection quand on ouvre la modale (tout décoché par défaut)
  useEffect(() => {
    if (showExportModal) {
      setSelectedPerimetres([])
    }
  }, [showExportModal])

  // Ne pas afficher sur la page cours des matières premières
  if (pathname === '/cours-matieres-premieres') return null

  // Ne pas afficher si pas en mode simulation
  if (!isSimulationMode) return null

  // Handlers
  const handleViewModify = () => {
    openWindow()
  }

  const handleExport = () => {
    setShowExportModal(true)
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

  // Gestion de la sélection des périmètres
  const handleTogglePerimetre = (perimetreId: string) => {
    const clickedPerimetre = EXPORT_PERIMETRES.find(p => p.id === perimetreId)
    if (!clickedPerimetre) return

    const isSelected = selectedPerimetres.includes(perimetreId)

    // Périmètres indépendants : simple toggle
    if (!clickedPerimetre.isHierarchy) {
      setSelectedPerimetres(prev => {
        if (prev.includes(perimetreId)) {
          return prev.filter(id => id !== perimetreId)
        }
        return [...prev, perimetreId]
      })
      return
    }

    // Périmètres hiérarchiques
    if (isSelected) {
      // Décocher : retirer ce périmètre et tous ceux au-dessus
      const perimetresToRemove = EXPORT_PERIMETRES
        .filter(p => p.isHierarchy && p.level <= clickedPerimetre.level && p.level >= 0)
        .map(p => p.id)
      setSelectedPerimetres(prev => prev.filter(id => !perimetresToRemove.includes(id)))
    } else {
      // Cocher : ajouter ce périmètre et tous ceux en dessous
      const perimetresToAdd = EXPORT_PERIMETRES
        .filter(p => p.isHierarchy && p.level >= clickedPerimetre.level && p.level >= 0)
        .map(p => p.id)
      setSelectedPerimetres(prev => [...new Set([...prev, ...perimetresToAdd])])
    }
  }

  const handleDownload = () => {
    // TODO: Implémenter le téléchargement réel
    console.log('Téléchargement des données pour:', selectedPerimetres)
    setShowExportModal(false)
    setSelectedPerimetres([])
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
              variant="outline"
              className="px-4 py-2 text-sm border-[#0970E6] text-[#0970E6] hover:bg-blue-50"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter la simulation
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

      {/* Modale d'export */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Exporter la simulation
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowExportModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Élément de simulation (toujours sélectionné, grisé) */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 text-[#0970E6] border-gray-300 rounded cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentPerimetre} : {currentLabel}
                </span>
                <span className="text-xs text-gray-500 ml-auto">(élément simulé)</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Sélectionnez les périmètres à exporter :
            </p>

            {/* Liste des périmètres */}
            <div className="space-y-1 mb-6">
              {EXPORT_PERIMETRES.map((perimetre) => {
                const isChecked = selectedPerimetres.includes(perimetre.id)

                return (
                  <label
                    key={perimetre.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer border-gray-200 ${
                      isChecked ? 'border-[#0970E6] bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePerimetre(perimetre.id)}
                      className="w-4 h-4 text-[#0970E6] border-gray-300 rounded focus:ring-[#0970E6]"
                    />
                    <span className="text-sm text-gray-700">
                      {perimetre.label}
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button
                variant="default"
                className="bg-[#0970E6] hover:bg-[#004E9B] text-white"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
