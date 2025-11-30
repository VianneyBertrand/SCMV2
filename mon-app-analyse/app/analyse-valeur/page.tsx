// @ts-nocheck
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateSubLevelCounts,
  type FilterType,
  getAvailableFilters,
  getPerimetreData,
  getSubLevels,
  perimetreAbbreviations,
  perimetreToFilterKey,
  type PerimetreType,
} from "@/lib/data/perimetre-data";
import { cn } from "@/lib/utils";
import { PORTEFEUILLE_NAMES } from "@/lib/constants/portefeuilles";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronDown as ChevronDownIcon,
  ChevronsUpDown,
  Download,
  Eye,
  Info,
  Search,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVolumeUnit } from "@/hooks/useVolumeUnit";
import { SwitchIcon } from "@/components/ui/switch-icon";
import { usePageState, useRestoredPageState } from "@/hooks/usePageState";
import { SimulationTag } from "@/components/simulation/SimulationTag";
import { InlineField } from "@/componentsv2/ui/inline-field";
import {
  Select as SelectV2,
  SelectContent as SelectContentV2,
  SelectItem as SelectItemV2,
  SelectTrigger as SelectTriggerV2,
  SelectValue as SelectValueV2,
} from "@/componentsv2/ui/select";
import { Autocomplete } from "@/componentsv2/ui/autocomplete";
import { DatePicker as DatePickerV2 } from "@/componentsv2/ui/date-picker";
import { usePeriodStore } from "@/stores/periodStore";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/componentsv2/ui/pagination";

// Lazy load heavy components - Command and Calendar
const LazyCalendar = dynamic(
  () =>
    import("@/components/ui/calendar").then((mod) => ({
      default: mod.Calendar,
    })),
  { ssr: false }
) as any;
const LazyCommand = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({ default: mod.Command })),
  { ssr: false }
) as any;
const LazyCommandEmpty = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({
      default: mod.CommandEmpty,
    })),
  { ssr: false }
) as any;
const LazyCommandGroup = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({
      default: mod.CommandGroup,
    })),
  { ssr: false }
) as any;
const LazyCommandInput = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({
      default: mod.CommandInput,
    })),
  { ssr: false }
) as any;
const LazyCommandItem = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({
      default: mod.CommandItem,
    })),
  { ssr: false }
) as any;
const LazyCommandList = dynamic(
  () =>
    import("@/components/ui/command").then((mod) => ({
      default: mod.CommandList,
    })),
  { ssr: false }
) as any;

// Interface pour l'historique de navigation
interface NavigationHistoryItem {
  perimetre: PerimetreType;
  filters: Record<string, string>;
  fournisseurSelections: string[];
  paysSelections: string[];
  portefeuilleSelections: string[];
}

// Interface pour l'état de la page à persister
interface AnalyseValeurPageState {
  perimetre: PerimetreType;
  filters: Record<string, string>;
  fournisseurSelections: string[];
  paysSelections: string[];
  portefeuilleSelections: string[];
  comparisonMode: boolean;
  comparedElements: {
    id: string;
    name: string;
    filters: Record<string, string>;
  }[];
  comparisonByPerimeter: Record<string, typeof comparedElements>;
  rechercheValue: string;
}

