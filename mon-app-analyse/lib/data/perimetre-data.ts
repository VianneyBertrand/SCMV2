import {
  type PerimetreType as ContentPerimetreType,
  type PerimetreItem as ContentPerimetreItem,
  type Metric,
  perimetreData,
  perimetreFilters,
  perimetreColumns,
} from "./content";

// Types exportés pour la compatibilité avec la page
export type PerimetreType =
  | "Marché"
  | "Marché détaillé"
  | "Catégorie"
  | "Groupe Famille"
  | "Famille"
  | "Sous Famille"
  | "Produit"
  | "Fournisseur"
  | "Portefeuille"
  | "Pays";

export type FilterType =
  | "pays"
  | "fournisseur"
  | "portefeuille"
  | "marche"
  | "marcheDetaille"
  | "categorie"
  | "groupeFamille"
  | "famille"
  | "sousFamille";

// Hiérarchie des périmètres produits
const productHierarchy: PerimetreType[] = [
  "Marché",
  "Marché détaillé",
  "Catégorie",
  "Groupe Famille",
  "Famille",
  "Sous Famille",
  "Produit",
];

// Mapping entre les types de périmètres et les clés de filtres
export const perimetreToFilterKey: Record<PerimetreType, FilterType | null> = {
  "Marché": "marche",
  "Marché détaillé": "marcheDetaille",
  "Catégorie": "categorie",
  "Groupe Famille": "groupeFamille",
  "Famille": "famille",
  "Sous Famille": "sousFamille",
  "Produit": null,
  "Fournisseur": "fournisseur",
  "Portefeuille": "portefeuille",
  "Pays": "pays",
};

// Mapping pour les abréviations des périmètres
export const perimetreAbbreviations: Record<PerimetreType, string> = {
  "Marché": "MAR",
  "Marché détaillé": "MD",
  "Catégorie": "CAT",
  "Groupe Famille": "GF",
  "Famille": "FAM",
  "Sous Famille": "SF",
  "Produit": "PRO",
  "Fournisseur": "FOU",
  "Portefeuille": "PORT",
  "Pays": "PAYS",
};

// Interface pour une métrique avec valeur et évolution
export interface MetricDisplay {
  valeur: string;
  evolution: string;
}

// Interface adaptée pour la page
export interface PerimetreItem {
  id: string;
  label: string;
  tags?: string[];
  ca: MetricDisplay;
  mpa: MetricDisplay;
  mpi: MetricDisplay;
  evoPa: MetricDisplay;
  coutTheorique: MetricDisplay;
  opportunites: MetricDisplay;
  // Prix de vente (uniquement pour les produits)
  pv?: MetricDisplay;
  pvLeclerc?: MetricDisplay;
  margePvLcl?: MetricDisplay;
  margePvc?: MetricDisplay;
  margeMoyenneCategorielle?: string;
  // Relations hiérarchiques pour le filtrage
  marche?: string;
  marcheDetaille?: string;
  categorie?: string;
  groupeFamille?: string;
  famille?: string;
  sousFamille?: string;
  fournisseur?: string;
  portefeuille?: string;
  pays?: string;
}

export interface PerimetreConfig {
  type: PerimetreType;
  title: string;
  description: string;
  availableFilters: FilterType[];
  columns: string[];
  linkedPerimetres: PerimetreType[];
  getItems: (filters?: Record<string, string>) => PerimetreItem[];
}

// Fonction pour formater une métrique en M€ ou K€
const formatToME = (metric: Metric): MetricDisplay => {
  // Extraire la valeur numérique
  const cleaned = metric.valeur.replace(/[^\d.,-]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);

  // Convertir en M€ (diviser par 1 000 000)
  const valueInME = value / 1000000;

  // Si la valeur en M€ < 1 (ou aurait 1 chiffre après la virgule), afficher en K€
  if (valueInME < 1) {
    const valueInKE = value / 1000;
    return {
      valeur: `${valueInKE.toFixed(2)} K€`,
      evolution: metric.evolution,
    };
  }

  return {
    valeur: `${valueInME.toFixed(2)} M€`,
    evolution: metric.evolution,
  };
};

