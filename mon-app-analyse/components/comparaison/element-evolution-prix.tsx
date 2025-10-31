// @ts-nocheck
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Download, Info, ChevronDown, ChevronUp, RefreshCw, RotateCcw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CurveIcon } from "@/components/ui/curve-icon"

// Import Recharts components directly
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Brush
} from 'recharts';

// Helper pour filtrer les filtres à afficher (uniquement Pays, Fournisseur, Portefeuille)
const filterDisplayableFilters = (filters: Record<string, string>): Record<string, string> => {
  const allowedKeys = ['pays', 'fournisseur', 'fournisseurs', 'portefeuille']
  const filtered = Object.entries(filters)
    .filter(([key]) => allowedKeys.includes(key.toLowerCase()))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  console.log('[ElementEvolutionPrix] Original filters:', filters)
  console.log('[ElementEvolutionPrix] Filtered filters:', filtered)
  return filtered
}

interface ElementEvolutionPrixProps {
  element: {
    id: string
    name: string
    filters: Record<string, string>
  }
  perimetre?: string
  evolutionLegendOpacity?: Record<string, boolean>
  setEvolutionLegendOpacity?: (value: Record<string, boolean>) => void
  evolutionPeriod?: 'mois' | 'semaine' | 'jour'
  setEvolutionPeriod?: (value: 'mois' | 'semaine' | 'jour') => void
  evolutionBase100?: boolean
  setEvolutionBase100?: (value: boolean) => void
  evolutionDateRange?: number[]
  setEvolutionDateRange?: (value: number[]) => void
  showEvolutionTable?: boolean
  setShowEvolutionTable?: (value: boolean) => void
  hasPairedElementTags?: boolean
}

