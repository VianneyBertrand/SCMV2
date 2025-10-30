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
}

function HeatmapRect({ label, percentage, evolution, color, className, href, type, categoryPercentage, style, totalPA }: HeatmapRectProps) {
  // Calculer la valorisation en euros
  const valorisation = useMemo(() => {
    if (!totalPA) return null
    return calculateValorisation(percentage, totalPA)
  }, [percentage, totalPA])

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
                  <span className="text-sm select-none">% du total {type === 'mpa' ? 'MPA' : 'MPI'}</span>
                  <span className="text-sm font-medium">{categoryPercentage}</span>
                </>
              )}
              {valorisation && (
                <>
                  <span className="text-sm select-none">Valorisation</span>
                  <span className="text-sm font-medium">{valorisation}</span>
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
    energie: true,
    transport: true,
    emballage: true,
    'main-oeuvre': true,
    'transport-routier': true,
    'transport-maritime': true,
    electricite: true,
    gaz: true,
    'salaires-production': true,
    'salaires-logistique': true,
    'carton-ondule': true,
    'plastique-emballage': true,
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
    transport: true,
    energie: true,
    'main-oeuvre': true,
    emballage: true,
    'transport-routier': false,
    'transport-maritime': false,
    electricite: false,
    gaz: false,
    'salaires-production': false,
    'salaires-logistique': false,
    'carton-ondule': false,
    'plastique-emballage': false,
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
      { date: '2024-04', MPA: 280, MPI: 250, 'farine-ble': 270, 'sucre': 270, 'sel': 380, 'lait': 350, 'beurre': 250, 'huile': 260, 'oeufs': 240, 'levure': 230, 'amidon-mais': 235, 'gelatine': 228, 'presure': 232, 'ferments-lactiques': 238, 'creme-fraiche': 242, 'energie': 210, 'transport': 430, 'emballage': 250, 'main-oeuvre': 290, 'transport-routier': 425, 'transport-maritime': 435, 'electricite': 215, 'gaz': 205, 'salaires-production': 295, 'salaires-logistique': 285, 'carton-ondule': 255, 'plastique-emballage': 245 },
      { date: '2024-05', MPA: 240, MPI: 230, 'farine-ble': 250, 'sucre': 240, 'sel': 360, 'lait': 330, 'beurre': 230, 'huile': 245, 'oeufs': 220, 'levure': 225, 'amidon-mais': 230, 'gelatine': 223, 'presure': 227, 'ferments-lactiques': 233, 'creme-fraiche': 237, 'energie': 205, 'transport': 410, 'emballage': 240, 'main-oeuvre': 280, 'transport-routier': 405, 'transport-maritime': 415, 'electricite': 210, 'gaz': 200, 'salaires-production': 285, 'salaires-logistique': 275, 'carton-ondule': 245, 'plastique-emballage': 235 },
      { date: '2024-06', MPA: 240, MPI: 210, 'farine-ble': 245, 'sucre': 235, 'sel': 355, 'lait': 325, 'beurre': 225, 'huile': 240, 'oeufs': 215, 'levure': 220, 'amidon-mais': 228, 'gelatine': 220, 'presure': 224, 'ferments-lactiques': 230, 'creme-fraiche': 234, 'energie': 210, 'transport': 405, 'emballage': 235, 'main-oeuvre': 275, 'transport-routier': 400, 'transport-maritime': 410, 'electricite': 212, 'gaz': 203, 'salaires-production': 280, 'salaires-logistique': 270, 'carton-ondule': 240, 'plastique-emballage': 230 },
      { date: '2024-07', MPA: 320, MPI: 290, 'farine-ble': 310, 'sucre': 305, 'sel': 390, 'lait': 360, 'beurre': 270, 'huile': 280, 'oeufs': 260, 'levure': 250, 'amidon-mais': 255, 'gelatine': 248, 'presure': 252, 'ferments-lactiques': 258, 'creme-fraiche': 262, 'energie': 230, 'transport': 450, 'emballage': 280, 'main-oeuvre': 310, 'transport-routier': 445, 'transport-maritime': 455, 'electricite': 235, 'gaz': 225, 'salaires-production': 315, 'salaires-logistique': 305, 'carton-ondule': 285, 'plastique-emballage': 275 },
      { date: '2024-08', MPA: 380, MPI: 340, 'farine-ble': 360, 'sucre': 350, 'sel': 420, 'lait': 390, 'beurre': 300, 'huile': 310, 'oeufs': 290, 'levure': 280, 'amidon-mais': 285, 'gelatine': 278, 'presure': 282, 'ferments-lactiques': 288, 'creme-fraiche': 292, 'energie': 250, 'transport': 470, 'emballage': 310, 'main-oeuvre': 340, 'transport-routier': 465, 'transport-maritime': 475, 'electricite': 255, 'gaz': 245, 'salaires-production': 345, 'salaires-logistique': 335, 'carton-ondule': 315, 'plastique-emballage': 305 },
      { date: '2025-01', MPA: 400, MPI: 320, 'farine-ble': 380, 'sucre': 370, 'sel': 430, 'lait': 400, 'beurre': 310, 'huile': 320, 'oeufs': 300, 'levure': 290, 'amidon-mais': 295, 'gelatine': 288, 'presure': 292, 'ferments-lactiques': 298, 'creme-fraiche': 302, 'energie': 260, 'transport': 480, 'emballage': 320, 'main-oeuvre': 350, 'transport-routier': 475, 'transport-maritime': 485, 'electricite': 265, 'gaz': 255, 'salaires-production': 355, 'salaires-logistique': 345, 'carton-ondule': 325, 'plastique-emballage': 315 },
      { date: '2025-02', MPA: 380, MPI: 290, 'farine-ble': 365, 'sucre': 360, 'sel': 415, 'lait': 385, 'beurre': 295, 'huile': 305, 'oeufs': 285, 'levure': 275, 'amidon-mais': 280, 'gelatine': 273, 'presure': 277, 'ferments-lactiques': 283, 'creme-fraiche': 287, 'energie': 245, 'transport': 465, 'emballage': 305, 'main-oeuvre': 335, 'transport-routier': 460, 'transport-maritime': 470, 'electricite': 250, 'gaz': 240, 'salaires-production': 340, 'salaires-logistique': 330, 'carton-ondule': 310, 'plastique-emballage': 300 },
      { date: '2025-03', MPA: 410, MPI: 280, 'farine-ble': 390, 'sucre': 380, 'sel': 435, 'lait': 405, 'beurre': 315, 'huile': 325, 'oeufs': 305, 'levure': 295, 'amidon-mais': 300, 'gelatine': 293, 'presure': 297, 'ferments-lactiques': 303, 'creme-fraiche': 307, 'energie': 235, 'transport': 475, 'emballage': 315, 'main-oeuvre': 345, 'transport-routier': 470, 'transport-maritime': 480, 'electricite': 240, 'gaz': 230, 'salaires-production': 350, 'salaires-logistique': 340, 'carton-ondule': 320, 'plastique-emballage': 310 },
    ]
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
            name: 'MPA',
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
            name: 'MPI',
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
          // Moyennes
          {
            id: 'transport',
            name: 'Moyenne transport',
            cost: '0.035M€',
            partCost: '25%',
            evolution: '+3.35%',
            color: '#E91E63',
            isMain: true,
            category: 'transport'
          },
          {
            id: 'energie',
            name: 'Moyenne energie',
            cost: '0.028M€',
            partCost: '20%',
            evolution: '+2.15%',
            color: '#00BCD4',
            isMain: true,
            category: 'energie'
          },
          {
            id: 'main-oeuvre',
            name: "Moyenne main d'oeuvre",
            cost: '0.042M€',
            partCost: '30%',
            evolution: '+1.85%',
            color: '#4CAF50',
            isMain: true,
            category: 'main-oeuvre'
          },
          {
            id: 'emballage',
            name: 'Moyenne emballage',
            cost: '0.035M€',
            partCost: '25%',
            evolution: '+2.75%',
            color: '#FF9800',
            isMain: true,
            category: 'emballage'
          },
          // Transport
          {
            id: 'transport-routier',
            name: 'Transport routier',
            subLabel: 'TRA01',
            cost: '0.020M€',
            partCost: '14.3%',
            evolution: '+3.20%',
            color: '#F48FB1',
            isMain: true,
            category: 'transport'
          },
          {
            id: 'transport-maritime',
            name: 'Transport maritime',
            subLabel: 'TRA02',
            cost: '0.015M€',
            partCost: '10.7%',
            evolution: '+3.50%',
            color: '#F06292',
            isMain: true,
            category: 'transport'
          },
          // Energie
          {
            id: 'electricite',
            name: 'Électricité',
            subLabel: 'ENE01',
            cost: '0.016M€',
            partCost: '11.4%',
            evolution: '+2.10%',
            color: '#80DEEA',
            isMain: true,
            category: 'energie'
          },
          {
            id: 'gaz',
            name: 'Gaz naturel',
            subLabel: 'ENE02',
            cost: '0.012M€',
            partCost: '8.6%',
            evolution: '+2.20%',
            color: '#4DD0E1',
            isMain: true,
            category: 'energie'
          },
          // Main d'oeuvre
          {
            id: 'salaires-production',
            name: 'Salaires production',
            subLabel: 'MO01',
            cost: '0.025M€',
            partCost: '17.9%',
            evolution: '+1.80%',
            color: '#A5D6A7',
            isMain: true,
            category: 'main-oeuvre'
          },
          {
            id: 'salaires-logistique',
            name: 'Salaires logistique',
            subLabel: 'MO02',
            cost: '0.017M€',
            partCost: '12.1%',
            evolution: '+1.90%',
            color: '#81C784',
            isMain: true,
            category: 'main-oeuvre'
          },
          // Emballage
          {
            id: 'carton-ondule',
            name: 'Carton ondulé',
            subLabel: 'EMB01',
            cost: '0.020M€',
            partCost: '14.3%',
            evolution: '+2.80%',
            color: '#FFCC80',
            isMain: true,
            category: 'emballage'
          },
          {
            id: 'plastique-emballage',
            name: 'Film plastique',
            subLabel: 'EMB02',
            cost: '0.015M€',
            partCost: '10.7%',
            evolution: '+2.70%',
            color: '#FFB74D',
            isMain: true,
            category: 'emballage'
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
                    totalPA={totalPA}
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
                    totalPA={totalPA}
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
                      totalPA={totalPA}
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
                      totalPA={totalPA}
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
                  <span className="text-sm select-none">MPA</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: legendOpacity.MPI ? 1 : 0.4 }}
                  onClick={() => toggleLegendOpacity('MPI')}
                >
                  <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                  <span className="text-sm select-none">MPI</span>
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
                {/* Moyennes */}
                {showInLegend.transport && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.transport ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('transport')}
                  >
                    <CurveIcon color="#E91E63" className="w-[30px] h-[14px]" />
                    <span className="text-sm font-semibold select-none">Moyenne transport</span>
                  </div>
                )}
                {showInLegend.energie && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.energie ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('energie')}
                  >
                    <CurveIcon color="#00BCD4" className="w-[30px] h-[14px]" />
                    <span className="text-sm font-semibold select-none">Moyenne energie</span>
                  </div>
                )}
                {showInLegend['main-oeuvre'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['main-oeuvre'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('main-oeuvre')}
                  >
                    <CurveIcon color="#4CAF50" className="w-[30px] h-[14px]" />
                    <span className="text-sm font-semibold select-none">Moyenne main d&apos;oeuvre</span>
                  </div>
                )}
                {showInLegend.emballage && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.emballage ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('emballage')}
                  >
                    <CurveIcon color="#FF9800" className="w-[30px] h-[14px]" />
                    <span className="text-sm font-semibold select-none">Moyenne emballage</span>
                  </div>
                )}

                {/* Transport items */}
                {showInLegend['transport-routier'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['transport-routier'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('transport-routier')}
                  >
                    <CurveIcon color="#F48FB1" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Transport routier</span>
                  </div>
                )}
                {showInLegend['transport-maritime'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['transport-maritime'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('transport-maritime')}
                  >
                    <CurveIcon color="#F06292" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Transport maritime</span>
                  </div>
                )}

                {/* Energie items */}
                {showInLegend.electricite && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.electricite ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('electricite')}
                  >
                    <CurveIcon color="#80DEEA" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Électricité</span>
                  </div>
                )}
                {showInLegend.gaz && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity.gaz ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('gaz')}
                  >
                    <CurveIcon color="#4DD0E1" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Gaz naturel</span>
                  </div>
                )}

                {/* Main d'oeuvre items */}
                {showInLegend['salaires-production'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['salaires-production'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('salaires-production')}
                  >
                    <CurveIcon color="#81C784" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Salaires production</span>
                  </div>
                )}
                {showInLegend['salaires-logistique'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['salaires-logistique'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('salaires-logistique')}
                  >
                    <CurveIcon color="#66BB6A" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Salaires logistique</span>
                  </div>
                )}

                {/* Emballage items */}
                {showInLegend['carton-ondule'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['carton-ondule'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('carton-ondule')}
                  >
                    <CurveIcon color="#FFB74D" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Carton ondulé</span>
                  </div>
                )}
                {showInLegend['plastique-emballage'] && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ opacity: legendOpacity['plastique-emballage'] ? 1 : 0.4 }}
                    onClick={() => toggleLegendOpacity('plastique-emballage')}
                  >
                    <CurveIcon color="#FFA726" className="w-[30px] h-[14px]" />
                    <span className="text-sm select-none">Film plastique</span>
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
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getChartData()} margin={{ left: -30, right: 10, top: 5, bottom: 5 }}>
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
                  {/* Moyennes */}
                  <Line type="monotone" dataKey="transport" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity.transport} />
                  <Line type="monotone" dataKey="energie" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.energie} />
                  <Line type="monotone" dataKey="main-oeuvre" stroke="#4CAF50" strokeWidth={2} dot={false} hide={!legendOpacity['main-oeuvre']} />
                  <Line type="monotone" dataKey="emballage" stroke="#FF9800" strokeWidth={2} dot={false} hide={!legendOpacity.emballage} />

                  {/* Transport items */}
                  <Line type="monotone" dataKey="transport-routier" stroke="#F48FB1" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['transport-routier']} />
                  <Line type="monotone" dataKey="transport-maritime" stroke="#F06292" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['transport-maritime']} />

                  {/* Energie items */}
                  <Line type="monotone" dataKey="electricite" stroke="#80DEEA" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.electricite} />
                  <Line type="monotone" dataKey="gaz" stroke="#4DD0E1" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.gaz} />

                  {/* Main d'oeuvre items */}
                  <Line type="monotone" dataKey="salaires-production" stroke="#81C784" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['salaires-production']} />
                  <Line type="monotone" dataKey="salaires-logistique" stroke="#66BB6A" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['salaires-logistique']} />

                  {/* Emballage items */}
                  <Line type="monotone" dataKey="carton-ondule" stroke="#FFB74D" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['carton-ondule']} />
                  <Line type="monotone" dataKey="plastique-emballage" stroke="#FFA726" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['plastique-emballage']} />
                </>
              )}
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
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Volume</TableHead>}
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Volume (UVC)</TableHead>}
                  {costSubTab === 'total' && <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Part Volume</TableHead>}
                  {costSubTab === 'mpa' && (
                    <>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Volume</TableHead>
                      <TableHead className="font-semibold bg-gray-50" style={{ minWidth: '120px' }}>Volume (UVC)</TableHead>
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
                    {costSubTab === 'total' && <TableCell>{row.volume}</TableCell>}
                    {costSubTab === 'total' && <TableCell>{row.volumeUVC}</TableCell>}
                    {costSubTab === 'total' && <TableCell>{row.partVolume}</TableCell>}
                    {costSubTab === 'mpa' && (
                      <>
                        <TableCell>{row.volume}</TableCell>
                        <TableCell>{row.volumeUVC}</TableCell>
                        <TableCell>{row.partVolume}</TableCell>
                      </>
                    )}
                    <TableCell>{row.cost}</TableCell>
                    {costSubTab === 'total' && <TableCell>{row.partCost}</TableCell>}
                    {costSubTab === 'mpa' && (
                      <>
                        <TableCell>{row.partCostTotal}</TableCell>
                        <TableCell>{row.partCostMPA}</TableCell>
                      </>
                    )}
                    {costSubTab === 'mpi' && <TableCell>{row.partCost}</TableCell>}
                    <TableCell className={row.evolution?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {row.evolution}
                    </TableCell>
                    {costSubTab === 'total' && (
                      <TableCell className={row.impact?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {row.impact}
                      </TableCell>
                    )}
                    {costSubTab === 'mpa' && (
                      <TableCell className={row.impactTotal?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {row.impactTotal}
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