// Fonction pour formater une métrique en pourcentage
const formatToPercent = (metric: Metric): MetricDisplay => {
  return {
    valeur: metric.valeur,
    evolution: metric.evolution,
  };
};

// Fonction pour formater une métrique en euros (garde le format original)
const formatToCurrency = (metric: Metric): MetricDisplay => {
  return {
    valeur: metric.valeur,
    evolution: metric.evolution,
  };
};

// Fonction helper pour calculer la marge PV LCL
const calculateMargePvLcl = (pvLeclerc: Metric, evoPa: Metric, ca?: Metric): MetricDisplay | null => {
  // Vérifier que tous les paramètres sont définis
  if (!pvLeclerc || !evoPa || !ca) {
    return null;
  }

  // Extraire les valeurs numériques
  const extractNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const pvLclValue = extractNumber(pvLeclerc.valeur);
  const paTotal = extractNumber(evoPa.valeur);
  const caValue = extractNumber(ca.valeur);

  // Protection contre division par zéro
  if (caValue === 0) {
    return null;
  }

  // Calculer le PA unitaire : PA unitaire = (PA total × PV unitaire) / CA
  const paUnitaire = (paTotal * pvLclValue) / caValue;

  // Calculer la marge (PV LCL - PA unitaire)
  const marge = pvLclValue - paUnitaire;

  // Extraire les évolutions en %
  const pvLclEvolution = extractNumber(pvLeclerc.evolution);
  const paEvolution = extractNumber(evoPa.evolution);

  // Calculer l'évolution de la marge
  // Si PV augmente et PA diminue, la marge augmente
  // Si PV diminue et PA augmente, la marge diminue
  const margeEvolution = pvLclEvolution - paEvolution;

  return {
    valeur: `${marge.toFixed(2)}€`,
    evolution: `${margeEvolution >= 0 ? '+' : ''}${margeEvolution.toFixed(2)}%`
  };
};

// Fonction helper pour calculer la marge PVC (PV Carrefour - PA unitaire)
const calculateMargePvc = (pv: Metric, evoPa: Metric, ca?: Metric): MetricDisplay | null => {
  // Vérifier que tous les paramètres sont définis
  if (!pv || !evoPa || !ca) {
    return null;
  }

  // Extraire les valeurs numériques
  const extractNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const pvValue = extractNumber(pv.valeur);
  const paTotal = extractNumber(evoPa.valeur);
  const caValue = extractNumber(ca.valeur);

  // Protection contre division par zéro
  if (caValue === 0) {
    return null;
  }

  // Calculer le PA unitaire : PA unitaire = (PA total × PV unitaire) / CA
  const paUnitaire = (paTotal * pvValue) / caValue;

  // Calculer la marge (PV - PA unitaire)
  const marge = pvValue - paUnitaire;

  // Extraire les évolutions en %
  const pvEvolution = extractNumber(pv.evolution);
  const paEvolution = extractNumber(evoPa.evolution);

  // Calculer l'évolution de la marge
  const margeEvolution = pvEvolution - paEvolution;

  return {
    valeur: `${marge.toFixed(2)}€`,
    evolution: `${margeEvolution >= 0 ? '+' : ''}${margeEvolution.toFixed(2)}%`
  };
};

