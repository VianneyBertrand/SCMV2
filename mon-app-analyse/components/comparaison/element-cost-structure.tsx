"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, Download, ChevronDown, ChevronUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface ElementCostStructureProps {
  element: {
    id: string
    name: string
    filters: Record<string, string>
  }
  data?: {
    mpa: string
    mpaEvolution: string
    mpi: string
    mpiEvolution: string
  }
  costSubTab?: 'total' | 'mpa' | 'mpi'
  setCostSubTab?: (value: 'total' | 'mpa' | 'mpi') => void
  showTable?: boolean
  setShowTable?: (value: boolean) => void
}

// Composant HeatmapRect
interface HeatmapRectProps {
  label: string
  percentage: string
  evolution: string
  color: string
  className?: string
  href: string
  type: 'total' | 'mpa' | 'mpi'
  categoryPercentage?: string
  style?: React.CSSProperties
}

function HeatmapRect({ label, percentage, evolution, color, className, href, type, categoryPercentage, style }: HeatmapRectProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={style}
            className={`${color} ${className} p-2 flex flex-col items-center justify-center hover:opacity-90 transition-opacity cursor-pointer overflow-hidden`}
          >
            <span className="text-[14px] font-bold text-center text-black line-clamp-3 break-words w-full px-1">{label}</span>
            <span className="text-[14px] font-medium text-black mt-1">{percentage}</span>
            <span className="text-[14px] font-medium text-black">
              {evolution}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{label}</p>
            <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
              <span className="text-sm">% du coût total</span>
              <span className="text-sm font-medium">{percentage}</span>
              {type !== 'total' && categoryPercentage && (
                <>
                  <span className="text-sm">% du total {type === 'mpa' ? 'MPA' : 'MPI'}</span>
                  <span className="text-sm font-medium">{categoryPercentage}</span>
                </>
              )}
              <span className="text-sm">% d&apos;évolution</span>
              <span className="text-sm font-medium">{evolution}</span>
              <span className="text-sm">% impact sur le prix</span>
              <span className="text-sm font-medium">{evolution}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">Source : Mintech</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ElementCostStructure({ element, data, costSubTab: costSubTabProp, setCostSubTab: setCostSubTabProp, showTable: showTableProp, setShowTable: setShowTableProp }: ElementCostStructureProps) {
  // État local comme fallback si les props ne sont pas fournies
  const [costSubTabLocal, setCostSubTabLocal] = useState<'total' | 'mpa' | 'mpi'>('total')
  const [showTableLocal, setShowTableLocal] = useState(false)

  // Utiliser les props si disponibles, sinon l'état local
  const costSubTab = costSubTabProp ?? costSubTabLocal
  const setCostSubTab = setCostSubTabProp ?? setCostSubTabLocal
  const showTable = showTableProp ?? showTableLocal
  const setShowTable = setShowTableProp ?? setShowTableLocal
  const [base100, setBase100] = useState(false)
  const [dateRange, setDateRange] = useState([0, 100])

  const [legendOpacity, setLegendOpacity] = useState<Record<string, boolean>>({
    MPA: true,
    MPI: true,
    'farine-ble': true,
    sucre: true,
    sel: true,
    lait: true,
    beurre: true,
    huile: true,
    oeufs: true,
    energie: true,
    transport: true,
    emballage: true,
    'main-oeuvre': true,
    gas: true,
    electricite: true,
    petrole: true,
  })

  const toggleLegendOpacity = (key: string) => {
    setLegendOpacity(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const unselectAll = () => {
    const newOpacity: Record<string, boolean> = {}
    Object.keys(legendOpacity).forEach(key => {
      newOpacity[key] = false
    })
    setLegendOpacity(newOpacity)
  }

  // Données heatmap selon sous-tab
  const getCostHeatmapData = () => {
    // Utiliser les données réelles si disponibles, sinon valeurs par défaut
    const mpaValue = data?.mpa || '48.23%'
    const mpaEvolution = data?.mpaEvolution || '+3.20%'
    const mpiValue = data?.mpi || '37.43%'
    const mpiEvolution = data?.mpiEvolution || '-1.80%'

    // Calculer "Autre" (100 - MPA - MPI)
    const mpaNum = parseFloat(mpaValue.replace('%', ''))
    const mpiNum = parseFloat(mpiValue.replace('%', ''))
    const autreNum = 100 - mpaNum - mpiNum
    const autreValue = `${autreNum.toFixed(2)}%`

    switch (costSubTab) {
      case 'total':
        return {
          layout: 'horizontal',
          type: 'total' as const,
          items: [
            { label: 'MPA', percentage: mpaValue, evolution: mpaEvolution, color: 'bg-[#F25056]', className: 'flex-1', href: '#' },
            { label: 'MPI', percentage: mpiValue, evolution: mpiEvolution, color: 'bg-[#2FB67E]', className: 'flex-1', href: '#' },
            { label: 'Autre', percentage: autreValue, evolution: '0.00%', color: 'bg-gray-400', className: 'w-1/6', href: '#' },
          ]
        }
      case 'mpa':
        // Ajuster proportionnellement les composants MPA détaillés au total MPA réel
        const baseMpaTotal = 48.23 // Total des valeurs hardcodées
        const actualMpaTotal = mpaNum
        const mpaRatio = actualMpaTotal / baseMpaTotal

        const mpaBaseItems = [
          { label: 'Farine de blé', basePercentage: 28.34, categoryPercentage: '58.76%', evolution: '+0.91%', color: 'bg-[#F0FAF6]', href: '#' },
          { label: 'Sucre', basePercentage: 17.35, categoryPercentage: '35.97%', evolution: '-1.80%', color: 'bg-[#2FB67E]', href: '#' },
          { label: 'Sel', basePercentage: 6.62, categoryPercentage: '13.73%', evolution: '+2.10%', color: 'bg-[#F25056]', href: '#' },
          { label: 'Lait en poudre', basePercentage: 4.47, categoryPercentage: '9.27%', evolution: '+1.50%', color: 'bg-[#F57A7E]', href: '#' },
          { label: 'Beurre', basePercentage: 2.35, categoryPercentage: '4.87%', evolution: '-1.80%', color: 'bg-[#8EE2BF]', href: '#' },
          { label: 'Huile végétale', basePercentage: 2.23, categoryPercentage: '4.62%', evolution: '-0.80%', color: 'bg-[#8EE2BF]', href: '#' },
          { label: 'Oeufs', basePercentage: 1.82, categoryPercentage: '3.77%', evolution: '-1.80%', color: 'bg-[#F57A7E]', href: '#' },
        ]

        return {
          layout: 'complex-mpa',
          type: 'mpa' as const,
          items: mpaBaseItems.map(item => ({
            label: item.label,
            percentage: `${(item.basePercentage * mpaRatio).toFixed(2)}%`,
            categoryPercentage: item.categoryPercentage,
            evolution: item.evolution,
            color: item.color,
            href: item.href
          }))
        }
      case 'mpi':
        // Ajuster proportionnellement les composants MPI détaillés au total MPI réel
        const baseMpiTotal = 37.43 // Total des valeurs hardcodées
        const actualMpiTotal = mpiNum
        const mpiRatio = actualMpiTotal / baseMpiTotal

        const mpiBaseItems = [
          { label: 'Energie', basePercentage: 18.36, categoryPercentage: '49.05%', evolution: '-4.20%', color: 'bg-[#2FB67E]', href: '#' },
          { label: 'Transport', basePercentage: 13.37, categoryPercentage: '35.72%', evolution: '-3.80%', color: 'bg-[#8EE2BF]', href: '#' },
          { label: 'Emballage', basePercentage: 9.67, categoryPercentage: '25.84%', evolution: '-3.10%', color: 'bg-[#F0FAF6]', href: '#' },
          { label: "Main d'oeuvre", basePercentage: 4.36, categoryPercentage: '11.65%', evolution: '-1.80%', color: 'bg-[#F25056]', href: '#' },
        ]

        return {
          layout: 'complex-mpi',
          type: 'mpi' as const,
          items: mpiBaseItems.map(item => ({
            label: item.label,
            percentage: `${(item.basePercentage * mpiRatio).toFixed(2)}%`,
            categoryPercentage: item.categoryPercentage,
            evolution: item.evolution,
            color: item.color,
            href: item.href
          }))
        }
    }
  }

  // Données graphique
  const getChartData = () => {
    const baseData = [
      { date: '2024-04', MPA: 280, MPI: 250, 'farine-ble': 270, 'sucre': 270, 'sel': 380, 'lait': 350, 'beurre': 250, 'huile': 260, 'oeufs': 240, 'energie': 210, 'transport': 430, 'emballage': 250, 'main-oeuvre': 290, 'gas': 200, 'electricite': 215, 'petrole': 205 },
      { date: '2024-05', MPA: 240, MPI: 230, 'farine-ble': 250, 'sucre': 240, 'sel': 360, 'lait': 330, 'beurre': 230, 'huile': 245, 'oeufs': 220, 'energie': 205, 'transport': 410, 'emballage': 240, 'main-oeuvre': 280, 'gas': 195, 'electricite': 210, 'petrole': 200 },
      { date: '2024-06', MPA: 240, MPI: 210, 'farine-ble': 245, 'sucre': 235, 'sel': 355, 'lait': 325, 'beurre': 225, 'huile': 240, 'oeufs': 215, 'energie': 210, 'transport': 405, 'emballage': 235, 'main-oeuvre': 275, 'gas': 205, 'electricite': 212, 'petrole': 203 },
      { date: '2024-07', MPA: 320, MPI: 290, 'farine-ble': 310, 'sucre': 305, 'sel': 390, 'lait': 360, 'beurre': 270, 'huile': 280, 'oeufs': 260, 'energie': 230, 'transport': 450, 'emballage': 280, 'main-oeuvre': 310, 'gas': 220, 'electricite': 235, 'petrole': 225 },
      { date: '2024-08', MPA: 380, MPI: 340, 'farine-ble': 360, 'sucre': 350, 'sel': 420, 'lait': 390, 'beurre': 300, 'huile': 310, 'oeufs': 290, 'energie': 250, 'transport': 470, 'emballage': 310, 'main-oeuvre': 340, 'gas': 240, 'electricite': 255, 'petrole': 245 },
      { date: '2025-01', MPA: 400, MPI: 320, 'farine-ble': 380, 'sucre': 370, 'sel': 430, 'lait': 400, 'beurre': 310, 'huile': 320, 'oeufs': 300, 'energie': 260, 'transport': 480, 'emballage': 320, 'main-oeuvre': 350, 'gas': 250, 'electricite': 265, 'petrole': 255 },
      { date: '2025-02', MPA: 380, MPI: 290, 'farine-ble': 365, 'sucre': 360, 'sel': 415, 'lait': 385, 'beurre': 295, 'huile': 305, 'oeufs': 285, 'energie': 245, 'transport': 465, 'emballage': 305, 'main-oeuvre': 335, 'gas': 235, 'electricite': 250, 'petrole': 240 },
      { date: '2025-03', MPA: 410, MPI: 280, 'farine-ble': 390, 'sucre': 380, 'sel': 435, 'lait': 405, 'beurre': 315, 'huile': 325, 'oeufs': 305, 'energie': 235, 'transport': 475, 'emballage': 315, 'main-oeuvre': 345, 'gas': 225, 'electricite': 240, 'petrole': 230 },
    ]
    return baseData
  }

  const getChartTitle = () => {
    if (costSubTab === 'total') return 'Évolution de la structure de coût'
    if (costSubTab === 'mpa') return 'Évolution des Matières Premières et Achats'
    return 'Évolution des Moyens de Production et Infrastructure'
  }

  return (
    <div className="space-y-6 border border-[#D9D9D9] rounded-lg p-6">
      {/* Header avec nom et filtres */}
      <div>
        <h3 className="text-lg font-bold mb-2">{element.name}</h3>
        {Object.entries(element.filters).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(element.filters).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sous-tabs */}
      <div className="flex gap-0 w-fit">
        <button
          onClick={() => setCostSubTab('total')}
          className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'total' ? 'bg-blue text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
        >
          Total
        </button>
        <button
          onClick={() => setCostSubTab('mpa')}
          className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpa' ? 'bg-blue text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
        >
          MPA
        </button>
        <button
          onClick={() => setCostSubTab('mpi')}
          className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpi' ? 'bg-blue text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
        >
          MPI
        </button>
      </div>

      {/* Heatmap */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-[16px] font-medium">
            {costSubTab === 'total' && 'Répartition de la structure de coût'}
            {costSubTab === 'mpa' && 'Répartition des Matières Premières et Achats'}
            {costSubTab === 'mpi' && 'Répartition des Moyens de Production et Infrastructure'}
          </h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualisation de la répartition des coûts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="rounded overflow-hidden">
          {(() => {
            const heatmapData = getCostHeatmapData()

            if (heatmapData.layout === 'horizontal') {
              // Layout Total : horizontal simple avec tailles proportionnelles
              return (
                <div className="flex gap-1 h-[320px]">
                  {heatmapData.items.map((item, idx) => {
                    // Extraire le pourcentage numérique
                    const percentage = parseFloat(item.percentage.replace('%', ''))
                    return (
                      <HeatmapRect
                        key={idx}
                        label={item.label}
                        percentage={item.percentage}
                        evolution={item.evolution}
                        color={item.color}
                        className="h-full"
                        href={item.href}
                        type={heatmapData.type}
                        style={{ width: `${percentage}%` }}
                      />
                    )
                  })}
                </div>
              )
            } else if (heatmapData.layout === 'complex-mpa') {
              // Layout MPA : grid complexe avec tailles proportionnelles
              const items = heatmapData.items
              // Calculer les pourcentages numériques
              const percentages = items.map(item => parseFloat(item.percentage.replace('%', '')))
              const total = percentages.reduce((a, b) => a + b, 0)

              // Groupe droite : items 2-6 (Sel, Lait, Beurre, Huile, Oeufs)
              const rightGroupTotal = percentages.slice(2).reduce((a, b) => a + b, 0)
              const rightGroupWidth = (rightGroupTotal / total) * 100

              // Ligne du haut dans groupe droite : Sel + Lait
              const topRowTotal = percentages[2] + percentages[3]
              const topRowHeight = (topRowTotal / rightGroupTotal) * 100

              return (
                <div className="flex gap-1 h-[320px]">
                  {/* Farine (plus grand - gauche) */}
                  <HeatmapRect
                    label={items[0].label}
                    percentage={items[0].percentage}
                    evolution={items[0].evolution}
                    color={items[0].color}
                    className="h-full"
                    href={items[0].href}
                    type={heatmapData.type}
                    categoryPercentage={items[0].categoryPercentage}
                    style={{ width: `${(percentages[0] / total) * 100}%` }}
                  />
                  {/* Sucre (deuxième plus grand - centre) */}
                  <HeatmapRect
                    label={items[1].label}
                    percentage={items[1].percentage}
                    evolution={items[1].evolution}
                    color={items[1].color}
                    className="h-full"
                    href={items[1].href}
                    type={heatmapData.type}
                    categoryPercentage={items[1].categoryPercentage}
                    style={{ width: `${(percentages[1] / total) * 100}%` }}
                  />
                  {/* Colonne droite avec Sel, Lait, etc. (plus petits) */}
                  <div className="flex flex-col gap-1" style={{ width: `${rightGroupWidth}%` }}>
                    {/* Ligne du haut avec Sel et Lait */}
                    <div className="flex gap-1" style={{ height: `${topRowHeight}%` }}>
                      <HeatmapRect
                        label={items[2].label}
                        percentage={items[2].percentage}
                        evolution={items[2].evolution}
                        color={items[2].color}
                        className="h-full"
                        href={items[2].href}
                        type={heatmapData.type}
                        categoryPercentage={items[2].categoryPercentage}
                        style={{ width: `${(percentages[2] / topRowTotal) * 100}%` }}
                      />
                      <HeatmapRect
                        label={items[3].label}
                        percentage={items[3].percentage}
                        evolution={items[3].evolution}
                        color={items[3].color}
                        className="h-full"
                        href={items[3].href}
                        type={heatmapData.type}
                        categoryPercentage={items[3].categoryPercentage}
                        style={{ width: `${(percentages[3] / topRowTotal) * 100}%` }}
                      />
                    </div>
                    {/* Ligne du bas avec Beurre, Huile, Oeufs */}
                    <div className="flex gap-1 flex-1">
                      {[4, 5, 6].map(idx => {
                        const bottomRowTotal = percentages[4] + percentages[5] + percentages[6]
                        return (
                          <HeatmapRect
                            key={idx}
                            label={items[idx].label}
                            percentage={items[idx].percentage}
                            evolution={items[idx].evolution}
                            color={items[idx].color}
                            className="h-full"
                            href={items[idx].href}
                            type={heatmapData.type}
                            categoryPercentage={items[idx].categoryPercentage}
                            style={{ width: `${(percentages[idx] / bottomRowTotal) * 100}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            } else if (heatmapData.layout === 'complex-mpi') {
              // Layout MPI : avec tailles proportionnelles
              const items = heatmapData.items
              // Calculer les pourcentages numériques
              const percentages = items.map(item => parseFloat(item.percentage.replace('%', '')))
              const total = percentages.reduce((a, b) => a + b, 0)

              // Colonne droite : Emballage + Main d'oeuvre
              const rightGroupTotal = percentages[2] + percentages[3]
              const rightGroupWidth = (rightGroupTotal / total) * 100

              return (
                <div className="flex gap-1 h-[320px]">
                  {/* Energie (très large gauche) */}
                  <HeatmapRect
                    label={items[0].label}
                    percentage={items[0].percentage}
                    evolution={items[0].evolution}
                    color={items[0].color}
                    className="h-full"
                    href={items[0].href}
                    type={heatmapData.type}
                    categoryPercentage={items[0].categoryPercentage}
                    style={{ width: `${(percentages[0] / total) * 100}%` }}
                  />
                  {/* Transport (large centre) */}
                  <HeatmapRect
                    label={items[1].label}
                    percentage={items[1].percentage}
                    evolution={items[1].evolution}
                    color={items[1].color}
                    className="h-full"
                    href={items[1].href}
                    type={heatmapData.type}
                    categoryPercentage={items[1].categoryPercentage}
                    style={{ width: `${(percentages[1] / total) * 100}%` }}
                  />
                  {/* Colonne droite avec Emballage et Main d'oeuvre */}
                  <div className="flex flex-col gap-1" style={{ width: `${rightGroupWidth}%` }}>
                    <HeatmapRect
                      label={items[2].label}
                      percentage={items[2].percentage}
                      evolution={items[2].evolution}
                      color={items[2].color}
                      className="w-full"
                      href={items[2].href}
                      type={heatmapData.type}
                      categoryPercentage={items[2].categoryPercentage}
                      style={{ height: `${(percentages[2] / rightGroupTotal) * 100}%` }}
                    />
                    <HeatmapRect
                      label={items[3].label}
                      percentage={items[3].percentage}
                      evolution={items[3].evolution}
                      color={items[3].color}
                      className="w-full"
                      href={items[3].href}
                      type={heatmapData.type}
                      categoryPercentage={items[3].categoryPercentage}
                      style={{ height: `${(percentages[3] / rightGroupTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* Bouton Afficher plus/moins */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowTable(!showTable)}
          className="gap-2"
        >
          {showTable ? (
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

      {/* Graphique - visible uniquement si showTable */}
      {showTable && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[16px] font-medium">{getChartTitle()}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Évolution temporelle des coûts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="p-6 border-2 border-gray-300 rounded">
          {/* Contrôles */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={base100} onCheckedChange={setBase100} />
                <Label>Base 100</Label>
              </div>
              <Button variant="ghost" size="sm" className="p-2">
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Légendes avec checkboxes */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <div className="flex flex-wrap gap-3 justify-center items-center">
              {costSubTab === 'total' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.MPA}
                      onCheckedChange={() => toggleLegendOpacity('MPA')}
                    />
                    <div className="w-4 h-4 bg-[#E91E63] rounded"></div>
                    <span className="text-sm">MPA</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.MPI}
                      onCheckedChange={() => toggleLegendOpacity('MPI')}
                    />
                    <div className="w-4 h-4 bg-[#00BCD4] rounded"></div>
                    <span className="text-sm">MPI</span>
                  </label>
                </>
              )}

              {costSubTab === 'mpa' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity['farine-ble']}
                      onCheckedChange={() => toggleLegendOpacity('farine-ble')}
                    />
                    <div className="w-4 h-4 bg-[#E91E63] rounded"></div>
                    <span className="text-sm">Farine de blé</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.sucre}
                      onCheckedChange={() => toggleLegendOpacity('sucre')}
                    />
                    <div className="w-4 h-4 bg-[#00BCD4] rounded"></div>
                    <span className="text-sm">Sucre</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.sel}
                      onCheckedChange={() => toggleLegendOpacity('sel')}
                    />
                    <div className="w-4 h-4 bg-[#4CAF50] rounded"></div>
                    <span className="text-sm">Sel</span>
                  </label>
                </>
              )}

              {costSubTab === 'mpi' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.transport}
                      onCheckedChange={() => toggleLegendOpacity('transport')}
                    />
                    <div className="w-4 h-4 bg-[#E91E63] rounded"></div>
                    <span className="text-sm">Transport</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={legendOpacity.energie}
                      onCheckedChange={() => toggleLegendOpacity('energie')}
                    />
                    <div className="w-4 h-4 bg-[#00BCD4] rounded"></div>
                    <span className="text-sm">Énergie</span>
                  </label>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-[14px]" onClick={unselectAll}>
              Tout désélectionner
            </Button>
          </div>

          {/* Graphique */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => value.toFixed(3)} />

                {costSubTab === 'total' && (
                  <>
                    <Line type="monotone" dataKey="MPA" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity.MPA} />
                    <Line type="monotone" dataKey="MPI" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.MPI} />
                  </>
                )}

                {costSubTab === 'mpa' && (
                  <>
                    <Line type="monotone" dataKey="farine-ble" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity['farine-ble']} />
                    <Line type="monotone" dataKey="sucre" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.sucre} />
                    <Line type="monotone" dataKey="sel" stroke="#4CAF50" strokeWidth={2} dot={false} hide={!legendOpacity.sel} />
                  </>
                )}

                {costSubTab === 'mpi' && (
                  <>
                    <Line type="monotone" dataKey="transport" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity.transport} />
                    <Line type="monotone" dataKey="energie" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.energie} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Plage de dates</Label>
            <Slider
              value={dateRange}
              onValueChange={setDateRange}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
        </div>
      )}

      {/* Tableau - visible uniquement si showTable */}
      {showTable && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[16px] font-medium">Détail de la structure de coût</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tableau détaillé des coûts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#D9D9D9]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Nom</TableHead>
                  <TableHead className="font-bold">Coût (€)</TableHead>
                  <TableHead className="font-bold">Part (%)</TableHead>
                  <TableHead className="font-bold">Évolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Données réelles basées sur les heatmaps */}
                {(() => {
                  const heatmapData = getCostHeatmapData()
                  return heatmapData.items.map((item, index) => {
                    const evolutionNum = parseFloat(item.evolution.replace('%', '').replace('+', ''))
                    const isPositive = evolutionNum >= 0

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{item.percentage}</TableCell>
                        <TableCell className={isPositive ? 'text-green-600' : 'text-red-600'}>
                          {item.evolution}
                        </TableCell>
                      </TableRow>
                    )
                  })
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