// Helper pour filtrer les filtres à afficher (uniquement Pays, Fournisseur, Portefeuille)
const filterDisplayableFilters = (
  filters: Record<string, string>
): Record<string, string> => {
  const allowedKeys = ["pays", "fournisseur", "fournisseurs", "portefeuille"];
  return Object.entries(filters)
    .filter(([key]) => allowedKeys.includes(key.toLowerCase()))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

// Helper pour vérifier si des filtres non-affichables sont actifs
const hasNonDisplayableFilters = (filters: Record<string, string>): boolean => {
  const allowedKeys = ["pays", "fournisseur", "fournisseurs", "portefeuille"];
  return Object.keys(filters).some(
    (key) => !allowedKeys.includes(key.toLowerCase())
  );
};

function AnalyseValeurContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ref pour tracker les searchParams précédents et éviter les restaurations multiples
  const previousSearchParamsRef = useRef<string | null>(null);

  // Initialiser avec des valeurs par défaut (pas de sessionStorage)
  const [comparisonMode, setComparisonMode] = useState(false);
  const [perimetre, setPerimetre] = useState<PerimetreType>("Marché");
  const { period, setPeriod } = usePeriodStore();
  const [typePrix, setTypePrix] = useState<"Prix départ" | "Prix franco">("Prix départ");

  // States pour le combobox
  const [openRecherche, setOpenRecherche] = useState(false);
  const [rechercheValue, setRechercheValue] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  // States pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // States pour la multi-sélection des fournisseurs
  const [fournisseurSelections, setFournisseurSelections] = useState<string[]>([]);
  const [tempFournisseurSelections, setTempFournisseurSelections] = useState<string[]>([]);
  const [openFournisseur, setOpenFournisseur] = useState(false);
  const [fournisseurSearch, setFournisseurSearch] = useState("");

  // States pour la multi-sélection des pays
  const [paysSelections, setPaysSelections] = useState<string[]>([]);
  const [tempPaysSelections, setTempPaysSelections] = useState<string[]>([]);
  const [openPays, setOpenPays] = useState(false);
  const [paysSearch, setPaysSearch] = useState("");

  // States pour la multi-sélection des portefeuilles
  const [portefeuilleSelections, setPortefeuilleSelections] = useState<string[]>([]);
  const [tempPortefeuilleSelections, setTempPortefeuilleSelections] = useState<string[]>([]);
  const [openPortefeuille, setOpenPortefeuille] = useState(false);
  const [portefeuilleSearch, setPortefeuilleSearch] = useState("");

  // States pour les filtres dynamiques
  const [filters, setFilters] = useState<Record<string, string>>({
    pays: "tous",
    marche: "tous",
    marcheDetaille: "tous",
    categorie: "tous",
    groupeFamille: "tous",
    famille: "tous",
    sousFamille: "tous",
    produit: "tous",
    fournisseur: "tous",
    portefeuille: "tous",
  });

  // Historique de navigation
  const [navigationHistory, setNavigationHistory] = useState<
    NavigationHistoryItem[]
  >([]);

  // States mode comparaison
  const [comparedElements, setComparedElements] = useState<
    {
      id: string;
      name: string;
      filters: Record<string, string>;
    }[]
  >([]);

  const [comparisonByPerimeter, setComparisonByPerimeter] = useState<
    Record<string, typeof comparedElements>
  >({
    Marché: [],
    "Marché détaillé": [],
    Catégorie: [],
    "Groupe Famille": [],
    Famille: [],
    "Sous Famille": [],
    Produit: [],
    Fournisseur: [],
    Portefeuille: [],
  });

  // Hook pour gérer le toggle UVC/Tonne
  const { unit: volumeUnit, toggleUnit: toggleVolumeUnit } = useVolumeUnit('volume-unit-analyse-valeur');

  // Fonctions mode comparaison
  const generateElementId = (name: string, filters: Record<string, string>) => {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
    return `${name}||${filterString}`;
  };

  const getActiveFilters = () => {
    const activeFilters: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "tous") {
        activeFilters[key] = value;
      }
    });
    // Ajouter les fournisseurs sélectionnés
    if (fournisseurSelections.length > 0) {
      activeFilters.fournisseurs = fournisseurSelections.join(" + ");
    }
    // Ajouter les pays sélectionnés
    if (paysSelections.length > 0) {
      activeFilters.pays = paysSelections.join(" + ");
    }
    // Ajouter les portefeuilles sélectionnés
    if (portefeuilleSelections.length > 0) {
      activeFilters.portefeuille = portefeuilleSelections.join(" + ");
    }
    return activeFilters;
  };

  const isElementSelected = (name: string) => {
    // Vérifier si l'élément avec ces filtres précis existe déjà
    const currentFilters = getActiveFilters();
    const displayableFilters = filterDisplayableFilters(currentFilters);
    const id = generateElementId(name, displayableFilters);
    return comparedElements.some((el) => el.id === id);
  };

  const addToComparison = (name: string) => {
    if (comparedElements.length >= 4) return;

    // Ne garder que les filtres affichables pour la comparaison
    const currentFilters = getActiveFilters();
    const displayableFilters = filterDisplayableFilters(currentFilters);

    const id = generateElementId(name, displayableFilters);
    // Vérifier si cet élément avec ces filtres précis existe déjà
    if (comparedElements.some((el) => el.id === id)) return;

    console.log("fournisseurSelections:", fournisseurSelections);
    console.log("currentFilters:", currentFilters);
    console.log("displayableFilters:", displayableFilters);

    const newElement = { id, name, filters: displayableFilters };
    setComparedElements([...comparedElements, newElement]);
  };

  const removeFromComparison = (id: string) => {
    setComparedElements(comparedElements.filter((el) => el.id !== id));
  };

  const goToComparison = () => {
    if (comparedElements.length < 2) return;
    const encodedElements = encodeURIComponent(
      JSON.stringify(comparedElements)
    );
    router.push(
      `/comparaison?elements=${encodedElements}&perimetre=${perimetre}`
    );
  };

  // Restaurer l'état depuis sessionStorage OU depuis URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentSearchParams = searchParams.toString();

    // Ne restaurer que si les searchParams ont changé (évite les restaurations multiples)
    if (previousSearchParamsRef.current === currentSearchParams) return;
    previousSearchParamsRef.current = currentSearchParams;

    const hasUrlParams = currentSearchParams.length > 0;

    // Si on a des URL params, les utiliser (priorité aux URL params)
    if (hasUrlParams) {
      const perimetreParam = searchParams.get("perimetre");
      if (perimetreParam) {
        const validPerimetres: PerimetreType[] = [
          "Marché", "Marché détaillé", "Catégorie", "Groupe Famille",
          "Famille", "Sous Famille", "Produit", "Fournisseur", "Portefeuille",
        ];
        if (validPerimetres.includes(perimetreParam as PerimetreType)) {
          setPerimetre(perimetreParam as PerimetreType);
        }
      }

      // Lire les filtres depuis l'URL
      const newFilters: Record<string, string> = { ...filters };
      let hasFilters = false;

      const filterKeys: FilterType[] = [
        "pays", "marche", "marcheDetaille", "categorie",
        "groupeFamille", "famille", "sousFamille", "fournisseur", "portefeuille",
      ];

      filterKeys.forEach((key) => {
        const value = searchParams.get(key);
        if (value && value !== "tous") {
          newFilters[key] = value;
          hasFilters = true;
        }
      });

      if (hasFilters) {
        setFilters(newFilters);
      }

      // Restaurer le mode comparaison si présent dans l'URL
      const comparisonModeParam = searchParams.get("comparisonMode");
      const elementsParam = searchParams.get("elements");

      if (comparisonModeParam === "true" && elementsParam) {
        try {
          const decodedElements = JSON.parse(decodeURIComponent(elementsParam));
          setComparisonMode(true);
          setComparedElements(decodedElements);
          setComparisonByPerimeter((prev) => ({
            ...prev,
            [perimetreParam || perimetre]: decodedElements,
          }));
        } catch (e) {
          console.error("Error parsing elements from URL:", e);
        }
      }
    }
    // Sinon, restaurer depuis sessionStorage (navigation depuis le menu)
    else {
      try {
        const savedState = sessionStorage.getItem('page-state-analyse-valeur');
        if (savedState) {
          const parsed: AnalyseValeurPageState = JSON.parse(savedState);

          // Restaurer tous les états depuis sessionStorage
          if (parsed.perimetre) setPerimetre(parsed.perimetre);
          if (parsed.filters) setFilters(parsed.filters);
          if (parsed.fournisseurSelections) {
            setFournisseurSelections(parsed.fournisseurSelections);
            setTempFournisseurSelections(parsed.fournisseurSelections);
          }
          if (parsed.paysSelections) {
            setPaysSelections(parsed.paysSelections);
            setTempPaysSelections(parsed.paysSelections);
          }
          if (parsed.portefeuilleSelections) {
            setPortefeuilleSelections(parsed.portefeuilleSelections);
            setTempPortefeuilleSelections(parsed.portefeuilleSelections);
          }
          if (parsed.comparisonMode !== undefined) setComparisonMode(parsed.comparisonMode);
          if (parsed.comparedElements) setComparedElements(parsed.comparedElements);
          if (parsed.comparisonByPerimeter) setComparisonByPerimeter(parsed.comparisonByPerimeter);
          if (parsed.rechercheValue) setRechercheValue(parsed.rechercheValue);

          console.log('État restauré depuis sessionStorage:', parsed);
        }
      } catch (error) {
        console.error('Erreur lors de la restauration de l\'état:', error);
      }
    }
  }, [searchParams]); // S'exécuter à chaque changement de searchParams

  useEffect(() => {
    if (comparisonMode) {
      const saved = comparisonByPerimeter[perimetre] || [];
      setComparedElements(saved);
    }
  }, [perimetre, comparisonMode]);

  useEffect(() => {
    if (comparisonMode) {
      setComparisonByPerimeter({
        ...comparisonByPerimeter,
        [perimetre]: comparedElements,
      });
    }
  }, [comparedElements, comparisonMode]);

  const getPerimetreLabel = () => {
    const labels: Record<PerimetreType, string> = {
      Marché: "marché",
      "Marché détaillé": "marché détaillé",
      Catégorie: "catégorie",
      "Groupe Famille": "groupe famille",
      Famille: "famille",
      "Sous Famille": "sous famille",
      Produit: "produit",
      Fournisseur: "fournisseur",
      Portefeuille: "portefeuille",
      Pays: "pays",
    };
    return labels[perimetre] || "élément";
  };

  // Fonction helper pour mettre à jour l'URL avec le périmètre et les filtres
  const updateURL = useCallback(
    (newPerimetre: PerimetreType, newFilters: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("perimetre", newPerimetre);

      // Ajouter les filtres actifs à l'URL
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "tous") {
          params.set(key, value);
        }
      });

      router.replace(`/analyse-valeur?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Sauvegarder l'état de la page à chaque changement
  useEffect(() => {
    const pageState: AnalyseValeurPageState = {
      perimetre,
      filters,
      fournisseurSelections,
      paysSelections,
      portefeuilleSelections,
      comparisonMode,
      comparedElements,
      comparisonByPerimeter,
      rechercheValue,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('page-state-analyse-valeur', JSON.stringify(pageState));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état:', error);
      }
    }
  }, [perimetre, filters, fournisseurSelections, paysSelections, portefeuilleSelections, comparisonMode, comparedElements, comparisonByPerimeter, rechercheValue]);

  // States pour le tri
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  // Handler pour changer un filtre individuel (mémoïsé)
  const handleFilterChange = useCallback(
    (filterType: string, value: string) => {
      const newFilters = { ...filters, [filterType]: value };
      setFilters(newFilters);
      updateURL(perimetre, newFilters);
    },
    [filters, perimetre, updateURL]
  );

  // Fonction pour réinitialiser la recherche
  const resetRecherche = useCallback(() => {
    const filterKey = perimetreToFilterKey[perimetre];

    if (filterKey) {
      const newFilters = { ...filters, [filterKey]: "tous" };
      setFilters(newFilters);
      // Utiliser setTimeout pour éviter l'erreur de setState pendant le rendu
      setTimeout(() => {
        updateURL(perimetre, newFilters);
      }, 0);
    }

    setRechercheValue("");
    setSearchInputValue("");
    setOpenRecherche(false);
  }, [perimetre, filters, updateURL]);

  // Réinitialiser la recherche quand on change de périmètre
  useEffect(() => {
    const filterKey = perimetreToFilterKey[perimetre];
    if (filterKey) {
      setFilters((prev) => ({ ...prev, [filterKey]: "tous" }));
    }
    setRechercheValue("");
    setSearchInputValue("");
    setOpenRecherche(false);
  }, [perimetre]);

  // Obtenir les filtres disponibles pour le périmètre actuel
  const visibleFilters = useMemo(() => {
    return getAvailableFilters(perimetre);
  }, [perimetre]);

  // Séparer les filtres en deux groupes
  const hierarchyFilters = useMemo(() => {
    const hierarchy: FilterType[] = [
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
    ];
    return visibleFilters.filter((f) => hierarchy.includes(f));
  }, [visibleFilters]);

  const otherFilters = useMemo(() => {
    const others: FilterType[] = ["pays", "portefeuille"];
    return visibleFilters.filter((f) => {
      // Exclure le filtre qui correspond au périmètre actuel
      if (perimetre === "Portefeuille" && f === "portefeuille") return false;
      return others.includes(f);
    });
  }, [visibleFilters, perimetre]);

  // Vérifier si le filtre fournisseur est visible
  const showFournisseurFilter = useMemo(() => {
    return (
      visibleFilters.includes("fournisseur") && perimetre !== "Fournisseur"
    );
  }, [visibleFilters, perimetre]);

  // Synchroniser les sélections temporaires quand on ouvre le popover
  useEffect(() => {
    if (openFournisseur) {
      setTempFournisseurSelections(fournisseurSelections);
    }
  }, [openFournisseur, fournisseurSelections]);

  // Synchroniser les sélections temporaires pays quand on ouvre le popover
  useEffect(() => {
    if (openPays) {
      setTempPaysSelections(paysSelections);
    }
  }, [openPays, paysSelections]);

  // Synchroniser les sélections temporaires portefeuille quand on ouvre le popover
  useEffect(() => {
    if (openPortefeuille) {
      setTempPortefeuilleSelections(portefeuilleSelections);
    }
  }, [openPortefeuille, portefeuilleSelections]);

  // Options de périmètre
  const perimetreOptions = [
    { value: "Marché" as const, label: "Marché" },
    { value: "Marché détaillé" as const, label: "Marché détaillé" },
    { value: "Catégorie" as const, label: "Catégorie" },
    { value: "Groupe Famille" as const, label: "Groupe Famille" },
    { value: "Famille" as const, label: "Famille" },
    { value: "Sous Famille" as const, label: "Sous Famille" },
    { value: "Produit" as const, label: "Produit" },
    { value: "Fournisseur" as const, label: "Fournisseur" },
    { value: "Portefeuille" as const, label: "Portefeuille" },
  ];

  // Générer le placeholder de recherche dynamique (mémoïsé)
  const getSearchPlaceholder = useMemo(() => {
    const articles: Record<PerimetreType, string> = {
      Marché: "un marché",
      "Marché détaillé": "un marché détaillé",
      Catégorie: "une catégorie",
      "Groupe Famille": "un groupe famille",
      Famille: "une famille",
      "Sous Famille": "une sous famille",
      Produit: "un produit ou EAN",
      Fournisseur: "un fournisseur",
      Portefeuille: "un portefeuille",
      Pays: "un pays", // ← Ajoutez cette ligne
    };
    return `Rechercher ${articles[perimetre]}`;
  }, [perimetre]);

  // Obtenir les données du périmètre avec filtres
  const rawData = useMemo(() => {
    const activeFilters: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "tous") {
        activeFilters[key] = value;
      }
    });
    return getPerimetreData(perimetre, activeFilters);
  }, [perimetre, filters]);

  // Fonction pour extraire la valeur numérique d'une métrique pour le tri (mémoïsée)
  const parseMetricValue = useCallback((metric: any): number => {
    if (typeof metric === "string") {
      const cleaned = metric.replace(/[^\d.,-]/g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    }
    if (typeof metric === "object" && metric.valeur) {
      const cleaned = metric.valeur.replace(/[^\d.,-]/g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }, []);

  // Fonction pour gérer le tri (mémoïsée)
  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortColumn(null);
          setSortDirection(null);
        }
      } else {
        setSortColumn(column);
        setSortDirection("asc");
      }
    },
    [sortColumn, sortDirection]
  );

  // Trier les données (optimisé)
  const sortedData = useMemo(() => {
    // Si pas de tri, retourner directement les données
    if (!sortColumn || !sortDirection) return rawData;

    return [...rawData].sort((a, b) => {
      if (sortColumn === "label") {
        const aValue = a.label.toLowerCase();
        const bValue = b.label.toLowerCase();
        const result = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? result : -result;
      } else if (sortColumn === "volume") {
        // Tri spécial pour la colonne volume qui dépend de volumeUnit (toujours CAD)
        const aValue = a.volume?.[volumeUnit]?.['CAD'] ? parseMetricValue(a.volume[volumeUnit]['CAD']) : 0;
        const bValue = b.volume?.[volumeUnit]?.['CAD'] ? parseMetricValue(b.volume[volumeUnit]['CAD']) : 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        const aValue = parseMetricValue(a[sortColumn as keyof typeof a]);
        const bValue = parseMetricValue(b[sortColumn as keyof typeof b]);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  }, [rawData, sortColumn, sortDirection, parseMetricValue, volumeUnit]);

  // Réinitialiser les filtres quand le périmètre change (mémoïsé)
  const handlePerimetreChange = useCallback(
    (newPerimetre: PerimetreType) => {
      // Sauvegarder l'état actuel dans l'historique
      setNavigationHistory((prev) => [
        ...prev,
        {
          perimetre,
          filters: { ...filters },
          fournisseurSelections: [...fournisseurSelections],
          paysSelections: [...paysSelections],
          portefeuilleSelections: [...portefeuilleSelections]
        },
      ]);

      const newFilters = {
        pays: "tous",
        marche: "tous",
        marcheDetaille: "tous",
        categorie: "tous",
        groupeFamille: "tous",
        famille: "tous",
        sousFamille: "tous",
        fournisseur: "tous",
        portefeuille: "tous",
      };

      // Désactiver le mode comparaison si on passe au périmètre Marché
      if (newPerimetre === "Marché") {
        setComparisonMode(false);
      }

      setPerimetre(newPerimetre);
      setFilters(newFilters);
      setFournisseurSelections([]);
      setTempFournisseurSelections([]);
      setPaysSelections([]);
      setTempPaysSelections([]);
      setPortefeuilleSelections([]);
      setTempPortefeuilleSelections([]);
      updateURL(newPerimetre, newFilters);
    },
    [perimetre, filters, fournisseurSelections, paysSelections, portefeuilleSelections, updateURL]
  );

  // Navigation vers un sous-niveau avec filtre (mémoïsé)
  const handleSubLevelNavigation = useCallback(
    (targetPerimetre: PerimetreType, filterValue: string) => {
      // Sauvegarder l'état actuel dans l'historique
      setNavigationHistory((prev) => [
        ...prev,
        {
          perimetre,
          filters: { ...filters },
          fournisseurSelections: [...fournisseurSelections],
          paysSelections: [...paysSelections],
          portefeuilleSelections: [...portefeuilleSelections]
        },
      ]);

      // Obtenir la clé du filtre pour ce périmètre
      const filterKey = perimetreToFilterKey[perimetre];

      // Appliquer les filtres : garder les filtres actifs + ajouter le nouveau
      const newFilters = { ...filters };
      if (filterKey) {
        newFilters[filterKey] = filterValue;
      }

      // Changer le périmètre
      setPerimetre(targetPerimetre);
      setFilters(newFilters);
      updateURL(targetPerimetre, newFilters);
    },
    [perimetre, filters, fournisseurSelections, paysSelections, portefeuilleSelections, updateURL]
  );

  // Retour au périmètre précédent (mémoïsé)
  const handleBackNavigation = useCallback(() => {
    // Si l'historique est vide, ne rien faire (le bouton sera désactivé)
    if (navigationHistory.length === 0) {
      return;
    }

    // Récupérer le dernier état de l'historique
    const previousState = navigationHistory[navigationHistory.length - 1];

    // Restaurer l'état
    setPerimetre(previousState.perimetre);
    setFilters(previousState.filters);
    setFournisseurSelections(previousState.fournisseurSelections);
    setTempFournisseurSelections(previousState.fournisseurSelections);
    setPaysSelections(previousState.paysSelections);
    setTempPaysSelections(previousState.paysSelections);
    setPortefeuilleSelections(previousState.portefeuilleSelections);
    setTempPortefeuilleSelections(previousState.portefeuilleSelections);
    updateURL(previousState.perimetre, previousState.filters);

    // Retirer cet état de l'historique
    setNavigationHistory((prev) => prev.slice(0, -1));
  }, [navigationHistory, updateURL]);

  // Helper pour obtenir les options d'un filtre (mémoïsé pour éviter les recalculs)
  const getFilterOptions = useCallback(
    (filterType: string): string[] => {
      // Pour pays, fournisseur et portefeuille, retourner les listes complètes (constantes)
      if (filterType === "pays") {
        return [
          "France",
          "Espagne",
          "Belgique",
          "Roumanie",
          "Pologne",
          "Italie",
        ];
      }
      if (filterType === "fournisseur") {
        return [
          "Labeyrie Fine Foods",
          "Picard Surgelés",
          "Lactalis Foodservice",
          "Fleury Michon",
          "Danone Professionnel",
          "Nestlé Professional",
          "Sysco France",
          "Transgourmet",
          "Metro Cash & Carry",
          "Brake France",
        ];
      }
      if (filterType === "portefeuille") {
        return PORTEFEUILLE_NAMES;
      }

      // Pour les autres filtres, récupérer les valeurs depuis les données (sans filtres pour avoir toutes les options)
      const data = getPerimetreData(perimetre);
      const uniqueValues = new Set<string>();

      data.forEach((item) => {
        if (filterType in item) {
          const value = item[filterType as keyof typeof item];
          if (value) {
            uniqueValues.add(String(value));
          }
        }
      });

      return Array.from(uniqueValues);
    },
    [perimetre]
  );

  // Filtrer les fournisseurs selon la recherche
  const filteredFournisseurs = useMemo(() => {
    const allFournisseurs = getFilterOptions("fournisseur");
    if (!fournisseurSearch) return allFournisseurs;
    return allFournisseurs.filter((f) =>
      f.toLowerCase().includes(fournisseurSearch.toLowerCase())
    );
  }, [fournisseurSearch, getFilterOptions]);

  // Filtrer les pays selon la recherche
  const filteredPays = useMemo(() => {
    const allPays = getFilterOptions("pays");
    if (!paysSearch) return allPays;
    return allPays.filter((p) =>
      p.toLowerCase().includes(paysSearch.toLowerCase())
    );
  }, [paysSearch, getFilterOptions]);

  // Filtrer les portefeuilles selon la recherche
  const filteredPortefeuilles = useMemo(() => {
    const allPortefeuilles = getFilterOptions("portefeuille");
    if (!portefeuilleSearch) return allPortefeuilles;
    return allPortefeuilles.filter((p) =>
      p.toLowerCase().includes(portefeuilleSearch.toLowerCase())
    );
  }, [portefeuilleSearch, getFilterOptions]);

  // Vérifier si au moins un filtre est actif
  const hasActiveFilters = useMemo(() => {
    const filterKeys: FilterType[] = [
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
      "pays",
      "fournisseur",
      "portefeuille",
    ];
    return (
      filterKeys.some((key) => filters[key] && filters[key] !== "tous") ||
      fournisseurSelections.length > 0 ||
      paysSelections.length > 0 ||
      portefeuilleSelections.length > 0
    );
  }, [filters, fournisseurSelections, paysSelections, portefeuilleSelections]);

  // Réinitialiser tous les filtres (mémoïsé)
  const handleResetFilters = useCallback(() => {
    const newFilters = {
      pays: "tous",
      marche: "tous",
      marcheDetaille: "tous",
      categorie: "tous",
      groupeFamille: "tous",
      famille: "tous",
      sousFamille: "tous",
      fournisseur: "tous",
      portefeuille: "tous",
    };
    setFilters(newFilters);
    setFournisseurSelections([]);
    setTempFournisseurSelections([]);
    setPaysSelections([]);
    setTempPaysSelections([]);
    setPortefeuilleSelections([]);
    setTempPortefeuilleSelections([]);
    updateURL(perimetre, newFilters);
  }, [perimetre, updateURL]);

  // Obtenir les sous-niveaux pour le périmètre actuel
  const subLevels = useMemo(() => {
    return getSubLevels(perimetre);
  }, [perimetre]);

  // Calculer les comptages des sous-niveaux pour chaque ligne (optimisé avec cache)
  const dataWithSubLevelCounts = useMemo(() => {
    // Extraire uniquement les filtres actifs
    const activeFilters: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "tous") {
        activeFilters[key] = value;
      }
    });

    // Calculer les counts pour chaque item (le cache dans calculateSubLevelCounts évite les recalculs)
    return sortedData.map((item) => ({
      ...item,
      subLevelCounts: calculateSubLevelCounts(perimetre, item, activeFilters),
    }));
  }, [sortedData, perimetre, filters]);

  // Pagination
  const totalItems = dataWithSubLevelCounts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return dataWithSubLevelCounts.slice(startIndex, endIndex);
  }, [dataWithSubLevelCounts, currentPage, rowsPerPage]);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedData, rowsPerPage]);

  // Fonction pour télécharger le tableau en CSV
  const downloadTableAsCSV = useCallback(() => {
    // Définir les en-têtes selon le périmètre
    const headers = [
      perimetreOptions.find((p) => p.value === perimetre)?.label || '',
      `Volume (${volumeUnit})`,
      'MP',
      'Emballage',
      perimetre === "Produit" ? "PA" : "CA",
      perimetre === "Produit" ? "PA théorique" : "CA théorique",
    ];

    if (perimetre === "Produit") {
      headers.push("PV", "PV LCL", "Marge PV LCL");
    }

    headers.push("Opportunité");

    // Créer les lignes de données
    const rows = dataWithSubLevelCounts.map((row) => {
      const line = [
        row.label,
        row.volume?.[volumeUnit]?.['CAD']?.valeur || 'N/A',
        row.mpa.valeur,
        row.mpi.valeur,
        perimetre === "Produit" && row.paUnitaire ? row.paUnitaire.valeur : row.evoPa.valeur,
        perimetre === "Produit" && row.coutTheoriqueUnitaire ? row.coutTheoriqueUnitaire.valeur : row.coutTheorique.valeur,
      ];

      if (perimetre === "Produit") {
        line.push(
          row.pv?.valeur || '',
          row.pvLeclerc?.valeur || '',
          row.margePvLcl?.valeur || ''
        );
      }

      line.push(row.opportunites.valeur);

      return line;
    });

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Créer le blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `analyse-valeur-${perimetre}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [dataWithSubLevelCounts, perimetre, volumeUnit]);

  return (
    <main className="w-full px-[50px] py-4">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        className="-ml-2 mb-2 gap-2 text-sm"
        onClick={handleBackNavigation}
        disabled={navigationHistory.length === 0}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Titre + Switch */}
      <div className="mb-8 flex items-center gap-8">
        <h1 className="text-[40px] font-bold">Analyse de la valeur</h1>

        <div
          className="flex items-center gap-4"
          style={{ opacity: perimetre === "Marché" ? 0.6 : 1 }}
        >
          <Switch
            id="comparison-mode"
            checked={comparisonMode}
            onCheckedChange={setComparisonMode}
            disabled={perimetre === "Marché"}
          />
          <Label
            htmlFor="comparison-mode"
            className={
              perimetre === "Marché"
                ? "text-sm text-gray-600"
                : "cursor-pointer text-sm text-gray-600"
            }
          >
            Mode comparaison
          </Label>
        </div>
      </div>

      {/* FILTRES - Ligne 1 : 3 cards */}
      <div className="mb-6 flex flex-wrap gap-x-2 gap-y-4">
        {/* Périmètre d'analyse */}
        <InlineField label="Périmètre d'analyse">
          <SelectV2
            value={perimetre}
            onValueChange={(value) =>
              handlePerimetreChange(value as PerimetreType)
            }
          >
            <SelectTriggerV2 size="sm" width="auto">
              <SelectValueV2 />
            </SelectTriggerV2>
            <SelectContentV2>
              {perimetreOptions.map((option) => (
                <SelectItemV2 key={option.value} value={option.value}>
                  {option.label}
                </SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Recherche dynamique (Autocomplete) - masqué pour le périmètre Marché - affiché ici uniquement si mode comparaison OFF */}
        {perimetre !== "Marché" && !comparisonMode && (
          <Autocomplete
            options={sortedData.map((item) => ({ value: item.label, label: item.label }))}
            value={rechercheValue}
            onValueChange={(value) => {
              setRechercheValue(value);

              // Vérifier si c'est une option valide (sélection)
              const isValidOption = sortedData.some((item) => item.label === value);
              if (isValidOption) {
                const filterKey = perimetreToFilterKey[perimetre];
                if (filterKey) {
                  const newFilters = {
                    ...filters,
                    [filterKey]: value,
                  };
                  setFilters(newFilters);
                  // Utiliser setTimeout pour éviter l'erreur de setState pendant le rendu
                  setTimeout(() => {
                    updateURL(perimetre, newFilters);
                  }, 0);
                }
              }
            }}
            placeholder={getSearchPlaceholder}
            emptyMessage="Aucun résultat trouvé."
            minChars={3}
            size="md"
            className="w-[280px]"
            hideSearchIcon
            endAddon={
              rechercheValue ? (
                <X
                  className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetRecherche();
                  }}
                />
              ) : (
                <Search className="h-5 w-5 text-primary" />
              )
            }
          />
        )}

        {/* Période */}
        <InlineField label="Période">
          <DatePickerV2
            mode="period"
            size="sm"
            value={period}
            onValueChange={setPeriod}
            minDate={{ month: 0, year: 2018 }}
            maxDate={{ month: 11, year: 2025 }}
            showValidateButton
          />
        </InlineField>

        {/* Prix */}
        <InlineField label="Prix">
          <SelectV2
            value={typePrix}
            onValueChange={(value) => setTypePrix(value as "Prix départ" | "Prix franco")}
          >
            <SelectTriggerV2 size="sm" width="auto">
              <SelectValueV2 />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="Prix départ">Prix départ</SelectItemV2>
              <SelectItemV2 value="Prix franco">Prix franco</SelectItemV2>
            </SelectContentV2>
          </SelectV2>
        </InlineField>
      </div>

      {/* MODE COMPARAISON - Cards de sélection */}
      {comparisonMode && (
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex gap-4 flex-1">
            {[0, 1, 2, 3].map((index) => {
              const element = comparedElements[index];

              return (
                <Card
                  key={index}
                  className={`flex-1 min-h-[120px] shadow-none rounded-lg ${
                    element
                      ? "border-2 border-blue"
                      : "border-2 border-dashed border-gray-300"
                  }`}
                >
                  <CardContent className="p-4 relative">
                    {element ? (
                      <>
                        <button
                          onClick={() => removeFromComparison(element.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="font-semibold text-sm mb-2 pr-6">
                          {element.name}
                        </div>

                        {Object.entries(
                          filterDisplayableFilters(element.filters)
                        ).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(
                              filterDisplayableFilters(element.filters)
                            ).map(([key, value]) => (
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
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        {index === 0 ? (
                          <div className="text-sm text-gray-500">
                            Sélectionnez le premier {getPerimetreLabel()} à
                            comparer
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Élément {index + 1}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={goToComparison}
            disabled={comparedElements.length < 2}
            className="px-8"
          >
            Comparer
          </Button>
        </div>
      )}

      {/* INPUT RECHERCHE - Affiché ici quand mode comparaison ON */}
      {comparisonMode && perimetre !== "Marché" && (
        <div className="mb-4">
          <Autocomplete
            options={sortedData.map((item) => ({ value: item.label, label: item.label }))}
            value={rechercheValue}
            onValueChange={(value) => {
              setRechercheValue(value);

              // Vérifier si c'est une option valide (sélection)
              const isValidOption = sortedData.some((item) => item.label === value);
              if (isValidOption) {
                const filterKey = perimetreToFilterKey[perimetre];
                if (filterKey) {
                  const newFilters = {
                    ...filters,
                    [filterKey]: value,
                  };
                  setFilters(newFilters);
                  // Utiliser setTimeout pour éviter l'erreur de setState pendant le rendu
                  setTimeout(() => {
                    updateURL(perimetre, newFilters);
                  }, 0);
                }
              }
            }}
            placeholder={getSearchPlaceholder}
            emptyMessage="Aucun résultat trouvé."
            minChars={3}
            size="md"
            className="w-[280px]"
            hideSearchIcon
            endAddon={
              rechercheValue ? (
                <X
                  className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetRecherche();
                  }}
                />
              ) : (
                <Search className="h-5 w-5 text-primary" />
              )
            }
          />
        </div>
      )}

      {/* FILTRES - Ligne 2 : Filtres disponibles selon le périmètre */}
      <div className="mb-4 flex flex-wrap gap-2 items-end justify-between">
        <div className="flex flex-wrap gap-2">
        {/* Filtres hiérarchiques (Marché, Catégorie, etc.) */}
        {hierarchyFilters.map((filterType) => (
          <InlineField
            key={filterType}
            label={
              filterType === "marche"
                ? "Marché"
                : filterType === "marcheDetaille"
                ? "Marché détaillé"
                : filterType === "categorie"
                ? "Catégorie"
                : filterType === "groupeFamille"
                ? "Groupe Famille"
                : filterType === "famille"
                ? "Famille"
                : filterType === "sousFamille"
                ? "Sous Famille"
                : filterType.charAt(0).toUpperCase() + filterType.slice(1)
            }
          >
            <SelectV2
              value={filters[filterType] || "tous"}
              onValueChange={(value) => handleFilterChange(filterType, value)}
            >
              <SelectTriggerV2 size="sm" width="auto">
                <SelectValueV2 placeholder="tous" />
              </SelectTriggerV2>
              <SelectContentV2>
                <SelectItemV2 value="tous">tous</SelectItemV2>
                {getFilterOptions(filterType).map((option) => (
                  <SelectItemV2 key={option} value={option}>
                    {option}
                  </SelectItemV2>
                ))}
              </SelectContentV2>
            </SelectV2>
          </InlineField>
        ))}

        {/* Pays avec multi-sélection */}
        {otherFilters.includes("pays") && (
          <Card className={`border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none ${hierarchyFilters.length > 0 ? 'ml-2' : ''}`}>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 break-words">
                Pays
              </Label>
              <Popover open={openPays} onOpenChange={setOpenPays}>
                <PopoverTrigger asChild>
                  <div
                    className={`flex h-9 w-auto items-center whitespace-nowrap rounded-md border border-gray-200 bg-white text-[16px] shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                      paysSelections.length === 0 ? "pl-3 py-2" : "p-0.5"
                    }`}
                    onClick={() => setOpenPays(true)}
                  >
                    {paysSelections.length === 0 ? (
                      <span className="text-[16px]">tous</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 overflow-hidden flex-wrap">
                        {paysSelections.slice(0, 2).map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                          >
                            <span className="text-[14px] font-medium">{p}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaysSelections((prev) =>
                                  prev.filter((item) => item !== p)
                                );
                                setTempPaysSelections((prev) =>
                                  prev.filter((item) => item !== p)
                                );
                              }}
                              className="text-[#0970E6] hover:text-[#075bb3]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {paysSelections.length > 2 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{paysSelections.length - 2}
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
                        placeholder="Rechercher pays..."
                        value={paysSearch}
                        onChange={(e) => setPaysSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* Bouton Tout désélectionner */}
                    {tempPaysSelections.length > 0 && (
                      <div className="px-3 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-600 hover:text-gray-900"
                          onClick={() => setTempPaysSelections([])}
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    )}

                    {/* Liste avec checkboxes */}
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredPays.map((p) => (
                        <div
                          key={p}
                          className="flex items-center gap-2 px-4 py-4 rounded cursor-pointer"
                          onClick={() => {
                            setTempPaysSelections((prev) =>
                              prev.includes(p)
                                ? prev.filter((item) => item !== p)
                                : [...prev, p]
                            );
                          }}
                        >
                          <Checkbox
                            checked={tempPaysSelections.includes(p)}
                            onCheckedChange={(checked) => {
                              setTempPaysSelections((prev) =>
                                checked
                                  ? [...prev, p]
                                  : prev.filter((item) => item !== p)
                              );
                            }}
                          />
                          <span className="text-[16px]">{p}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton Valider */}
                    <div className="p-3 border-t">
                      <Button
                        className="w-full bg-[#0970E6] hover:bg-[#075bb3] text-white"
                        onClick={() => {
                          setPaysSelections(tempPaysSelections);
                          setOpenPays(false);
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
        )}

        {/* Fournisseur avec multi-sélection */}
        {showFournisseurFilter && (
          <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 break-words">
                Fournisseur
              </Label>
              <Popover open={openFournisseur} onOpenChange={setOpenFournisseur}>
                <PopoverTrigger asChild>
                  <div
                    className={`flex h-9 w-auto items-center whitespace-nowrap rounded-md border border-gray-200 bg-white text-[16px] shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                      fournisseurSelections.length === 0 ? "pl-3 py-2" : "p-0.5"
                    }`}
                    onClick={() => setOpenFournisseur(true)}
                  >
                    {fournisseurSelections.length === 0 ? (
                      <span className="text-[16px]">tous</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 overflow-hidden flex-wrap">
                        {fournisseurSelections.slice(0, 2).map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                          >
                            <span className="text-[14px] font-medium">{f}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFournisseurSelections((prev) =>
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
                        {fournisseurSelections.length > 2 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{fournisseurSelections.length - 2}
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
                          setFournisseurSelections(tempFournisseurSelections);
                          setOpenFournisseur(false);
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
        )}

        {/* Portefeuille avec multi-sélection */}
        {otherFilters.includes("portefeuille") && (
          <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 break-words">
                Portefeuille
              </Label>
              <Popover open={openPortefeuille} onOpenChange={setOpenPortefeuille}>
                <PopoverTrigger asChild>
                  <div
                    className={`flex h-9 w-auto items-center whitespace-nowrap rounded-md border border-gray-200 bg-white text-[16px] shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                      portefeuilleSelections.length === 0 ? "pl-3 py-2" : "p-0.5"
                    }`}
                    onClick={() => setOpenPortefeuille(true)}
                  >
                    {portefeuilleSelections.length === 0 ? (
                      <span className="text-[16px]">tous</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 overflow-hidden flex-wrap">
                        {portefeuilleSelections.slice(0, 2).map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                          >
                            <span className="text-[14px] font-medium">{p}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPortefeuilleSelections((prev) =>
                                  prev.filter((item) => item !== p)
                                );
                                setTempPortefeuilleSelections((prev) =>
                                  prev.filter((item) => item !== p)
                                );
                              }}
                              className="text-[#0970E6] hover:text-[#075bb3]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {portefeuilleSelections.length > 2 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{portefeuilleSelections.length - 2}
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
                        placeholder="Rechercher portefeuille..."
                        value={portefeuilleSearch}
                        onChange={(e) => setPortefeuilleSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* Bouton Tout désélectionner */}
                    {tempPortefeuilleSelections.length > 0 && (
                      <div className="px-3 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-600 hover:text-gray-900"
                          onClick={() => setTempPortefeuilleSelections([])}
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    )}

                    {/* Liste avec checkboxes */}
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredPortefeuilles.map((p) => (
                        <div
                          key={p}
                          className="flex items-center gap-2 px-4 py-4 rounded cursor-pointer"
                          onClick={() => {
                            setTempPortefeuilleSelections((prev) =>
                              prev.includes(p)
                                ? prev.filter((item) => item !== p)
                                : [...prev, p]
                            );
                          }}
                        >
                          <Checkbox
                            checked={tempPortefeuilleSelections.includes(p)}
                            onCheckedChange={(checked) => {
                              setTempPortefeuilleSelections((prev) =>
                                checked
                                  ? [...prev, p]
                                  : prev.filter((item) => item !== p)
                              );
                            }}
                          />
                          <span className="text-[16px]">{p}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton Valider */}
                    <div className="p-3 border-t">
                      <Button
                        className="w-full bg-[#0970E6] hover:bg-[#075bb3] text-white"
                        onClick={() => {
                          setPortefeuilleSelections(tempPortefeuilleSelections);
                          setOpenPortefeuille(false);
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
        )}

        {/* Bouton Réinitialiser */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="h-[52px] border-blue text-blue bg-white hover:border-[#004E9B] hover:text-[#004E9B]"
          >
            Réinitialiser
          </Button>
        )}
        </div>

        {/* Icône téléchargement */}
        <button
          onClick={downloadTableAsCSV}
          className="text-[#0970E6] hover:text-[#075bb3] p-2 transition-colors"
          title="Télécharger le tableau"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* TABLEAU */}
      <TooltipProvider>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[300px] font-semibold pl-4">
                  <div className="flex items-center gap-2">
                    {perimetreOptions.find((p) => p.value === perimetre)
                      ?.label || ""}{" "}
                    ({dataWithSubLevelCounts.length})
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() => handleSort("label")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    Volume
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleVolumeUnit();
                      }}
                      className="px-1.5 py-0.5 text-[12px] font-bold bg-blue-50 text-blue-600 rounded border border-black hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                    >
                      {volumeUnit} <SwitchIcon className="w-4 h-3.5" />
                    </button>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Volume total en {volumeUnit === 'UVC' ? 'unités de vente consommateur' : 'tonnes'}
                      </TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() => handleSort("volume")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    MP
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>Marge Prix Achat</TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() => handleSort("mpa")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    Emballage
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>Marge Prix Industriel</TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() => handleSort("mpi")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    {perimetre === "Produit" ? "PA" : "CA"}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {perimetre === "Produit"
                          ? "Prix d'achat unitaire"
                          : "Chiffre d'affaires total"}
                      </TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() =>
                        handleSort(
                          perimetre === "Produit" ? "paUnitaire" : "evoPa"
                        )
                      }
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    {perimetre === "Produit" ? "PA théorique" : "CA théorique"}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {perimetre === "Produit"
                          ? "PA théorique unitaire"
                          : "CA théorique total"}
                      </TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() =>
                        handleSort(
                          perimetre === "Produit"
                            ? "coutTheoriqueUnitaire"
                            : "coutTheorique"
                        )
                      }
                    />
                  </div>
                </TableHead>
                {perimetre === "Produit" && (
                  <>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-2">
                        PV
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-[#121212]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Prix de vente Carrefour
                          </TooltipContent>
                        </Tooltip>
                        <ChevronsUpDown
                          className="h-4 w-4 cursor-pointer text-[#121212]"
                          onClick={() => handleSort("pv")}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-2">
                        PV LCL
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-[#121212]" />
                          </TooltipTrigger>
                          <TooltipContent>Prix de vente Leclerc</TooltipContent>
                        </Tooltip>
                        <ChevronsUpDown
                          className="h-4 w-4 cursor-pointer text-[#121212]"
                          onClick={() => handleSort("pvLeclerc")}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-2">
                        Marge PV LCL
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-[#121212]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Marge entre PA et PV LCL
                          </TooltipContent>
                        </Tooltip>
                        <ChevronsUpDown
                          className="h-4 w-4 cursor-pointer text-[#121212]"
                          onClick={() => handleSort("margePvLcl")}
                        />
                      </div>
                    </TableHead>
                  </>
                )}
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    Opportunité
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#121212]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Opportunité d&apos;économie
                      </TooltipContent>
                    </Tooltip>
                    <ChevronsUpDown
                      className="h-4 w-4 cursor-pointer text-[#121212]"
                      onClick={() => handleSort("opportunites")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={perimetre === "Produit" ? 11 : 8}
                    className="text-center text-gray-500"
                  >
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const isSelected = isElementSelected(row.label);

                  return (
                    <TableRow
                      key={`${row.label}-${index}`}
                      className={
                        comparisonMode && !isSelected
                          ? "cursor-pointer hover:bg-gray-50"
                          : "cursor-pointer hover:bg-gray-50"
                      }
                      onClick={() => {
                        if (comparisonMode && !isSelected) {
                          addToComparison(row.label);
                        } else if (!comparisonMode) {
                          router.push(
                            `/detail?perimetre=${encodeURIComponent(
                              perimetre
                            )}&label=${encodeURIComponent(row.label)}`
                          );
                        }
                      }}
                    >
                      {/* Nom + Liens des sous-niveaux */}
                      <TableCell className="pl-4">
                        <div className="flex flex-col gap-2">
                          {/* Titre en haut */}
                          <div>
                            <div className="font-bold">{row.label}</div>
                            {/* EAN (uniquement pour les produits) */}
                            {perimetre === "Produit" && row.ean && (
                              <div className="text-[12px]" style={{ color: '#454545' }}>{row.ean}</div>
                            )}
                          </div>

                          {/* Liens horizontaux en dessous */}
                          {subLevels.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {subLevels.map((subLevel) => {
                                const count = row.subLevelCounts[subLevel] || 0;
                                if (count === 0) return null;

                                return (
                                  <button
                                    key={subLevel}
                                    className="text-sm hover:underline font-medium"
                                    style={{ color: "#0970E6" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubLevelNavigation(
                                        subLevel,
                                        row.label
                                      );
                                    }}
                                  >
                                    {count} {perimetreAbbreviations[subLevel]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Volume */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {row.volume?.[volumeUnit]?.['CAD']?.valeur || 'N/A'}
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              row.volume?.[volumeUnit]?.['CAD']?.evolution?.startsWith("+")
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {row.volume?.[volumeUnit]?.['CAD']?.evolution || 'N/A'}
                          </div>
                        </div>
                      </TableCell>

                      {/* MP */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            {row.mpa.valeur}
                            <SimulationTag seed={`av-mp-${row.id}`} />
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              row.mpa.evolution.startsWith("+")
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {row.mpa.evolution}
                          </div>
                        </div>
                      </TableCell>

                      {/* Emballage */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            {row.mpi.valeur}
                            <SimulationTag seed={`av-emb-${row.id}`} />
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              row.mpi.evolution.startsWith("+")
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {row.mpi.evolution}
                          </div>
                        </div>
                      </TableCell>

                      {/* CA */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            {perimetre === "Produit" && row.paUnitaire
                              ? row.paUnitaire.valeur
                              : row.evoPa.valeur}
                            <SimulationTag seed={`av-ca-${row.id}`} />
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              (perimetre === "Produit" && row.paUnitaire
                                ? row.paUnitaire.evolution
                                : row.evoPa.evolution
                              ).startsWith("+")
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {perimetre === "Produit" && row.paUnitaire
                              ? row.paUnitaire.evolution
                              : row.evoPa.evolution}
                          </div>
                        </div>
                      </TableCell>

                      {/* CA théorique */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            {perimetre === "Produit" &&
                            row.coutTheoriqueUnitaire
                              ? row.coutTheoriqueUnitaire.valeur
                              : row.coutTheorique.valeur}
                            <SimulationTag seed={`av-cathe-${row.id}`} />
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              (perimetre === "Produit" &&
                              row.coutTheoriqueUnitaire
                                ? row.coutTheoriqueUnitaire.evolution
                                : row.coutTheorique.evolution
                              ).startsWith("+")
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {perimetre === "Produit" &&
                            row.coutTheoriqueUnitaire
                              ? row.coutTheoriqueUnitaire.evolution
                              : row.coutTheorique.evolution}
                          </div>
                        </div>
                      </TableCell>

                      {/* PV */}
                      {perimetre === "Produit" && row.pv && (
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center">
                              {row.pv.valeur}
                              <SimulationTag seed={`av-pv-${row.id}`} />
                            </div>
                            <div
                              className={cn(
                                "font-medium",
                                row.pv.evolution.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {row.pv.evolution}
                            </div>
                          </div>
                        </TableCell>
                      )}

                      {/* PV LCL */}
                      {perimetre === "Produit" && row.pvLeclerc && (
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center">
                              {row.pvLeclerc.valeur}
                              <SimulationTag seed={`av-pvlcl-${row.id}`} />
                            </div>
                            <div
                              className={cn(
                                "font-medium",
                                row.pvLeclerc.evolution.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {row.pvLeclerc.evolution}
                            </div>
                          </div>
                        </TableCell>
                      )}

                      {/* Marge PV LCL */}
                      {perimetre === "Produit" && row.margePvLcl && (
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center">
                              {row.margePvLcl.valeur}
                              <SimulationTag seed={`av-marge-${row.id}`} />
                            </div>
                            <div
                              className={cn(
                                "font-medium",
                                row.margePvLcl.evolution.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {row.margePvLcl.evolution}
                            </div>
                          </div>
                        </TableCell>
                      )}

                      {/* Opportunités */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            {row.opportunites.valeur}
                            <SimulationTag seed={`av-opp-${row.id}`} isOpportunity />
                          </div>
                          <div
                            className={cn(
                              "font-medium",
                              row.opportunites.evolution.startsWith("+")
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {row.opportunites.evolution}
                          </div>
                        </div>
                      </TableCell>

                      {/* Colonne Eye / Checkbox */}
                      <TableCell
                        className="w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {comparisonMode ? (
                          <Checkbox
                            checked={isSelected}
                            disabled={isSelected}
                            onCheckedChange={() => {
                              if (!isSelected) {
                                addToComparison(row.label);
                              }
                            }}
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/detail?perimetre=${encodeURIComponent(
                                  perimetre
                                )}&label=${encodeURIComponent(row.label)}`
                              );
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-end gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Lignes par page:</span>
              <SelectV2 value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))}>
                <SelectTriggerV2 size="sm" width="auto" className="w-[80px]">
                  <SelectValueV2 />
                </SelectTriggerV2>
                <SelectContentV2>
                  <SelectItemV2 value="20">20</SelectItemV2>
                  <SelectItemV2 value="30">30</SelectItemV2>
                  <SelectItemV2 value="40">40</SelectItemV2>
                  <SelectItemV2 value="50">50</SelectItemV2>
                  <SelectItemV2 value="60">60</SelectItemV2>
                </SelectContentV2>
              </SelectV2>
            </div>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(currentPage - 1)} className="cursor-pointer">
                      {currentPage - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink isActive className="cursor-default">
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(currentPage + 1)} className="cursor-pointer">
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </TooltipProvider>
    </main>
  );
}

export default function AnalyseValeurPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AnalyseValeurContent />
    </Suspense>
  );
}