// Convertir les données de content.ts vers le format de la page
const convertToPageFormat = (items: ContentPerimetreItem[]): PerimetreItem[] => {
  return items.map((item) => {
    // Calculer margePvLcl si pvLeclerc, evoPa et ca sont disponibles
    let margePvLcl: MetricDisplay | undefined = undefined;
    if (item.pvLeclerc && item.evoPa && item.ca) {
      const calculatedMarge = calculateMargePvLcl(item.pvLeclerc, item.evoPa, item.ca);
      if (calculatedMarge !== null) {
        margePvLcl = calculatedMarge;
      }
    }

    // Calculer margePvc si pv, evoPa et ca sont disponibles
    let margePvc: MetricDisplay | undefined = undefined;
    if (item.pv && item.evoPa && item.ca) {
      const calculatedMargePvc = calculateMargePvc(item.pv, item.evoPa, item.ca);
      if (calculatedMargePvc !== null) {
        margePvc = calculatedMargePvc;
      }
    }

    // Marge moyenne catégorielle (valeur statique pour l'instant)
    let margeMoyenneCategorielle: string | undefined = undefined;
    if (item.categorie) {
      margeMoyenneCategorielle = "37.5%";
    }

    return {
      id: item.id,
      label: item.nom,
      tags: item.tags,
      ca: formatToME(item.ca),
      mpa: formatToPercent(item.mpa),
      mpi: formatToPercent(item.mpi),
      evoPa: formatToME(item.evoPa),
      coutTheorique: formatToME(item.coutTheorique),
      opportunites: formatToME(item.opportunite),
      pv: item.pv ? formatToCurrency(item.pv) : undefined,
      pvLeclerc: item.pvLeclerc ? formatToCurrency(item.pvLeclerc) : undefined,
      margePvLcl: margePvLcl,
      margePvc: margePvc,
      margeMoyenneCategorielle: margeMoyenneCategorielle,
      marche: item.marche,
      marcheDetaille: item.marcheDetaille,
      categorie: item.categorie,
      groupeFamille: item.groupeFamille,
      famille: item.famille,
      sousFamille: item.sousFamille,
      fournisseur: item.fournisseur,
      portefeuille: item.portefeuille,
      pays: item.pays,
    };
  });
};

