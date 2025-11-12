// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import dynamic from 'next/dynamic'

// Lazy load heavy Command component
const LazyCommand = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.Command })), { ssr: false }) as any;
const LazyCommandEmpty = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.CommandEmpty })), { ssr: false }) as any;
const LazyCommandGroup = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.CommandGroup })), { ssr: false }) as any;
const LazyCommandInput = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.CommandInput })), { ssr: false }) as any;
const LazyCommandItem = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.CommandItem })), { ssr: false }) as any;
const LazyCommandList = dynamic(() => import("@/components/ui/command").then(mod => ({ default: mod.CommandList })), { ssr: false }) as any;
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  calculateSubLevelCounts,
  getPerimetreData,
  perimetreAbbreviations,
  perimetreToFilterKey,
  type PerimetreItem,
  type PerimetreType
} from "@/lib/data/perimetre-data"
import { cn, calculateValorisation } from "@/lib/utils"
import { PORTEFEUILLE_CATEGORIE_MAP, PORTEFEUILLE_NAMES } from "@/lib/constants/portefeuilles"
import { CalendarIcon, Check, ChevronDown as ChevronDownIcon, ChevronsUpDown, Eye, Info, X } from "lucide-react"
import { SwitchIcon } from "@/components/ui/switch-icon"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { usePeriodMode } from "@/hooks/usePeriodMode"
import { useVolumeUnit } from "@/hooks/useVolumeUnit"
import { useRestoredPageState } from "@/hooks/usePageState"

// Interface pour l'état de la page à persister
interface AccueilPageState {
  selectedPortefeuille: string;
  selectedFournisseurs: string[];
}

// Composant Heatmap Rectangle réutilisable
interface HeatmapRectProps {
  label: string
  percentage: string
  evolution: string
  color: string
  className?: string
  href?: string // Rendre href optionnel pour désactiver le clic
  totalPA?: string // PA total pour calculer la valorisation
  lastUpdate?: string // Date de dernière mise à jour
}

