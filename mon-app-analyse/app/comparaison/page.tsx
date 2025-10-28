"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BackButton } from "@/components/shared/back-button"
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
import { Info } from "lucide-react"
import { ElementCostStructure } from "@/components/comparaison/element-cost-structure"
import { ElementRecette } from "@/components/comparaison/element-recette"
import { getPerimetreData, type PerimetreType } from "@/lib/data/perimetre-data"

export default function ComparaisonPage() {
  const searchParams = useSearchParams()

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

      return {
        ca: element.ca.valeur,
        caEvolution: element.ca.evolution,
        volume: '287', // TODO: Ajouter volume aux données
        volumeEvolution: '+4.32%',
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
        { label: 'Coût théorique', key: 'coutTheorique' },
        { label: 'Opportunité', key: 'opportunite' },
      ]
    }

    return [
      { label: 'CA', key: 'ca' },
      { label: 'Volume (UVC)', key: 'volume' },
      { label: 'MPA', key: 'mpa' },
      { label: 'MPI', key: 'mpi' },
      { label: 'PA', key: 'pa' },
      { label: 'Coût théorique', key: 'coutTheorique' },
      { label: 'Opportunité', key: 'opportunite' },
    ]
  }

  return (
    <main className="w-full px-[50px] py-4">
      {/* Bouton Retour */}
      <BackButton />

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
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-blue pb-2 px-4"
          >
            Résumé
          </TabsTrigger>
          <TabsTrigger
            value="structure-cout"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-blue pb-2 px-4"
          >
            Structure de coût
          </TabsTrigger>
          <TabsTrigger
            value="recette"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-blue pb-2 px-4"
          >
            Recette
          </TabsTrigger>
          <TabsTrigger
            value="evolution-prix"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-blue data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-blue pb-2 px-4"
          >
            Evolution prix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="space-y-6 mt-6">
          <h2 className="text-xl font-semibold">
            Les principales métriques de vos {perimetre || 'éléments'}
          </h2>

          <h3 className="text-lg font-medium text-gray-600">Vue d'ensemble</h3>

          <TooltipProvider>
            <div className="border border-[#D9D9D9] rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold w-48 align-top">
                      <div className="py-2">Metrics</div>
                    </TableHead>
                    {elements.map((element) => (
                      <TableHead key={element.id} className="text-center min-w-[200px] align-top">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <span className="font-bold text-base">{element.name}</span>
                          {Object.entries(element.filters).length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {Object.entries(element.filters).map(([key, value]) => (
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
                  {getMetrics().map((metric) => (
                    <TableRow key={metric.key}>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          {metric.label}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="structure-cout" className="mt-6">
          <h2 className="text-[16px] font-bold mb-6">Répartition en valeur des matières premières</h2>

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
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recette" className="mt-6">
          <h2 className="text-[16px] font-bold mb-6">Répartition en volume des matières premières</h2>

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
                />
              )}
              {elements[2] && (
                <ElementRecette
                  element={elements[2]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
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
                />
              )}
              {elements[3] && (
                <ElementRecette
                  element={elements[3]}
                  recetteSubTab={recetteSubTab}
                  setRecetteSubTab={setRecetteSubTab}
                  showAllRecette={showAllRecette}
                  setShowAllRecette={setShowAllRecette}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evolution-prix" className="mt-6">
          <p className="text-muted-foreground">Contenu à venir...</p>
        </TabsContent>
      </Tabs>
    </main>
  )
}