// Fonction pour ajuster les données selon les filtres actifs (optimisée)
const adjustDataForFilters = (
  items: PerimetreItem[],
  filters?: Record<string, string>,
  currentPerimetre?: PerimetreType
): PerimetreItem[] => {
  if (!filters || Object.keys(filters).length === 0) {
    return items;
  }

  const currentFilterKey = currentPerimetre ? perimetreToFilterKey[currentPerimetre] : null;

  // Filtrer en une seule passe (optimisation)
  let filteredItems = items.filter(item => {
    // Filtrer par le périmètre actuel (par label)
    if (currentFilterKey && filters[currentFilterKey] && filters[currentFilterKey] !== "tous") {
      if (item.label !== filters[currentFilterKey]) return false;
    }

    // Filtrer par les autres niveaux hiérarchiques (sauf le périmètre actuel)
    const hierarchyFilters: Array<{ key: FilterType; field: keyof PerimetreItem }> = [
      { key: "marche", field: "marche" },
      { key: "marcheDetaille", field: "marcheDetaille" },
      { key: "categorie", field: "categorie" },
      { key: "groupeFamille", field: "groupeFamille" },
      { key: "famille", field: "famille" },
      { key: "sousFamille", field: "sousFamille" },
    ];

    for (const { key, field } of hierarchyFilters) {
      if (filters[key] && filters[key] !== "tous" && currentFilterKey !== key) {
        if (item[field] !== filters[key]) return false;
      }
    }

    return true;
  });

  // Ajuster les valeurs selon les filtres pays/fournisseur/portefeuille
  let caMultiplier = 1.0;
  let mpaAdjustment = 0;
  let mpiAdjustment = 0;

  // Filtre pays - répartition exacte du CA
  if (filters.pays && filters.pays !== "tous") {
    if (filters.pays === "France") {
      caMultiplier = 0.70; // 70% du CA pour la France
      mpaAdjustment = 2.5; // MPA légèrement plus élevée
    } else if (filters.pays === "Espagne") {
      caMultiplier = 0.15; // 15% du CA pour l'Espagne
      mpaAdjustment = -1;
    } else if (filters.pays === "Belgique") {
      caMultiplier = 0.08; // 8% du CA pour la Belgique
      mpiAdjustment = 1;
    } else if (filters.pays === "Roumanie") {
      caMultiplier = 0.04; // 4% du CA pour la Roumanie
      mpaAdjustment = -2;
    } else if (filters.pays === "Pologne") {
      caMultiplier = 0.02; // 2% du CA pour la Pologne
      mpaAdjustment = -1.5;
    } else if (filters.pays === "Italie") {
      caMultiplier = 0.01; // 1% du CA pour l'Italie
      mpaAdjustment = 0.5;
    }
  }

  // Filtre fournisseur (affecte aussi le CA et les marges)
  if (filters.fournisseur && filters.fournisseur !== "tous") {
    caMultiplier *= 0.1; // Un fournisseur représente ~10% du CA total
    mpiAdjustment += 1; // Légère variation des marges selon le fournisseur
  }

  // Filtre portefeuille
  if (filters.portefeuille && filters.portefeuille !== "tous") {
    caMultiplier *= 0.25; // Un portefeuille représente ~25% du CA total
    mpaAdjustment -= 0.5; // Variation selon le portefeuille
  }

  // 3. Appliquer les ajustements aux données filtrées
  return filteredItems.map((item) => {
    // Extraire les valeurs numériques et détecter l'unité
    const extractNumberAndUnit = (str: string): { value: number; unit: string } => {
      const cleaned = str.replace(/[^\d.-]/g, '');
      const value = parseFloat(cleaned) || 0;
      let unit = '€';
      if (str.includes('M€')) {
        unit = ' M€';
      } else if (str.includes('k€')) {
        unit = ' k€';
      }
      return { value, unit };
    };

    const ca = extractNumberAndUnit(item.ca.valeur);
    const mpaValue = parseFloat(item.mpa.valeur.replace(/[^\d.-]/g, '')) || 0;
    const mpiValue = parseFloat(item.mpi.valeur.replace(/[^\d.-]/g, '')) || 0;
    const pa = extractNumberAndUnit(item.evoPa.valeur);
    const cout = extractNumberAndUnit(item.coutTheorique.valeur);
    const opp = extractNumberAndUnit(item.opportunites.valeur);

    // Appliquer les multiplicateurs
    const newCA = ca.value * caMultiplier;
    const newMPA = Math.min(100, Math.max(0, mpaValue + mpaAdjustment));
    const newMPI = Math.min(100, Math.max(0, mpiValue + mpiAdjustment));
    const newPA = pa.value * caMultiplier;
    const newCout = cout.value * caMultiplier;
    const newOpp = Math.max(0, opp.value * caMultiplier);

    return {
      ...item,
      ca: { valeur: `${newCA.toFixed(2)}${ca.unit}`, evolution: item.ca.evolution },
      mpa: { valeur: `${newMPA.toFixed(2)}%`, evolution: item.mpa.evolution },
      mpi: { valeur: `${newMPI.toFixed(2)}%`, evolution: item.mpi.evolution },
      evoPa: { valeur: `${newPA.toFixed(2)}${pa.unit}`, evolution: item.evoPa.evolution },
      coutTheorique: { valeur: `${newCout.toFixed(2)}${cout.unit}`, evolution: item.coutTheorique.evolution },
      opportunites: { valeur: `${newOpp.toFixed(2)}${opp.unit}`, evolution: item.opportunites.evolution },
    };
  });
};