function HeatmapRect({ label, percentage, evolution, color, className, href, totalPA, lastUpdate }: HeatmapRectProps) {
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
      <span className="text-[14px] font-medium text-black mt-1">{percentage}</span>
      <span className="text-[14px] font-medium text-black">
        {evolution}
      </span>
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
              <p>Répartition : {percentage} du PA total</p>
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

// Helper pour extraire la valeur numérique d'une opportunité
const extractOpportunityValue = (oppStr: string): number => {
  const cleaned = oppStr.replace(/[^\d.,-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// Helper pour créer un lien vers la page analyse-valeur
const createAnalyseValeurLink = (perimetre: PerimetreType): string => {
  const perimetreMap: Record<PerimetreType, string> = {
    "Marché": "Marché",
    "Marché détaillé": "Marché détaillé",
    "Catégorie": "Catégorie",
    "Groupe Famille": "Groupe Famille",
    "Famille": "Famille",
    "Sous Famille": "Sous Famille",
    "Produit": "Produit",
    "Fournisseur": "Fournisseur",
    "Portefeuille": "Portefeuille",
    "Pays": "Pays",
  }
  return `/analyse-valeur?perimetre=${encodeURIComponent(perimetreMap[perimetre])}`
}

// Composant pour un tableau d'opportunités
interface OpportunityTableProps {
  title: string
  perimetre: PerimetreType
  items: PerimetreItem[]
  activeFilters?: Record<string, string>
}

function OpportunityTable({ title, perimetre, items, activeFilters = {} }: OpportunityTableProps) {
  const router = useRouter()

  const subLevelCounts = useMemo(() => {
    return items.map(item => {
      // Créer le filtre pour ce specific item en ajoutant son label au filtre du périmètre
      const filterKey = perimetreToFilterKey[perimetre]
      const itemFilters = { ...activeFilters }
      if (filterKey) {
        itemFilters[filterKey] = item.label
      }

      return {
        ...item,
        counts: calculateSubLevelCounts(perimetre, item, itemFilters)
      }
    })
  }, [items, perimetre, activeFilters])

  // Helper pour créer l'URL avec les bons filtres
  const createSubLevelLink = (item: PerimetreItem, targetPerimetre: PerimetreType) => {
    const filterKey = perimetreToFilterKey[perimetre]
    const params = new URLSearchParams()

    // Ajouter le périmètre cible
    params.append('perimetre', targetPerimetre)

    // Ajouter le filtre du périmètre parent
    if (filterKey) {
      params.append(filterKey, item.label)
    }

    // Ajouter les autres filtres actifs
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== 'tous' && key !== filterKey) {
        params.append(key, value)
      }
    })

    return `/analyse-valeur?${params.toString()}`
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold">{title}</TableHead>
              <TableHead className="text-right"></TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subLevelCounts.map((item) => {
              const subLevels = Object.entries(item.counts)
                .filter(([_, count]) => count > 0)
                .map(([level, count]) => ({ level: level as PerimetreType, count }))

              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    router.push(`/detail?perimetre=${encodeURIComponent(perimetre)}&label=${encodeURIComponent(item.label)}`)
                  }}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={title.includes("Famille") && title.includes("top 5") ? "text-sm font-bold" : "font-bold"}>
                        {item.label}
                      </span>
                      {subLevels.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {subLevels.map(({ level, count }) => (
                            <Link
                              key={level}
                              href={createSubLevelLink(item, level)}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {count} {perimetreAbbreviations[level]}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-right">{item.opportunites.valeur}</TableCell>
                  <TableCell className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/detail?perimetre=${encodeURIComponent(perimetre)}&label=${encodeURIComponent(item.label)}`)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function AccueilPage() {
  const router = useRouter()

  // Restaurer l'état sauvegardé
  const restoredState = useRestoredPageState<AccueilPageState>('accueil');

  // Modes période CAD/CAM pour CA et Volume
  const { mode: caMode, toggleMode: toggleCAMode } = usePeriodMode('period-mode-ca')
  const { mode: volumeMode, toggleMode: toggleVolumeMode } = usePeriodMode('period-mode-volume')

  // Mode unité UVC/Tonne pour Volume
  const { unit: volumeUnit, toggleUnit: toggleVolumeUnit } = useVolumeUnit('volume-unit-accueil')

  // State pour le portefeuille sélectionné
  const [selectedPortefeuille, setSelectedPortefeuille] = useState<string>(restoredState?.selectedPortefeuille ?? "tous")

  // State pour le combobox
  const [openCombobox, setOpenCombobox] = useState(false)

  // State pour les fournisseurs sélectionnés (multiselection)
  const [selectedFournisseurs, setSelectedFournisseurs] = useState<string[]>(restoredState?.selectedFournisseurs ?? [])
  const [tempFournisseurSelections, setTempFournisseurSelections] = useState<string[]>(restoredState?.selectedFournisseurs ?? [])
  const [openFournisseursPopover, setOpenFournisseursPopover] = useState(false)
  const [fournisseurSearch, setFournisseurSearch] = useState("")

  // Options des portefeuilles
  const portefeuilleOptions = PORTEFEUILLE_NAMES

  // Liste des fournisseurs
  const fournisseursList = useMemo(() => {
    const data = getPerimetreData("Fournisseur")
    return data.map(f => f.label)
  }, [])

  // Filtrer les fournisseurs selon la recherche
  const filteredFournisseurs = useMemo(() => {
    if (!fournisseurSearch) return fournisseursList
    return fournisseursList.filter((f) =>
      f.toLowerCase().includes(fournisseurSearch.toLowerCase())
    )
  }, [fournisseurSearch, fournisseursList])

  // Synchroniser les sélections temporaires quand on ouvre le popover
  useEffect(() => {
    if (openFournisseursPopover) {
      setTempFournisseurSelections(selectedFournisseurs)
    }
  }, [openFournisseursPopover, selectedFournisseurs])

  // Sauvegarder l'état de la page à chaque changement
  useEffect(() => {
    const pageState: AccueilPageState = {
      selectedPortefeuille,
      selectedFournisseurs,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('page-state-accueil', JSON.stringify(pageState));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état:', error);
      }
    }
  }, [selectedPortefeuille, selectedFournisseurs]);

  // Récupérer les données du périmètre Marché pour les liens de navigation
  const marcheData = useMemo(() => getPerimetreData("Marché"), [])

  // Récupérer la catégorie associée au portefeuille sélectionné
  const selectedCategorie = selectedPortefeuille !== "tous"
    ? PORTEFEUILLE_CATEGORIE_MAP[selectedPortefeuille]
    : null

  // Helper pour filtrer les données par catégorie
  const filterDataByCategorie = (data: PerimetreItem[]) => {
    if (selectedPortefeuille === "tous") return data
    if (!selectedCategorie) return data
    return data.filter(item => item.categorie === selectedCategorie)
  }

  // Récupérer les données de la catégorie sélectionnée (pour KPI cards)
  const categorieData = useMemo(() => {
    if (selectedPortefeuille === "tous") {
      // Par défaut, afficher PLS
      const data = getPerimetreData("Marché")
      return data.find(item => item.label === "PLS") || data[0]
    } else {
      // Afficher les données de la catégorie du portefeuille
      const data = getPerimetreData("Catégorie")
      return data.find(item => item.label === selectedCategorie) || data[0]
    }
  }, [selectedPortefeuille, selectedCategorie])

  // Données KPI (7 cards) - récupérées dynamiquement selon le portefeuille
  const kpiCards = useMemo(() => {
    if (!categorieData) return []

    // Valeurs fixes CAD/CAM pour CA
    const caData = {
      CAD: { value: categorieData.ca.valeur, evolution: categorieData.ca.evolution },
      CAM: { value: "1254.00 M€", evolution: "+3.20%" }
    }

    // Valeurs fixes CAD/CAM et UVC/Tonne pour Volume
    const volumeData = {
      UVC: {
        CAD: { value: "287.932", evolution: "+2.63%" },
        CAM: { value: "316.725", evolution: "+3.10%" }
      },
      Tonne: {
        CAD: { value: "45.123", evolution: "+2.50%" },
        CAM: { value: "49.876", evolution: "+3.05%" }
      }
    }

    return [
      {
        label: "CA",
        value: caData[caMode].value,
        evolution: caData[caMode].evolution,
        tooltip: "Chiffre d'affaires total de la période",
        mode: caMode,
        onToggleMode: toggleCAMode
      },
      {
        label: "Volume",
        value: volumeData[volumeUnit][volumeMode].value,
        evolution: volumeData[volumeUnit][volumeMode].evolution,
        tooltip: `Volume total en ${volumeUnit === 'UVC' ? 'unités de vente consommateur' : 'tonnes'}`,
        mode: volumeMode,
        onToggleMode: toggleVolumeMode,
        unit: volumeUnit,
        onToggleUnit: toggleVolumeUnit
      },
      {
        label: "MPA",
        value: categorieData.mpa.valeur,
        evolution: categorieData.mpa.evolution,
        tooltip: "Marge en pourcentage des achats"
      },
      {
        label: "MPI",
        value: categorieData.mpi.valeur,
        evolution: categorieData.mpi.evolution,
        tooltip: "Marge en pourcentage des ventes (indice)"
      },
      {
        label: "PA",
        value: categorieData.evoPa.valeur,
        evolution: categorieData.evoPa.evolution,
        tooltip: "Prix d'achat total"
      },
      {
        label: "PA théorique",
        value: categorieData.coutTheorique.valeur,
        evolution: categorieData.coutTheorique.evolution,
        tooltip: "Prix d'achat théorique calculé"
      },
      {
        label: "Opportunité",
        value: categorieData.opportunites.valeur,
        evolution: categorieData.opportunites.evolution,
        tooltip: "Opportunité d'optimisation identifiée"
      },
    ]
  }, [categorieData, caMode, volumeMode, volumeUnit, toggleCAMode, toggleVolumeMode, toggleVolumeUnit])

  // Calculer les comptages pour le périmètre Marché
  const navigationLinks = useMemo(() => {
    if (marcheData.length === 0) return []

    // Prendre le premier marché (PLS) pour les comptages
    const pls = marcheData[0]
    const counts = calculateSubLevelCounts("Marché", pls, {})

    return [
      { perimetre: "Marché" as PerimetreType, count: marcheData.length },
      { perimetre: "Marché détaillé" as PerimetreType, count: counts["Marché détaillé"] || 0 },
      { perimetre: "Groupe Famille" as PerimetreType, count: counts["Groupe Famille"] || 0 },
      { perimetre: "Famille" as PerimetreType, count: counts["Famille"] || 0 },
      { perimetre: "Sous Famille" as PerimetreType, count: counts["Sous Famille"] || 0 },
      { perimetre: "Produit" as PerimetreType, count: counts["Produit"] || 0 },
    ]
  }, [marcheData])

  // Récupérer et trier les top 5 pour chaque périmètre
  const top5Categorie = useMemo(() => {
    const data = getPerimetreData("Catégorie")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5GroupeFamille = useMemo(() => {
    const data = getPerimetreData("Groupe Famille")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5Famille = useMemo(() => {
    const data = getPerimetreData("Famille")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5SousFamille = useMemo(() => {
    const data = getPerimetreData("Sous Famille")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5Produit = useMemo(() => {
    const data = getPerimetreData("Produit")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5Fournisseur = useMemo(() => {
    const data = getPerimetreData("Fournisseur")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const top5Portefeuille = useMemo(() => {
    const data = getPerimetreData("Portefeuille")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  const marcheDetaille = useMemo(() => {
    const data = getPerimetreData("Marché détaillé")
    const filtered = filterDataByCategorie(data)
    return filtered
      .sort((a, b) => extractOpportunityValue(b.opportunites.valeur) - extractOpportunityValue(a.opportunites.valeur))
      .slice(0, 5)
  }, [selectedPortefeuille, selectedCategorie])

  // Données dynamiques pour les heatmaps
  const paysData = useMemo(() => {
    const data = getPerimetreData("Pays")
    const totalCA = data.reduce((sum, item) => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      return sum + caValue
    }, 0)

    return data.map(item => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      const percentage = ((caValue / totalCA) * 100).toFixed(2)

      // Calculer la couleur en fonction de l'évolution PA
      const evoValue = parseFloat(item.evoPa.evolution.replace('%', ''))
      let color = 'bg-gray-200'
      if (evoValue > 2) color = 'bg-[#F25056]' // Rouge foncé
      else if (evoValue >= 1) color = 'bg-[#F57A7E]' // Rouge moyen
      else if (evoValue > 0) color = 'bg-[#FFEFEF]' // Rouge pâle
      else if (evoValue >= -1) color = 'bg-[#F0FAF6]' // Vert pâle
      else if (evoValue >= -2) color = 'bg-[#8EE2BF]' // Vert moyen
      else color = 'bg-[#2FB67E]' // Vert foncé

      return {
        label: item.label,
        percentage: `${percentage}%`,
        evolution: item.evoPa.evolution,
        color,
        flex: parseFloat(percentage)
      }
    }).sort((a, b) => b.flex - a.flex)
  }, [])

  const fournisseursData = useMemo(() => {
    const data = getPerimetreData("Fournisseur")
    const totalCA = data.reduce((sum, item) => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      return sum + caValue
    }, 0)

    return data.map(item => {
      const caValue = parseFloat(item.ca.valeur.replace(/[^\d.,-]/g, "").replace(",", "."))
      const percentage = ((caValue / totalCA) * 100).toFixed(2)

      // Calculer la couleur en fonction de l'évolution PA
      const evoValue = parseFloat(item.evoPa.evolution.replace('%', ''))
      let color = 'bg-gray-200'
      if (evoValue > 2) color = 'bg-[#F25056]' // Rouge foncé
      else if (evoValue >= 1) color = 'bg-[#F57A7E]' // Rouge moyen
      else if (evoValue > 0) color = 'bg-[#FFEFEF]' // Rouge pâle
      else if (evoValue >= -1) color = 'bg-[#F0FAF6]' // Vert pâle
      else if (evoValue >= -2) color = 'bg-[#8EE2BF]' // Vert moyen
      else color = 'bg-[#2FB67E]' // Vert foncé

      return {
        label: item.label,
        percentage: `${percentage}%`,
        evolution: item.evoPa.evolution,
        color,
        flex: parseFloat(percentage)
      }
    }).sort((a, b) => b.flex - a.flex)
  }, [])

  return (
    <main className="w-full px-[60px] py-4 space-y-6">
      {/* Titre + Contrôles */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[40px] font-bold">Accueil</h1>

        <div className="flex items-center gap-2">
          <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">Périmètre</Label>
              <Select value={selectedPortefeuille} onValueChange={setSelectedPortefeuille}>
                <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                  <SelectValue placeholder="Périmètre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  {portefeuilleOptions.map(portef => (
                    <SelectItem key={portef} value={portef}>{portef}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">Pays</Label>
              <Select defaultValue="tous">
                <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="belgique">Belgique</SelectItem>
                  <SelectItem value="espagne">Espagne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">Période</Label>
              <Button
                variant="outline"
                className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none gap-2"
              >
                13/12/2024 - 14/12/2024
                <CalendarIcon className="h-4 w-4 text-blue-500" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Titre et liens de navigation */}
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-[20px] font-medium">
          {selectedPortefeuille === "tous"
            ? "Vue d'ensemble de votre portefeuille"
            : `Vue d'ensemble du portefeuille de ${selectedPortefeuille}`
          }
        </h2>
        {navigationLinks.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-end">
            {navigationLinks.map((link) => (
              <Link key={link.perimetre} href={createAnalyseValeurLink(link.perimetre)}>
                <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                  {link.count} {perimetreAbbreviations[link.perimetre]}
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 7 Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4" style={{ marginBottom: '40px' }}>
        {kpiCards.map((card) => {
          const isPositive = card.evolution?.startsWith('+')
          // Pour la card Opportunité, toujours afficher en vert (c'est le % de baisse du prix à demander)
          const isOpportunity = card.label === "Opportunité"
          // Logique inversée pour MPA, MPI, PA, PA théorique
          const isInversed = ["MPA", "MPI", "PA", "PA théorique"].includes(card.label)

          let color = 'text-green-600'
          if (isOpportunity) {
            color = 'text-green-600'
          } else if (isInversed) {
            color = isPositive ? 'text-red-600' : 'text-green-600'
          } else {
            color = isPositive ? 'text-green-600' : 'text-red-600'
          }

          const hasMode = card.label === "CA" || card.label === "Volume"
          const hasUnit = card.label === "Volume"

          return (
            <Card key={card.label} className="p-4 rounded shadow-none">
              <div className="flex items-center gap-2 mb-3">
                {hasMode ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-sm font-medium">{card.label}</span>
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
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        card.onToggleMode?.()
                      }}
                      className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                    >
                      {card.mode} <SwitchIcon className="w-4 h-3.5" />
                    </button>
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
                  </>
                )}
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

      {/* 4 Blocs Heatmap - Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '56px' }}>

        {/* Bloc A - Répartition PA par pays */}
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
              {paysData.length >= 2 && (
                <>
                  {/* Premier pays (le plus gros) */}
                  <div style={{ flex: paysData[0].flex }} className="h-full">
                    <HeatmapRect
                      label={paysData[0].label}
                      percentage={paysData[0].percentage}
                      evolution={paysData[0].evolution}
                      color={paysData[0].color}
                      className="h-full"
                      href={`/detail?perimetre=Pays&label=${encodeURIComponent(paysData[0].label)}`}
                      totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                    />
                  </div>
                  {/* Deuxième pays */}
                  <div style={{ flex: paysData[1].flex }} className="h-full">
                    <HeatmapRect
                      label={paysData[1].label}
                      percentage={paysData[1].percentage}
                      evolution={paysData[1].evolution}
                      color={paysData[1].color}
                      className="h-full"
                      href={`/detail?perimetre=Pays&label=${encodeURIComponent(paysData[1].label)}`}
                      totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                    />
                  </div>
                  {/* Colonne droite avec les autres pays */}
                  {paysData.length > 2 && (
                    <div style={{ flex: paysData.slice(2).reduce((sum, p) => sum + p.flex, 0) }} className="flex flex-col gap-1">
                      {paysData[2] && (
                        <div style={{ flex: paysData[2].flex }} className="w-full">
                          <HeatmapRect
                            label={paysData[2].label}
                            percentage={paysData[2].percentage}
                            evolution={paysData[2].evolution}
                            color={paysData[2].color}
                            className="w-full h-full"
                            href={`/detail?perimetre=Pays&label=${encodeURIComponent(paysData[2].label)}`}
                            totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                          />
                        </div>
                      )}
                      {paysData.length > 3 && (
                        <div style={{ flex: paysData.slice(3).reduce((sum, p) => sum + p.flex, 0) }} className="flex gap-1">
                          {paysData.slice(3).map((pays) => (
                            <div key={pays.label} style={{ flex: pays.flex }} className="h-full">
                              <HeatmapRect
                                label={pays.label}
                                percentage={pays.percentage}
                                evolution={pays.evolution}
                                color={pays.color}
                                className="h-full"
                                href={`/detail?perimetre=Pays&label=${encodeURIComponent(pays.label)}`}
                                totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bloc B - Structure de coût */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[16px] font-medium">Structure de coût</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Répartition des coûts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="rounded overflow-hidden">
            <div className="flex gap-1 h-[300px]">
              {/* MPA - le plus gros */}
              <div style={{ flex: parseFloat(categorieData.mpa.valeur) }} className="h-full">
                <HeatmapRect
                  label="MPA"
                  percentage={categorieData.mpa.valeur}
                  evolution={categorieData.mpa.evolution}
                  color={(() => {
                    const evoValue = parseFloat(categorieData.mpa.evolution.replace('%', ''))
                    if (evoValue > 2) return 'bg-[#F25056]'
                    if (evoValue >= 1) return 'bg-[#F57A7E]'
                    if (evoValue > 0) return 'bg-[#FFEFEF]'
                    if (evoValue >= -1) return 'bg-[#F0FAF6]'
                    if (evoValue >= -2) return 'bg-[#8EE2BF]'
                    return 'bg-[#2FB67E]'
                  })()}
                  className="h-full"
                  totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                />
              </div>
              {/* MPI - deuxième */}
              <div style={{ flex: parseFloat(categorieData.mpi.valeur) }} className="h-full">
                <HeatmapRect
                  label="MPI"
                  percentage={categorieData.mpi.valeur}
                  evolution={categorieData.mpi.evolution}
                  color={(() => {
                    const evoValue = parseFloat(categorieData.mpi.evolution.replace('%', ''))
                    if (evoValue > 2) return 'bg-[#F25056]'
                    if (evoValue >= 1) return 'bg-[#F57A7E]'
                    if (evoValue > 0) return 'bg-[#FFEFEF]'
                    if (evoValue >= -1) return 'bg-[#F0FAF6]'
                    if (evoValue >= -2) return 'bg-[#8EE2BF]'
                    return 'bg-[#2FB67E]'
                  })()}
                  className="h-full"
                  totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                />
              </div>
              {/* Autre - le plus petit */}
              <div style={{ flex: 100 - parseFloat(categorieData.mpa.valeur) - parseFloat(categorieData.mpi.valeur) }} className="h-full">
                <HeatmapRect
                  label="Autre"
                  percentage={`${(100 - parseFloat(categorieData.mpa.valeur) - parseFloat(categorieData.mpi.valeur)).toFixed(2)}%`}
                  evolution="+0.00%"
                  color="bg-gray-400"
                  className="h-full"
                  totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloc C - Répartition PA par catégorie/famille */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[16px] font-medium">
              {selectedPortefeuille === "tous" ? "Répartition PA par catégorie" : "Répartition PA par famille"}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectedPortefeuille === "tous" ? "Répartition du CA par catégorie de produits" : "Répartition du CA par famille de produits"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="rounded overflow-hidden">
            <div className="flex gap-1 h-[300px]">
              {selectedPortefeuille === "tous" ? (
                // Heatmap par catégorie (tous les portefeuilles)
                <>
              {/* SURGELE VIANDES LEGUMES - le plus gros */}
              <HeatmapRect
                label="SURGELE VIANDES LEGUMES"
                percentage="7.53%"
                evolution="+1.60%"
                color="bg-[#F57A7E]"
                className="flex-[7.5] h-full"
                href="/detail?perimetre=Catégorie&label=SURGELE VIANDES LEGUMES"
                totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
              />
              {/* SURGELES GLACES PPI */}
              <HeatmapRect
                label="SURGELES GLACES PPI"
                percentage="6.33%"
                evolution="-1.69%"
                color="bg-[#8EE2BF]"
                className="flex-[6.3] h-full"
                href="/detail?perimetre=Catégorie&label=SURGELES GLACES PPI"
                totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
              />
              {/* LAIT BEURRE CREME */}
              <HeatmapRect
                label="LAIT BEURRE CREME"
                percentage="6.03%"
                evolution="-7.60%"
                color="bg-[#2FB67E]"
                className="flex-[6] h-full"
                href="/detail?perimetre=Catégorie&label=LAIT BEURRE CREME"
                totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
              />
              {/* Colonne droite avec les 6 petits */}
              <div className="flex-[18] flex flex-col gap-1">
                {/* SURGELE POISSON PLATS CUIS POT */}
                <HeatmapRect
                  label="SURGELE POISSON PLATS CUIS POT"
                  percentage="4.17%"
                  evolution="-1.70%"
                  color="bg-[#8EE2BF]"
                  className="flex-[5.5] w-full"
                  href="/detail?perimetre=Catégorie&label=SURGELE POISSON PLATS CUIS POT"
                  totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                />
                {/* Ligne avec TRAITEUR et ULTRAFAIS */}
                <div className="flex-[6.5] flex gap-1">
                  <HeatmapRect
                    label="TRAITEUR"
                    percentage="3.93%"
                    evolution="-1.21%"
                    color="bg-[#F0FAF6]"
                    className="flex-[3.9] h-full"
                    href="/detail?perimetre=Catégorie&label=TRAITEUR"
                    totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                  />
                  <HeatmapRect
                    label="ULTRAFAIS"
                    percentage="3.65%"
                    evolution="-0.08%"
                    color="bg-[#F0FAF6]"
                    className="flex-[3.7] h-full"
                    href="/detail?perimetre=Catégorie&label=ULTRAFAIS"
                    totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                  />
                </div>
                {/* Ligne du bas avec FROMAGES, SAUCISSERIE, VOLAILLE */}
                <div className="flex-[6] flex gap-1">
                  <HeatmapRect
                    label="FROMAGES"
                    percentage="3.32%"
                    evolution="-0.20%"
                    color="bg-[#F0FAF6]"
                    className="flex-[3.3] h-full"
                    href="/detail?perimetre=Catégorie&label=FROMAGES"
                    totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                  />
                  <HeatmapRect
                    label="SAUCISSERIE"
                    percentage="2.63%"
                    evolution="-1.80%"
                    color="bg-[#8EE2BF]"
                    className="flex-[2.6] h-full"
                    href="/detail?perimetre=Catégorie&label=SAUCISSERIE"
                    totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                  />
                  <HeatmapRect
                    label="VOLAILLE CHARCUTERIE"
                    percentage="1.93%"
                    evolution="-0.69%"
                    color="bg-[#F0FAF6]"
                    className="flex-[2] h-full"
                    href="/detail?perimetre=Catégorie&label=VOLAILLE CHARCUTERIE"
                    totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                  />
                </div>
              </div>
                </>
              ) : (
                // Heatmap par famille (portefeuille spécifique)
                <>
                  {top5Famille.map((item, index) => {
                    // Calculer la couleur en fonction de l'évolution (logique inversée pour PA)
                    const getColorFromEvolution = (evolution: string) => {
                      const value = parseFloat(evolution.replace('%', ''))
                      if (value > 2) return 'bg-[#F25056]' // Rouge foncé pour forte hausse
                      if (value >= 1) return 'bg-[#F57A7E]' // Rouge moyen
                      if (value > 0) return 'bg-[#FFEFEF]' // Rouge pâle
                      if (value >= -1) return 'bg-[#F0FAF6]' // Vert pâle
                      if (value >= -2) return 'bg-[#8EE2BF]' // Vert moyen
                      return 'bg-[#2FB67E]' // Vert foncé pour forte baisse
                    }

                    return (
                      <HeatmapRect
                        key={item.id}
                        label={item.label}
                        percentage={item.ca.valeur}
                        evolution={item.ca.evolution}
                        color={getColorFromEvolution(item.ca.evolution)}
                        className="flex-1 h-full"
                        href={`/detail?perimetre=Famille&label=${encodeURIComponent(item.label)}`}
                        totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                      />
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bloc D - Répartition PA par fournisseur */}
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
              {fournisseursData.length >= 2 && (
                <>
                  {/* Premier fournisseur (le plus gros) */}
                  <div style={{ flex: fournisseursData[0].flex }} className="h-full">
                    <HeatmapRect
                      label={fournisseursData[0].label}
                      percentage={fournisseursData[0].percentage}
                      evolution={fournisseursData[0].evolution}
                      color={fournisseursData[0].color}
                      className="h-full"
                      href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseursData[0].label)}`}
                      totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                    />
                  </div>
                  {/* Deuxième fournisseur */}
                  <div style={{ flex: fournisseursData[1].flex }} className="h-full">
                    <HeatmapRect
                      label={fournisseursData[1].label}
                      percentage={fournisseursData[1].percentage}
                      evolution={fournisseursData[1].evolution}
                      color={fournisseursData[1].color}
                      className="h-full"
                      href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseursData[1].label)}`}
                      totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                    />
                  </div>
                  {/* Troisième fournisseur */}
                  {fournisseursData[2] && (
                    <div style={{ flex: fournisseursData[2].flex }} className="h-full">
                      <HeatmapRect
                        label={fournisseursData[2].label}
                        percentage={fournisseursData[2].percentage}
                        evolution={fournisseursData[2].evolution}
                        color={fournisseursData[2].color}
                        className="h-full"
                        href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseursData[2].label)}`}
                        totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                      />
                    </div>
                  )}
                  {/* Colonne droite avec les autres fournisseurs */}
                  {fournisseursData.length > 3 && (
                    <div style={{ flex: fournisseursData.slice(3).reduce((sum, p) => sum + p.flex, 0) }} className="flex flex-col gap-1">
                      {fournisseursData[3] && (
                        <div style={{ flex: fournisseursData[3].flex }} className="w-full">
                          <HeatmapRect
                            label={fournisseursData[3].label}
                            percentage={fournisseursData[3].percentage}
                            evolution={fournisseursData[3].evolution}
                            color={fournisseursData[3].color}
                            className="w-full h-full"
                            href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseursData[3].label)}`}
                            totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                          />
                        </div>
                      )}
                      {fournisseursData[4] && (
                        <div style={{ flex: fournisseursData[4].flex }} className="w-full">
                          <HeatmapRect
                            label={fournisseursData[4].label}
                            percentage={fournisseursData[4].percentage}
                            evolution={fournisseursData[4].evolution}
                            color={fournisseursData[4].color}
                            className="w-full h-full"
                            href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseursData[4].label)}`}
                            totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                          />
                        </div>
                      )}
                      {/* Ligne du bas avec les petits fournisseurs */}
                      {fournisseursData.length > 5 && (
                        <div style={{ flex: fournisseursData.slice(5).reduce((sum, p) => sum + p.flex, 0) }} className="flex gap-1">
                          {fournisseursData.slice(5).map((fournisseur) => (
                            <div key={fournisseur.label} style={{ flex: fournisseur.flex }} className="h-full">
                              <HeatmapRect
                                label={fournisseur.label}
                                percentage={fournisseur.percentage}
                                evolution={fournisseur.evolution}
                                color={fournisseur.color}
                                className="h-full"
                                href={`/detail?perimetre=Fournisseur&label=${encodeURIComponent(fournisseur.label)}`}
                                totalPA={categorieData.evoPa.valeur} lastUpdate="12/11/25"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Section Opportunités */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-medium">Opportunités</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-[#121212]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Opportunités d&apos;optimisation identifiées</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">Fournisseurs</Label>
                <Popover open={openFournisseursPopover} onOpenChange={setOpenFournisseursPopover}>
                  <PopoverTrigger asChild>
                    <div
                      className={`flex h-9 w-auto items-center whitespace-nowrap rounded-md border border-gray-200 bg-white text-[16px] shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                        selectedFournisseurs.length === 0 ? "pl-3 py-2" : "p-0.5"
                      }`}
                      onClick={() => setOpenFournisseursPopover(true)}
                    >
                      {selectedFournisseurs.length === 0 ? (
                        <span className="text-[16px]">tous</span>
                      ) : (
                        <div className="flex items-center gap-1 flex-1 overflow-hidden flex-wrap">
                          {selectedFournisseurs.slice(0, 2).map((f, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                            >
                              <span className="text-[14px] font-medium">{f}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFournisseurs((prev) =>
                                    prev.filter((item) => item !== f)
                                  );
                                  setTempFournisseurSelections((prev) =>
                                    prev.filter((item) => item !== f)
                                  );
                                }}
                                className="text-[#0970E6] hover:text-[#075bb3]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {selectedFournisseurs.length > 2 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{selectedFournisseurs.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <ChevronDownIcon className="h-4 w-4 text-[#0970E6] ml-2 mr-2 flex-shrink-0" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="flex flex-col">
                      {/* Champ de recherche */}
                      <div className="p-3 border-b">
                        <Input
                          placeholder="Rechercher fournisseur..."
                          value={fournisseurSearch}
                          onChange={(e) => setFournisseurSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>

                      {/* Bouton Tout désélectionner */}
                      {tempFournisseurSelections.length > 0 && (
                        <div className="px-3 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-gray-600 hover:text-gray-900"
                            onClick={() => setTempFournisseurSelections([])}
                          >
                            Tout désélectionner
                          </Button>
                        </div>
                      )}

                      {/* Liste avec checkboxes */}
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {filteredFournisseurs.map((f) => (
                          <div
                            key={f}
                            className="flex items-center gap-2 px-4 py-4 rounded cursor-pointer"
                            onClick={() => {
                              setTempFournisseurSelections((prev) =>
                                prev.includes(f)
                                  ? prev.filter((item) => item !== f)
                                  : [...prev, f]
                              );
                            }}
                          >
                            <Checkbox
                              checked={tempFournisseurSelections.includes(f)}
                              onCheckedChange={(checked) => {
                                setTempFournisseurSelections((prev) =>
                                  checked
                                    ? [...prev, f]
                                    : prev.filter((item) => item !== f)
                                );
                              }}
                            />
                            <span className="text-[16px]">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bouton Valider */}
                      <div className="p-3 border-t">
                        <Button
                          className="w-full bg-[#0970E6] hover:bg-[#075bb3] text-white"
                          onClick={() => {
                            setSelectedFournisseurs(tempFournisseurSelections);
                            setOpenFournisseursPopover(false);
                          }}
                        >
                          Valider
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </Card>

            <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">Pays</Label>
                <Select defaultValue="tous-pays">
                  <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-pays">Tous</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="belgique">Belgique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">Période</Label>
                <Button
                  variant="outline"
                  className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none gap-2"
                >
                  13/12/2024 - 14/12/2024
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Colonne Gauche */}
          <div className="space-y-6">
            {selectedPortefeuille === "tous" && (
              <>
                <OpportunityTable
                  title="Marché / mon portefeuille"
                  perimetre="Marché"
                  items={marcheData.slice(0, 1)}
                />

                <OpportunityTable
                  title="Marché détaillé"
                  perimetre="Marché détaillé"
                  items={marcheDetaille}
                />

                <OpportunityTable
                  title="Catégorie (top 5)"
                  perimetre="Catégorie"
                  items={top5Categorie}
                />
              </>
            )}

            <OpportunityTable
              title="Groupes Familles (top 5)"
              perimetre="Groupe Famille"
              items={top5GroupeFamille}
            />

            <OpportunityTable
              title="Famille (top 5)"
              perimetre="Famille"
              items={top5Famille}
            />
          </div>

          {/* Colonne Droite */}
          <div className="space-y-6">
            <OpportunityTable
              title="Sous famille (top 5)"
              perimetre="Sous Famille"
              items={top5SousFamille}
            />

            {/* Tableau Produits avec code */}
            <div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold">Produits (top 5)</TableHead>
                      <TableHead className="text-right"></TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top5Produit.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          router.push(`/detail?perimetre=Produit&label=${encodeURIComponent(item.label)}`)
                        }}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-right">{item.opportunites.valeur}</TableCell>
                        <TableCell className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/detail?perimetre=Produit&label=${encodeURIComponent(item.label)}`)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <OpportunityTable
              title="Fournisseurs (top 5)"
              perimetre="Fournisseur"
              items={top5Fournisseur}
            />

            <OpportunityTable
              title="Portefeuilles"
              perimetre="Portefeuille"
              items={top5Portefeuille}
            />
          </div>

        </div>
      </div>

    </main>
  )
}
