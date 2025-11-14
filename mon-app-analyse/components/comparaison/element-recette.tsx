"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ChevronUp } from "lucide-react"

// Helper pour filtrer les filtres à afficher (uniquement Pays, Fournisseur, Portefeuille)
const filterDisplayableFilters = (filters: Record<string, string>): Record<string, string> => {
  const allowedKeys = ['pays', 'fournisseur', 'fournisseurs', 'portefeuille']
  const filtered = Object.entries(filters)
    .filter(([key]) => allowedKeys.includes(key.toLowerCase()))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  console.log('[ElementRecette] Original filters:', filters)
  console.log('[ElementRecette] Filtered filters:', filtered)
  return filtered
}

interface ElementRecetteProps {
  element: {
    id: string
    name: string
    filters: Record<string, string>
  }
  recetteSubTab?: 'mpa' | 'mpi'
  setRecetteSubTab?: (value: 'mpa' | 'mpi') => void
  showAllRecette?: boolean
  setShowAllRecette?: (value: boolean) => void
  hasPairedElementTags?: boolean
}

export function ElementRecette({
  element,
  recetteSubTab: recetteSubTabProp,
  setRecetteSubTab: setRecetteSubTabProp,
  showAllRecette: showAllRecetteProp,
  setShowAllRecette: setShowAllRecetteProp,
  hasPairedElementTags = false,
}: ElementRecetteProps) {
  // État local comme fallback si les props ne sont pas fournies
  const [recetteSubTabLocal, setRecetteSubTabLocal] = useState<'mpa' | 'mpi'>('mpa')
  const [showAllRecetteLocal, setShowAllRecetteLocal] = useState(false)

  // Utiliser les props si disponibles, sinon l'état local
  const recetteSubTab = recetteSubTabProp ?? recetteSubTabLocal
  const setRecetteSubTab = setRecetteSubTabProp ?? setRecetteSubTabLocal
  const showAllRecette = showAllRecetteProp ?? showAllRecetteLocal
  const setShowAllRecette = setShowAllRecetteProp ?? setShowAllRecetteLocal

  const getRecetteData = () => {
    switch (recetteSubTab) {
      case 'mpa':
        return [
          { name: 'Eau', code: 'HE65', percentage: 25.43 },
          { name: 'Farine de blé', code: 'FE23', percentage: 20.15 },
          { name: 'Sucre', code: 'FE23', percentage: 17.24 },
          { name: 'Sel', code: 'FR34', percentage: 5.46 },
          { name: 'Lait en poudre', code: 'FR34', percentage: 5.46 },
          { name: 'Beurre', code: 'FR34', percentage: 5.46 },
          { name: 'Huile végétale', code: 'FR34', percentage: 5.46 },
          { name: 'Œufs', code: 'FR34', percentage: 5.46 },
          { name: 'Levure', code: 'FR34', percentage: 5.46 },
          { name: 'Amidon de maïs', code: 'FR34', percentage: 5.46 },
          { name: 'Gélatine', code: 'FR34', percentage: 5.46 },
          { name: 'Présure', code: 'FR34', percentage: 5.46 },
          { name: 'Ferments lactiques', code: 'FR34', percentage: 5.46 },
          { name: 'Crème fraîche', code: 'FR34', percentage: 5.46 },
        ].sort((a, b) => b.percentage - a.percentage)
      case 'mpi':
        return [
          { name: 'Carton ondulé', code: 'MP01', percentage: 18.5 },
          { name: 'Polypropylène', code: 'MP02', percentage: 14.2 },
          { name: 'Polyéthylène', code: 'MP03', percentage: 12.8 },
          { name: 'Aluminium', code: 'MP04', percentage: 10.3 },
          { name: 'Verre', code: 'MP05', percentage: 8.7 },
          { name: 'Acier', code: 'MP06', percentage: 7.9 },
          { name: 'Papier kraft', code: 'MP07', percentage: 6.5 },
          { name: 'Polystyrène expansé', code: 'MP08', percentage: 5.4 },
          { name: 'PET', code: 'MP09', percentage: 4.8 },
          { name: 'Étiquettes papier', code: 'MP10', percentage: 3.6 },
          { name: 'Bouchons plastique', code: 'MP11', percentage: 2.9 },
          { name: 'Film étirable', code: 'MP12', percentage: 2.3 },
          { name: 'Encres d\'impression', code: 'MP13', percentage: 1.8 },
          { name: 'Colles et adhésifs', code: 'MP14', percentage: 1.5 },
        ].sort((a, b) => b.percentage - a.percentage)
    }
  }

  const recetteData = getRecetteData()
  const displayedData = showAllRecette ? recetteData : recetteData.slice(0, 6)

  const hasOwnTags = Object.entries(filterDisplayableFilters(element.filters)).length > 0
  const shouldAddSpacing = !hasOwnTags && hasPairedElementTags

  return (
    <div className="space-y-6 border border-[#D9D9D9] rounded-lg p-6">
      {/* En-tête avec nom et filtres */}
      <div className={shouldAddSpacing ? "min-h-[60px]" : ""}>
        <h3 className="text-lg font-bold mb-2">{element.name}</h3>
        {hasOwnTags && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(filterDisplayableFilters(element.filters)).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sous-tabs MPA / MPI avec icône download */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-0 w-fit">
          <button
            onClick={() => setRecetteSubTab('mpa')}
            className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${
              recetteSubTab === 'mpa'
                ? 'bg-[#0970E6] text-white font-bold'
                : 'bg-[#F2F2F2] text-black font-medium'
            }`}
          >
            MP
          </button>
          <button
            onClick={() => setRecetteSubTab('mpi')}
            className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${
              recetteSubTab === 'mpi'
                ? 'bg-[#0970E6] text-white font-bold'
                : 'bg-[#F2F2F2] text-black font-medium'
            }`}
          >
            Emballage
          </button>
        </div>
        <Button variant="ghost" size="icon" className="p-0">
          <Download className="text-[#0970E6]" width={24} height={24} />
        </Button>
      </div>

      {/* Liste avec bar charts */}
      <div>

        <div className="space-y-3">
          {displayedData.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Nom + Code Mintech */}
              <div className="w-48 flex-shrink-0">
                <div className="font-bold text-base">{item.name}</div>
                <div className="font-medium text-gray-500 text-sm">{item.code}</div>
              </div>

              {/* Barre de progression horizontale */}
              <div className="flex-1 bg-gray-100 rounded-md h-8 relative overflow-hidden">
                <div
                  className="bg-blue h-full rounded-md transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Pourcentage à droite */}
              <div className="w-20 text-right font-bold text-base">
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton Afficher plus/moins */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowAllRecette(!showAllRecette)}
          className="gap-2"
        >
          {showAllRecette ? (
            <>
              Afficher moins
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Afficher plus
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