// Configuration des périmètres
export const perimetreConfigs: Record<PerimetreType, PerimetreConfig> = {
  Marché: {
    type: "Marché",
    title: "Analyse par Marché",
    description: "Vue d'ensemble des performances par marché",
    availableFilters: ["pays", "fournisseur", "portefeuille"],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché détaillé", "Catégorie", "Groupe Famille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Marché"]);
      return adjustDataForFilters(data, filters, "Marché");
    },
  },

  "Marché détaillé": {
    type: "Marché détaillé",
    title: "Analyse par Marché détaillé",
    description: "Performance par marché détaillé",
    availableFilters: ["pays", "fournisseur", "portefeuille", "marche"],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché", "Catégorie", "Groupe Famille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Marché détaillé"]);
      return adjustDataForFilters(data, filters, "Marché détaillé");
    },
  },

  Catégorie: {
    type: "Catégorie",
    title: "Analyse par Catégorie",
    description: "Détail par catégorie de produits",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché détaillé", "Groupe Famille", "Famille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Catégorie"]);
      return adjustDataForFilters(data, filters, "Catégorie");
    },
  },

  "Groupe Famille": {
    type: "Groupe Famille",
    title: "Analyse par Groupe Famille",
    description: "Performance par groupe famille",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Catégorie", "Famille", "Sous Famille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Groupe Famille"]);
      return adjustDataForFilters(data, filters, "Groupe Famille");
    },
  },

  Famille: {
    type: "Famille",
    title: "Analyse par Famille",
    description: "Détail par famille de produits",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Groupe Famille", "Sous Famille", "Produit"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Famille"]);
      return adjustDataForFilters(data, filters, "Famille");
    },
  },

  "Sous Famille": {
    type: "Sous Famille",
    title: "Analyse par Sous Famille",
    description: "Performance par sous famille",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Famille", "Produit"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Sous Famille"]);
      return adjustDataForFilters(data, filters, "Sous Famille");
    },
  },

  Produit: {
    type: "Produit",
    title: "Analyse par Produit",
    description: "Analyse détaillée par produit",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Sous Famille", "Famille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Produit"]);
      return adjustDataForFilters(data, filters, "Produit");
    },
  },

  Fournisseur: {
    type: "Fournisseur",
    title: "Analyse par Fournisseur",
    description: "Performance par fournisseur",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché", "Catégorie", "Portefeuille"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Fournisseur"]);
      return adjustDataForFilters(data, filters, "Fournisseur");
    },
  },

  Portefeuille: {
    type: "Portefeuille",
    title: "Analyse par Portefeuille",
    description: "Vue par portefeuille",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché", "Fournisseur"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Portefeuille"]);
      return adjustDataForFilters(data, filters, "Portefeuille");
    },
  },

  Pays: {
    type: "Pays",
    title: "Analyse par Pays",
    description: "Performance par pays",
    availableFilters: [
      "pays",
      "fournisseur",
      "portefeuille",
      "marche",
      "marcheDetaille",
      "categorie",
      "groupeFamille",
      "famille",
      "sousFamille",
    ],
    columns: ["CA", "MPA", "MPI", "PA", "Coût théorique", "Opportunités"],
    linkedPerimetres: ["Marché", "Catégorie", "Fournisseur"],
    getItems: (filters) => {
      const data = convertToPageFormat(perimetreData["Pays"]);
      return adjustDataForFilters(data, filters, "Pays");
    },
  },
};

// Helper pour obtenir les données d'un périmètre
export const getPerimetreData = (
  type: PerimetreType,
  filters?: Record<string, string>
): PerimetreItem[] => {
  const config = perimetreConfigs[type];
  return config.getItems(filters);
};

// Helper pour obtenir les filtres disponibles
export const getAvailableFilters = (type: PerimetreType): FilterType[] => {
  const config = perimetreConfigs[type];
  if (!config) {
    console.error(`No config found for perimetre type: ${type}`);
    console.log('Available keys:', Object.keys(perimetreConfigs));
    return [];
  }
  return config.availableFilters;
};

// Helper pour obtenir les périmètres liés
export const getLinkedPerimetres = (type: PerimetreType): PerimetreType[] => {
  const config = perimetreConfigs[type];
  if (!config) {
    return [];
  }
  return config.linkedPerimetres;
};

