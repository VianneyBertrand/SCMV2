// @ts-nocheck
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
import { Download, Info, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import dynamic from 'next/dynamic'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CurveIcon } from "@/components/ui/curve-icon"

// Lazy load Recharts components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const RechartsTooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });

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
    const baseData = [
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

    return {
      headers: baseData.map(d => {
        const [year, month] = d.date.split('-')
        if (evolutionPeriod === 'mois') return `${month}/${year.slice(2)}`
        if (evolutionPeriod === 'semaine') return `S${month}/${year.slice(2)}`
        return `01/${month}/${year.slice(2)}`
      }),
      rows: [
        {
          label: "Prix d'achat",
          values: baseData.map(d => evolutionBase100 ? d.PA.toFixed(1) : d.PA.toString())
        },
        {
          label: 'Coût théorique',
          values: baseData.map(d => evolutionBase100 ? d['cout-theorique'].toFixed(1) : d['cout-theorique'].toString())
        }
      ]
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
              <span className="text-sm select-none">Coût théorique</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="p-0"
              onClick={() => setEvolutionLegendOpacity({ PA: false, 'cout-theorique': false })}
            >
              <RefreshCw className="text-[#0970E6]" width={20} height={20} />
            </Button>
          </div>
        </div>

        {/* Graphique */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getEvolutionChartData()} margin={{ left: -30, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip
              formatter={(value: number) => value.toFixed(1)}
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
          </LineChart>
        </ResponsiveContainer>

        {/* Range Slider */}
        <div className="mt-6 px-4">
          <Slider
            min={0}
            max={100}
            step={1}
            value={evolutionDateRange}
            onValueChange={setEvolutionDateRange}
          />
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#D9D9D9] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Evo PA</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Évolution du prix d&apos;achat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-3xl font-bold text-green-600">+3.6%</p>
        </div>

        <div className="border border-[#D9D9D9] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Coût théorique</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Évolution du coût théorique</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-3xl font-bold text-green-600">+2.8%</p>
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
          <h4 className="text-lg font-semibold">Détail</h4>
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
