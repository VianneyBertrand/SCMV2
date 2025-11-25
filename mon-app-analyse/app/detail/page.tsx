// @ts-nocheck
"use client";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { CurveIcon } from "@/components/ui/curve-icon"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  calculateSubLevelCounts,
  getPerimetreData,
  perimetreAbbreviations,
  perimetreToFilterKey,
  type PerimetreItem,
  type PerimetreType
} from "@/lib/data/perimetre-data"
import { calculateValorisation } from "@/lib/utils"
import { ArrowLeft, CalendarIcon, Info, Pencil, X, Download, ChevronsUpDown, RotateCcw } from "lucide-react"
import { SwitchIcon } from "@/components/ui/switch-icon"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, Suspense, useEffect, useRef } from "react"
import dynamic from 'next/dynamic'
import { usePeriodMode } from "@/hooks/usePeriodMode"
import { useVolumeUnit } from "@/hooks/useVolumeUnit"

// Imports pour la simulation
import { SimulationButton } from "@/components/simulation/SimulationButton"
import { SimulationWindow } from "@/components/simulation/SimulationWindow"
import { SimulationTag } from "@/components/simulation/SimulationTag"
import { useSimulationStore } from "@/stores/simulationStore"
import { extractMPValuesFromChartData, extractMPVolumesFromRecetteData } from "@/lib/utils/simulationHelpers"

// Import Recharts components directly
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Brush
} from 'recharts';

// Composant HeatmapRect (copié depuis app/accueil/page.tsx)
interface HeatmapRectProps {
  label: string
  percentage: string
  evolution: string
  color: string
  className?: string
  href?: string
  type: 'total' | 'mpa' | 'mpi'
  categoryPercentage?: string
  totalPA?: string // PA total pour calculer la valorisation
  lastUpdate?: string // Date de dernière mise à jour
}

