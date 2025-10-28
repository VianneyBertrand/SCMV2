"use client";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, ChevronsUpDown, Eye, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

// Composant Heatmap Rectangle réutilisable
interface HeatmapRectProps {
  label: string
  percentage: string
  evolution: string
  color: string
  className?: string
  href: string
}

function HeatmapRect({ label, percentage, evolution, color, className, href }: HeatmapRectProps) {
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
        <TooltipContent side="top" sideOffset={-50} className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{label}</p>
            <p>Répartition : {percentage} du CA total</p>
            <p>Évolution : {evolution}</p>
            <p className="text-xs text-muted-foreground">Source : Mintech</p>
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

// Mapping des portefeuilles vers les catégories
const PORTEFEUILLE_CATEGORIE_MAP: Record<string, string> = {
  "Jean Dubois": "SAURISSERIE",
  "Marie Grivault": "SURGELE POISSON PLATS CUIS PDT",
  "Pierre Lefebvre": "SURGELE VIANDES LEGUMES",
  "Sophie Martin": "SURGELES GLACE PPI",
  "Thomas Bernard": "VOLAILLE CHARCUTERIE",
  "Claire Durand": "FROMAGE",
  "Antoine Rousseau": "LAIT BEURRE CREME",
  "Isabelle Mercier": "TRAITEUR  ",
  "Nicolas Laurent": "ULTRA FRAIS",
  "Émilie Fournier": "ŒUF PPI"
}

export default function AccueilPage() {
  const router = useRouter()

  // State pour le portefeuille sélectionné
  const [selectedPortefeuille, setSelectedPortefeuille] = useState<string>("tous")

  // State pour le combobox
  const [openCombobox, setOpenCombobox] = useState(false)

  // Options des portefeuilles
  const portefeuilleOptions = Object.keys(PORTEFEUILLE_CATEGORIE_MAP)

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

    return [
      {
        label: "CA Total",
        value: categorieData.ca.valeur,
        evolution: categorieData.ca.evolution,
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
        label: "Coût théorique",
        value: categorieData.coutTheorique.valeur,
        evolution: categorieData.coutTheorique.evolution,
        tooltip: "Coût théorique calculé"
      },
      {
        label: "Opportunité",
        value: categorieData.opportunites.valeur,
        evolution: categorieData.opportunites.evolution,
        tooltip: "Opportunité d'optimisation identifiée"
      },
    ]
  }, [categorieData])

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

      {/* Liens de navigation */}
      <div className="flex flex-wrap gap-3 mb-6">
        {navigationLinks.map((link) => (
          <Link key={link.perimetre} href={createAnalyseValeurLink(link.perimetre)}>
            <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
              {link.count} {perimetreAbbreviations[link.perimetre]}
            </button>
          </Link>
        ))}
      </div>

      {/* 7 Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4" style={{ marginBottom: '40px' }}>
        {kpiCards.map((card) => {
          const isPositive = card.evolution?.startsWith('+')
          // Pour la card Opportunité, toujours afficher en vert (c'est le % de baisse du prix à demander)
          const isOpportunity = card.label === "Opportunité"
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
                <p className={`text-[16px] ${isOpportunity ? 'text-green-600' : (isPositive ? 'text-green-600' : 'text-red-600')}`}>
                  {card.evolution}
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {/* 4 Blocs Heatmap - Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '56px' }}>

        {/* Bloc A - Répartition CA par pays */}
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
              {/* France - le plus gros, toute la hauteur à gauche */}
              <HeatmapRect
                label="France"
                percentage="34.43%"
                evolution="+0.24%"
                color="bg-[#F0FAF6]"
                className="flex-[34] h-full"
                href="/detail?perimetre=Pays&label=France"
              />
              {/* Belgique - deuxième plus gros */}
              <HeatmapRect
                label="Belgique"
                percentage="25.32%"
                evolution="-1.15%"
                color="bg-[#FFEFEF]"
                className="flex-[25] h-full"
                href="/detail?perimetre=Pays&label=Belgique"
              />
              {/* Colonne droite avec les 4 petits */}
              <div className="flex-[41] flex flex-col gap-1">
                {/* Espagne */}
                <HeatmapRect
                  label="Espagne"
                  percentage="14.21%"
                  evolution="+1.18%"
                  color="bg-[#8EE2BF]"
                  className="flex-[14] w-full"
                  href="/detail?perimetre=Pays&label=Espagne"
                />
                {/* Ligne avec Roumanie, Italie, Pologne */}
                <div className="flex-[27] flex gap-1">
                  <HeatmapRect
                    label="Roumanie"
                    percentage="8.36%"
                    evolution="+0.90%"
                    color="bg-[#F0FAF6]"
                    className="flex-[8] h-full"
                    href="/detail?perimetre=Pays&label=Roumanie"
                  />
                  <HeatmapRect
                    label="Italie"
                    percentage="3.58%"
                    evolution="-1.60%"
                    color="bg-[#F57A7E]"
                    className="flex-[4] h-full"
                    href="/detail?perimetre=Pays&label=Italie"
                  />
                  <HeatmapRect
                    label="Pologne"
                    percentage="2.10%"
                    evolution="+1.80%"
                    color="bg-[#2FB67E]"
                    className="flex-[2] h-full"
                    href="/detail?perimetre=Pays&label=Pologne"
                  />
                </div>
              </div>
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
                  <Info className="w-4 h-4 text-muted-foreground" />
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
              <HeatmapRect
                label="MPA"
                percentage="42.03%"
                evolution="-2.70%"
                color="bg-[#F25056]"
                className="flex-[42] h-full"
                href="/detail/mpa"
              />
              {/* MPI - deuxième */}
              <HeatmapRect
                label="MPI"
                percentage="37.23%"
                evolution="-1.10%"
                color="bg-[#FFEFEF]"
                className="flex-[37] h-full"
                href="/detail/mpi"
              />
              {/* Autre - le plus petit */}
              <HeatmapRect
                label="Autre"
                percentage="3.21%"
                evolution="+0.00%"
                color="bg-gray-400"
                className="flex-[3] h-full"
                href="/detail/autre"
              />
            </div>
          </div>
        </div>

        {/* Bloc C - Répartition CA par catégorie/famille */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[16px] font-medium">
              {selectedPortefeuille === "tous" ? "Répartition CA par catégorie" : "Répartition CA par famille"}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
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
                color="bg-[#8EE2BF]"
                className="flex-[7.5] h-full"
                href="/detail?perimetre=Catégorie&label=SURGELE VIANDES LEGUMES"
              />
              {/* SURGELES GLACES PPI */}
              <HeatmapRect
                label="SURGELES GLACES PPI"
                percentage="6.33%"
                evolution="-1.69%"
                color="bg-[#F57A7E]"
                className="flex-[6.3] h-full"
                href="/detail?perimetre=Catégorie&label=SURGELES GLACES PPI"
              />
              {/* LAIT BEURRE CREME */}
              <HeatmapRect
                label="LAIT BEURRE CREME"
                percentage="6.03%"
                evolution="-7.60%"
                color="bg-[#F25056]"
                className="flex-[6] h-full"
                href="/detail?perimetre=Catégorie&label=LAIT BEURRE CREME"
              />
              {/* Colonne droite avec les 6 petits */}
              <div className="flex-[18] flex flex-col gap-1">
                {/* SURGELE POISSON PLATS CUIS POT */}
                <HeatmapRect
                  label="SURGELE POISSON PLATS CUIS POT"
                  percentage="4.17%"
                  evolution="-1.70%"
                  color="bg-[#F57A7E]"
                  className="flex-[5.5] w-full"
                  href="/detail?perimetre=Catégorie&label=SURGELE POISSON PLATS CUIS POT"
                />
                {/* Ligne avec TRAITEUR et ULTRAFAIS */}
                <div className="flex-[6.5] flex gap-1">
                  <HeatmapRect
                    label="TRAITEUR"
                    percentage="3.93%"
                    evolution="-1.21%"
                    color="bg-[#FFEFEF]"
                    className="flex-[3.9] h-full"
                    href="/detail?perimetre=Catégorie&label=TRAITEUR"
                  />
                  <HeatmapRect
                    label="ULTRAFAIS"
                    percentage="3.65%"
                    evolution="-0.08%"
                    color="bg-[#FFEFEF]"
                    className="flex-[3.7] h-full"
                    href="/detail?perimetre=Catégorie&label=ULTRAFAIS"
                  />
                </div>
                {/* Ligne du bas avec FROMAGES, SAUCISSERIE, VOLAILLE */}
                <div className="flex-[6] flex gap-1">
                  <HeatmapRect
                    label="FROMAGES"
                    percentage="3.32%"
                    evolution="-0.20%"
                    color="bg-[#FFEFEF]"
                    className="flex-[3.3] h-full"
                    href="/detail?perimetre=Catégorie&label=FROMAGES"
                  />
                  <HeatmapRect
                    label="SAUCISSERIE"
                    percentage="2.63%"
                    evolution="-1.80%"
                    color="bg-[#F57A7E]"
                    className="flex-[2.6] h-full"
                    href="/detail?perimetre=Catégorie&label=SAUCISSERIE"
                  />
                  <HeatmapRect
                    label="VOLAILLE CHARCUTERIE"
                    percentage="1.93%"
                    evolution="-0.69%"
                    color="bg-[#FFEFEF]"
                    className="flex-[2] h-full"
                    href="/detail?perimetre=Catégorie&label=VOLAILLE CHARCUTERIE"
                  />
                </div>
              </div>
                </>
              ) : (
                // Heatmap par famille (portefeuille spécifique)
                <>
                  {top5Famille.map((item, index) => {
                    const colors = ['bg-[#8EE2BF]', 'bg-[#F0FAF6]', 'bg-[#FFEFEF]', 'bg-[#F57A7E]', 'bg-[#F25056]']
                    return (
                      <HeatmapRect
                        key={item.id}
                        label={item.label}
                        percentage={item.ca.valeur}
                        evolution={item.ca.evolution}
                        color={colors[index] || 'bg-gray-200'}
                        className="flex-1 h-full"
                        href={`/detail?perimetre=Famille&label=${encodeURIComponent(item.label)}`}
                      />
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bloc D - Répartition CA par fournisseur */}
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
              {/* Lactalis - le plus gros */}
              <HeatmapRect
                label="Lactalis"
                percentage="21.12%"
                evolution="-0.29%"
                color="bg-[#FFEFEF]"
                className="flex-[21] h-full"
                href="/detail?perimetre=Fournisseur&label=Lactalis"
              />
              {/* Savencia - deuxième */}
              <HeatmapRect
                label="Savencia"
                percentage="19.24%"
                evolution="-0.80%"
                color="bg-[#FFEFEF]"
                className="flex-[19] h-full"
                href="/detail?perimetre=Fournisseur&label=Savencia"
              />
              {/* Bel */}
              <HeatmapRect
                label="Bel"
                percentage="8.53%"
                evolution="+0.80%"
                color="bg-[#F0FAF6]"
                className="flex-[8.5] h-full"
                href="/detail?perimetre=Fournisseur&label=Bel"
              />
              {/* Colonne droite avec les 5 petits */}
              <div className="flex-[24] flex flex-col gap-1">
                {/* Fromageries BEL */}
                <HeatmapRect
                  label="Fromageries BEL"
                  percentage="7.93%"
                  evolution="+1.80%"
                  color="bg-[#8EE2BF]"
                  className="flex-[8] w-full"
                  href="/detail?perimetre=Fournisseur&label=Fromageries BEL"
                />
                {/* Agrial */}
                <HeatmapRect
                  label="Agrial"
                  percentage="6.93%"
                  evolution="-0.60%"
                  color="bg-[#FFEFEF]"
                  className="flex-[7] w-full"
                  href="/detail?perimetre=Fournisseur&label=Agrial"
                />
                {/* Ligne du bas avec Sodaal, Eurial, Triballat Noyal */}
                <div className="flex-[9.4] flex gap-1">
                  <HeatmapRect
                    label="Sodaal"
                    percentage="4.07%"
                    evolution="-0.90%"
                    color="bg-[#FFEFEF]"
                    className="flex-[4] h-full"
                    href="/detail?perimetre=Fournisseur&label=Sodaal"
                  />
                  <HeatmapRect
                    label="Eurial"
                    percentage="3.00%"
                    evolution="-0.06%"
                    color="bg-[#FFEFEF]"
                    className="flex-[3] h-full"
                    href="/detail?perimetre=Fournisseur&label=Eurial"
                  />
                  <HeatmapRect
                    label="Triballat Noyal"
                    percentage="2.33%"
                    evolution="-3.21%"
                    color="bg-[#F25056]"
                    className="flex-[2.4] h-full"
                    href="/detail?perimetre=Fournisseur&label=Triballat Noyal"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Section Opportunités */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[32px] font-semibold">Opportunités</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
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
                <Select defaultValue="tous">
                  <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                    <SelectValue placeholder="Fournisseurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="danone">Danone</SelectItem>
                    <SelectItem value="lactalis">Lactalis</SelectItem>
                  </SelectContent>
                </Select>
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
