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
import { ArrowLeft, CalendarIcon, Info, Pencil, X, Download } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

// Composant HeatmapRect (copié depuis app/accueil/page.tsx)
interface HeatmapRectProps {
  label: string
  percentage: string
  evolution: string
  color: string
  className?: string
  href: string
  type: 'total' | 'mpa' | 'mpi'
  categoryPercentage?: string
}

function HeatmapRect({ label, percentage, evolution, color, className, href, type, categoryPercentage }: HeatmapRectProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={`${color} ${className} p-2 flex flex-col items-center justify-center hover:opacity-90 transition-opacity cursor-pointer overflow-hidden`}
          >
            <span className="text-[14px] font-bold text-center text-black line-clamp-3 break-words w-full px-1">{label}</span>
            <span className="text-[14px] font-medium text-black mt-1">{percentage}</span>
            <span className="text-[14px] font-medium text-black">
              {evolution}
            </span>
          </Link>
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

// Helper pour obtenir la couleur en fonction de l'évolution
const getColorFromEvolution = (evolution: string): string => {
  const value = parseFloat(evolution.replace('%', ''))

  if (value >= 5) return "bg-[#2FB67E]" // Green +++
  if (value >= 1) return "bg-[#8EE2BF]" // Green ++
  if (value > 0) return "bg-[#F0FAF6]" // Green +
  if (value >= -1) return "bg-[#FFEFEF]" // Red -
  if (value >= -5) return "bg-[#F57A7E]" // Red --
  return "bg-[#F25056]" // Red ---
}

export default function DetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Récupérer les paramètres de l'URL
  const perimetre = (searchParams.get('perimetre') as PerimetreType) || "Marché"
  const label = searchParams.get('label') || ""

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
    // MPI
    'energie': true,
    'transport': true,
    'emballage': true,
    'main-oeuvre': true,
    'gas': true,
    'electricite': true,
    'petrole': true,
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
    'energie': true,
    'transport': true,
    'emballage': true,
    'main-oeuvre': true,
    'gas': true,
    'electricite': true,
    'petrole': true,
  })
  const [base100, setBase100] = useState(false)
  const [dateRange, setDateRange] = useState([0, 100])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [recetteSubTab, setRecetteSubTab] = useState<'mpa' | 'mpi'>('mpa')

  // États pour Evolution Prix
  const [evolutionPeriod, setEvolutionPeriod] = useState<'mois' | 'semaine' | 'jour'>('mois')
  const [evolutionBase100, setEvolutionBase100] = useState(false)
  const [evolutionDateRange, setEvolutionDateRange] = useState([0, 100])
  const [evolutionLegendOpacity, setEvolutionLegendOpacity] = useState<Record<string, boolean>>({
    PA: true,
    'cout-theorique': true,
  })

  // Récupérer l'item spécifique
  const currentItem = useMemo(() => {
    const data = getPerimetreData(perimetre)
    return data.find(item => item.label === label) || data[0]
  }, [perimetre, label])

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

  // Données KPI (7 cards + 2 pour les produits + 3 marges pour produit)
  const kpiCards = useMemo(() => {
    if (!currentItem) return []

    const baseCards = [
      {
        label: "CA Total",
        value: currentItem.ca.valeur,
        evolution: currentItem.ca.evolution,
        tooltip: "Chiffre d'affaires total de la période"
      },
      {
        label: "Volume (UVC)",
        value: "287.932", // Statique pour l'instant
        evolution: "+2.63%",
        tooltip: "Volume total en unités de vente consommateur"
      },
      {
        label: "MPA",
        value: currentItem.mpa.valeur,
        evolution: currentItem.mpa.evolution,
        tooltip: "Marge en pourcentage des achats"
      },
      {
        label: "MPI",
        value: currentItem.mpi.valeur,
        evolution: currentItem.mpi.evolution,
        tooltip: "Marge en pourcentage des ventes (indice)"
      },
    ]

    // Ajouter les 3 nouvelles cartes de marge uniquement pour les produits
    if (perimetre === "Produit") {
      if (currentItem.margePvc) {
        baseCards.push({
          label: "Marge PVC",
          value: currentItem.margePvc.valeur,
          evolution: currentItem.margePvc.evolution,
          tooltip: "Marge entre PV Carrefour et PA unitaire"
        })
      }
      if (currentItem.margePvLcl) {
        baseCards.push({
          label: "Marge PV LCL",
          value: currentItem.margePvLcl.valeur,
          evolution: currentItem.margePvLcl.evolution,
          tooltip: "Marge entre PV Leclerc et PA unitaire"
        })
      }
      if (currentItem.margeMoyenneCategorielle) {
        baseCards.push({
          label: "Marge moyenne catégorielle",
          value: currentItem.margeMoyenneCategorielle,
          evolution: undefined, // Pas d'évolution pour cette carte
          tooltip: "Marge moyenne de la catégorie"
        })
      }
    }

    // Ajouter PA et Coût théorique
    baseCards.push(
      {
        label: "PA",
        value: currentItem.evoPa.valeur,
        evolution: currentItem.evoPa.evolution,
        tooltip: "Prix d'achat total"
      },
      {
        label: "Coût théorique",
        value: currentItem.coutTheorique.valeur,
        evolution: currentItem.coutTheorique.evolution,
        tooltip: "Coût théorique calculé"
      }
    )

    // Ajouter PV et PV Leclerc uniquement pour les produits
    if (perimetre === "Produit" && currentItem.pv && currentItem.pvLeclerc) {
      baseCards.push(
        {
          label: "PV",
          value: currentItem.pv.valeur,
          evolution: currentItem.pv.evolution,
          tooltip: "Prix de vente Carrefour"
        },
        {
          label: "PV Leclerc",
          value: currentItem.pvLeclerc.valeur,
          evolution: currentItem.pvLeclerc.evolution,
          tooltip: "Prix de vente Leclerc"
        }
      )
    }

    // Ajouter Opportunité à la fin
    baseCards.push({
      label: "Opportunité",
      value: currentItem.opportunites.valeur,
      evolution: currentItem.opportunites.evolution,
      tooltip: "Opportunité d'optimisation identifiée"
    })

    return baseCards
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
    // Pour simplifier, on utilise des données statiques pour l'instant
    // Dans une vraie app, on filtrerait les données de pays selon l'élément actuel
    return [
      { label: "France", percentage: "34.43%", evolution: "+0.24%", href: "/detail?perimetre=Pays&label=France" },
      { label: "Belgique", percentage: "25.32%", evolution: "-1.15%", href: "/detail?perimetre=Pays&label=Belgique" },
      { label: "Espagne", percentage: "14.21%", evolution: "+1.18%", href: "/detail?perimetre=Pays&label=Espagne" },
      { label: "Roumanie", percentage: "8.36%", evolution: "+0.90%", href: "/detail?perimetre=Pays&label=Roumanie" },
      { label: "Italie", percentage: "3.58%", evolution: "-1.60%", href: "/detail?perimetre=Pays&label=Italie" },
      { label: "Pologne", percentage: "2.10%", evolution: "+1.80%", href: "/detail?perimetre=Pays&label=Pologne" },
    ]
  }, [])

  // Données pour heatmap Fournisseur (top 3)
  const fournisseurHeatmapData = useMemo(() => {
    const data = getPerimetreData("Fournisseur")
    return data.slice(0, 3).map((item, index) => {
      const percentages = ["21.12%", "19.24%", "8.53%"]
      return {
        label: item.label,
        percentage: percentages[index] || "5%",
        evolution: item.ca.evolution,
        href: `/detail?perimetre=Fournisseur&label=${encodeURIComponent(item.label)}`
      }
    })
  }, [])

  // ============================================
  // FONCTIONS - Structure de coût
  // ============================================

  // Heatmap selon sous-tab
  const getCostHeatmapData = () => {
    switch (costSubTab) {
      case 'total':
        return {
          layout: 'horizontal',
          type: 'total' as const,
          items: [
            { label: 'MPA', percentage: '48.23%', evolution: '+3.20%', color: 'bg-[#F25056]', className: 'flex-1', href: '/detail?perimetre=MPA' },
            { label: 'MPI', percentage: '37.43%', evolution: '-1.80%', color: 'bg-[#2FB67E]', className: 'flex-1', href: '/detail?perimetre=MPI' },
            { label: 'Autre', percentage: '10.01%', evolution: '0.00%', color: 'bg-gray-400', className: 'w-1/6', href: '/detail?perimetre=Autre' },
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
            { label: 'Energie', percentage: '18.36%', categoryPercentage: '49.05%', evolution: '-4.20%', color: 'bg-[#2FB67E]', href: '/detail?item=energie' },
            { label: 'Transport', percentage: '13.37%', categoryPercentage: '35.72%', evolution: '-3.80%', color: 'bg-[#8EE2BF]', href: '/detail?item=transport' },
            { label: 'Emballage', percentage: '9.67%', categoryPercentage: '25.84%', evolution: '-3.10%', color: 'bg-[#F0FAF6]', href: '/detail?item=emballage' },
            { label: "Main d'oeuvre", percentage: '4.36%', categoryPercentage: '11.65%', evolution: '-1.80%', color: 'bg-[#F25056]', href: '/detail?item=main-oeuvre' },
          ]
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
      { date: '2025-04', MPA: 430, MPI: 310, 'farine-ble': 405, 'sucre': 395, 'sel': 445, 'lait': 415, 'beurre': 325, 'huile': 335, 'oeufs': 315, 'energie': 255, 'transport': 485, 'emballage': 325, 'main-oeuvre': 355, 'gas': 245, 'electricite': 260, 'petrole': 250 },
    ]

    if (base100) {
      const firstValues: Record<string, number> = {}
      Object.keys(baseData[0]).forEach(key => {
        if (key !== 'date') {
          firstValues[key] = baseData[0][key as keyof typeof baseData[0]] as number
        }
      })

      return baseData.map(item => {
        const transformed: any = { date: item.date }
        Object.keys(item).forEach(key => {
          if (key !== 'date') {
            transformed[key] = ((item[key as keyof typeof item] as number) / firstValues[key]) * 100
          }
        })
        return transformed
      })
    }

    return baseData
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
            partCost: '48.23%',
            evolution: '+3.20%',
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
            partCost: '27.43%',
            evolution: '-1.80%',
            impact: '-0.80%',
            color: '#00BCD4'
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
        ]
      case 'mpi':
        return [
          {
            id: 'transport',
            name: 'Moyenne transport',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#E91E63',
            isMain: true
          },
          {
            id: 'energie',
            name: 'Moyenne energie',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#00BCD4',
            isMain: true
          },
          {
            id: 'main-oeuvre',
            name: "Moyenne main d'oeuvre",
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#4CAF50',
            isMain: true
          },
          {
            id: 'emballage',
            name: 'Moyenne emballage',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#FF9800',
            isMain: true
          },
          {
            id: 'gas',
            name: 'Gas',
            subLabel: 'HDCGEZ',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#9C27B0',
            isMain: false,
            indent: true
          },
          {
            id: 'electricite',
            name: 'Electricité',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '22.25%',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#795548',
            isMain: false,
            indent: false
          },
          {
            id: 'petrole',
            name: 'Pétrole',
            volume: '7023.42T',
            volumeUVC: '258 UVC',
            partVolume: '22.25%',
            cost: '0.035M€',
            partCost: '48%',
            evolution: '+3.35%',
            color: '#607D8B',
            isMain: false,
            indent: false
          },
        ]
      default:
        return []
    }
  }

  // Fonctions d'interaction
  const toggleItemVisibility = (itemId: string) => {
    setVisibleItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
    if (visibleItems[itemId]) {
      setLegendOpacity(prev => ({ ...prev, [itemId]: false }))
    } else {
      setLegendOpacity(prev => ({ ...prev, [itemId]: true }))
    }
  }

  const toggleLegendOpacity = (itemId: string) => {
    setLegendOpacity(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const unselectAll = () => {
    const allFalse = Object.keys(legendOpacity).reduce((acc, key) => {
      acc[key] = false
      return acc
    }, {} as Record<string, boolean>)
    setLegendOpacity(allFalse)
  }

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

  // Données Recette selon sous-tab
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

  // Données Evolution Prix - Graphique
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

  // Données Evolution Prix - Tableau
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
    <main className="w-full px-[50px] py-4">
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
          <h1 className="text-[40px] font-bold">{label}</h1>
          <Button variant="ghost" size="sm" className="text-blue-600 gap-2 hover:text-blue-800 text-[16px] font-bold">
            <Pencil className="w-5 h-5" />
            Simuler
          </Button>
        </div>

        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">Période</Label>
            <Button
              variant="outline"
              className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none gap-2"
            >
              13/12/2024 - 14/12/2024
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
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4"
          >
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="structure-cout"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4"
          >
            Structure de coût
          </TabsTrigger>
          <TabsTrigger
            value="recette"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4"
          >
            Recette
          </TabsTrigger>
          <TabsTrigger
            value="evolution-prix"
            className="rounded-none bg-transparent border-b-2 border-[#D9D9D9] data-[state=active]:border-[#0970E6] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[14px] font-medium data-[state=active]:font-bold data-[state=active]:text-[#0970E6] pb-2 px-4"
          >
            Évolution prix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vue-ensemble" className="space-y-2 mt-6">
          {/* Sous-titre dynamique */}
          <h2 className="text-[16px] font-bold">{pageTitle}</h2>

          {/* Liens navigation */}
          {navigationLinks.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {navigationLinks.map((link) => (
                <Link key={link.perimetre} href={link.href}>
                  <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                    {link.count} {perimetreAbbreviations[link.perimetre]}
                  </button>
                </Link>
              ))}
            </div>
          )}

          {/* 7 Cards KPI */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 !mt-4">
            {kpiCards.map((card) => {
              const isPositive = card.evolution?.startsWith('+')
              // Logique inversée pour certaines métriques
              const isInversed = ["MPA", "MPI", "PA", "Coût théorique", "Opportunité"].includes(card.label)
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
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{card.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-2xl font-bold mb-1">{card.value}</div>
                  {card.evolution && (
                    <p className={`text-[16px] ${color}`}>
                      {card.evolution}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>

          {/* 2 Blocs Heatmap côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 !mt-6">

            {/* Bloc Gauche - Répartition CA par pays (conditionnel) */}
            {shouldShowPaysHeatmap && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">Répartition CA par pays</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
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
                      href={paysHeatmapData[0].href}
                      type="total"
                    />
                    <HeatmapRect
                      label={paysHeatmapData[1].label}
                      percentage={paysHeatmapData[1].percentage}
                      evolution={paysHeatmapData[1].evolution}
                      color={getColorFromEvolution(paysHeatmapData[1].evolution)}
                      className="flex-[25] h-full"
                      href={paysHeatmapData[1].href}
                      type="total"
                    />
                    <div className="flex-[41] flex flex-col gap-1">
                      <HeatmapRect
                        label={paysHeatmapData[2].label}
                        percentage={paysHeatmapData[2].percentage}
                        evolution={paysHeatmapData[2].evolution}
                        color={getColorFromEvolution(paysHeatmapData[2].evolution)}
                        className="flex-[14] w-full"
                        href={paysHeatmapData[2].href}
                        type="total"
                      />
                      <div className="flex-[27] flex gap-1">
                        <HeatmapRect
                          label={paysHeatmapData[3].label}
                          percentage={paysHeatmapData[3].percentage}
                          evolution={paysHeatmapData[3].evolution}
                          color={getColorFromEvolution(paysHeatmapData[3].evolution)}
                          className="flex-[8] h-full"
                          href={paysHeatmapData[3].href}
                          type="total"
                        />
                        <HeatmapRect
                          label={paysHeatmapData[4].label}
                          percentage={paysHeatmapData[4].percentage}
                          evolution={paysHeatmapData[4].evolution}
                          color={getColorFromEvolution(paysHeatmapData[4].evolution)}
                          className="flex-[4] h-full"
                          href={paysHeatmapData[4].href}
                          type="total"
                        />
                        <HeatmapRect
                          label={paysHeatmapData[5].label}
                          percentage={paysHeatmapData[5].percentage}
                          evolution={paysHeatmapData[5].evolution}
                          color={getColorFromEvolution(paysHeatmapData[5].evolution)}
                          className="flex-[2] h-full"
                          href={paysHeatmapData[5].href}
                          type="total"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bloc Droite - Répartition CA par fournisseur (conditionnel) */}
            {shouldShowFournisseurHeatmap && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">Répartition CA par fournisseur</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
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
                      href={fournisseurHeatmapData[0].href}
                      type="total"
                    />
                    <HeatmapRect
                      label={fournisseurHeatmapData[1].label}
                      percentage={fournisseurHeatmapData[1].percentage}
                      evolution={fournisseurHeatmapData[1].evolution}
                      color={getColorFromEvolution(fournisseurHeatmapData[1].evolution)}
                      className="flex-[19] h-full"
                      href={fournisseurHeatmapData[1].href}
                      type="total"
                    />
                    <HeatmapRect
                      label={fournisseurHeatmapData[2].label}
                      percentage={fournisseurHeatmapData[2].percentage}
                      evolution={fournisseurHeatmapData[2].evolution}
                      color={getColorFromEvolution(fournisseurHeatmapData[2].evolution)}
                      className="flex-[8.5] h-full"
                      href={fournisseurHeatmapData[2].href}
                      type="total"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </TabsContent>

        {/* Tab Structure de coût */}
        <TabsContent value="structure-cout" className="space-y-6 mt-6">
          <h2 className="text-[16px] font-bold">Répartition en valeur des matières premières</h2>

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
              MPA
            </button>
            <button
              onClick={() => setCostSubTab('mpi')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${costSubTab === 'mpi' ? 'bg-[#0970E6] text-white font-bold' : 'bg-[#F2F2F2] text-black font-medium'}`}
            >
              MPI
            </button>
          </div>

          <div className="space-y-6">
              {/* Heatmap */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">
                    {costSubTab === 'total' && 'Répartition de la structure de coût'}
                    {costSubTab === 'mpa' && 'Répartition des Matières Premières et Achats'}
                    {costSubTab === 'mpi' && 'Répartition des Moyens de Production et Infrastructure'}
                  </h2>
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
                      // Layout Total : horizontal simple
                      return (
                        <div className="flex gap-1 h-[300px]">
                          {heatmapData.items.map((item, idx) => (
                            <HeatmapRect
                              key={idx}
                              label={item.label}
                              percentage={item.percentage}
                              evolution={item.evolution}
                              color={item.color}
                              className={`${item.className} h-full`}
                              href={item.href}
                              type={heatmapData.type}
                            />
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
                              />
                            </div>
                          </div>
                        </div>
                      )
                    } else if (heatmapData.layout === 'complex-mpi') {
                      // Layout MPI : Energie large gauche, Transport large centre, Emballage et Main d'oeuvre à droite
                      const items = heatmapData.items
                      return (
                        <div className="flex gap-1 h-[300px]">
                          {/* Energie (très large gauche) */}
                          <HeatmapRect
                            label={items[0].label}
                            percentage={items[0].percentage}
                            evolution={items[0].evolution}
                            color={items[0].color}
                            className="flex-[18] h-full"
                            href={items[0].href}
                            type={heatmapData.type}
                            categoryPercentage={items[0].categoryPercentage}
                          />
                          {/* Transport (large centre) */}
                          <HeatmapRect
                            label={items[1].label}
                            percentage={items[1].percentage}
                            evolution={items[1].evolution}
                            color={items[1].color}
                            className="flex-[13] h-full"
                            href={items[1].href}
                            type={heatmapData.type}
                            categoryPercentage={items[1].categoryPercentage}
                          />
                          {/* Colonne droite avec Emballage et Main d'oeuvre */}
                          <div className="flex-[14] flex flex-col gap-1">
                            <HeatmapRect
                              label={items[2].label}
                              percentage={items[2].percentage}
                              evolution={items[2].evolution}
                              color={items[2].color}
                              className="flex-[2] w-full"
                              href={items[2].href}
                              type={heatmapData.type}
                              categoryPercentage={items[2].categoryPercentage}
                            />
                            <HeatmapRect
                              label={items[3].label}
                              percentage={items[3].percentage}
                              evolution={items[3].evolution}
                              color={items[3].color}
                              className="flex-[1] w-full"
                              href={items[3].href}
                              type={heatmapData.type}
                              categoryPercentage={items[3].categoryPercentage}
                            />
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>

              {/* Graphique avec légendes */}
              <div>
                {/* Titre */}
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">{getChartTitle()}</h2>
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

                {/* Frame avec border */}
                <div className="p-6 border-2 border-gray-300 rounded">
                  {/* Contrôles en haut à droite */}
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

                  {/* Légendes centrées avec bouton "Tout désélectionner" */}
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
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.lait}
                            onCheckedChange={() => toggleLegendOpacity('lait')}
                          />
                          <div className="w-4 h-4 bg-[#FF9800] rounded"></div>
                          <span className="text-sm">Lait en poudre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.beurre}
                            onCheckedChange={() => toggleLegendOpacity('beurre')}
                          />
                          <div className="w-4 h-4 bg-[#9C27B0] rounded"></div>
                          <span className="text-sm">Beurre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.huile}
                            onCheckedChange={() => toggleLegendOpacity('huile')}
                          />
                          <div className="w-4 h-4 bg-[#607D8B] rounded"></div>
                          <span className="text-sm">Huile végétale</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.oeufs}
                            onCheckedChange={() => toggleLegendOpacity('oeufs')}
                          />
                          <div className="w-4 h-4 bg-[#795548] rounded"></div>
                          <span className="text-sm">Oeufs</span>
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
                          <span className="text-sm font-semibold">Moyenne transport</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.energie}
                            onCheckedChange={() => toggleLegendOpacity('energie')}
                          />
                          <div className="w-4 h-4 bg-[#00BCD4] rounded"></div>
                          <span className="text-sm font-semibold">Moyenne energie</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity['main-oeuvre']}
                            onCheckedChange={() => toggleLegendOpacity('main-oeuvre')}
                          />
                          <div className="w-4 h-4 bg-[#4CAF50] rounded"></div>
                          <span className="text-sm font-semibold">Moyenne main d&apos;oeuvre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.emballage}
                            onCheckedChange={() => toggleLegendOpacity('emballage')}
                          />
                          <div className="w-4 h-4 bg-[#FF9800] rounded"></div>
                          <span className="text-sm font-semibold">Moyenne emballage</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.gas}
                            onCheckedChange={() => toggleLegendOpacity('gas')}
                          />
                          <div className="w-4 h-4 bg-[#9C27B0] rounded"></div>
                          <span className="text-sm">Gas</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.electricite}
                            onCheckedChange={() => toggleLegendOpacity('electricite')}
                          />
                          <div className="w-4 h-4 bg-[#795548] rounded"></div>
                          <span className="text-sm">Electricité</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={legendOpacity.petrole}
                            onCheckedChange={() => toggleLegendOpacity('petrole')}
                          />
                          <div className="w-4 h-4 bg-[#607D8B] rounded"></div>
                          <span className="text-sm">Pétrole</span>
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
                    <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
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
                        </>
                      )}

                      {costSubTab === 'mpi' && (
                        <>
                          <Line type="monotone" dataKey="transport" stroke="#E91E63" strokeWidth={2} dot={false} hide={!legendOpacity.transport} />
                          <Line type="monotone" dataKey="energie" stroke="#00BCD4" strokeWidth={2} dot={false} hide={!legendOpacity.energie} />
                          <Line type="monotone" dataKey="main-oeuvre" stroke="#4CAF50" strokeWidth={2} dot={false} hide={!legendOpacity['main-oeuvre']} />
                          <Line type="monotone" dataKey="emballage" stroke="#FF9800" strokeWidth={2} dot={false} hide={!legendOpacity.emballage} />
                          <Line type="monotone" dataKey="gas" stroke="#9C27B0" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.gas} />
                          <Line type="monotone" dataKey="electricite" stroke="#795548" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.electricite} />
                          <Line type="monotone" dataKey="petrole" stroke="#607D8B" strokeWidth={1} strokeDasharray="5 5" dot={false} hide={!legendOpacity.petrole} />
                        </>
                      )}
                    </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sélecteur de plage de dates */}
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

              {/* Tableau */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[16px] font-medium">Détail de la structure de coût</h2>
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

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold w-[40px]"></TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Nom
                            {sortConfig?.key === 'name' && (
                              <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3 h-3 text-muted-foreground ml-1" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Nom de l&apos;élément de coût</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        {costSubTab !== 'total' && costSubTab !== 'mpi' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('subLabel')}
                          >
                            <div className="flex items-center gap-1">
                              Code
                              {sortConfig?.key === 'subLabel' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-3 h-3 text-muted-foreground ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Code de l&apos;élément</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableHead>
                        )}
                        {(costSubTab === 'total' || costSubTab === 'mpi') && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('volume')}
                          >
                            <div className="flex items-center gap-1">
                              Volume
                              {sortConfig?.key === 'volume' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {(costSubTab === 'total' || costSubTab === 'mpi') && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('volumeUVC')}
                          >
                            <div className="flex items-center gap-1">
                              Volume (UVC)
                              {sortConfig?.key === 'volumeUVC' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('partVolume')}
                          >
                            <div className="flex items-center gap-1">
                              Part Volume
                              {sortConfig?.key === 'partVolume' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('volume')}
                            >
                              <div className="flex items-center gap-1">
                                Volume
                                {sortConfig?.key === 'volume' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('volumeUVC')}
                            >
                              <div className="flex items-center gap-1">
                                Volume (UVC)
                                {sortConfig?.key === 'volumeUVC' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partVolume')}
                            >
                              <div className="flex items-center gap-1">
                                Part Volume
                                {sortConfig?.key === 'partVolume' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                          </>
                        )}
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('cost')}
                        >
                          <div className="flex items-center gap-1">
                            Coût
                            {sortConfig?.key === 'cost' && (
                              <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3 h-3 text-muted-foreground ml-1" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Coût total de l&apos;élément</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('partCost')}
                          >
                            <div className="flex items-center gap-1">
                              Part Coût
                              {sortConfig?.key === 'partCost' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostTotal')}
                            >
                              <div className="flex items-center gap-1">
                                Part coût total
                                {sortConfig?.key === 'partCostTotal' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('partCostMPA')}
                            >
                              <div className="flex items-center gap-1">
                                Part coût MPA
                                {sortConfig?.key === 'partCostMPA' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                          </>
                        )}
                        {costSubTab === 'mpi' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('partCost')}
                          >
                            <div className="flex items-center gap-1">
                              Part Coût
                              {sortConfig?.key === 'partCost' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('evolution')}
                        >
                          <div className="flex items-center gap-1">
                            Évolution
                            {sortConfig?.key === 'evolution' && (
                              <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3 h-3 text-muted-foreground ml-1" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Évolution du coût par rapport à la période précédente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        {costSubTab === 'total' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('impact')}
                          >
                            <div className="flex items-center gap-1">
                              Impact
                              {sortConfig?.key === 'impact' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {costSubTab === 'mpa' && (
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('impactTotal')}
                          >
                            <div className="flex items-center gap-1">
                              Impact sur coût total
                              {sortConfig?.key === 'impactTotal' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedTableData().map((row: any, idx) => (
                        <TableRow key={row.id} className={row.indent ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}>
                          <TableCell>
                            <Checkbox
                              checked={visibleItems[row.id] !== false}
                              onCheckedChange={(checked) => {
                                setVisibleItems(prev => ({ ...prev, [row.id]: checked as boolean }))
                                setLegendOpacity(prev => ({ ...prev, [row.id]: checked as boolean }))
                              }}
                            />
                          </TableCell>
                          <TableCell className={row.isMain === false && !row.indent ? 'pl-8' : ''}>
                            <div>
                              <span className={row.isMain === true ? 'font-semibold' : ''}>{row.name}</span>
                              {row.subLabel && <span className="text-xs text-gray-500 ml-2">({row.subLabel})</span>}
                            </div>
                          </TableCell>
                          {costSubTab === 'mpa' && <TableCell>{row.subLabel}</TableCell>}
                          {(costSubTab === 'total' || costSubTab === 'mpi') && <TableCell>{row.volume}</TableCell>}
                          {(costSubTab === 'total' || costSubTab === 'mpi') && <TableCell>{row.volumeUVC}</TableCell>}
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
        </TabsContent>

        <TabsContent value="recette" className="space-y-6 mt-6">

          {/* Sous-titre */}
          <h2 className="text-[16px] font-bold">Répartition en volume des matières premières</h2>

          {/* Sous-tabs MPA / MPI */}
          <div className="flex gap-0 w-fit">
            <button
              onClick={() => setRecetteSubTab('mpa')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${
                recetteSubTab === 'mpa'
                  ? 'bg-[#0970E6] text-white font-bold'
                  : 'bg-[#F2F2F2] text-black font-medium'
              }`}
            >
              MPA
            </button>
            <button
              onClick={() => setRecetteSubTab('mpi')}
              className={`px-4 py-2 text-[14px] first:rounded-l last:rounded-r transition-colors ${
                recetteSubTab === 'mpi'
                  ? 'bg-[#0970E6] text-white font-bold'
                  : 'bg-[#F2F2F2] text-black font-medium'
              }`}
            >
              MPI
            </button>
          </div>

          {/* Card Liste avec bar charts */}
          <Card className="border rounded-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {recetteSubTab === 'mpa' ? 'Liste des MPA' : 'Liste des MPI'}
                </h3>
                <Button variant="ghost" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {getRecetteData().map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  {/* Nom + Code Mintech */}
                  <div className="w-48 flex-shrink-0">
                    <div className="font-bold text-base">{item.name}</div>
                    <div className="font-medium text-gray-500 text-sm">{item.code}</div>
                  </div>

                  {/* Barre de progression horizontale */}
                  <div className="flex-1 bg-gray-100 rounded-md h-8 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-md transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* Pourcentage à droite */}
                  <div className="w-20 text-right font-bold text-base">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="evolution-prix" className="mt-6">
          <div className="space-y-6">
            {/* Titre principal */}
            <h2 className="text-[16px] font-bold">
              Évolution des prix de votre {label || perimetre}
            </h2>

            {/* Sous-titre */}
            <h3 className="text-[16px] font-medium">Graphique de l&apos;évolution des prix</h3>

            {/* Card graphique */}
            <Card className="border rounded-lg">
              <CardContent className="p-6">
                {/* Header avec controls */}
                <div className="flex items-center justify-between mb-4">
                  {/* Gauche: Légendes cliquables + bouton désélectionner */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className="w-4 h-4 bg-[#E91E63] rounded"
                        style={{ opacity: evolutionLegendOpacity.PA ? 1 : 0.3 }}
                      />
                      <span
                        className="text-sm"
                        onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, PA: !evolutionLegendOpacity.PA })}
                      >
                        PA
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className="w-4 h-4 bg-[#607D8B] rounded"
                        style={{ opacity: evolutionLegendOpacity['cout-theorique'] ? 1 : 0.3 }}
                      />
                      <span
                        className="text-sm"
                        onClick={() => setEvolutionLegendOpacity({ ...evolutionLegendOpacity, 'cout-theorique': !evolutionLegendOpacity['cout-theorique'] })}
                      >
                        Coût théorique
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[14px]"
                      onClick={() => setEvolutionLegendOpacity({ PA: false, 'cout-theorique': false })}
                    >
                      Tout désélectionner
                    </Button>
                  </div>

                  {/* Droite: Select période + Base 100 + Export */}
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
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t my-4" />

                {/* Graphique */}
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getEvolutionChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
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
              </CardContent>
            </Card>

            {/* Cards KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border rounded-lg p-6">
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
              </Card>

              <Card className="border rounded-lg p-6">
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
                <p className="text-3xl font-bold text-green-600">+3.6%</p>
              </Card>
            </div>

            {/* Tableau Détail */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Détail</h3>
              <Card className="border rounded-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10 min-w-[150px]">Période</TableHead>
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
                            <TableCell className="sticky left-0 bg-white z-10 font-medium">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

    </main>
  )
}