function HeatmapRect({ label, percentage, evolution, color, className, href, type, categoryPercentage, totalPA, lastUpdate }: HeatmapRectProps) {
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

  const content = (
    <>
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
    </>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? (
            <Link
              href={href}
              className={`${color} ${className} p-2 flex flex-col items-center justify-center hover:opacity-90 transition-opacity cursor-pointer overflow-hidden`}
            >
              {content}
            </Link>
          ) : (
            <div
              className={`${color} ${className} p-2 flex flex-col items-center justify-center overflow-hidden`}
            >
              {content}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={-50} className="max-w-xs">
          <div>
            <p className="font-semibold mb-4">{label}</p>
            <div className="space-y-1">
              <p>Répartition : {percentage} du CA théorique</p>
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

// Helper pour obtenir la couleur en fonction de l'évolution
const getColorFromEvolution = (evolution: string): string => {
  const value = parseFloat(evolution.replace('%', ''))

  // Logique inversée : rouge = augmentation PA = mauvais, vert = baisse PA = bon
  if (value > 2) return 'bg-[#F25056]' // Rouge foncé (forte hausse > 2% = très mauvais)
  if (value >= 1) return 'bg-[#F57A7E]' // Rouge moyen (entre 1% et 2%)
  if (value > 0) return 'bg-[#FFEFEF]' // Rouge pâle (entre 0% et 1%)
  if (value >= -1) return 'bg-[#F0FAF6]' // Vert pâle (entre 0% et -1%)
  if (value >= -2) return 'bg-[#8EE2BF]' // Vert moyen (entre -1% et -2%)
  return 'bg-[#2FB67E]' // Vert foncé (forte baisse < -2% = très bon)
}

// Helper pour générer le titre avec la bonne préposition
const getVueEnsembleTitle = (perimetre: string, label: string): string => {
  const perimetreMap: Record<string, string> = {
    "Marché": "du marché",
    "Marché détaillé": "du marché détaillé",
    "Famille": "de la famille",
    "Sous famille": "de la sous famille",
    "Code Mintech": "du code Mintech",
  }

  const preposition = perimetreMap[perimetre] || `de ${perimetre.toLowerCase()}`
  return `Vue d'ensemble ${preposition} ${label || perimetre}`
}

// Helper pour générer le titre "Évolution des prix"
const getEvolutionPrixTitle = (perimetre: string, label: string): string => {
  const perimetreMap: Record<string, string> = {
    "Marché": "du marché",
    "Marché détaillé": "du marché détaillé",
    "Famille": "de la famille",
    "Sous famille": "de la sous famille",
    "Code Mintech": "du code Mintech",
  }

  const preposition = perimetreMap[perimetre] || `de ${perimetre.toLowerCase()}`
  return `Évolution des prix ${preposition} ${label || perimetre}`
}

function DetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Récupérer les paramètres de l'URL
  const perimetre = (searchParams.get('perimetre') as PerimetreType) || "Marché"
  const label = searchParams.get('label') || ""

  // Mode unité UVC/Tonne pour Volume
  const { unit: volumeUnit, toggleUnit: toggleVolumeUnit } = useVolumeUnit('volume-unit-detail')

  // Mode période CAD/CAM pour les tableaux de structure de coût (colonne Volume)
  const { mode: volumeTableMode, toggleMode: toggleVolumeTableMode } = usePeriodMode('period-mode-volume-table-detail')

  // États pour Structure de coût
  const [costSubTab, setCostSubTab] = useState<'total' | 'mpa' | 'mpi'>('total')
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({
    // Total
    MPA: true,
    MPI: true,
    // MPA
    'farine-ble': true,
    'sucre': true,
    'sel': true,
    'lait': true,
    'beurre': true,
    'huile': true,
    'oeufs': true,
    'levure': true,
    'amidon-mais': true,
    'gelatine': true,
    'presure': true,
    'ferments-lactiques': true,
    'creme-fraiche': true,
    // MPI - 20 emballages
    'carton-ondule': true,
    'polypropylene': true,
    'polyethylene': true,
    'aluminium': true,
    'verre': true,
    'acier': true,
    'papier-kraft': true,
    'polystyrene-expanse': true,
    'pet': true,
    'etiquettes-papier': true,
    'bouchons-plastique': true,
    'film-etirable': true,
    'encres-impression': true,
    'colles-adhesifs': true,
    'ruban-adhesif': true,
    'palettes-bois': true,
    'housses-thermoretractables': true,
    'sachets-zip': true,
    'capsules-metal': true,
    'opercules-aluminium': true,
  })
  const [legendOpacity, setLegendOpacity] = useState<Record<string, boolean>>({
    MPA: true,
    MPI: true,
    'farine-ble': true,
    'sucre': true,
    'sel': true,
    'lait': true,
    'beurre': true,
    'huile': true,
    'oeufs': true,
    'levure': true,
    'amidon-mais': true,
    'gelatine': true,
    'presure': true,
    'ferments-lactiques': true,
    'creme-fraiche': true,
    // MPI - 10 emballages (4 actifs, 6 inactifs)
    'carton-ondule': true,
    'polypropylene': true,
    'polyethylene': true,
    'aluminium': true,
    'verre': false,
    'acier': false,
    'papier-kraft': false,
    'polystyrene-expanse': false,
    'pet': false,
    'etiquettes-papier': false,
  })
  // État pour contrôler l'affichage des légendes via checkboxes
  const [showInLegend, setShowInLegend] = useState<Record<string, boolean>>({
    // MPA - 6 premiers
    'farine-ble': true,
    'sucre': true,
    'sel': true,
    'lait': true,
    'beurre': true,
    'huile': true,
    'oeufs': false,
    'levure': false,
    'amidon-mais': false,
    'gelatine': false,
    'presure': false,
    'ferments-lactiques': false,
    'creme-fraiche': false,
    // MPI - 10 emballages affichés dans le graphique
    'carton-ondule': true,
    'polypropylene': true,
    'polyethylene': true,
    'aluminium': true,
    'verre': true,
    'acier': true,
    'papier-kraft': true,
    'polystyrene-expanse': true,
    'pet': true,
    'etiquettes-papier': true,
    // MPI - 10 emballages non affichés dans le graphique
    'bouchons-plastique': false,
    'film-etirable': false,
    'encres-impression': false,
    'colles-adhesifs': false,
    'ruban-adhesif': false,
    'palettes-bois': false,
    'housses-thermoretractables': false,
    'sachets-zip': false,
    'capsules-metal': false,
    'opercules-aluminium': false,
  })
  const [base100, setBase100] = useState(false)
  const [dateRange, setDateRange] = useState([0, 100])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [recetteSubTab, setRecetteSubTab] = useState<'mpa' | 'mpi'>('mpa')

  // États pour Evolution Prix
  const [evolutionPeriod, setEvolutionPeriod] = useState<'mois' | 'semaine' | 'jour'>('mois')
  const [evolutionBase100, setEvolutionBase100] = useState(false)
  const [evolutionDateRange, setEvolutionDateRange] = useState<{startIndex: number, endIndex: number}>({startIndex: 0, endIndex: 11})
  const [evolutionLegendOpacity, setEvolutionLegendOpacity] = useState<Record<string, boolean>>({
    PA: true,
    'cout-theorique': true,
    PV: false,
    'PV-LCL': false,
    'Marge-PV': false,
    'Marge-PV-LCL': false,
  })

  // Récupérer l'item spécifique
  const currentItem = useMemo(() => {
    const data = getPerimetreData(perimetre)
    return data.find(item => item.label === label) || data[0]
  }, [perimetre, label])

  // ============================================
  // FONCTIONS - Données pour simulation (doivent être avant les useMemo)
  // ============================================

  // Heatmap selon sous-tab
  const getCostHeatmapData = () => {
    switch (costSubTab) {
      case 'total':
        const mpaValue = parseFloat(currentItem.mpa.valeur)
        const mpiValue = parseFloat(currentItem.mpi.valeur)
        const autreValue = (100 - mpaValue - mpiValue).toFixed(2)

        const getMPAColor = () => {
          const evoValue = parseFloat(currentItem.mpa.evolution.replace('%', ''))
          if (evoValue > 2) return 'bg-[#F25056]'
          if (evoValue >= 1) return 'bg-[#F57A7E]'
          if (evoValue > 0) return 'bg-[#FFEFEF]'
          if (evoValue >= -1) return 'bg-[#F0FAF6]'
          if (evoValue >= -2) return 'bg-[#8EE2BF]'
          return 'bg-[#2FB67E]'
        }

        const getMPIColor = () => {
          const evoValue = parseFloat(currentItem.mpi.evolution.replace('%', ''))
          if (evoValue > 2) return 'bg-[#F25056]'
          if (evoValue >= 1) return 'bg-[#F57A7E]'
          if (evoValue > 0) return 'bg-[#FFEFEF]'
          if (evoValue >= -1) return 'bg-[#F0FAF6]'
          if (evoValue >= -2) return 'bg-[#8EE2BF]'
          return 'bg-[#2FB67E]'
        }

        return {
          layout: 'horizontal',
          type: 'total' as const,
          items: [
            { label: 'MP', percentage: currentItem.mpa.valeur, evolution: currentItem.mpa.evolution, color: getMPAColor(), className: 'flex-1', href: '/detail?perimetre=MPA' },
            { label: 'Emballage', percentage: currentItem.mpi.valeur, evolution: currentItem.mpi.evolution, color: getMPIColor(), className: 'flex-1', href: '/detail?perimetre=MPI' },
            { label: 'Autre', percentage: `${autreValue}%`, evolution: '+0.00%', color: 'bg-gray-400', className: 'w-1/6', href: '/detail?perimetre=Autre' },
          ]
        }
      case 'mpa':
        return {
          layout: 'complex-mpa',
          type: 'mpa' as const,
          items: [
            { label: 'Farine de blé', percentage: '28.34%', categoryPercentage: '58.76%', evolution: '+0.91%', color: 'bg-[#F0FAF6]', href: '/detail?item=farine-ble' },
            { label: 'Sucre', percentage: '17.35%', categoryPercentage: '35.97%', evolution: '-1.80%', color: 'bg-[#2FB67E]', href: '/detail?item=sucre' },
            { label: 'Sel', percentage: '6.62%', categoryPercentage: '13.73%', evolution: '+2.10%', color: 'bg-[#F25056]', href: '/detail?item=sel' },
            { label: 'Lait en poudre', percentage: '4.47%', categoryPercentage: '9.27%', evolution: '+1.50%', color: 'bg-[#F57A7E]', href: '/detail?item=lait' },
            { label: 'Beurre', percentage: '2.35%', categoryPercentage: '4.87%', evolution: '-1.80%', color: 'bg-[#8EE2BF]', href: '/detail?item=beurre' },
            { label: 'Huile végétale', percentage: '2.23%', categoryPercentage: '4.62%', evolution: '-0.80%', color: 'bg-[#8EE2BF]', href: '/detail?item=huile' },
            { label: 'Oeufs', percentage: '1.82%', categoryPercentage: '3.77%', evolution: '-1.80%', color: 'bg-[#F57A7E]', href: '/detail?item=oeufs' },
          ]
        }
      case 'mpi':
        return {
          layout: 'complex-mpi',
          type: 'mpi' as const,
          items: [
            { label: 'Carton ondulé', percentage: '22.34%', categoryPercentage: '22.34%', evolution: '+1.20%', color: 'bg-[#F57A7E]', href: '/detail?item=carton-ondule' },
            { label: 'Polypropylène', percentage: '16.45%', categoryPercentage: '16.45%', evolution: '-2.30%', color: 'bg-[#2FB67E]', href: '/detail?item=polypropylene' },
            { label: 'Polyéthylène', percentage: '14.28%', categoryPercentage: '14.28%', evolution: '+0.85%', color: 'bg-[#F0FAF6]', href: '/detail?item=polyethylene' },
            { label: 'Aluminium', percentage: '11.92%', categoryPercentage: '11.92%', evolution: '+3.15%', color: 'bg-[#F25056]', href: '/detail?item=aluminium' },
            { label: 'Verre', percentage: '9.67%', categoryPercentage: '9.67%', evolution: '-1.45%', color: 'bg-[#8EE2BF]', href: '/detail?item=verre' },
            { label: 'Acier', percentage: '8.53%', categoryPercentage: '8.53%', evolution: '+2.70%', color: 'bg-[#F25056]', href: '/detail?item=acier' },
            { label: 'Papier kraft', percentage: '7.21%', categoryPercentage: '7.21%', evolution: '-0.65%', color: 'bg-[#F0FAF6]', href: '/detail?item=papier-kraft' },
            { label: 'Polystyrène expansé', percentage: '4.89%', categoryPercentage: '4.89%', evolution: '+1.90%', color: 'bg-[#F57A7E]', href: '/detail?item=polystyrene-expanse' },
            { label: 'PET', percentage: '2.76%', categoryPercentage: '2.76%', evolution: '-3.40%', color: 'bg-[#2FB67E]', href: '/detail?item=pet' },
            { label: 'Étiquettes papier', percentage: '1.95%', categoryPercentage: '1.95%', evolution: '+0.55%', color: 'bg-[#F0FAF6]', href: '/detail?item=etiquettes-papier' },
          ]
        }
    }
  }

  // Données graphique
  const getChartData = () => {
    // Facteur de conversion pour obtenir des €/kg (405 -> 1.12€/kg)
    const MP_CONVERSION_FACTOR = 361.6

    const baseData = [
      { date: '2024-04', MPA: 280, MPI: 250, 'farine-ble': 270, 'sucre': 270, 'sel': 380, 'lait': 350, 'beurre': 250, 'huile': 260, 'oeufs': 240, 'levure': 230, 'amidon-mais': 235, 'gelatine': 228, 'presure': 232, 'ferments-lactiques': 238, 'creme-fraiche': 242, 'carton-ondule': 320, 'polypropylene': 290, 'polyethylene': 270, 'aluminium': 250, 'verre': 230, 'acier': 210, 'papier-kraft': 190, 'polystyrene-expanse': 170, 'pet': 150, 'etiquettes-papier': 130 },
      { date: '2024-05', MPA: 240, MPI: 230, 'farine-ble': 250, 'sucre': 240, 'sel': 360, 'lait': 330, 'beurre': 230, 'huile': 245, 'oeufs': 220, 'levure': 210, 'amidon-mais': 215, 'gelatine': 208, 'presure': 212, 'ferments-lactiques': 218, 'creme-fraiche': 222, 'carton-ondule': 315, 'polypropylene': 285, 'polyethylene': 265, 'aluminium': 245, 'verre': 225, 'acier': 205, 'papier-kraft': 185, 'polystyrene-expanse': 165, 'pet': 145, 'etiquettes-papier': 125 },
      { date: '2024-06', MPA: 240, MPI: 210, 'farine-ble': 245, 'sucre': 235, 'sel': 355, 'lait': 325, 'beurre': 225, 'huile': 240, 'oeufs': 215, 'levure': 205, 'amidon-mais': 210, 'gelatine': 203, 'presure': 207, 'ferments-lactiques': 213, 'creme-fraiche': 217, 'carton-ondule': 310, 'polypropylene': 280, 'polyethylene': 260, 'aluminium': 240, 'verre': 220, 'acier': 202, 'papier-kraft': 183, 'polystyrene-expanse': 163, 'pet': 142, 'etiquettes-papier': 123 },
      { date: '2024-07', MPA: 320, MPI: 290, 'farine-ble': 310, 'sucre': 305, 'sel': 390, 'lait': 360, 'beurre': 270, 'huile': 280, 'oeufs': 260, 'levure': 250, 'amidon-mais': 255, 'gelatine': 248, 'presure': 252, 'ferments-lactiques': 258, 'creme-fraiche': 262, 'carton-ondule': 328, 'polypropylene': 298, 'polyethylene': 275, 'aluminium': 255, 'verre': 235, 'acier': 215, 'papier-kraft': 195, 'polystyrene-expanse': 175, 'pet': 155, 'etiquettes-papier': 135 },
      { date: '2024-08', MPA: 380, MPI: 340, 'farine-ble': 360, 'sucre': 350, 'sel': 420, 'lait': 390, 'beurre': 300, 'huile': 310, 'oeufs': 290, 'levure': 280, 'amidon-mais': 285, 'gelatine': 278, 'presure': 282, 'ferments-lactiques': 288, 'creme-fraiche': 292, 'carton-ondule': 335, 'polypropylene': 305, 'polyethylene': 282, 'aluminium': 260, 'verre': 240, 'acier': 220, 'papier-kraft': 200, 'polystyrene-expanse': 180, 'pet': 160, 'etiquettes-papier': 140 },
      { date: '2025-01', MPA: 400, MPI: 320, 'farine-ble': 380, 'sucre': 370, 'sel': 430, 'lait': 400, 'beurre': 310, 'huile': 320, 'oeufs': 300, 'levure': 290, 'amidon-mais': 295, 'gelatine': 288, 'presure': 292, 'ferments-lactiques': 298, 'creme-fraiche': 302, 'carton-ondule': 340, 'polypropylene': 310, 'polyethylene': 287, 'aluminium': 265, 'verre': 245, 'acier': 223, 'papier-kraft': 203, 'polystyrene-expanse': 183, 'pet': 162, 'etiquettes-papier': 142 },
      { date: '2025-02', MPA: 380, MPI: 290, 'farine-ble': 365, 'sucre': 360, 'sel': 415, 'lait': 385, 'beurre': 295, 'huile': 305, 'oeufs': 285, 'levure': 275, 'amidon-mais': 280, 'gelatine': 273, 'presure': 277, 'ferments-lactiques': 283, 'creme-fraiche': 287, 'carton-ondule': 333, 'polypropylene': 303, 'polyethylene': 280, 'aluminium': 258, 'verre': 238, 'acier': 218, 'papier-kraft': 198, 'polystyrene-expanse': 178, 'pet': 158, 'etiquettes-papier': 138 },
      { date: '2025-03', MPA: 410, MPI: 280, 'farine-ble': 390, 'sucre': 380, 'sel': 435, 'lait': 405, 'beurre': 315, 'huile': 325, 'oeufs': 305, 'levure': 295, 'amidon-mais': 300, 'gelatine': 293, 'presure': 297, 'ferments-lactiques': 303, 'creme-fraiche': 307, 'carton-ondule': 325, 'polypropylene': 295, 'polyethylene': 273, 'aluminium': 252, 'verre': 232, 'acier': 212, 'papier-kraft': 192, 'polystyrene-expanse': 172, 'pet': 152, 'etiquettes-papier': 132 },
      { date: '2025-04', MPA: 430, MPI: 310, 'farine-ble': 405, 'sucre': 395, 'sel': 445, 'lait': 415, 'beurre': 325, 'huile': 335, 'oeufs': 315, 'levure': 305, 'amidon-mais': 310, 'gelatine': 303, 'presure': 307, 'ferments-lactiques': 313, 'creme-fraiche': 317, 'carton-ondule': 338, 'polypropylene': 308, 'polyethylene': 285, 'aluminium': 263, 'verre': 243, 'acier': 221, 'papier-kraft': 201, 'polystyrene-expanse': 181, 'pet': 159, 'etiquettes-papier': 139 },
    ]

    // Convertir les valeurs MP en €/kg (sauf date, MPA, MPI)
    const convertedData = baseData.map(item => {
      const converted: any = { date: item.date, MPA: item.MPA, MPI: item.MPI }
      Object.keys(item).forEach(key => {
        if (key !== 'date' && key !== 'MPA' && key !== 'MPI') {
          converted[key] = (item[key as keyof typeof item] as number) / MP_CONVERSION_FACTOR
        }
      })
      return converted
    })

    if (base100) {
      const firstValues: Record<string, number> = {}
      Object.keys(convertedData[0]).forEach(key => {
        if (key !== 'date') {
          firstValues[key] = convertedData[0][key as keyof typeof convertedData[0]] as number
        }
      })

      return convertedData.map(item => {
        const transformed: any = { date: item.date }
        Object.keys(item).forEach(key => {
          if (key !== 'date') {
            transformed[key] = ((item[key as keyof typeof item] as number) / firstValues[key]) * 100
          }
        })
        return transformed
      })
    }

    return convertedData
  }

  // Données Recette selon sous-tab
  const getRecetteData = () => {
    switch (recetteSubTab) {
      case 'mpa':
        return [
          { name: 'Eau', code: 'HE65', percentage: 20.00 },
          { name: 'Farine de blé', code: 'FE23', percentage: 18.00 },
          { name: 'Sucre', code: 'FE23', percentage: 15.00 },
          { name: 'Sel', code: 'FR34', percentage: 8.00 },
          { name: 'Lait en poudre', code: 'FR34', percentage: 7.00 },
          { name: 'Beurre', code: 'FR34', percentage: 6.50 },
          { name: 'Huile végétale', code: 'FR34', percentage: 5.50 },
          { name: 'Œufs', code: 'FR34', percentage: 5.00 },
          { name: 'Levure', code: 'FR34', percentage: 4.00 },
          { name: 'Amidon de maïs', code: 'FR34', percentage: 3.50 },
          { name: 'Gélatine', code: 'FR34', percentage: 3.00 },
          { name: 'Présure', code: 'FR34', percentage: 2.00 },
          { name: 'Ferments lactiques', code: 'FR34', percentage: 1.50 },
          { name: 'Crème fraîche', code: 'FR34', percentage: 1.00 },
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
          { name: 'Encre d&apos;impression', code: 'MP11', percentage: 2.9 },
          { name: 'Colle alimentaire', code: 'MP12', percentage: 2.1 },
          { name: 'Palettes bois', code: 'MP13', percentage: 1.5 },
          { name: 'Film étirable', code: 'MP14', percentage: 0.6 },
          { name: 'Ruban adhésif', code: 'MP15', percentage: 0.2 },
        ].sort((a, b) => b.percentage - a.percentage)
      default:
        return []
    }
  }

  // Titre du graphique selon sous-tab
  const getChartTitle = () => {
    switch (costSubTab) {
      case 'total':
        return 'Evolution du cours des MPA et MPI'
      case 'mpa':
        return 'Evolution du cours des MPA'
      case 'mpi':
        return 'Evolution du cours des MPI'
    }
  }

  // Store de simulation
  const isWindowOpen = useSimulationStore((state) => state.isWindowOpen)
  const initializeFromExistingData = useSimulationStore((state) => state.initializeFromExistingData)

  // Préparer les données de simulation (mémorisées)
  const simulationMPValues = useMemo(() => {
    try {
      const chartData = getChartData()
      const heatmapData = getCostHeatmapData()
      const recetteData = getRecetteData()
      if (!chartData || !heatmapData) return []
      return extractMPValuesFromChartData(chartData, heatmapData, recetteData)
    } catch (error) {
      console.error('Error extracting MP values:', error)
      return []
    }
  }, [costSubTab, base100, currentItem, recetteSubTab])

  const simulationMPVolumes = useMemo(() => {
    try {
      const recetteData = getRecetteData()
      if (!recetteData) return []
      return extractMPVolumesFromRecetteData(recetteData)
    } catch (error) {
      console.error('Error extracting MP volumes:', error)
      return []
    }
  }, [recetteSubTab])

  // Initialiser les données de simulation quand la fenêtre s'ouvre
  // On attend que les deux listes aient des données avant d'initialiser
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    console.log('Simulation useEffect - isWindowOpen:', isWindowOpen, 'hasInitialized:', hasInitializedRef.current, 'mpValues:', simulationMPValues.length, 'mpVolumes:', simulationMPVolumes.length)
    if (isWindowOpen && !hasInitializedRef.current) {
      // Initialiser seulement quand les deux listes sont disponibles
      if (simulationMPValues.length > 0 && simulationMPVolumes.length > 0) {
        console.log('Initializing simulation data with:', simulationMPValues, simulationMPVolumes)
        initializeFromExistingData(simulationMPValues, simulationMPVolumes)
        hasInitializedRef.current = true
      }
    }
    if (!isWindowOpen) {
      hasInitializedRef.current = false
    }
  }, [isWindowOpen, simulationMPValues, simulationMPVolumes, initializeFromExistingData])

  // Calculer les sous-niveaux pour les liens de navigation
  const navigationLinks = useMemo(() => {
    if (!currentItem) return []

    const filterKey = perimetreToFilterKey[perimetre]
    const itemFilters: Record<string, string> = {}
    if (filterKey) {
      itemFilters[filterKey] = currentItem.label
    }

    const counts = calculateSubLevelCounts(perimetre, currentItem, itemFilters)

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        perimetre: level as PerimetreType,
        count,
        href: `/analyse-valeur?perimetre=${encodeURIComponent(level)}${filterKey ? `&${filterKey}=${encodeURIComponent(currentItem.label)}` : ''}`
      }))
  }, [currentItem, perimetre])

  // Données KPI (7 cards de base + cartes produit séparées)
  const kpiCards = useMemo(() => {
    if (!currentItem) return []

    const baseCards = [
      {
        label: "Volume",
        value: currentItem.volume?.[volumeUnit]?.['CAD']?.valeur || 'N/A',
        evolution: currentItem.volume?.[volumeUnit]?.['CAD']?.evolution || 'N/A',
        tooltip: `Volume total en ${volumeUnit === 'UVC' ? 'unités de vente consommateur' : 'tonnes'}`,
        unit: volumeUnit,
        onToggleUnit: toggleVolumeUnit
      },
      {
        label: "MP",
        value: currentItem.mpa.valeur,
        evolution: currentItem.mpa.evolution,
        tooltip: "Marge en pourcentage des achats"
      },
      {
        label: "Emballage",
        value: currentItem.mpi.valeur,
        evolution: currentItem.mpi.evolution,
        tooltip: "Marge en pourcentage des ventes (indice)"
      },
      {
        label: "CA",
        value: currentItem.evoPa.valeur,
        evolution: currentItem.evoPa.evolution,
        tooltip: "Prix d'achat total"
      },
      {
        label: "CA théorique",
        value: currentItem.coutTheorique.valeur,
        evolution: currentItem.coutTheorique.evolution,
        tooltip: "Prix d'achat théorique total calculé"
      },
      {
        label: "Opportunité",
        value: currentItem.opportunites.valeur,
        evolution: currentItem.opportunites.evolution,
        tooltip: "Opportunité totale d'optimisation identifiée"
      }
    ]

    return baseCards
  }, [currentItem, perimetre, volumeUnit, toggleVolumeUnit])

  // Cartes spécifiques au produit (PA unitaire, PV, marges)
  const productCards = useMemo(() => {
    if (perimetre !== "Produit" || !currentItem) return []

    const cards = []

    // PA unitaire
    if (currentItem.paUnitaire) {
      cards.push({
        label: "PA",
        value: currentItem.paUnitaire.valeur,
        evolution: currentItem.paUnitaire.evolution,
        tooltip: "Prix d'achat unitaire du produit"
      })
    }

    // PA théorique unitaire
    if (currentItem.coutTheoriqueUnitaire) {
      cards.push({
        label: "PA théorique",
        value: currentItem.coutTheoriqueUnitaire.valeur,
        evolution: currentItem.coutTheoriqueUnitaire.evolution,
        tooltip: "Prix d'achat théorique unitaire - Si inférieur au PA, il y a une opportunité"
      })
    }

    // Opportunité = PA - PA théorique (si négatif, afficher 0.00€)
    if (currentItem.paUnitaire && currentItem.coutTheoriqueUnitaire) {
      const paTheorique = parseFloat(currentItem.coutTheoriqueUnitaire.valeur.replace(/[^0-9.-]/g, ''));
      const pa = parseFloat(currentItem.paUnitaire.valeur.replace(/[^0-9.-]/g, ''));
      const opportunite = Math.max(0, pa - paTheorique);

      const paTheoriqueEvol = parseFloat(currentItem.coutTheoriqueUnitaire.evolution.replace(/[^0-9.-]/g, ''));
      const paEvol = parseFloat(currentItem.paUnitaire.evolution.replace(/[^0-9.-]/g, ''));
      const opportuniteEvol = paEvol - paTheoriqueEvol;

      cards.push({
        label: "Opportunité",
        value: `${opportunite.toFixed(2)}€`,
        evolution: `${opportuniteEvol >= 0 ? '+' : ''}${opportuniteEvol.toFixed(2)}%`,
        tooltip: "Opportunité d'économie (PA - PA théorique)"
      })
    }

    // PV et Marge PV
    if (currentItem.pv) {
      cards.push({
        label: "PV",
        value: currentItem.pv.valeur,
        evolution: currentItem.pv.evolution,
        tooltip: "Prix de vente Carrefour"
      })
    }
    if (currentItem.margePvc) {
      cards.push({
        label: "Marge PV",
        value: currentItem.margePvc.valeur,
        evolution: currentItem.margePvc.evolution,
        tooltip: "Marge entre PV Carrefour et PA unitaire"
      })
    }

    // PV LCL et Marge PV LCL
    if (currentItem.pvLeclerc) {
      cards.push({
        label: "PV LCL",
        value: currentItem.pvLeclerc.valeur,
        evolution: currentItem.pvLeclerc.evolution,
        tooltip: "Prix de vente Leclerc"
      })
    }
    if (currentItem.margePvLcl) {
      cards.push({
        label: "Marge PV LCL",
        value: currentItem.margePvLcl.valeur,
        evolution: currentItem.margePvLcl.evolution,
        tooltip: "Marge entre PV Leclerc et PA unitaire"
      })
    }
    if (currentItem.margeMoyenneCategorielle) {
      cards.push({
        label: "Marge moyenne catégorielle",
        value: currentItem.margeMoyenneCategorielle,
        evolution: undefined,
        tooltip: "Marge moyenne de la catégorie"
      })
    }

    return cards
  }, [currentItem, perimetre])

  // Titre dynamique
  const pageTitle = useMemo(() => {
    const perimetreMap: Record<string, string> = {
      "Marché": "du marché",
      "Marché détaillé": "du marché détaillé",
      "Catégorie": "de la catégorie",
      "Groupe Famille": "du groupe famille",
      "Famille": "de la famille",
      "Sous Famille": "de la sous famille",
      "Produit": "du produit",
      "Fournisseur": "du fournisseur",
      "Portefeuille": "du portefeuille"
    }

    return `Vue d'ensemble ${perimetreMap[perimetre] || ''} ${label}`
  }, [perimetre, label])

  // Déterminer quelles heatmaps afficher (pas celle du type actuel)
  const shouldShowPaysHeatmap = perimetre !== "Pays"
  const shouldShowFournisseurHeatmap = perimetre !== "Fournisseur"

  // Données pour heatmap Pays (filtré par l'élément actuel si applicable)
  const paysHeatmapData = useMemo(() => {
    const data = getPerimetreData("Pays")
    const totalCA = data.reduce((sum, item) => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      return sum + caValue
    }, 0)

    return data.map(item => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      const percentage = ((caValue / totalCA) * 100).toFixed(2)

      return {
        label: item.label,
        percentage: `${percentage}%`,
        evolution: item.evoPa.evolution,
        href: `/detail?perimetre=Pays&label=${encodeURIComponent(item.label)}`
      }
    }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
  }, [])

  // Données pour heatmap Fournisseur (top 3)
  const fournisseurHeatmapData = useMemo(() => {
    const data = getPerimetreData("Fournisseur")
    const totalCA = data.reduce((sum, item) => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      return sum + caValue
    }, 0)

    return data.slice(0, 3).map(item => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      const percentage = ((caValue / totalCA) * 100).toFixed(2)

      return {
        label: item.label,
        percentage: `${percentage}%`,
        evolution: item.evoPa.evolution,
        href: `/detail?perimetre=Fournisseur&label=${encodeURIComponent(item.label)}`
      }
    })
  }, [])

  // ============================================
  // FONCTIONS - Structure de coût
  // ============================================

  // Fonction pour réinitialiser la sélection des séries
  const unselectAll = () => {
    // Cette fonction permettrait de déselectionner toutes les séries du graphique
    // Pour l'instant, elle est vide car la gestion des séries sélectionnées
    // n'est pas encore implémentée
  }

  // Données tableau selon sous-tab
  const getTableData = () => {
    switch (costSubTab) {
      case 'total':
        return [
          {
            id: 'mp',
            name: 'MP',
            volume: '258 UVC',
            volumeUVC: '258 UVC',
            partVolume: '49.25%',
            cost: '0.123M€',
            partCost: '48.21%',
            evolution: '+3.20%',
            impact: '+2.20%'
          },
          {
            id: 'emballage',
            name: 'Emballage',
            volume: '258 UVC',
            volumeUVC: '258 UVC',
            partVolume: '50.75%',
            cost: '0.083M€',
            partCost: '27.43%',
            evolution: '-1.80%',
            impact: '-0.80%'
          },
          {
            id: 'autre',
            name: 'Autre',
            volume: '',
            volumeUVC: '',
            partVolume: '',
            cost: '0.049M€',
            partCost: '24.34%',
            evolution: '+0.00%',
            impact: ''
          },
        ]
      case 'mpa':
        return [
          { id: 'farine-ble', name: 'Farine de blé', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '34.34%', evolution: '+0.91%', impactTotal: '+0.41%' },
          { id: 'sucre', name: 'Sucre', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.31%' },
          { id: 'sel', name: 'Sel', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.23%' },
          { id: 'lait-poudre', name: 'Lait en poudre', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.1%' },
          { id: 'beurre', name: 'Beurre', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.21%' },
          { id: 'huile-vegetale', name: 'Huile végétale', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.21%' },
          { id: 'oeufs', name: 'Oeufs', subLabel: 'HRTZERF', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '20.15%', cost: '0.035M€', partCostTotal: '22.34%', partCostMPA: '22.34%', evolution: '+0.91%', impactTotal: '+0.21%' },
          { id: 'levure', name: 'Levure', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
          { id: 'amidon-mais', name: 'Amidon de maïs', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
          { id: 'gelatine', name: 'Gélatine', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
          { id: 'presure', name: 'Présure', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
          { id: 'ferments-lactiques', name: 'Ferments lactiques', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
          { id: 'creme-fraiche', name: 'Crème fraîche', subLabel: 'FR34', volume: '258 UVC', volumeUVC: '258 UVC', partVolume: '5.46%', cost: '0.035M€', partCostTotal: '5.46%', partCostMPA: '5.46%', evolution: '+0.91%', impactTotal: '+0.05%' },
        ]
      case 'mpi':
        return [
          { id: 'carton-ondule', name: 'Carton ondulé', subLabel: 'MP04', volume: '4850 UVC', volumeUVC: '4850 UVC', partVolume: '18.5%', cost: '0.067M€', partCostTotal: '22.34%', partCostMPI: '33.5%', evolution: '+1.20%', impactTotal: '+0.27%' },
          { id: 'polypropylene', name: 'Polypropylène', subLabel: 'MP03', volume: '3720 UVC', volumeUVC: '3720 UVC', partVolume: '14.2%', cost: '0.049M€', partCostTotal: '16.45%', partCostMPI: '24.68%', evolution: '-2.10%', impactTotal: '-0.38%' },
          { id: 'polyethylene', name: 'Polyéthylène', subLabel: 'MP03', volume: '3350 UVC', volumeUVC: '3350 UVC', partVolume: '12.8%', cost: '0.043M€', partCostTotal: '14.28%', partCostMPI: '21.42%', evolution: '+0.85%', impactTotal: '+0.12%' },
          { id: 'aluminium', name: 'Aluminium', subLabel: 'MP03', volume: '2695 UVC', volumeUVC: '2695 UVC', partVolume: '10.3%', cost: '0.036M€', partCostTotal: '11.92%', partCostMPI: '17.88%', evolution: '+3.15%', impactTotal: '+0.38%' },
          { id: 'verre', name: 'Verre', subLabel: 'MP05', volume: '2275 UVC', volumeUVC: '2275 UVC', partVolume: '8.7%', cost: '0.029M€', partCostTotal: '9.67%', partCostMPI: '14.51%', evolution: '-1.45%', impactTotal: '-0.14%' },
          { id: 'acier', name: 'Acier', subLabel: 'MP05', volume: '2070 UVC', volumeUVC: '2070 UVC', partVolume: '7.9%', cost: '0.026M€', partCostTotal: '8.53%', partCostMPI: '12.80%', evolution: '+2.70%', impactTotal: '+0.23%' },
          { id: 'papier-kraft', name: 'Papier kraft', subLabel: 'MP07', volume: '1700 UVC', volumeUVC: '1700 UVC', partVolume: '6.5%', cost: '0.022M€', partCostTotal: '7.21%', partCostMPI: '10.82%', evolution: '-0.65%', impactTotal: '-0.05%' },
          { id: 'polystyrene-expanse', name: 'Polystyrène expansé', subLabel: 'MP08', volume: '1415 UVC', volumeUVC: '1415 UVC', partVolume: '5.4%', cost: '0.015M€', partCostTotal: '4.89%', partCostMPI: '7.34%', evolution: '+1.90%', impactTotal: '+0.09%' },
          { id: 'pet', name: 'PET', subLabel: 'MP09', volume: '1255 UVC', volumeUVC: '1255 UVC', partVolume: '4.8%', cost: '0.008M€', partCostTotal: '2.76%', partCostMPI: '4.14%', evolution: '-3.40%', impactTotal: '-0.09%' },
          { id: 'etiquettes-papier', name: 'Étiquettes papier', subLabel: 'MP10', volume: '940 UVC', volumeUVC: '940 UVC', partVolume: '3.6%', cost: '0.006M€', partCostTotal: '1.95%', partCostMPI: '2.93%', evolution: '+0.55%', impactTotal: '+0.01%' },
          { id: 'bouchons-plastique', name: 'Bouchons plastique', subLabel: 'MP11', volume: '760 UVC', volumeUVC: '760 UVC', partVolume: '2.9%', cost: '0.005M€', partCostTotal: '1.67%', partCostMPI: '2.51%', evolution: '+1.25%', impactTotal: '+0.02%' },
          { id: 'film-etirable', name: 'Film étirable', subLabel: 'MP12', volume: '602 UVC', volumeUVC: '602 UVC', partVolume: '2.3%', cost: '0.004M€', partCostTotal: '1.42%', partCostMPI: '2.13%', evolution: '-0.65%', impactTotal: '-0.01%' },
          { id: 'encres-impression', name: 'Encres d\'impression', subLabel: 'MP13', volume: '470 UVC', volumeUVC: '470 UVC', partVolume: '1.8%', cost: '0.004M€', partCostTotal: '1.28%', partCostMPI: '1.92%', evolution: '+2.10%', impactTotal: '+0.03%' },
          { id: 'colles-adhesifs', name: 'Colles et adhésifs', subLabel: 'MP14', volume: '392 UVC', volumeUVC: '392 UVC', partVolume: '1.5%', cost: '0.003M€', partCostTotal: '1.15%', partCostMPI: '1.73%', evolution: '+0.75%', impactTotal: '+0.01%' },
          { id: 'ruban-adhesif', name: 'Ruban adhésif', subLabel: 'MP15', volume: '197 UVC', volumeUVC: '197 UVC', partVolume: '0.6%', cost: '0.003M€', partCostTotal: '0.98%', partCostMPI: '1.47%', evolution: '-1.20%', impactTotal: '-0.01%' },
          { id: 'palettes-bois', name: 'Palettes bois', subLabel: 'MP16', volume: '392 UVC', volumeUVC: '392 UVC', partVolume: '1.5%', cost: '0.002M€', partCostTotal: '0.85%', partCostMPI: '1.28%', evolution: '+1.60%', impactTotal: '+0.01%' },
          { id: 'housses-thermoretractables', name: 'Housses thermorétractables', subLabel: 'MP17', volume: '313 UVC', volumeUVC: '313 UVC', partVolume: '1.2%', cost: '0.002M€', partCostTotal: '0.72%', partCostMPI: '1.08%', evolution: '-0.45%', impactTotal: '-0.00%' },
          { id: 'sachets-zip', name: 'Sachets zip', subLabel: 'MP18', volume: '235 UVC', volumeUVC: '235 UVC', partVolume: '0.9%', cost: '0.002M€', partCostTotal: '0.58%', partCostMPI: '0.87%', evolution: '+0.90%', impactTotal: '+0.01%' },
          { id: 'capsules-metal', name: 'Capsules métal', subLabel: 'MP19', volume: '183 UVC', volumeUVC: '183 UVC', partVolume: '0.7%', cost: '0.001M€', partCostTotal: '0.45%', partCostMPI: '0.68%', evolution: '+1.35%', impactTotal: '+0.01%' },
          { id: 'opercules-aluminium', name: 'Opercules aluminium', subLabel: 'MP20', volume: '130 UVC', volumeUVC: '130 UVC', partVolume: '0.5%', cost: '0.001M€', partCostTotal: '0.32%', partCostMPI: '0.48%', evolution: '-0.80%', impactTotal: '-0.00%' },
        ]
    }
  }

  // Données Evolution Prix - Graphique
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

  // Calcul des évolutions dynamiques basées sur la période sélectionnée (Brush)
  const evolutionCardData = useMemo(() => {
    const chartData = getEvolutionChartData()
    const { startIndex, endIndex } = evolutionDateRange

    if (startIndex === endIndex || !chartData[startIndex] || !chartData[endIndex]) {
      return null
    }

    const startData = chartData[startIndex]
    const endData = chartData[endIndex]

    const calculateEvolution = (start: number, end: number) => {
      if (start === 0) return '+0.0%'
      const evolution = ((end - start) / start) * 100
      return `${evolution >= 0 ? '+' : ''}${evolution.toFixed(1)}%`
    }

    const result: any = {
      PA: calculateEvolution(startData.PA, endData.PA),
      'PA théorique': calculateEvolution(startData['cout-theorique'], endData['cout-theorique'])
    }

    if (perimetre === "Produit") {
      result['PV'] = calculateEvolution(startData.PV, endData.PV)
      result['PV LCL'] = calculateEvolution(startData['PV-LCL'], endData['PV-LCL'])
      result['Marge PV'] = calculateEvolution(startData['Marge-PV'], endData['Marge-PV'])
      result['Marge PV LCL'] = calculateEvolution(startData['Marge-PV-LCL'], endData['Marge-PV-LCL'])
    }

    return result
  }, [evolutionDateRange, perimetre, evolutionBase100])

  // Données Evolution Prix - Tableau
  const getEvolutionTableData = () => {
    const baseData = getEvolutionChartData()

    const headers = baseData.map(d => {
      const [year, month] = d.date.split('-')
      if (evolutionPeriod === 'mois') return `${month}/${year.slice(2)}`
      if (evolutionPeriod === 'semaine') return `S${month}/${year.slice(2)}`
      return `01/${month}/${year.slice(2)}`
    })

    // Different rows for Produit vs other perimetres
    if (perimetre === "Produit") {
      return {
        headers,
        rows: [
          {
            label: "PA",
            values: baseData.map(d => evolutionBase100 ? d.PA.toFixed(1) : d.PA.toString())
          },
          {
            label: 'PA théorique',
            values: baseData.map(d => evolutionBase100 ? d['cout-theorique'].toFixed(1) : d['cout-theorique'].toString())
          },
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
        ]
      }
    }

    // For other perimetres
    return {
      headers,
      rows: [
        {
          label: "CA",
          values: baseData.map(d => evolutionBase100 ? d.PA.toFixed(1) : d.PA.toString())
        },
        {
          label: 'CA théorique',
          values: baseData.map(d => evolutionBase100 ? d['cout-theorique'].toFixed(1) : d['cout-theorique'].toString())
        }
      ]
    }
  }

  // Fonction de tri du tableau
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Appliquer le tri aux données du tableau
  const getSortedTableData = () => {
    const data = getTableData()
    if (!sortConfig) return data

    return [...data].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      // Gestion des valeurs numériques (enlever % et convertir)
      const aNum = typeof aVal === 'string' && aVal.includes('%') ? parseFloat(aVal.replace('%', '')) : aVal
      const bNum = typeof bVal === 'string' && bVal.includes('%') ? parseFloat(bVal.replace('%', '')) : bVal

      if (aNum < bNum) return sortConfig.direction === 'asc' ? -1 : 1
      if (aNum > bNum) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  if (!currentItem) {
    return <div className="p-6">Élément non trouvé</div>
  }

  return (
    <main className="w-full px-[50px] py-4 relative">
      {/* Bouton Retour */}
      <Button
        variant="ghost"
        className="-ml-2 mb-2 gap-2 text-sm"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Titre + Simuler + Date */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[40px] font-bold">{label}</h1>
            {/* EAN (uniquement pour les produits) */}
            {perimetre === "Produit" && currentItem?.ean && (
              <div className="text-[14px]" style={{ color: '#454545' }}>{currentItem.ean}</div>
            )}
          </div>
          <SimulationButton />
        </div>

        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">Période</Label>
            <Button
              variant="outline"
              className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none gap-2"
            >
              01/01/2025 - 13/11/2025
              <CalendarIcon className="h-4 w-4 text-blue" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vue-ensemble" className="w-full">
        <TabsList className="flex w-auto justify-start bg-transparent p-0 h-auto gap-0">
          <TabsTrigger
            value="vue-ensemble"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] text-black font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4 hover:text-black hover:font-medium focus-visible:ring-0 transition-none"
          >
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="structure-cout"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] text-black font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4 hover:text-black hover:font-medium focus-visible:ring-0 transition-none"
          >
            Structure de coût
          </TabsTrigger>
          <TabsTrigger
            value="recette"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] text-black font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4 hover:text-black hover:font-medium focus-visible:ring-0 transition-none"
          >
            Recette
          </TabsTrigger>
          <TabsTrigger
            value="evolution-prix"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] text-black font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4 hover:text-black hover:font-medium focus-visible:ring-0 transition-none"
          >
            Évolution prix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vue-ensemble" className="space-y-6 mt-10">
          {/* Titre et liens navigation */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-[20px] font-medium">
              {getVueEnsembleTitle(perimetre, label)}
            </h2>
            {navigationLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-end">
                {navigationLinks.map((link) => (
                  <Link key={link.perimetre} href={link.href}>
                    <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                      {link.count} {perimetreAbbreviations[link.perimetre]}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 6 Cards KPI de base */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {kpiCards.map((card) => {
              const isPositive = card.evolution?.startsWith('+')
              // Logique inversée pour certaines métriques
              const isInversed = ["MP", "Emballage", "CA", "CA théorique", "Opportunité"].includes(card.label)
              const color = isInversed
                ? (isPositive ? 'text-red-600' : 'text-green-600')
                : (isPositive ? 'text-green-600' : 'text-red-600')

              const hasMode = false
              const hasUnit = card.label === "Volume"

              const displayLabel = card.label

              return (
                <Card key={card.label} className="p-4 rounded shadow-none">
                  <div className="flex items-center gap-2 mb-3">
                    {hasMode || hasUnit ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-sm font-medium">{displayLabel}</span>
                        {hasUnit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              card.onToggleUnit?.()
                            }}
                            className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                          >
                            {card.unit} <SwitchIcon className="w-4 h-3.5" />
                          </button>
                        )}
                        {hasMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              card.onToggleMode?.()
                            }}
                            className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                          >
                            {card.mode} <SwitchIcon className="w-4 h-3.5" />
                          </button>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-[#121212]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{card.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{displayLabel}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-[#121212]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{card.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                  <div className="text-2xl font-bold mb-1 flex items-center">
                    {card.value}
                    {card.label !== "Volume" && <SimulationTag seed={`kpi-${card.label}`} isOpportunity={card.label === "Opportunité"} />}
                  </div>
                  {card.evolution && (
                    <p className={`text-[16px] ${color}`}>
                      {card.evolution}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Cards KPI produit (PA, PA théorique, Opportunité, PV, PV Leclerc, marges) */}
          {perimetre === "Produit" && productCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {productCards.map((card) => {
                const isPositive = card.evolution?.startsWith('+')
                // Opportunité toujours en vert
                const isOpportunity = card.label === "Opportunité"
                // Logique inversée pour PA, PA théorique et marges
                const isInversed = ["PA", "PA théorique", "Marge PV", "Marge PV LCL", "Marge moyenne catégorielle"].includes(card.label)

                let color = 'text-green-600'
                if (isOpportunity) {
                  color = 'text-green-600'
                } else if (isInversed) {
                  color = isPositive ? 'text-red-600' : 'text-green-600'
                } else {
                  color = isPositive ? 'text-green-600' : 'text-red-600'
                }

                return (
                  <Card key={card.label} className="p-4 rounded shadow-none">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium">{card.label}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-[#121212]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{card.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-2xl font-bold flex items-center">
                        {card.value}
                        <SimulationTag seed={`product-${card.label}`} isOpportunity={card.label === "Opportunité"} />
                      </div>
                      {card.label === "Marge moyenne catégorielle" && (
                        <Pencil className="w-4 h-4 text-[#0970E6]" />
                      )}
                    </div>
                    {card.evolution && (
                      <p className={`text-[16px] ${color}`}>
                        {card.evolution}
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* 2 Blocs Heatmap côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Bloc Gauche - Répartition PA par pays (conditionnel) */}
            {shouldShowPaysHeatmap && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">Répartition PA par pays</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Répartition du chiffre d&apos;affaires par pays</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="rounded overflow-hidden">
                  <div className="flex gap-1 h-[300px]">
                    <HeatmapRect
                      label={paysHeatmapData[0].label}
                      percentage={paysHeatmapData[0].percentage}
                      evolution={paysHeatmapData[0].evolution}
                      color={getColorFromEvolution(paysHeatmapData[0].evolution)}
                      className="flex-[34] h-full"
                      type="total"
                      totalPA={currentItem.evoPa.valeur}
                      lastUpdate="12/11/25"
                    />
                    <HeatmapRect
                      label={paysHeatmapData[1].label}
                      percentage={paysHeatmapData[1].percentage}
                      evolution={paysHeatmapData[1].evolution}
                      color={getColorFromEvolution(paysHeatmapData[1].evolution)}
                      className="flex-[25] h-full"
                      type="total"
                      totalPA={currentItem.evoPa.valeur}
                      lastUpdate="12/11/25"
                    />
                    <div className="flex-[41] flex flex-col gap-1">
                      <HeatmapRect
                        label={paysHeatmapData[2].label}
                        percentage={paysHeatmapData[2].percentage}
                        evolution={paysHeatmapData[2].evolution}
                        color={getColorFromEvolution(paysHeatmapData[2].evolution)}
                        className="flex-[14] w-full"
                        type="total"
                        totalPA={currentItem.evoPa.valeur}
                        lastUpdate="12/11/25"
                      />
                      <div className="flex-[27] flex gap-1">
                        <HeatmapRect
                          label={paysHeatmapData[3].label}
                          percentage={paysHeatmapData[3].percentage}
                          evolution={paysHeatmapData[3].evolution}
                          color={getColorFromEvolution(paysHeatmapData[3].evolution)}
                          className="flex-[8] h-full"
                          type="total"
                          totalPA={currentItem.evoPa.valeur}
                          lastUpdate="12/11/25"
                        />
                        <HeatmapRect
                          label={paysHeatmapData[4].label}
                          percentage={paysHeatmapData[4].percentage}
                          evolution={paysHeatmapData[4].evolution}
                          color={getColorFromEvolution(paysHeatmapData[4].evolution)}
                          className="flex-[4] h-full"
                          type="total"
                          totalPA={currentItem.evoPa.valeur}
                          lastUpdate="12/11/25"
                        />
                        <HeatmapRect
                          label={paysHeatmapData[5].label}
                          percentage={paysHeatmapData[5].percentage}
                          evolution={paysHeatmapData[5].evolution}
                          color={getColorFromEvolution(paysHeatmapData[5].evolution)}
                          className="flex-[2] h-full"
                          type="total"
                          totalPA={currentItem.evoPa.valeur}
                          lastUpdate="12/11/25"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bloc Droite - Répartition PA par fournisseur (conditionnel) */}
            {shouldShowFournisseurHeatmap && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">Répartition PA par fournisseur</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Répartition du CA par fournisseur</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="rounded overflow-hidden">
                  <div className="flex gap-1 h-[300px]">
                    <HeatmapRect
                      label={fournisseurHeatmapData[0].label}
                      percentage={fournisseurHeatmapData[0].percentage}
                      evolution={fournisseurHeatmapData[0].evolution}
                      color={getColorFromEvolution(fournisseurHeatmapData[0].evolution)}
                      className="flex-[21] h-full"
                      type="total"
                      totalPA={currentItem.evoPa.valeur}
                      lastUpdate="12/11/25"
                    />
                    <HeatmapRect
                      label={fournisseurHeatmapData[1].label}
                      percentage={fournisseurHeatmapData[1].percentage}
                      evolution={fournisseurHeatmapData[1].evolution}
                      color={getColorFromEvolution(fournisseurHeatmapData[1].evolution)}
                      className="flex-[19] h-full"
                      type="total"
                      totalPA={currentItem.evoPa.valeur}
                      lastUpdate="12/11/25"
                    />
                    <HeatmapRect
                      label={fournisseurHeatmapData[2].label}
                      percentage={fournisseurHeatmapData[2].percentage}
                      evolution={fournisseurHeatmapData[2].evolution}
                      color={getColorFromEvolution(fournisseurHeatmapData[2].evolution)}
                      className="flex-[8.5] h-full"
                      type="total"
                      totalPA={currentItem.evoPa.valeur}
                      lastUpdate="12/11/25"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </TabsContent>

        {/* Tab Structure de coût */}
        <TabsContent value="structure-cout" className="space-y-6 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] font-medium">
              {costSubTab === 'total' && 'Répartition en valeur des MP et Emballage'}
              {costSubTab === 'mpa' && 'Répartition en valeur des MP'}
              {costSubTab === 'mpi' && 'Répartition en valeur des emballages'}
            </h2>
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

          <div className="flex gap-0 w-fit">
            <button
              onClick={() => setCostSubTab('total')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'total' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
            >
              Total
            </button>
            <button
              onClick={() => setCostSubTab('mpa')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpa' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
            >
              MP
            </button>
            <button
              onClick={() => setCostSubTab('mpi')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpi' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
            >
              Emballage
            </button>
          </div>

          <div className="space-y-12 !mt-4">
              {/* Heatmap */}
              <div>
                <div className="rounded overflow-hidden">
                  {(() => {
                    const heatmapData = getCostHeatmapData()

                    if (heatmapData.layout === 'horizontal') {
                      // Layout Total : horizontal simple
                      return (
                        <div className="flex gap-1 h-[300px]">
                          {heatmapData.items.map((item, idx) => (
                            <div key={idx} style={{ flex: parseFloat(item.percentage) }} className="h-full">
                              <HeatmapRect
                                label={item.label}
                                percentage={item.percentage}
                                evolution={item.evolution}
                                color={item.color}
                                className="h-full"
                                href={item.href}
                                type={heatmapData.type}
                                totalPA={currentItem.evoPa.valeur}
                                lastUpdate="12/11/25"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    } else if (heatmapData.layout === 'complex-mpa') {
                      // Layout MPA : grid complexe (du plus grand au plus petit)
                      const items = heatmapData.items
                      return (
                        <div className="flex gap-1 h-[300px]">
                          {/* Farine (plus grand - gauche) */}
                          <HeatmapRect
                            label={items[0].label}
                            percentage={items[0].percentage}
                            evolution={items[0].evolution}
                            color={items[0].color}
                            className="flex-1 h-full"
                            href={items[0].href}
                            type={heatmapData.type}
                            categoryPercentage={items[0].categoryPercentage}
                            totalPA={currentItem.evoPa.valeur}
                            lastUpdate="12/11/25"
                          />
                          {/* Sucre (deuxième plus grand - centre) */}
                          <HeatmapRect
                            label={items[1].label}
                            percentage={items[1].percentage}
                            evolution={items[1].evolution}
                            color={items[1].color}
                            className="w-[30%] h-full"
                            href={items[1].href}
                            type={heatmapData.type}
                            categoryPercentage={items[1].categoryPercentage}
                            totalPA={currentItem.evoPa.valeur}
                            lastUpdate="12/11/25"
                          />
                          {/* Colonne droite avec Sel, Lait, etc. (plus petits) */}
                          <div className="w-[28%] flex flex-col gap-1">
                            {/* Ligne du haut avec Sel et Lait */}
                            <div className="flex gap-1 h-[40%]">
                              <HeatmapRect
                                label={items[2].label}
                                percentage={items[2].percentage}
                                evolution={items[2].evolution}
                                color={items[2].color}
                                className="flex-[2] h-full"
                                href={items[2].href}
                                type={heatmapData.type}
                                categoryPercentage={items[2].categoryPercentage}
                                totalPA={currentItem.evoPa.valeur}
                                lastUpdate="12/11/25"
                              />
                              <HeatmapRect
                                label={items[3].label}
                                percentage={items[3].percentage}
                                evolution={items[3].evolution}
                                color={items[3].color}
                                className="flex-[1] h-full"
                                href={items[3].href}
                                type={heatmapData.type}
                                categoryPercentage={items[3].categoryPercentage}
                                totalPA={currentItem.evoPa.valeur}
                                lastUpdate="12/11/25"
                              />
                            </div>
                            {/* Ligne du bas avec Beurre, Huile, Oeufs */}
                            <div className="flex gap-1 flex-1">
                              <HeatmapRect
                                label={items[4].label}
                                percentage={items[4].percentage}
                                evolution={items[4].evolution}
                                color={items[4].color}
                                className="flex-1 h-full"
                                href={items[4].href}
                                type={heatmapData.type}
                                categoryPercentage={items[4].categoryPercentage}
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
                                lastUpdate="12/11/25"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    } else if (heatmapData.layout === 'complex-mpi') {
                      // Layout MPI : 10 emballages en grille complexe
                      const items = heatmapData.items
                      return (
                        <div className="flex gap-1 h-[300px]">
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
                            totalPA={currentItem.evoPa.valeur}
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
                            totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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
                                totalPA={currentItem.evoPa.valeur}
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

              {/* Graphique avec légendes */}
              <div>
                {/* Frame avec border */}
                <div>
                  {/* Titre et contrôles alignés */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-medium">{getChartTitle()}</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-[#121212]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Évolution temporelle des coûts</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={base100} onCheckedChange={setBase100} />
                        <Label>Base 100</Label>
                      </div>
                      <Button variant="ghost" size="sm" className="p-0">
                        <Download className="text-[#0970E6]" width={24} height={24} />
                      </Button>
                    </div>
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
                        {/* 10 emballages - 4 actifs + 6 inactifs */}
                        {showInLegend['carton-ondule'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['carton-ondule'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('carton-ondule')}
                          >
                            <CurveIcon color="#FF6B6B" className="w-[30px] h-[14px]" />
                            <span className="text-sm font-medium select-none">Carton ondulé</span>
                          </div>
                        )}
                        {showInLegend['polypropylene'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['polypropylene'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('polypropylene')}
                          >
                            <CurveIcon color="#4ECDC4" className="w-[30px] h-[14px]" />
                            <span className="text-sm font-medium select-none">Polypropylène</span>
                          </div>
                        )}
                        {showInLegend['polyethylene'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['polyethylene'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('polyethylene')}
                          >
                            <CurveIcon color="#45B7D1" className="w-[30px] h-[14px]" />
                            <span className="text-sm font-medium select-none">Polyéthylène</span>
                          </div>
                        )}
                        {showInLegend['aluminium'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['aluminium'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('aluminium')}
                          >
                            <CurveIcon color="#F7B731" className="w-[30px] h-[14px]" />
                            <span className="text-sm font-medium select-none">Aluminium</span>
                          </div>
                        )}
                        {showInLegend['verre'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['verre'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('verre')}
                          >
                            <CurveIcon color="#5F27CD" className="w-[30px] h-[14px]" />
                            <span className="text-sm select-none">Verre</span>
                          </div>
                        )}
                        {showInLegend['acier'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['acier'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('acier')}
                          >
                            <CurveIcon color="#00D2D3" className="w-[30px] h-[14px]" />
                            <span className="text-sm select-none">Acier</span>
                          </div>
                        )}
                        {showInLegend['papier-kraft'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['papier-kraft'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('papier-kraft')}
                          >
                            <CurveIcon color="#FD79A8" className="w-[30px] h-[14px]" />
                            <span className="text-sm select-none">Papier kraft</span>
                          </div>
                        )}
                        {showInLegend['polystyrene-expanse'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['polystyrene-expanse'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('polystyrene-expanse')}
                          >
                            <CurveIcon color="#A29BFE" className="w-[30px] h-[14px]" />
                            <span className="text-sm select-none">Polystyrène expansé</span>
                          </div>
                        )}
                        {showInLegend['pet'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['pet'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('pet')}
                          >
                            <CurveIcon color="#6C5CE7" className="w-[30px] h-[14px]" />
                            <span className="text-sm select-none">PET</span>
                          </div>
                        )}
                        {showInLegend['etiquettes-papier'] && (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ opacity: legendOpacity['etiquettes-papier'] ? 1 : 0.4 }}
                            onClick={() => toggleLegendOpacity('etiquettes-papier')}
                          >
                            <CurveIcon color="#FD79A8" className="w-[30px] h-[14px]" />
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
                        formatter={(value: number, name: string) => {
                          // Pour les MP individuelles (pas MPA/MPI), afficher en €/kg
                          if (name !== 'MPA' && name !== 'MPI') {
                            return `${value.toFixed(3)}€/kg`
                          }
                          return value.toFixed(3)
                        }}
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
                          {/* 10 emballages - 4 actifs (ligne continue) + 6 inactifs (ligne pointillée) */}
                          <Line type="monotone" dataKey="carton-ondule" stroke="#FF6B6B" strokeWidth={2} dot={false} hide={!legendOpacity['carton-ondule']} />
                          <Line type="monotone" dataKey="polypropylene" stroke="#4ECDC4" strokeWidth={2} dot={false} hide={!legendOpacity['polypropylene']} />
                          <Line type="monotone" dataKey="polyethylene" stroke="#45B7D1" strokeWidth={2} dot={false} hide={!legendOpacity['polyethylene']} />
                          <Line type="monotone" dataKey="aluminium" stroke="#F7B731" strokeWidth={2} dot={false} hide={!legendOpacity['aluminium']} />
                          <Line type="monotone" dataKey="verre" stroke="#5F27CD" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['verre']} />
                          <Line type="monotone" dataKey="acier" stroke="#00D2D3" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['acier']} />
                          <Line type="monotone" dataKey="papier-kraft" stroke="#FD79A8" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['papier-kraft']} />
                          <Line type="monotone" dataKey="polystyrene-expanse" stroke="#A29BFE" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['polystyrene-expanse']} />
                          <Line type="monotone" dataKey="pet" stroke="#6C5CE7" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['pet']} />
                          <Line type="monotone" dataKey="etiquettes-papier" stroke="#FD79A8" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity['etiquettes-papier']} />
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
              </div>

              {/* Tableau */}
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

                <div className="overflow-hidden rounded-lg border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100 w-[300px] pl-4"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Nom
                            <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                          </div>
                        </TableHead>
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort(volumeUnit === 'UVC' ? 'volumeUVC' : 'volume')}
                          >
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Volume en {volumeUnit === 'UVC' ? 'UVC (Unité de Vente Consommateur)' : 'Tonnes'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('partVolume')}
                          >
                            <div className="flex items-center gap-2">
                              Part Volume
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Part du volume dans le total</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort(volumeUnit === 'UVC' ? 'volumeUVC' : 'volume')}
                            >
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Volume en {volumeUnit === 'UVC' ? 'UVC (Unité de Vente Consommateur)' : 'Tonnes'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partVolume')}
                            >
                              <div className="flex items-center gap-2">
                                Part Volume
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du volume dans le total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                          </>
                        )}
                        {costSubTab === 'mpi' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort(volumeUnit === 'UVC' ? 'volumeUVC' : 'volume')}
                            >
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Volume en {volumeUnit === 'UVC' ? 'UVC (Unité de Vente Consommateur)' : 'Tonnes'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partVolume')}
                            >
                              <div className="flex items-center gap-2">
                                Part Volume
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du volume dans le total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                          </>
                        )}
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('cost')}
                        >
                          <div className="flex items-center gap-2">
                            Coût
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-[#121212]" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Coût total de l&apos;élément</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                          </div>
                        </TableHead>
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('partCost')}
                          >
                            <div className="flex items-center gap-2">
                              Part coût total
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Part du coût dans le total</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostTotal')}
                            >
                              <div className="flex items-center gap-2">
                                Part coût total
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du coût dans le total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostMPA')}
                            >
                              <div className="flex items-center gap-2">
                                Part coût MPA
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du coût dans les MPA</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                          </>
                        )}
                        {costSubTab === 'mpi' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostTotal')}
                            >
                              <div className="flex items-center gap-2">
                                Part coût total
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du coût dans le total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostMPI')}
                            >
                              <div className="flex items-center gap-2">
                                Part coût MPI
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-[#121212]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Part du coût dans les MPI</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                              </div>
                            </TableHead>
                          </>
                        )}
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('evolution')}
                        >
                          <div className="flex items-center gap-2">
                            Évolution
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-[#121212]" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Évolution du coût par rapport à la période précédente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                          </div>
                        </TableHead>
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('impact')}
                          >
                            <div className="flex items-center gap-2">
                              Impact sur coût total
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Impact de l&apos;évolution sur le coût total</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('impactTotal')}
                          >
                            <div className="flex items-center gap-2">
                              Impact sur coût total
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Impact de l&apos;évolution sur le coût total</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpi' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('impactTotal')}
                          >
                            <div className="flex items-center gap-2">
                              Impact sur coût total
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-[#121212]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Impact de l&apos;évolution sur le coût total</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedTableData().map((row: any, idx) => (
                        <TableRow key={row.id} className={row.indent ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}>
                          <TableCell className={`w-[300px] pl-4 ${row.isMain === false && !row.indent ? 'pl-12' : ''}`}>
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
                                {costSubTab !== 'mpa' && costSubTab !== 'mpi' && row.subLabel && (
                                  <span className="text-xs text-gray-500 ml-2">({row.subLabel})</span>
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
                          {costSubTab === 'mpi' && (
                            <>
                              <TableCell>{volumeUnit === 'UVC' ? row.volumeUVC : row.volume}</TableCell>
                              <TableCell>{row.partVolume}</TableCell>
                            </>
                          )}
                          <TableCell>
                            <span className="flex items-center">
                              {row.cost}
                              <SimulationTag seed={`table-cost-${row.id}`} />
                            </span>
                          </TableCell>
                          {costSubTab === 'total' && <TableCell>
                            <span className="flex items-center">
                              {row.partCost}
                              <SimulationTag seed={`table-partcost-${row.id}`} />
                            </span>
                          </TableCell>}
                          {costSubTab === 'mpa' && (
                            <>
                              <TableCell>
                                <span className="flex items-center">
                                  {row.partCostTotal}
                                  <SimulationTag seed={`table-partcosttotal-${row.id}`} />
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center">
                                  {row.partCostMPA}
                                  <SimulationTag seed={`table-partcostmpa-${row.id}`} />
                                </span>
                              </TableCell>
                            </>
                          )}
                          {costSubTab === 'mpi' && (
                            <>
                              <TableCell>
                                <span className="flex items-center">
                                  {row.partCostTotal}
                                  <SimulationTag seed={`table-partcosttotal-${row.id}`} />
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center">
                                  {row.partCostMPI}
                                  <SimulationTag seed={`table-partcostmpi-${row.id}`} />
                                </span>
                              </TableCell>
                            </>
                          )}
                          <TableCell className={row.evolution?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                            <span className="flex items-center">
                              {row.evolution}
                              <SimulationTag seed={`table-evol-${row.id}`} />
                            </span>
                          </TableCell>
                          {costSubTab === 'total' && (
                            <TableCell className={row.impact?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                              <span className="flex items-center">
                                {row.impact}
                                <SimulationTag seed={`table-impact-${row.id}`} />
                              </span>
                            </TableCell>
                          )}
                          {costSubTab === 'mpa' && (
                            <TableCell className={row.impactTotal?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                              <span className="flex items-center">
                                {row.impactTotal}
                                <SimulationTag seed={`table-impacttotal-${row.id}`} />
                              </span>
                            </TableCell>
                          )}
                          {costSubTab === 'mpi' && (
                            <TableCell className={row.impactTotal?.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                              <span className="flex items-center">
                                {row.impactTotal}
                                <SimulationTag seed={`table-impacttotal-${row.id}`} />
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
        </TabsContent>

        <TabsContent value="recette" className="space-y-6 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] font-medium">
              {recetteSubTab === 'mpa' && 'Répartition en volume des MP'}
              {recetteSubTab === 'mpi' && 'Répartition en volume des emballages'}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualisation de la répartition en volume des matières premières</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-0 w-fit">
              <button onClick={() => setRecetteSubTab('mpa')} className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${recetteSubTab === 'mpa' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}>
                MP
              </button>
              <button onClick={() => setRecetteSubTab('mpi')} className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${recetteSubTab === 'mpi' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}>
                Emballage
              </button>
            </div>
            <Button variant="ghost" size="icon" className="p-0">
              <Download className="text-[#0970E6]" width={24} height={24} />
            </Button>
          </div>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-3 p-0">
              {getRecetteData().map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-48 flex-shrink-0">
                    <div className="font-bold text-base">{item.name}</div>
                    <div className="font-medium text-gray-500 text-sm">{item.code}</div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-md h-8 relative overflow-hidden">
                    <div className="h-full rounded-md transition-all duration-300" style={{ width: `${item.percentage}%`, backgroundColor: '#0970E6' }} />
                  </div>
                  <div className="w-32 text-right font-bold text-base flex items-center justify-end">
                    {item.percentage.toFixed(2)}%
                    <SimulationTag mpLabel={item.name} mpType="volume" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution-prix" className="mt-10">
          <div className="space-y-6">
            {/* Card graphique */}
            <Card className="border-0 shadow-none overflow-visible">
              <CardContent className="p-0 overflow-visible">
                {/* Titre et Contrôles sur la même ligne */}
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-[20px] font-medium">
                    {getEvolutionPrixTitle(perimetre, label)}
                  </h2>
                  <div className="flex items-center gap-4">
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
                      <Label htmlFor="evolution-base100">Base 100</Label>
                      <Switch
                        id="evolution-base100"
                        checked={evolutionBase100}
                        onCheckedChange={setEvolutionBase100}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="p-0">
                      <Download className="text-[#0970E6]" width={24} height={24} />
                    </Button>
                  </div>
                </div>

                {/* Légendes centrées */}
                <div className="flex items-center justify-center gap-4 mb-2">
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

                {/* Graphique */}
                <div style={{ paddingBottom: '20px' }}>
                  <ResponsiveContainer width="100%" height={500} style={{ overflow: 'visible' }}>
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
                        />
                      )}
                      {evolutionLegendOpacity['cout-theorique'] && (
                        <Line
                          type="monotone"
                          dataKey="cout-theorique"
                          stroke="#607D8B"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {perimetre === "Produit" && evolutionLegendOpacity.PV && (
                        <Line
                          type="monotone"
                          dataKey="PV"
                          stroke="#4CAF50"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {perimetre === "Produit" && evolutionLegendOpacity['PV-LCL'] && (
                        <Line
                          type="monotone"
                          dataKey="PV-LCL"
                          stroke="#FF9800"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {perimetre === "Produit" && evolutionLegendOpacity['Marge-PV'] && (
                        <Line
                          type="monotone"
                          dataKey="Marge-PV"
                          stroke="#9C27B0"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {perimetre === "Produit" && evolutionLegendOpacity['Marge-PV-LCL'] && (
                        <Line
                          type="monotone"
                          dataKey="Marge-PV-LCL"
                          stroke="#00BCD4"
                          strokeWidth={2}
                          dot={false}
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
              </CardContent>
            </Card>

            {/* Cards KPI */}
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-medium">Pourcentage d&apos;évolution sur la période</h3>
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

              <div className={`grid grid-cols-1 gap-4 ${perimetre === "Produit" ? "md:grid-cols-6" : "md:grid-cols-2"}`}>
                {(perimetre === "Produit" ? productCards : kpiCards).filter(card =>
                  perimetre === "Produit"
                    ? ['PA', 'PA théorique', 'PV', 'PV LCL', 'Marge PV', 'Marge PV LCL'].includes(card.label)
                    : ['CA', 'CA théorique'].includes(card.label)
                ).map(card => {
                  const isPositive = card.evolution?.startsWith('+')
                  const isInversed = ["PA", "PA théorique", "CA", "CA théorique", "Marge PV", "Marge PV LCL"].includes(card.label)
                  const color = isInversed
                    ? (isPositive ? 'text-red-600' : 'text-green-600')
                    : (isPositive ? 'text-green-600' : 'text-red-600')

                  return (
                    <Card key={card.label} className="p-4 rounded shadow-none">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">{card.label}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-[#121212]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{card.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className={`text-2xl font-bold ${color} flex items-center`}>
                        {card.evolution}
                        <SimulationTag seed={`evol-${card.label}`} />
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Tableau Détail */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium">Détail</h3>
                <div className="flex items-center gap-4">
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
                    <Label htmlFor="evolution-table-base100">Base 100</Label>
                    <Switch
                      id="evolution-table-base100"
                      checked={evolutionBase100}
                      onCheckedChange={setEvolutionBase100}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="p-0">
                    <Download className="text-[#0970E6]" width={24} height={24} />
                  </Button>
                </div>
              </div>
              <Card className="border rounded-lg shadow-none">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[150px]">Période</TableHead>
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
                            <TableCell className="sticky left-0 bg-white z-10 font-bold">
                              {row.label}
                            </TableCell>
                            {row.values.map((value, colIdx) => (
                              <TableCell key={colIdx} className="text-center">
                                <span className="inline-flex items-center">
                                  {value}
                                  <SimulationTag seed={`detail-${row.label}-${colIdx}`} />
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Fenêtre de simulation */}
      <SimulationWindow
        availableMPValues={simulationMPValues}
        availableMPVolumes={simulationMPVolumes}
      />

    </main>
  )
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DetailContent />
    </Suspense>
  )
}