// Fonction pour obtenir les sous-niveaux d'un périmètre
export const getSubLevels = (type: PerimetreType): PerimetreType[] => {
  // Cas spécifiques pour Marché et Marché détaillé
  if (type === "Marché") {
    return ["Marché détaillé", "Catégorie", "Groupe Famille", "Famille", "Sous Famille", "Produit"];
  }

  if (type === "Marché détaillé") {
    return ["Catégorie", "Groupe Famille", "Famille", "Sous Famille", "Produit"];
  }

  // Cas spécifiques pour Fournisseur, Portefeuille et Pays (périmètres transverses)
  if (type === "Fournisseur" || type === "Portefeuille" || type === "Pays") {
    return ["Marché", "Marché détaillé", "Catégorie", "Groupe Famille", "Famille", "Sous Famille", "Produit"];
  }

  const index = productHierarchy.indexOf(type);

  // Si le périmètre n'est pas dans la hiérarchie produit, retourner un tableau vide
  if (index === -1) return [];

  // Si c'est le dernier niveau (Produit), pas de sous-niveaux
  if (index === productHierarchy.length - 1) return [];

  // Retourner tous les niveaux après le périmètre actuel
  return productHierarchy.slice(index + 1);
};

// Interface pour les comptages des sous-niveaux
export interface SubLevelCounts {
  [key: string]: number; // key est le type de périmètre, value est le nombre
}

// Cache pour les données de sous-niveaux (optimisation majeure)
const subLevelDataCache = new Map<string, PerimetreItem[]>();

// Fonction optimisée pour calculer le nombre d'éléments dans chaque sous-niveau
export const calculateSubLevelCounts = (
  currentPerimetre: PerimetreType,
  currentItem: PerimetreItem,
  activeFilters: Record<string, string>
): SubLevelCounts => {
  const subLevels = getSubLevels(currentPerimetre);
  const counts: SubLevelCounts = {};

  // Si pas de sous-niveaux, retourner immédiatement
  if (subLevels.length === 0) {
    return counts;
  }

  const filterKey = perimetreToFilterKey[currentPerimetre];

  // Cas spécial pour Fournisseur et Portefeuille (périmètres transverses)
  if (currentPerimetre === "Fournisseur" || currentPerimetre === "Portefeuille") {
    // Pour les périmètres transverses, on compte via les produits
    const produitsCacheKey = `Produit-${JSON.stringify(activeFilters)}`;
    let produitsData = subLevelDataCache.get(produitsCacheKey);

    if (!produitsData) {
      produitsData = getPerimetreData("Produit", activeFilters);
      subLevelDataCache.set(produitsCacheKey, produitsData);
    }

    // Filtrer les produits par le fournisseur/portefeuille actuel
    const produitsFiltres = produitsData.filter(item => {
      const itemFilterValue = item[filterKey as keyof PerimetreItem];
      return itemFilterValue === currentItem.label;
    });

    // Pour chaque sous-niveau, extraire les valeurs uniques
    subLevels.forEach((subLevel) => {
      const subLevelKey = perimetreToFilterKey[subLevel];
      if (subLevelKey) {
        const uniqueValues = new Set(
          produitsFiltres
            .map(p => p[subLevelKey as keyof PerimetreItem])
            .filter(v => v != null)
        );
        counts[subLevel] = uniqueValues.size;
      }
    });

    return counts;
  }

  // Logique normale pour les autres périmètres
  subLevels.forEach((subLevel) => {
    // Créer une clé de cache basée sur le sous-niveau et les filtres actifs
    const cacheKey = `${subLevel}-${JSON.stringify(activeFilters)}`;

    // Essayer de récupérer depuis le cache
    let subData = subLevelDataCache.get(cacheKey);

    if (!subData) {
      // Si pas en cache, calculer et mettre en cache
      const subFilters = { ...activeFilters };
      subData = getPerimetreData(subLevel, subFilters);
      subLevelDataCache.set(cacheKey, subData);
    }

    // Filtrer par le label de l'item actuel si nécessaire
    if (filterKey) {
      const filteredData = subData.filter(item => {
        const itemFilterValue = item[filterKey as keyof PerimetreItem];
        return itemFilterValue === currentItem.label;
      });
      counts[subLevel] = filteredData.length;
    } else {
      counts[subLevel] = subData.length;
    }
  });

  return counts;
};

// Fonction pour vider le cache (à appeler quand nécessaire)
export const clearSubLevelCache = () => {
  subLevelDataCache.clear();
};
