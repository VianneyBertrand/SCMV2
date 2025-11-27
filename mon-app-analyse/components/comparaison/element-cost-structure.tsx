// @ts-nocheck
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { calculateValorisation } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, Download, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import dynamic from 'next/dynamic'
import { CurveIcon } from "@/components/ui/curve-icon"
import { useVolumeUnit } from "@/hooks/useVolumeUnit"
import { usePeriodMode } from "@/hooks/usePeriodMode"
import { SwitchIcon } from "@/components/ui/switch-icon"
import { SimulationTag } from "@/components/simulation/SimulationTag"

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
  console.log('[ElementCostStructure] Original filters:', filters)
  console.log('[ElementCostStructure] Filtered filters:', filtered)
  return filtered
}

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
  totalPA?: string // PA total pour calculer la valorisation
  hasPairedElementTags?: boolean
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
  totalPA?: string // PA total pour calculer la valorisation
  lastUpdate?: string // Date de dernière mise à jour
}

function HeatmapRect({ label, percentage, evolution, color, className, href, type, categoryPercentage, style, totalPA, lastUpdate }: HeatmapRectProps) {
  // Calculer la valorisation en euros
  const valorisation = useMemo(() => {
    if (!totalPA) return null
    return calculateValorisation(percentage, totalPA)
  }, [percentage, totalPA])

  // Calculer l'impact en % (évolution)
  const impact = useMemo(() => {
    if (!evolution) return '+0.00%'
    return evolution
  }, [evolution])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={style}
            className={`${color} ${className} p-2 flex flex-col items-center justify-center hover:opacity-90 transition-opacity cursor-pointer overflow-hidden`}
          >
            <span className="text-[14px] font-bold text-center text-black line-clamp-3 break-words w-full px-1">{label}</span>
            <div className="flex flex-col items-start mt-1">
              <span className="text-[14px] font-medium text-black flex items-center">
                {percentage}
                <SimulationTag seed={`heatmap-${label}`} />
              </span>
              <span className="text-[14px] font-medium text-black">
                {evolution}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={-50} className="max-w-xs">
          <div>
            <p className="font-semibold mb-4">{label}</p>
            <div className="space-y-1">
              <p>Répartition : {percentage} du CA total</p>
              <p>Valorisation : {valorisation || 'N/A'}</p>
              <p>Evolution : {evolution}</p>
              <p>Impact : {impact}</p>
              <p>Dernière mise à jour : {lastUpdate || '12/11/25'}</p>
              <p className="text-xs text-muted-foreground">Source : Mintech</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ElementCostStructure({ element, data, costSubTab: costSubTabProp, setCostSubTab: setCostSubTabProp, showTable: showTableProp, setShowTable: setShowTableProp, totalPA, hasPairedElementTags = false }: ElementCostStructureProps) {
  // État local comme fallback si les props ne sont pas fournies
  const [costSubTabLocal, setCostSubTabLocal] = useState<'total' | 'mpa' | 'mpi'>('total')
  const [showTableLocal, setShowTableLocal] = useState(false)

  // Utiliser les props si disponibles, sinon l'état local
  const costSubTab = costSubTabProp ?? costSubTabLocal
  const setCostSubTab = setCostSubTabProp ?? setCostSubTabLocal
  const showTable = showTableProp ?? showTableLocal
  const setShowTable = setShowTableProp ?? setShowTableLocal
  const [base100, setBase100] = useState(false)

  // Mode unité UVC/Tonne pour Volume
  const { unit: volumeUnit, toggleUnit: toggleVolumeUnit } = useVolumeUnit('volume-unit-comparaison-cost-structure')

  // Mode période CAD/CAM pour la colonne Volume
  const { mode: volumeTableMode, toggleMode: toggleVolumeTableMode } = usePeriodMode('period-mode-volume-table-comparaison')

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
    levure: true,
    'amidon-mais': true,
    gelatine: true,
    presure: true,
    'ferments-lactiques': true,
    'creme-fraiche': true,
    'carton-ondule': true,
    polypropylene: true,
    polyethylene: true,
    aluminium: true,
    verre: true,
    acier: true,
    'papier-kraft': true,
    'polystyrene-expanse': true,
    pet: true,
    'etiquettes-papier': true,
  })

  const [showInLegend, setShowInLegend] = useState<Record<string, boolean>>({
    'farine-ble': true,
    sucre: true,
    sel: true,
    lait: true,
    beurre: true,
    huile: true,
    oeufs: true,
    levure: false,
    'amidon-mais': false,
    gelatine: false,
    presure: false,
    'ferments-lactiques': false,
    'creme-fraiche': false,
    'carton-ondule': true,
    polypropylene: true,
    polyethylene: true,
    aluminium: true,
    verre: false,
    acier: false,
    'papier-kraft': false,
    'polystyrene-expanse': false,
    pet: false,
    'etiquettes-papier': false,
  })


  const toggleLegendOpacity = (key: string) => {
    setLegendOpacity(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleShowInLegend = (itemId: string) => {
    setShowInLegend(prev => {
      const newValue = !prev[itemId]
      // Si on coche la checkbox, activer automatiquement la légende
      if (newValue) {
        setLegendOpacity(prevOpacity => ({ ...prevOpacity, [itemId]: true }))
      }
      return { ...prev, [itemId]: newValue }
    })
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
            { label: 'MP', percentage: mpaValue, evolution: mpaEvolution, color: 'bg-[#F25056]', className: 'flex-1', href: '#' },
            { label: 'Emballage', percentage: mpiValue, evolution: mpiEvolution, color: 'bg-[#2FB67E]', className: 'flex-1', href: '#' },
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
        return {
          layout: 'complex-mpi',
          type: 'mpi' as const,
          items: [
            { label: 'Carton ondulé', percentage: '22.34%', categoryPercentage: '22.34%', evolution: '+1.20%', color: 'bg-[#F57A7E]', href: '#' },
            { label: 'Polypropylène', percentage: '16.45%', categoryPercentage: '16.45%', evolution: '-2.30%', color: 'bg-[#2FB67E]', href: '#' },
            { label: 'Polyéthylène', percentage: '14.28%', categoryPercentage: '14.28%', evolution: '+0.85%', color: 'bg-[#F0FAF6]', href: '#' },
            { label: 'Aluminium', percentage: '11.92%', categoryPercentage: '11.92%', evolution: '+3.15%', color: 'bg-[#F25056]', href: '#' },
            { label: 'Verre', percentage: '9.67%', categoryPercentage: '9.67%', evolution: '-1.45%', color: 'bg-[#8EE2BF]', href: '#' },
            { label: 'Acier', percentage: '8.53%', categoryPercentage: '8.53%', evolution: '+2.70%', color: 'bg-[#F25056]', href: '#' },
            { label: 'Papier kraft', percentage: '7.21%', categoryPercentage: '7.21%', evolution: '-0.65%', color: 'bg-[#F0FAF6]', href: '#' },
            { label: 'Polystyrène expansé', percentage: '4.89%', categoryPercentage: '4.89%', evolution: '+1.90%', color: 'bg-[#F57A7E]', href: '#' },
            { label: 'PET', percentage: '2.76%', categoryPercentage: '2.76%', evolution: '-3.40%', color: 'bg-[#2FB67E]', href: '#' },
            { label: 'Étiquettes papier', percentage: '1.95%', categoryPercentage: '1.95%', evolution: '+0.55%', color: 'bg-[#F0FAF6]', href: '#' },
          ]
        }
    }
  }

  // Données graphique
  const getChartData = () => {
    const baseData = [
      { date: '2024-04', MPA: 280, MPI: 250, 'farine-ble': 270, 'sucre': 270, 'sel': 380, 'lait': 350, 'beurre': 250, 'huile': 260, 'oeufs': 240, 'levure': 230, 'amidon-mais': 235, 'gelatine': 228, 'presure': 232, 'ferments-lactiques': 238, 'creme-fraiche': 242, 'carton-ondule': 320, 'polypropylene': 290, 'polyethylene': 270, 'aluminium': 250, 'verre': 230, 'acier': 210, 'papier-kraft': 190, 'polystyrene-expanse': 170, 'pet': 150, 'etiquettes-papier': 130 },
      { date: '2024-05', MPA: 240, MPI: 230, 'farine-ble': 250, 'sucre': 240, 'sel': 360, 'lait': 330, 'beurre': 230, 'huile': 245, 'oeufs': 220, 'levure': 210, 'amidon-mais': 215, 'gelatine': 208, 'presure': 212, 'ferments-lactiques': 218, 'creme-fraiche': 222, 'carton-ondule': 315, 'polypropylene': 285, 'polyethylene': 265, 'aluminium': 245, 'verre': 225, 'acier': 205, 'papier-kraft': 185, 'polystyrene-expanse': 165, 'pet': 145, 'etiquettes-papier': 125 },
      { date: '2024-06', MPA: 240, MPI: 210, 'farine-ble': 245, 'sucre': 235, 'sel': 355, 'lait': 325, 'beurre': 225, 'huile': 240, 'oeufs': 215, 'levure': 205, 'amidon-mais': 210, 'gelatine': 203, 'presure': 207, 'ferments-lactiques': 213, 'creme-fraiche': 217, 'carton-ondule': 310, 'polypropylene': 280, 'polyethylene': 260, 'aluminium': 240, 'verre': 220, 'acier': 202, 'papier-kraft': 183, 'polystyrene-expanse': 163, 'pet': 142, 'etiquettes-papier': 123 },
      { date: '2024-07', MPA: 320, MPI: 290, 'farine-ble': 310, 'sucre': 305, 'sel': 390, 'lait': 360, 'beurre': 270, 'huile': 280, 'oeufs': 260, 'levure': 250, 'amidon-mais': 255, 'gelatine': 248, 'presure': 252, 'ferments-lactiques': 258, 'creme-fraiche': 262, 'carton-ondule': 328, 'polypropylene': 298, 'polyethylene': 275, 'aluminium': 255, 'verre': 235, 'acier': 215, 'papier-kraft': 195, 'polystyrene-expanse': 175, 'pet': 155, 'etiquettes-papier': 135 },
      { date: '2024-08', MPA: 380, MPI: 340, 'farine-ble': 360, 'sucre': 350, 'sel': 420, 'lait': 390, 'beurre': 300, 'huile': 310, 'oeufs': 290, 'levure': 280, 'amidon-mais': 285, 'gelatine': 278, 'presure': 282, 'ferments-lactiques': 288, 'creme-fraiche': 292, 'carton-ondule': 335, 'polypropylene': 305, 'polyethylene': 282, 'aluminium': 260, 'verre': 240, 'acier': 220, 'papier-kraft': 200, 'polystyrene-expanse': 180, 'pet': 160, 'etiquettes-papier': 140 },
      { date: '2025-01', MPA: 400, MPI: 320, 'farine-ble': 380, 'sucre': 370, 'sel': 430, 'lait': 400, 'beurre': 310, 'huile': 320, 'oeufs': 300, 'levure': 290, 'amidon-mais': 295, 'gelatine': 288, 'presure': 292, 'ferments-lactiques': 298, 'creme-fraiche': 302, 'carton-ondule': 340, 'polypropylene': 310, 'polyethylene': 287, 'aluminium': 265, 'verre': 245, 'acier': 223, 'papier-kraft': 203, 'polystyrene-expanse': 183, 'pet': 162, 'etiquettes-papier': 142 },
      { date: '2025-02', MPA: 380, MPI: 290, 'farine-ble': 365, 'sucre': 360, 'sel': 415, 'lait': 385, 'beurre': 295, 'huile': 305, 'oeufs': 285, 'levure': 275, 'amidon-mais': 280, 'gelatine': 273, 'presure': 277, 'ferments-lactiques': 283, 'creme-fraiche': 287, 'carton-ondule': 333, 'polypropylene': 303, 'polyethylene': 280, 'aluminium': 258, 'verre': 238, 'acier': 218, 'papier-kraft': 198, 'polystyrene-expanse': 178, 'pet': 158, 'etiquettes-papier': 138 },
      { date: '2025-03', MPA: 410, MPI: 280, 'farine-ble': 390, 'sucre': 380, 'sel': 435, 'lait': 405, 'beurre': 315, 'huile': 325, 'oeufs': 305, 'levure': 295, 'amidon-mais': 300, 'gelatine': 293, 'presure': 297, 'ferments-lactiques': 303, 'creme-fraiche': 307, 'carton-ondule': 325, 'polypropylene': 295, 'polyethylene': 273, 'aluminium': 252, 'verre': 232, 'acier': 212, 'papier-kraft': 192, 'polystyrene-expanse': 172, 'pet': 152, 'etiquettes-papier': 132 },
    ]

    // Si base 100 est activé, normaliser les données
    if (base100 && baseData.length > 0) {
      const firstRow = baseData[0]
      const keys = Object.keys(firstRow).filter(key => key !== 'date')

      return baseData.map(row => {
        const normalizedRow: any = { date: row.date }
        keys.forEach(key => {
          const firstValue = firstRow[key]
          const currentValue = row[key]
          normalizedRow[key] = firstValue !== 0 ? (currentValue / firstValue) * 100 : 100
        })
        return normalizedRow
      })
    }

    return baseData
  }

  const getChartTitle = () => {
    if (costSubTab === 'total') return 'Évolution de la structure de coût'
    if (costSubTab === 'mpa') return 'Évolution des Matières Premières et Achats'
    return 'Évolution des Moyens de Production et Infrastructure'
  }

  // Données tableau selon sous-tab
  const getTableData = () => {
    switch (costSubTab) {
      case 'total':
        return [
          {
            id: 'MPA',
            name: 'MP',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '49.25%',
            cost: '0.123M€',
            partCost: data?.mpa || '48.23%',
            evolution: data?.mpaEvolution || '+3.20%',
            impact: '+2.20%',
            color: '#E91E63'
          },
          {
            id: 'MPI',
            name: 'Emballage',
            volume: '7032.42T',
            volumeUVC: '258 UVC',
            partVolume: '50.75%',
            cost: '0.083M€',
            partCost: data?.mpi || '27.43%',
            evolution: data?.mpiEvolution || '-1.80%',
            impact: '-0.80%',
            color: '#00BCD4'
          },
          {
            id: 'Autre',
            name: 'Autre',
            volume: '',
            volumeUVC: '',
            partVolume: '',
            cost: '0.049M€',
            partCost: (() => {
              const mpaNum = parseFloat((data?.mpa || '48.23%').replace('%', ''))
              const mpiNum = parseFloat((data?.mpi || '27.43%').replace('%', ''))
              return `${(100 - mpaNum - mpiNum).toFixed(2)}%`
            })(),
            evolution: '+0.00%',
            impact: '',
            color: '#4CAF50'
          },
        ]
      case 'mpa':
        return [
          {
            id: 'farine-ble',
            name: 'Farine de blé',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '34.34%',
            evolution: '+0.91%',
            impactTotal: '+0.41%',
            color: '#E91E63'
          },
          {
            id: 'sucre',
            name: 'Sucre',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.31%',
            color: '#00BCD4'
          },
          {
            id: 'sel',
            name: 'Sel',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.23%',
            color: '#4CAF50'
          },
          {
            id: 'lait',
            name: 'Lait en poudre',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.1%',
            color: '#FF9800'
          },
          {
            id: 'beurre',
            name: 'Beurre',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.21%',
            color: '#9C27B0'
          },
          {
            id: 'huile',
            name: 'Huile végétale',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.21%',
            color: '#607D8B'
          },
          {
            id: 'oeufs',
            name: 'Oeufs',
            subLabel: 'HRTZERF',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '20.15%',
            cost: '0.035M€',
            partCostTotal: '22.34%',
            partCostMPA: '22.34%',
            evolution: '+0.91%',
            impactTotal: '+0.21%',
            color: '#795548'
          },
          {
            id: 'levure',
            name: 'Levure',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#FFEB3B'
          },
          {
            id: 'amidon-mais',
            name: 'Amidon de maïs',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#FFC107'
          },
          {
            id: 'gelatine',
            name: 'Gélatine',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#FF5722'
          },
          {
            id: 'presure',
            name: 'Présure',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#3F51B5'
          },
          {
            id: 'ferments-lactiques',
            name: 'Ferments lactiques',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#009688'
          },
          {
            id: 'creme-fraiche',
            name: 'Crème fraîche',
            subLabel: 'FR34',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '5.46%',
            cost: '0.035M€',
            partCostTotal: '5.46%',
            partCostMPA: '5.46%',
            evolution: '+0.91%',
            impactTotal: '+0.05%',
            color: '#8BC34A'
          },
        ]
      case 'mpi':
        return [
          {
            id: 'carton-ondule',
            name: 'Carton ondulé',
            subLabel: 'MP01',
            cost: '0.067M€',
            partCost: '22.34%',
            evolution: '+1.20%',
            color: '#FF6B6B',
            isMain: true
          },
          {
            id: 'polypropylene',
            name: 'Polypropylène',
            subLabel: 'MP02',
            cost: '0.049M€',
            partCost: '16.45%',
            evolution: '-2.30%',
            color: '#4ECDC4',
            isMain: true
          },
          {
            id: 'polyethylene',
            name: 'Polyéthylène',
            subLabel: 'MP03',
            cost: '0.043M€',
            partCost: '14.28%',
            evolution: '+0.85%',
            color: '#45B7D1',
            isMain: true
          },
          {
            id: 'aluminium',
            name: 'Aluminium',
            subLabel: 'MP04',
            cost: '0.036M€',
            partCost: '11.92%',
            evolution: '+3.15%',
            color: '#F7B731',
            isMain: true
          },
          {
            id: 'verre',
            name: 'Verre',
            subLabel: 'MP05',
            cost: '0.029M€',
            partCost: '9.67%',
            evolution: '-1.45%',
            color: '#5F27CD',
            isMain: true
          },
          {
            id: 'acier',
            name: 'Acier',
            subLabel: 'MP06',
            cost: '0.026M€',
            partCost: '8.53%',
            evolution: '+2.70%',
            color: '#00D2D3',
            isMain: true
          },
          {
            id: 'papier-kraft',
            name: 'Papier kraft',
            subLabel: 'MP07',
            cost: '0.022M€',
            partCost: '7.21%',
            evolution: '-0.65%',
            color: '#FD79A8',
            isMain: true
          },
          {
            id: 'polystyrene-expanse',
            name: 'Polystyrène expansé',
            subLabel: 'MP08',
            cost: '0.015M€',
            partCost: '4.89%',
            evolution: '+1.90%',
            color: '#A29BFE',
            isMain: true
          },
          {
            id: 'pet',
            name: 'PET',
            subLabel: 'MP09',
            cost: '0.008M€',
            partCost: '2.76%',
            evolution: '-3.40%',
            color: '#6C5CE7',
            isMain: true
          },
          {
            id: 'etiquettes-papier',
            name: 'Étiquettes papier',
            subLabel: 'MP10',
            cost: '0.006M€',
            partCost: '1.95%',
            evolution: '+0.55%',
            color: '#FD79A8',
            isMain: true
          },
        ]
      default:
        return []
    }
  }

  const hasOwnTags = Object.entries(filterDisplayableFilters(element.filters)).length > 0
  const shouldAddSpacing = !hasOwnTags && hasPairedElementTags

  return (
    <div className="space-y-6 border border-[#D9D9D9] rounded-lg p-6">
      {/* Header avec nom et filtres */}
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

      {/* Titre et bouton télécharger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[16px] font-medium">Structure de coût</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-[#121212]" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Répartition des coûts en valeur</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Télécharger">
          <Download className="w-4 h-4 text-gray-600" />
        </button>
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
          MP
        </button>
        <button
          onClick={() => setCostSubTab('mpi')}
          className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpi' ? 'bg-blue text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
        >
          Emballage
        </button>
      </div>

      {/* Heatmap */}
      <div>
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
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
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
                    totalPA={totalPA}
                    lastUpdate="12/11/25"
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
                    totalPA={totalPA}
                    lastUpdate="12/11/25"
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
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
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
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
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
                            totalPA={totalPA}
                            lastUpdate="12/11/25"
                            style={{ width: `${(percentages[idx] / bottomRowTotal) * 100}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            } else if (heatmapData.layout === 'complex-mpi') {
              // Layout MPI : 10 emballages en grille complexe
              const items = heatmapData.items
              return (
                <div className="flex gap-1 h-[320px]">
                  {/* Carton ondulé (plus grand - gauche) */}
                  <HeatmapRect
                    label={items[0].label}
                    percentage={items[0].percentage}
                    evolution={items[0].evolution}
                    color={items[0].color}
                    className="flex-1 h-full"
                    href={items[0].href}
                    type={heatmapData.type}
                    categoryPercentage={items[0].categoryPercentage}
                    totalPA={totalPA}
                    lastUpdate="12/11/25"
                  />
                  {/* Polypropylène (deuxième plus grand - centre) */}
                  <HeatmapRect
                    label={items[1].label}
                    percentage={items[1].percentage}
                    evolution={items[1].evolution}
                    color={items[1].color}
                    className="w-[28%] h-full"
                    href={items[1].href}
                    type={heatmapData.type}
                    categoryPercentage={items[1].categoryPercentage}
                    totalPA={totalPA}
                    lastUpdate="12/11/25"
                  />
                  {/* Colonne droite avec les 8 autres emballages */}
                  <div className="w-[35%] flex flex-col gap-1">
                    {/* Première ligne : Polyéthylène et Aluminium */}
                    <div className="flex gap-1 h-[33%]">
                      <HeatmapRect
                        label={items[2].label}
                        percentage={items[2].percentage}
                        evolution={items[2].evolution}
                        color={items[2].color}
                        className="flex-1 h-full"
                        href={items[2].href}
                        type={heatmapData.type}
                        categoryPercentage={items[2].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                      <HeatmapRect
                        label={items[3].label}
                        percentage={items[3].percentage}
                        evolution={items[3].evolution}
                        color={items[3].color}
                        className="flex-1 h-full"
                        href={items[3].href}
                        type={heatmapData.type}
                        categoryPercentage={items[3].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                    </div>
                    {/* Deuxième ligne : Verre, Acier, Papier kraft */}
                    <div className="flex gap-1 h-[33%]">
                      <HeatmapRect
                        label={items[4].label}
                        percentage={items[4].percentage}
                        evolution={items[4].evolution}
                        color={items[4].color}
                        className="flex-1 h-full"
                        href={items[4].href}
                        type={heatmapData.type}
                        categoryPercentage={items[4].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                      <HeatmapRect
                        label={items[5].label}
                        percentage={items[5].percentage}
                        evolution={items[5].evolution}
                        color={items[5].color}
                        className="flex-1 h-full"
                        href={items[5].href}
                        type={heatmapData.type}
                        categoryPercentage={items[5].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                      <HeatmapRect
                        label={items[6].label}
                        percentage={items[6].percentage}
                        evolution={items[6].evolution}
                        color={items[6].color}
                        className="flex-1 h-full"
                        href={items[6].href}
                        type={heatmapData.type}
                        categoryPercentage={items[6].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                    </div>
                    {/* Troisième ligne : Polystyrène expansé, PET, Étiquettes papier */}
                    <div className="flex gap-1 flex-1">
                      <HeatmapRect
                        label={items[7].label}
                        percentage={items[7].percentage}
                        evolution={items[7].evolution}
                        color={items[7].color}
                        className="flex-1 h-full"
                        href={items[7].href}
                        type={heatmapData.type}
                        categoryPercentage={items[7].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                      <HeatmapRect
                        label={items[8].label}
                        percentage={items[8].percentage}
                        evolution={items[8].evolution}
                        color={items[8].color}
                        className="flex-1 h-full"
                        href={items[8].href}
                        type={heatmapData.type}
                        categoryPercentage={items[8].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                      <HeatmapRect
                        label={items[9].label}
                        percentage={items[9].percentage}
                        evolution={items[9].evolution}
                        color={items[9].color}
                        className="flex-1 h-full"
                        href={items[9].href}
                        type={heatmapData.type}
                        categoryPercentage={items[9].categoryPercentage}
                        totalPA={totalPA}
                        lastUpdate="12/11/25"
                      />
                    </div>
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

      {/* Graphique et Tableau - visibles uniquement si showTable */}
      {showTable && (
        <>
          <div>
            {/* Contrôles alignés à droite */}
            <div className="flex justify-end items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Switch checked={base100} onCheckedChange={setBase100} />
                <Label>Base 100</Label>
              </div>
              <Button variant="ghost" size="sm" className="p-0">
                <Download className="text-[#0970E6]" width={24} height={24} />
              </Button>
            </div>

          {/* Légendes centrées avec bouton "Tout désélectionner" */}
          <div className="mb-2 flex items-center justify-center gap-6">
            <div className="flex flex-wrap gap-4 justify-center items-center">
            {costSubTab === 'total' && (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: legendOpacity.MPA ? 1 : 0.4 }}
                  onClick={() => toggleLegendOpacity('MPA')}
                >
                  <CurveIcon color="#E91E63" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">MP</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: legendOpacity.MPI ? 1 : 0.4 }}
                  onClick={() => toggleLegendOpacity('MPI')}
                >
                  <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">Emballage</span>
                </div>
              </>
            )}

            {costSubTab === 'mpa' && (
              <>
                {showInLegend['farine-ble'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['farine-ble'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('farine-ble')}
                  >
                    <CurveIcon color="#E91E63" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Farine de blé</span>
                  </div>
                )}
                {showInLegend.sucre && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.sucre ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('sucre')}
                  >
                    <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Sucre</span>
                  </div>
                )}
                {showInLegend.sel && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.sel ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('sel')}
                  >
                    <CurveIcon color="#4CAF50" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Sel</span>
                  </div>
                )}
                {showInLegend.lait && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.lait ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('lait')}
                  >
                    <CurveIcon color="#FF9800" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Lait en poudre</span>
                  </div>
                )}
                {showInLegend.beurre && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.beurre ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('beurre')}
                  >
                    <CurveIcon color="#9C27B0" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Beurre</span>
                  </div>
                )}
                {showInLegend.huile && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.huile ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('huile')}
                  >
                    <CurveIcon color="#607D8B" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Huile végétale</span>
                  </div>
                )}
                {showInLegend.oeufs && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.oeufs ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('oeufs')}
                  >
                    <CurveIcon color="#795548" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Oeufs</span>
                  </div>
                )}
                {showInLegend.levure && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.levure ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('levure')}
                  >
                    <CurveIcon color="#FFEB3B" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Levure</span>
                  </div>
                )}
                {showInLegend['amidon-mais'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['amidon-mais'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('amidon-mais')}
                  >
                    <CurveIcon color="#FFC107" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Amidon de maïs</span>
                  </div>
                )}
                {showInLegend.gelatine && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.gelatine ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('gelatine')}
                  >
                    <CurveIcon color="#FF5722" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Gélatine</span>
                  </div>
                )}
                {showInLegend.presure && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.presure ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('presure')}
                  >
                    <CurveIcon color="#3F51B5" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Présure</span>
                  </div>
                )}
                {showInLegend['ferments-lactiques'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['ferments-lactiques'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('ferments-lactiques')}
                  >
                    <CurveIcon color="#009688" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Ferments lactiques</span>
                  </div>
                )}
                {showInLegend['creme-fraiche'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['creme-fraiche'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('creme-fraiche')}
                  >
                    <CurveIcon color="#8BC34A" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Crème fraîche</span>
                  </div>
                )}
              </>
            )}

            {costSubTab === 'mpi' && (
              <>
                {showInLegend['carton-ondule'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['carton-ondule'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('carton-ondule')}
                  >
                    <CurveIcon color="#E91E63" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Carton ondulé</span>
                  </div>
                )}
                {showInLegend.polypropylene && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.polypropylene ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('polypropylene')}
                  >
                    <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Polypropylène</span>
                  </div>
                )}
                {showInLegend.polyethylene && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.polyethylene ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('polyethylene')}
                  >
                    <CurveIcon color="#4CAF50" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Polyéthylène</span>
                  </div>
                )}
                {showInLegend.aluminium && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.aluminium ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('aluminium')}
                  >
                    <CurveIcon color="#FF9800" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Aluminium</span>
                  </div>
                )}
                {showInLegend.verre && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.verre ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('verre')}
                  >
                    <CurveIcon color="#9C27B0" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Verre</span>
                  </div>
                )}
                {showInLegend.acier && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.acier ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('acier')}
                  >
                    <CurveIcon color="#607D8B" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Acier</span>
                  </div>
                )}
                {showInLegend['papier-kraft'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['papier-kraft'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('papier-kraft')}
                  >
                    <CurveIcon color="#795548" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Papier kraft</span>
                  </div>
                )}
                {showInLegend['polystyrene-expanse'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['polystyrene-expanse'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('polystyrene-expanse')}
                  >
                    <CurveIcon color="#FFEB3B" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Polystyrène expansé</span>
                  </div>
                )}
                {showInLegend.pet && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.pet ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('pet')}
                  >
                    <CurveIcon color="#FFC107" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">PET</span>
                  </div>
                )}
                {showInLegend['etiquettes-papier'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['etiquettes-papier'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('etiquettes-papier')}
                  >
                    <CurveIcon color="#FF5722" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Étiquettes papier</span>
                  </div>
                )}
              </>
            )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2" onClick={unselectAll}>
                    <RotateCcw className="w-4 h-4 text-[#0970E6]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tout désélectionner</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Graphique */}
          <div className="mb-6" style={{ paddingBottom: '20px' }}>
            <ResponsiveContainer width="100%" height={400} style={{ overflow: 'visible' }}>
            <LineChart data={getChartData()} margin={{ left: -30, right: 10, top: 5, bottom: 5 }} style={{ overflow: 'visible' }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                formatter={(value: number) => value.toFixed(3)}
              />

              {costSubTab === 'total' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="MPA"
                    stroke="#E91E63"
                    strokeWidth={2}
                    dot={false}
                    hide={!legendOpacity.MPA}
                  />
                  <Line
                    type="monotone"
                    dataKey="MPI"
                    stroke="#00BCD4"
                    strokeWidth={2}
                    dot={false}
                    hide={!legendOpacity.MPI}
                  />
                </>
              )}

              {costSubTab === 'mpa' && (
                <>
                  <Line type="monotone" dataKey="farine-ble" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity['farine-ble']} />
                  <Line type="monotone" dataKey="sucre" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.sucre} />
                  <Line type="monotone" dataKey="sel" stroke="#4CAF50" strokeWidth={2} dot={false} hide={!legendOpacity.sel} />
                  <Line type="monotone" dataKey="lait" stroke="#FF9800" strokeWidth={2} dot={false} hide={!legendOpacity.lait} />
                  <Line type="monotone" dataKey="beurre" stroke="#9C27B0" strokeWidth={2} dot={false} hide={!legendOpacity.beurre} />
                  <Line type="monotone" dataKey="huile" stroke="#607D8B" strokeWidth={2} dot={false} hide={!legendOpacity.huile} />
                  <Line type="monotone" dataKey="oeufs" stroke="#795548" strokeWidth={2} dot={false} hide={!legendOpacity.oeufs} />
                  <Line type="monotone" dataKey="levure" stroke="#FFEB3B" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.levure} />
                  <Line type="monotone" dataKey="amidon-mais" stroke="#FFC107" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['amidon-mais']} />
                  <Line type="monotone" dataKey="gelatine" stroke="#FF5722" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.gelatine} />
                  <Line type="monotone" dataKey="presure" stroke="#3F51B5" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.presure} />
                  <Line type="monotone" dataKey="ferments-lactiques" stroke="#009688" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['ferments-lactiques']} />
                  <Line type="monotone" dataKey="creme-fraiche" stroke="#8BC34A" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['creme-fraiche']} />
                </>
              )}

              {costSubTab === 'mpi' && (
                <>
                  <Line type="monotone" dataKey="carton-ondule" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity['carton-ondule']} />
                  <Line type="monotone" dataKey="polypropylene" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.polypropylene} />
                  <Line type="monotone" dataKey="polyethylene" stroke="#4CAF50" strokeWidth={2} dot={false} hide={!legendOpacity.polyethylene} />
                  <Line type="monotone" dataKey="aluminium" stroke="#FF9800" strokeWidth={2} dot={false} hide={!legendOpacity.aluminium} />
                  <Line type="monotone" dataKey="verre" stroke="#9C27B0" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.verre} />
                  <Line type="monotone" dataKey="acier" stroke="#607D8B" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.acier} />
                  <Line type="monotone" dataKey="papier-kraft" stroke="#795548" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['papier-kraft']} />
                  <Line type="monotone" dataKey="polystyrene-expanse" stroke="#FFEB3B" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['polystyrene-expanse']} />
                  <Line type="monotone" dataKey="pet" stroke="#FFC107" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.pet} />
                  <Line type="monotone" dataKey="etiquettes-papier" stroke="#FF5722" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['etiquettes-papier']} />
                </>
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

          {/* Tableau - details de la structure de coût */}
          <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] font-medium">Détail de la structure de coût</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tableau détaillé des coûts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="rounded-lg border">
            <div className="max-h-[400px] overflow-auto">
              <Table style={{ width: '100%', minWidth: '1400px' }}>
                <TableHeader className="sticky top-0 z-10 bg-gray-50">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold pl-4 bg-gray-50" style={{ minWidth: '250px' }}>
                    Nom
                  </TableHead>
                  {costSubTab === 'total' && (
                    <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>
                      <div className="flex items-center gap-2">
                        Volume
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVolumeUnit()
                          }}
                          className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                        >
                          {volumeUnit} <SwitchIcon className="w-4 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVolumeTableMode()
                          }}
                          className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                        >
                          {volumeTableMode} <SwitchIcon className="w-4 h-3.5" />
                        </button>
                      </div>
                    </TableHead>
                  )}
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Part Volume</TableHead>}
                  {costSubTab === 'mpa' && (
                    <>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>
                        <div className="flex items-center gap-2">
                          Volume
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleVolumeUnit()
                            }}
                            className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                          >
                            {volumeUnit} <SwitchIcon className="w-4 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleVolumeTableMode()
                            }}
                            className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                          >
                            {volumeTableMode} <SwitchIcon className="w-4 h-3.5" />
                          </button>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Part Volume</TableHead>
                    </>
                  )}
                  <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Coût</TableHead>
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '150px' }}>Part coût total</TableHead>}
                  {costSubTab === 'mpa' && (
                    <>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '150px' }}>Part coût total</TableHead>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '150px' }}>Part coût MPA</TableHead>
                    </>
                  )}
                  {costSubTab === 'mpi' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Part Coût</TableHead>}
                  <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Évolution</TableHead>
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '180px' }}>Impact sur coût total</TableHead>}
                  {costSubTab === 'mpa' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '180px' }}>Impact sur coût total</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTableData().map((row: any) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="w-[250px] pl-4">
                      <div className="flex items-center gap-3">
                        {(costSubTab === 'mpa' || costSubTab === 'mpi') && (
                          <Checkbox
                            checked={showInLegend[row.id] || false}
                            onCheckedChange={() => toggleShowInLegend(row.id)}
                          />
                        )}
                        <div>
                          <span className="font-bold">{row.name}</span>
                          {(costSubTab === 'mpa' || costSubTab === 'mpi') && row.subLabel && (
                            <div className="text-[16px] font-medium text-[#696969]">{row.subLabel}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {costSubTab === 'total' && <TableCell>{volumeUnit === 'UVC' ? row.volumeUVC : row.volume}</TableCell>}
                    {costSubTab === 'total' && <TableCell>{row.partVolume}</TableCell>}
                    {costSubTab === 'mpa' && (
                      <>
                        <TableCell>{volumeUnit === 'UVC' ? row.volumeUVC : row.volume}</TableCell>
                        <TableCell>{row.partVolume}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <span className="flex items-center">
                        {row.cost}
                        <SimulationTag seed={`comp-cost-${row.id}`} />
                      </span>
                    </TableCell>
                    {costSubTab === 'total' && <TableCell>
                      <span className="flex items-center">
                        {row.partCost}
                        <SimulationTag seed={`comp-partcost-${row.id}`} />
                      </span>
                    </TableCell>}
                    {costSubTab === 'mpa' && (
                      <>
                        <TableCell>
                          <span className="flex items-center">
                            {row.partCostTotal}
                            <SimulationTag seed={`comp-partcosttotal-${row.id}`} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            {row.partCostMPA}
                            <SimulationTag seed={`comp-partcostmpa-${row.id}`} />
                          </span>
                        </TableCell>
                      </>
                    )}
                    {costSubTab === 'mpi' && <TableCell>
                      <span className="flex items-center">
                        {row.partCost}
                        <SimulationTag seed={`comp-partcost-${row.id}`} />
                      </span>
                    </TableCell>}
                    <TableCell className={row.evolution?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      <span className="flex items-center">
                        {row.evolution}
                        <SimulationTag seed={`comp-evol-${row.id}`} />
                      </span>
                    </TableCell>
                    {costSubTab === 'total' && (
                      <TableCell className={row.impact?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        <span className="flex items-center">
                          {row.impact}
                          <SimulationTag seed={`comp-impact-${row.id}`} />
                        </span>
                      </TableCell>
                    )}
                    {costSubTab === 'mpa' && (
                      <TableCell className={row.impactTotal?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        <span className="flex items-center">
                          {row.impactTotal}
                          <SimulationTag seed={`comp-impacttotal-${row.id}`} />
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
