// @ts-nocheck
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { usePeriodMode } from "@/hooks/usePeriodMode"
import { ArrowLeft } from "lucide-react"
import { PeriodFilter } from "@/components/shared/period-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, RefreshCw } from "lucide-react"
import { getPerimetreData, type PerimetreType } from "@/lib/data/perimetre-data"

// Lazy load heavy comparison components with Recharts
const ElementCostStructure = dynamic(() => import("@/components/comparaison/element-cost-structure").then(mod => ({ default: mod.ElementCostStructure })), { ssr: false })
const ElementRecette = dynamic(() => import("@/components/comparaison/element-recette").then(mod => ({ default: mod.ElementRecette })), { ssr: false })
const ElementEvolutionPrix = dynamic(() => import("@/components/comparaison/element-evolution-prix").then(mod => ({ default: mod.ElementEvolutionPrix })), { ssr: false })

// Helper pour filtrer les filtres à afficher (uniquement Pays, Fournisseur, Portefeuille)
const filterDisplayableFilters = (filters: Record<string, string>): Record<string, string> => {
  const allowedKeys = ['pays', 'fournisseur', 'fournisseurs', 'portefeuille']
  const filtered = Object.entries(filters)
    .filter(([key]) => allowedKeys.includes(key.toLowerCase()))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  console.log('Original filters:', filters)
  console.log('Filtered filters:', filtered)
  return filtered
}

function ComparaisonContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Modes période CAD/CAM pour CA et Volume
  const { mode: caMode, toggleMode: toggleCAMode } = usePeriodMode('period-mode-ca-comparaison')
  const { mode: volumeMode, toggleMode: toggleVolumeMode } = usePeriodMode('period-mode-volume-comparaison')

  const [elements, setElements] = useState<{
    id: string
    name: string
    filters: Record<string, string>
  }[]>([])

  const [perimetre, setPerimetre] = useState('')

  // État partagé pour synchroniser les tabs de structure de coût entre tous les éléments
  const [costSubTab, setCostSubTab] = useState<'total' | 'mpa' | 'mpi'>('total')

  // État partagé pour synchroniser le bouton "Afficher plus/moins" entre tous les éléments
  const [showTable, setShowTable] = useState(false)

  // État partagé pour synchroniser les tabs de recette entre tous les éléments
  const [recetteSubTab, setRecetteSubTab] = useState<'mpa' | 'mpi'>('mpa')

  // État partagé pour synchroniser le bouton "Afficher plus/moins" de recette entre tous les éléments
  const [showAllRecette, setShowAllRecette] = useState(false)

  // États partagés pour synchroniser l'évolution prix entre tous les éléments
  const [evolutionLegendOpacity, setEvolutionLegendOpacity] = useState<Record<string, boolean>>({
    PA: true,
    'cout-theorique': true,
    PV: false,
    'PV-LCL': false,
    'Marge-PV': false,
    'Marge-PV-LCL': false,
  })
  const [evolutionPeriod, setEvolutionPeriod] = useState<'mois' | 'semaine' | 'jour'>('mois')
  const [evolutionBase100, setEvolutionBase100] = useState(false)
  const [evolutionDateRange, setEvolutionDateRange] = useState([0, 100])
  const [showEvolutionTable, setShowEvolutionTable] = useState(false)

  useEffect(() => {
    const elementsParam = searchParams.get('elements')
    const perimetreParam = searchParams.get('perimetre')

    if (elementsParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(elementsParam))
        setElements(decoded)
      } catch (e) {
        console.error('Error parsing elements:', e)
      }
    }

    if (perimetreParam) {
      setPerimetre(perimetreParam)
    }
  }, [searchParams])

  const getElementData = (elementName: string, filters: Record<string, string>) => {
    // Obtenir les données réelles depuis perimetre-data
    if (!perimetre) {
      return null
    }

    try {
      const data = getPerimetreData(perimetre as PerimetreType, filters)
      const element = data.find(item => item.label === elementName)

      if (!element) {
        return null
      }

      // Valeurs fixes CAD/CAM pour CA
      const caData = {
        CAD: { value: element.ca.valeur, evolution: element.ca.evolution },
        CAM: { value: "1254.00 M€", evolution: "+3.20%" }
      }

      // Valeurs fixes CAD/CAM pour Volume
      const volumeData = {
        CAD: { value: "287", evolution: "+4.32%" },
        CAM: { value: "315", evolution: "+4.85%" }
      }

      return {
        ca: caData[caMode].value,
        caEvolution: caData[caMode].evolution,
        volume: volumeData[volumeMode].value,
        volumeEvolution: volumeData[volumeMode].evolution,
        volumeTonne: '145.3', // TODO: Ajouter volume tonne
        volumeTonneEvolution: '+4.12%',
        mpa: element.mpa.valeur,
        mpaEvolution: element.mpa.evolution,
        mpi: element.mpi.valeur,
        mpiEvolution: element.mpi.evolution,
        pv: element.pv?.valeur || 'N/A',
        pvEvolution: element.pv?.evolution || 'N/A',
        pvLcl: element.pvLeclerc?.valeur || 'N/A',
        pvLclEvolution: element.pvLeclerc?.evolution || 'N/A',
        margePv: element.margePvc?.valeur || 'N/A',
        margePvEvolution: element.margePvc?.evolution || 'N/A',
        margePvLcl: element.margePvLcl?.valeur || 'N/A',
        margePvLclEvolution: element.margePvLcl?.evolution || 'N/A',
        pa: element.evoPa.valeur,
        paEvolution: element.evoPa.evolution,
        coutTheorique: element.coutTheorique.valeur,
        coutTheoriqueEvolution: element.coutTheorique.evolution,
        opportunite: element.opportunites.valeur,
        opportuniteEvolution: element.opportunites.evolution,
      }
    } catch (error) {
      console.error('Error fetching element data:', error)
      return null
    }
  }

  const getMetrics = () => {
    if (perimetre === 'produit') {
      return [
        { label: 'CA', key: 'ca' },
        { label: 'Volume (UVC)', key: 'volume' },
        { label: 'Volume (Tonne)', key: 'volumeTonne' },
        { label: 'MPA', key: 'mpa' },
        { label: 'MPI', key: 'mpi' },
        { label: 'PV', key: 'pv' },
        { label: 'PV LCL', key: 'pvLcl' },
        { label: 'Marge PV', key: 'margePv' },
        { label: 'Marge PV LCL', key: 'margePvLcl' },
        { label: 'PA', key: 'pa' },
        { label: 'PA théorique', key: 'coutTheorique' },
        { label: 'Opportunité', key: 'opportunite' },
      ]
    }

    return [
      { label: 'CA', key: 'ca' },
      { label: 'Volume (UVC)', key: 'volume' },
      { label: 'MPA', key: 'mpa' },
      { label: 'MPI', key: 'mpi' },
      { label: 'PA', key: 'pa' },
      { label: 'PA théorique', key: 'coutTheorique' },
      { label: 'Opportunité', key: 'opportunite' },
    ]
  }

  const handleBack = () => {
    // Construire l'URL de retour avec les éléments et le mode comparaison
    const encodedElements = encodeURIComponent(JSON.stringify(elements))
    router.push(`/analyse-valeur?perimetre=${perimetre}&comparisonMode=true&elements=${encodedElements}`)
  }

  return (
    <main className="w-full px-[50px] py-4">
      {/* Bouton Retour */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Titre + Période */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Comparaison</h1>

        <PeriodFilter />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="flex w-auto justify-start bg-transparent p-0 h-auto gap-0">
          <TabsTrigger
            value="resume"
            className="px-4 pb-2 text-[14px] border-b-2 border-[#D9D9D9] font-medium text-[#121212] bg-transparent rounded-none transition-none data-[state=active]:border-b-2 data-[state=active]:border-blue data-[state=active]:font-bold data-[state=active]:text-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
          >
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="structure-cout"
            className="px-4 pb-2 text-[14px] border-b-2 border-[#D9D9D9] font-medium text-[#121212] bg-transparent rounded-none transition-none data-[state=active]:border-b-2 data-[state=active]:border-blue data-[state=active]:font-bold data-[state=active]:text-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
          >
            Structure de coût
          </TabsTrigger>
          <TabsTrigger
            value="recette"
            className="px-4 pb-2 text-[14px] border-b-2 border-[#D9D9D9] font-medium text-[#121212] bg-transparent rounded-none transition-none data-[state=active]:border-b-2 data-[state=active]:border-blue data-[state=active]:font-bold data-[state=active]:text-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
          >
            Recette
          </TabsTrigger>
          <TabsTrigger
            value="evolution-prix"
            className="px-4 pb-2 text-[14px] border-b-2 border-[#D9D9D9] font-medium text-[#121212] bg-transparent rounded-none transition-none data-[state=active]:border-b-2 data-[state=active]:border-blue data-[state=active]:font-bold data-[state=active]:text-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
          >
            Evolution prix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[20px] font-medium">
              Comparaison des métriques
            </h2>
          </div>

          <TooltipProvider>
            <div className="border border-[#D9D9D9] rounded-lg overflow-x-auto">
              <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold align-top" style={{ width: '192px' }}>
                      <div className="py-2">Metrics</div>
                    </TableHead>
                    {elements.map((element) => (
                      <TableHead key={element.id} className="text-center align-top">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <span className="font-bold text-base">{element.name}</span>
                          {Object.entries(filterDisplayableFilters(element.filters)).length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {Object.entries(filterDisplayableFilters(element.filters)).map(([key, value]) => (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMetrics().map((metric) => {
                    const hasMode = metric.label === "CA" || metric.label === "Volume (UVC)"
                    const mode = metric.label === "CA" ? caMode : volumeMode
                    const toggleMode = metric.label === "CA" ? toggleCAMode : toggleVolumeMode

                    return (
                    <TableRow key={metric.key}>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          {hasMode ? (
                            <div className="inline-flex items-center gap-1">
                              {metric.label.replace(" (UVC)", "")}
                              {metric.label.includes("(UVC)") && <span className="text-xs text-gray-500">(UVC)</span>}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      toggleMode()
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-0.5"
                                  >
                                    {mode} <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{mode === 'CAD' ? 'Cumul À Date' : 'Cumul Année Mobile'}</p>
                                    <p className="text-xs">
                                      {mode === 'CAD'
                                        ? '1er janvier 2025 → aujourd\'hui'
                                        : '12 derniers mois glissants'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Cliquez pour voir {mode === 'CAD' ? 'CAM' : 'CAD'}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            metric.label
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-[#121212] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{metric.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      {elements.map((element) => {
                        const data = getElementData(element.name, element.filters)
                        if (!data) {
                          return (
                            <TableCell key={element.id} className="text-center">
                              <div className="text-sm text-gray-500">Aucune donnée</div>
                            </TableCell>
                          )
                        }
                        const value = data[metric.key as keyof typeof data]
                        const evolution = data[`${metric.key}Evolution` as keyof typeof data]
                        const isPositive = evolution?.startsWith('+')

                        return (
                          <TableCell key={element.id} className="text-center">
                            <div className="font-semibold text-base">{value}</div>
                            {evolution && (
                              <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {evolution}
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="structure-cout" className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[20px] font-medium">Comparaison des structures de coût</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualisation de la répartition des coûts en valeur</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Élément 1 et 3 */}
            <div className="space-y-6">
              {elements[0] && (
                <ElementCostStructure
                  element={elements[0]}
                  data={getElementData(elements[0].name, elements[0].filters) ? {
                    mpa: getElementData(elements[0].name, elements[0].filters)!.mpa,
                    mpaEvolution: getElementData(elements[0].name, elements[0].filters)!.mpaEvolution,
                    mpi: getElementData(elements[0].name, elements[0].filters)!.mpi,
                    mpiEvolution: getElementData(elements[0].name, elements[0].filters)!.mpiEvolution,
                  } : undefined}
                  costSubTab={costSubTab}
                  setCostSubTab={setCostSubTab}
                  showTable={showTable}
                  setShowTable={setShowTable}
                  totalPA={getElementData(elements[0].name, elements[0].filters)?.pa}
                  hasPairedElementTags={elements[1] ? Object.entries(filterDisplayableFilters(elements[1].filters)).length > 0 : false}
                />
              )}
              {elements[2] && (
                <ElementCostStructure
                  element={elements[2]}
                  data={getElementData(elements[2].name, elements[2].filters) ? {
                    mpa: getElementData(elements[2].name, elements[2].filters)!.mpa,
                    mpaEvolution: getElementData(elements[2].name, elements[2].filters)!.mpaEvolution,
                    mpi: getElementData(elements[2].name, elements[2].filters)!.mpi,
                    mpiEvolution: getElementData(elements[2].name, elements[2].filters)!.mpiEvolution,
                  } : undefined}
                  costSubTab={costSubTab}
                  setCostSubTab={setCostSubTab}
                  showTable={showTable}
                  setShowTable={setShowTable}
                  totalPA={getElementData(elements[2].name, elements[2].filters)?.pa}
                  hasPairedElementTags={elements[3] ? Object.entries(filterDisplayableFilters(elements[3].filters)).length > 0 : false}
                />
              )}
            </div>

            {/* Colonne droite: Élément 2 et 4 */}
            <div className="space-y-6">
              {elements[1] && (
                <ElementCostStructure
                  element={elements[1]}
                  data={getElementData(elements[1].name, elements[1].filters) ? {
                    mpa: getElementData(elements[1].name, elements[1].filters)!.mpa,
                    mpaEvolution: getElementData(elements[1].name, elements[1].filters)!.mpaEvolution,
                    mpi: getElementData(elements[1].name, elements[1].filters)!.mpi,
                    mpiEvolution: getElementData(elements[1].name, elements[1].filters)!.mpiEvolution,
                  } : undefined}
                  costSubTab={costSubTab}
                  setCostSubTab={setCostSubTab}
                  showTable={showTable}
                  setShowTable={setShowTable}
                  totalPA={getElementData(elements[1].name, elements[1].filters)?.pa}
                  hasPairedElementTags={elements[0] ? Object.entries(filterDisplayableFilters(elements[0].filters)).length > 0 : false}
                />
              )}
              {elements[3] && (
                <ElementCostStructure
                  element={elements[3]}
                  data={getElementData(elements[3].name, elements[3].filters) ? {
                    mpa: getElementData(elements[3].name, elements[3].filters)!.mpa,
                    mpaEvolution: getElementData(elements[3].name, elements[3].filters)!.mpaEvolution,
                    mpi: getElementData(elements[3].name, elements[3].filters)!.mpi,
                    mpiEvolution: getElementData(elements[3].name, elements[3].filters)!.mpiEvolution,
                  } : undefined}
                  costSubTab={costSubTab}
                  setCostSubTab={setCostSubTab}
                  showTable={showTable}
                  setShowTable={setShowTable}
                  totalPA={getElementData(elements[3].name, elements[3].filters)?.pa}
                  hasPairedElementTags={elements[2] ? Object.entries(filterDisplayableFilters(elements[2].filters)).length > 0 : false}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recette" className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[20px] font-medium">Comparaison des recettes</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comparaison des recettes entre les éléments sélectionnés</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Élément 1 et 3 */}
            <div className="space-y-6">
              {elements[0] && (
                <ElementRecette
                  element={elements[0]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
                  hasPairedElementTags={elements[1] ? Object.entries(filterDisplayableFilters(elements[1].filters)).length > 0 : false}
                />
              )}
              {elements[2] && (
                <ElementRecette
                  element={elements[2]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
                  hasPairedElementTags={elements[3] ? Object.entries(filterDisplayableFilters(elements[3].filters)).length > 0 : false}
                />
              )}
            </div>

            {/* Colonne droite: Élément 2 et 4 */}
            <div className="space-y-6">
              {elements[1] && (
                <ElementRecette
                  element={elements[1]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
                  hasPairedElementTags={elements[0] ? Object.entries(filterDisplayableFilters(elements[0].filters)).length > 0 : false}
                />
              )}
              {elements[3] && (
                <ElementRecette
                  element={elements[3]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
                  hasPairedElementTags={elements[2] ? Object.entries(filterDisplayableFilters(elements[2].filters)).length > 0 : false}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evolution-prix" className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[20px] font-medium">Comparaison des évolutions de prix</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Élément 1 et 3 */}
            <div className="space-y-6">
              {elements[0] && (
                <ElementEvolutionPrix
                  element={elements[0]}
                  perimetre={perimetre}
                  evolutionLegendOpacity={evolutionLegendOpacity}
                  setEvolutionLegendOpacity={setEvolutionLegendOpacity}
                  evolutionPeriod={evolutionPeriod}
                  setEvolutionPeriod={setEvolutionPeriod}
                  evolutionBase100={evolutionBase100}
                  setEvolutionBase100={setEvolutionBase100}
                  evolutionDateRange={evolutionDateRange}
                  setEvolutionDateRange={setEvolutionDateRange}
                  showEvolutionTable={showEvolutionTable}
                  setShowEvolutionTable={setShowEvolutionTable}
                  hasPairedElementTags={elements[1] ? Object.entries(filterDisplayableFilters(elements[1].filters)).length > 0 : false}
                />
              )}
              {elements[2] && (
                <ElementEvolutionPrix
                  element={elements[2]}
                  perimetre={perimetre}
                  evolutionLegendOpacity={evolutionLegendOpacity}
                  setEvolutionLegendOpacity={setEvolutionLegendOpacity}
                  evolutionPeriod={evolutionPeriod}
                  setEvolutionPeriod={setEvolutionPeriod}
                  evolutionBase100={evolutionBase100}
                  setEvolutionBase100={setEvolutionBase100}
                  evolutionDateRange={evolutionDateRange}
                  setEvolutionDateRange={setEvolutionDateRange}
                  showEvolutionTable={showEvolutionTable}
                  setShowEvolutionTable={setShowEvolutionTable}
                  hasPairedElementTags={elements[3] ? Object.entries(filterDisplayableFilters(elements[3].filters)).length > 0 : false}
                />
              )}
            </div>

            {/* Colonne droite: Élément 2 et 4 */}
            <div className="space-y-6">
              {elements[1] && (
                <ElementEvolutionPrix
                  element={elements[1]}
                  perimetre={perimetre}
                  evolutionLegendOpacity={evolutionLegendOpacity}
                  setEvolutionLegendOpacity={setEvolutionLegendOpacity}
                  evolutionPeriod={evolutionPeriod}
                  setEvolutionPeriod={setEvolutionPeriod}
                  evolutionBase100={evolutionBase100}
                  setEvolutionBase100={setEvolutionBase100}
                  evolutionDateRange={evolutionDateRange}
                  setEvolutionDateRange={setEvolutionDateRange}
                  showEvolutionTable={showEvolutionTable}
                  setShowEvolutionTable={setShowEvolutionTable}
                  hasPairedElementTags={elements[0] ? Object.entries(filterDisplayableFilters(elements[0].filters)).length > 0 : false}
                />
              )}
              {elements[3] && (
                <ElementEvolutionPrix
                  element={elements[3]}
                  perimetre={perimetre}
                  evolutionLegendOpacity={evolutionLegendOpacity}
                  setEvolutionLegendOpacity={setEvolutionLegendOpacity}
                  evolutionPeriod={evolutionPeriod}
                  setEvolutionPeriod={setEvolutionPeriod}
                  evolutionBase100={evolutionBase100}
                  setEvolutionBase100={setEvolutionBase100}
                  evolutionDateRange={evolutionDateRange}
                  setEvolutionDateRange={setEvolutionDateRange}
                  showEvolutionTable={showEvolutionTable}
                  setShowEvolutionTable={setShowEvolutionTable}
                  hasPairedElementTags={elements[2] ? Object.entries(filterDisplayableFilters(elements[2].filters)).length > 0 : false}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default function ComparaisonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ComparaisonContent />
    </Suspense>
  )
}