export function ElementEvolutionPrix({
  element,
  perimetre,
  evolutionLegendOpacity: evolutionLegendOpacityProp,
  setEvolutionLegendOpacity: setEvolutionLegendOpacityProp,
  evolutionPeriod: evolutionPeriodProp,
  setEvolutionPeriod: setEvolutionPeriodProp,
  evolutionBase100: evolutionBase100Prop,
  setEvolutionBase100: setEvolutionBase100Prop,
  evolutionDateRange: evolutionDateRangeProp,
  setEvolutionDateRange: setEvolutionDateRangeProp,
  showEvolutionTable: showEvolutionTableProp,
  setShowEvolutionTable: setShowEvolutionTableProp,
  hasPairedElementTags = false,
}: ElementEvolutionPrixProps) {
  // États locaux comme fallback
  const [evolutionLegendOpacityLocal, setEvolutionLegendOpacityLocal] = useState<Record<string, boolean>>({
    PA: true,
    'cout-theorique': true,
    PV: false,
    'PV-LCL': false,
    'Marge-PV': false,
    'Marge-PV-LCL': false,
  })
  const [evolutionPeriodLocal, setEvolutionPeriodLocal] = useState<'mois' | 'semaine' | 'jour'>('mois')
  const [evolutionBase100Local, setEvolutionBase100Local] = useState(false)
  const [evolutionDateRangeLocal, setEvolutionDateRangeLocal] = useState([0, 100])
  const [showEvolutionTableLocal, setShowEvolutionTableLocal] = useState(false)

  // Utiliser les props si disponibles, sinon l'état local
  const evolutionLegendOpacity = evolutionLegendOpacityProp ?? evolutionLegendOpacityLocal
  const setEvolutionLegendOpacity = setEvolutionLegendOpacityProp ?? setEvolutionLegendOpacityLocal
  const evolutionPeriod = evolutionPeriodProp ?? evolutionPeriodLocal
  const setEvolutionPeriod = setEvolutionPeriodProp ?? setEvolutionPeriodLocal
  const evolutionBase100 = evolutionBase100Prop ?? evolutionBase100Local
  const setEvolutionBase100 = setEvolutionBase100Prop ?? setEvolutionBase100Local
  const evolutionDateRange = evolutionDateRangeProp ?? evolutionDateRangeLocal
  const setEvolutionDateRange = setEvolutionDateRangeProp ?? setEvolutionDateRangeLocal
  const showEvolutionTable = showEvolutionTableProp ?? showEvolutionTableLocal
  const setShowEvolutionTable = setShowEvolutionTableProp ?? setShowEvolutionTableLocal

  const getEvolutionChartData = () => {
    const baseData = perimetre === "Produit" ? [
      { date: '2024-04', PA: 320, 'cout-theorique': 260, PV: 450, 'PV-LCL': 430, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-05', PA: 315, 'cout-theorique': 250, PV: 445, 'PV-LCL': 425, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-06', PA: 310, 'cout-theorique': 220, PV: 440, 'PV-LCL': 420, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-07', PA: 325, 'cout-theorique': 250, PV: 455, 'PV-LCL': 435, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-08', PA: 335, 'cout-theorique': 270, PV: 465, 'PV-LCL': 445, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-09', PA: 340, 'cout-theorique': 280, PV: 470, 'PV-LCL': 450, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-10', PA: 345, 'cout-theorique': 285, PV: 475, 'PV-LCL': 455, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-11', PA: 350, 'cout-theorique': 290, PV: 480, 'PV-LCL': 460, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2024-12', PA: 355, 'cout-theorique': 295, PV: 485, 'PV-LCL': 465, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2025-01', PA: 360, 'cout-theorique': 300, PV: 490, 'PV-LCL': 470, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2025-02', PA: 365, 'cout-theorique': 305, PV: 495, 'PV-LCL': 475, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
      { date: '2025-03', PA: 370, 'cout-theorique': 310, PV: 500, 'PV-LCL': 480, 'Marge-PV': 130, 'Marge-PV-LCL': 110 },
    ] : [
      { date: '2024-04', PA: 320, 'cout-theorique': 260 },
      { date: '2024-05', PA: 315, 'cout-theorique': 250 },
      { date: '2024-06', PA: 310, 'cout-theorique': 220 },
      { date: '2024-07', PA: 325, 'cout-theorique': 250 },
      { date: '2024-08', PA: 335, 'cout-theorique': 270 },
      { date: '2024-09', PA: 340, 'cout-theorique': 280 },
      { date: '2024-10', PA: 345, 'cout-theorique': 285 },
      { date: '2024-11', PA: 350, 'cout-theorique': 290 },
      { date: '2024-12', PA: 355, 'cout-theorique': 295 },
      { date: '2025-01', PA: 360, 'cout-theorique': 300 },
      { date: '2025-02', PA: 365, 'cout-theorique': 305 },
      { date: '2025-03', PA: 370, 'cout-theorique': 310 },
    ]

    if (evolutionBase100) {
      const firstPA = baseData[0].PA
      const firstCT = baseData[0]['cout-theorique']

      if (perimetre === "Produit") {
        const firstPV = baseData[0].PV
        const firstPVLCL = baseData[0]['PV-LCL']
        const firstMargePV = baseData[0]['Marge-PV']
        const firstMargePVLCL = baseData[0]['Marge-PV-LCL']

        return baseData.map(item => ({
          date: item.date,
          PA: (item.PA / firstPA) * 100,
          'cout-theorique': (item['cout-theorique'] / firstCT) * 100,
          PV: (item.PV / firstPV) * 100,
          'PV-LCL': (item['PV-LCL'] / firstPVLCL) * 100,
          'Marge-PV': (item['Marge-PV'] / firstMargePV) * 100,
          'Marge-PV-LCL': (item['Marge-PV-LCL'] / firstMargePVLCL) * 100,
        }))
      }

      return baseData.map(item => ({
        date: item.date,
        PA: (item.PA / firstPA) * 100,
        'cout-theorique': (item['cout-theorique'] / firstCT) * 100
      }))
    }

    return baseData
  }

  const getEvolutionTableData = () => {
    const baseData = getEvolutionChartData()

    const rows = [
      {
        label: "PA",
        values: baseData.map(d => evolutionBase100 ? d.PA.toFixed(1) : d.PA.toString())
      },
      {
        label: 'PA théorique',
        values: baseData.map(d => evolutionBase100 ? d['cout-theorique'].toFixed(1) : d['cout-theorique'].toString())
      }
    ]

    if (perimetre === "Produit") {
      rows.push(
        {
          label: 'PV',
          values: baseData.map(d => evolutionBase100 ? d.PV.toFixed(1) : d.PV.toString())
        },
        {
          label: 'PV LCL',
          values: baseData.map(d => evolutionBase100 ? d['PV-LCL'].toFixed(1) : d['PV-LCL'].toString())
        },
        {
          label: 'Marge PV',
          values: baseData.map(d => evolutionBase100 ? d['Marge-PV'].toFixed(1) : d['Marge-PV'].toString())
        },
        {
          label: 'Marge PV LCL',
          values: baseData.map(d => evolutionBase100 ? d['Marge-PV-LCL'].toFixed(1) : d['Marge-PV-LCL'].toString())
        }
      )
    }

    return {
      headers: baseData.map(d => {
        const [year, month] = d.date.split('-')
        if (evolutionPeriod === 'mois') return `${month}/${year.slice(2)}`
        if (evolutionPeriod === 'semaine') return `S${month}/${year.slice(2)}`
        return `01/${month}/${year.slice(2)}`
      }),
      rows
    }
  }

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

      {/* Graphique */}
      <div>
        {/* Header avec controls */}
        <div className="space-y-4 mb-2">
          {/* Première ligne: Select période + Base 100 + Export (alignés à droite) */}
          <div className="flex items-center justify-end gap-4">
            <Select value={evolutionPeriod} onValueChange={(v: 'mois' | 'semaine' | 'jour') => setEvolutionPeriod(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Mois</SelectItem>
                <SelectItem value="semaine">Semaine</SelectItem>
                <SelectItem value="jour">Jour</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label htmlFor={`evolution-base100-${element.id}`}>Base 100</Label>
              <Switch
                id={`evolution-base100-${element.id}`}
                checked={evolutionBase100}
                onCheckedChange={setEvolutionBase100}
              />
            </div>
            <Button variant="ghost" size="icon" className="p-0">
              <Download className="text-[#0970E6]" width={24} height={24} />
            </Button>
          </div>

          {/* Deuxième ligne: Légendes cliquables + icône refresh (centrées) */}
          <div className="flex items-center justify-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              style={{ opacity: evolutionLegendOpacity.PA ? 1 : 0.4 }}
              onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, PA: !evolutionLegendOpacity.PA })}
            >
              <CurveIcon color="#E91E63" className="w-[30px] h-[14px]" />
              <span className="text-sm select-none">PA</span>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer"
              style={{ opacity: evolutionLegendOpacity['cout-theorique'] ? 1 : 0.4 }}
              onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, 'cout-theorique': !evolutionLegendOpacity['cout-theorique'] })}
            >
              <CurveIcon color="#607D8B" className="w-[30px] h-[14px]" />
              <span className="text-sm select-none">PA théorique</span>
            </div>
            {perimetre === "Produit" && (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: evolutionLegendOpacity.PV ? 1 : 0.4 }}
                  onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, PV: !evolutionLegendOpacity.PV })}
                >
                  <CurveIcon color="#4CAF50" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">PV</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: evolutionLegendOpacity['PV-LCL'] ? 1 : 0.4 }}
                  onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, 'PV-LCL': !evolutionLegendOpacity['PV-LCL'] })}
                >
                  <CurveIcon color="#FF9800" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">PV LCL</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: evolutionLegendOpacity['Marge-PV'] ? 1 : 0.4 }}
                  onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, 'Marge-PV': !evolutionLegendOpacity['Marge-PV'] })}
                >
                  <CurveIcon color="#9C27B0" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">Marge PV</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: evolutionLegendOpacity['Marge-PV-LCL'] ? 1 : 0.4 }}
                  onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, 'Marge-PV-LCL': !evolutionLegendOpacity['Marge-PV-LCL'] })}
                >
                  <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">Marge PV LCL</span>
                </div>
              </>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={() => setEvolutionLegendOpacity(
                      perimetre === "Produit"
                        ? { PA: false, 'cout-theorique': false, PV: false, 'PV-LCL': false, 'Marge-PV': false, 'Marge-PV-LCL': false }
                        : { PA: false, 'cout-theorique': false }
                    )}
                  >
                    <RotateCcw className="w-4 h-4 text-[#0970E6]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tout désélectionner</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Graphique */}
        <div style={{ paddingBottom: '20px' }}>
          <ResponsiveContainer width="100%" height={400} style={{ overflow: 'visible' }}>
            <LineChart data={getEvolutionChartData()} margin={{ left: -30, right: 10, top: 5, bottom: 5 }} style={{ overflow: 'visible' }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    'PA': 'PA',
                    'cout-theorique': 'PA théorique',
                    'PV': 'PV',
                    'PV-LCL': 'PV LCL',
                    'Marge-PV': 'Marge PV',
                    'Marge-PV-LCL': 'Marge PV LCL'
                  }
                  return [value.toFixed(1), labels[name] || name]
                }}
              />
              {evolutionLegendOpacity.PA && (
                <Line
                  type="monotone"
                  dataKey="PA"
                  stroke="#E91E63"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              {evolutionLegendOpacity['cout-theorique'] && (
                <Line
                  type="monotone"
                  dataKey="cout-theorique"
                  stroke="#607D8B"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              {perimetre === "Produit" && evolutionLegendOpacity.PV && (
                <Line
                  type="monotone"
                  dataKey="PV"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              {perimetre === "Produit" && evolutionLegendOpacity['PV-LCL'] && (
                <Line
                  type="monotone"
                  dataKey="PV-LCL"
                  stroke="#FF9800"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              {perimetre === "Produit" && evolutionLegendOpacity['Marge-PV'] && (
                <Line
                  type="monotone"
                  dataKey="Marge-PV"
                  stroke="#9C27B0"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              {perimetre === "Produit" && evolutionLegendOpacity['Marge-PV-LCL'] && (
                <Line
                  type="monotone"
                  dataKey="Marge-PV-LCL"
                  stroke="#00BCD4"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={150}
                />
              )}
              <Brush
                dataKey="date"
                height={30}
                stroke="#0970E6"
                fill="#FFFFFF"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Pourcentage d&apos;évolution sur la période</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-[#121212]" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Évolution en pourcentage des métriques sur la période sélectionnée</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-wrap gap-4">
          <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">PA</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-[#121212]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix d&apos;achat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold text-red-600">+15.6%</div>
          </Card>

          <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">PA théorique</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-[#121212]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix d&apos;achat théorique</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold text-red-600">+19.2%</div>
          </Card>

          {perimetre === "Produit" && (
            <>
              <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">PV</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Prix de vente Carrefour</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-600">+11.1%</div>
              </Card>

              <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">PV LCL</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Prix de vente Leclerc</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-600">+11.6%</div>
              </Card>

              <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Marge PV</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marge entre PV Carrefour et PA unitaire</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-600">+0.0%</div>
              </Card>

              <Card className="p-4 rounded shadow-none flex-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Marge PV LCL</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marge entre PV Leclerc et PA unitaire</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-600">+0.0%</div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Bouton Afficher plus/moins */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowEvolutionTable(!showEvolutionTable)}
          className="gap-2"
        >
          {showEvolutionTable ? (
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

      {/* Tableau Détail - visible uniquement si showEvolutionTable */}
      {showEvolutionTable && (
        <div className="space-y-4">
          <div className="border border-[#D9D9D9] rounded-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 min-w-[150px]">Période</TableHead>
                    {getEvolutionTableData().headers.map((header, idx) => (
                      <TableHead key={idx} className="text-center min-w-[100px]">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getEvolutionTableData().rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell className="sticky left-0 bg-white z-10 font-bold text-[16px]">
                        {row.label}
                      </TableCell>
                      {row.values.map((value, colIdx) => (
                        <TableCell key={colIdx} className="text-center">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
