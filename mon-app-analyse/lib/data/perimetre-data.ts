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
  | "sousFamille"
  | "produit";

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
  "Produit": "produit",
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
  // Prix de vente et Prix d'achat (uniquement pour les produits)
  paUnitaire?: MetricDisplay;
  coutTheoriqueUnitaire?: MetricDisplay;
  pv?: MetricDisplay;
  pvLeclerc?: MetricDisplay;
  margePvLcl?: MetricDisplay;
  margePvc?: MetricDisplay;
  margeMoyenneCategorielle?: string;
  // EAN (uniquement pour les produits) - 13 chiffres
  ean?: string;
  // Volume en UVC et Tonne avec CAD/CAM
  volume?: {
    UVC: {
      CAD: MetricDisplay;
      CAM: MetricDisplay;
    };
    Tonne: {
      CAD: MetricDisplay;
      CAM: MetricDisplay;
    };
  };
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

// Générateur de nombres pseudo-aléatoires déterministe basé sur une seed
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Créer une seed numérique à partir de la string
    this.seed = 0;
    for (let i = 0; i < seed.length; i++) {
      this.seed = ((this.seed << 5) - this.seed) + seed.charCodeAt(i);
      this.seed = this.seed & this.seed; // Convert to 32bit integer
    }
  }

  // Génère un nombre pseudo-aléatoire entre 0 et 1
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Génère un nombre entre min et max
  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
}

// Convertir les données de content.ts vers le format de la page
const convertToPageFormat = (items: ContentPerimetreItem[]): PerimetreItem[] => {
  return items.map((item) => {
    // Créer un générateur de nombres pseudo-aléatoires basé sur l'ID
    const rng = new SeededRandom(item.id);
    // Variables pour les marges
    let margePvLcl: MetricDisplay | undefined = undefined;
    let margePvc: MetricDisplay | undefined = undefined;

    // Marge moyenne catégorielle (valeur statique pour l'instant)
    let margeMoyenneCategorielle: string | undefined = undefined;
    if (item.categorie) {
      margeMoyenneCategorielle = "37.5%";
    }

    // Calculer PA unitaire pour les produits (basé sur evoPa et ca)
    let paUnitaire: MetricDisplay | undefined = undefined;
    if (item.pv && item.evoPa) {
      // PA unitaire est généralement entre 60-85% du PV
      const pvValue = parseFloat(item.pv.valeur.replace(/[^0-9.-]/g, ''));
      const evoPaEvolution = parseFloat(item.evoPa.evolution.replace(/[^0-9.-]/g, ''));
      const paUnitaireValue = pvValue * 0.70; // 70% du PV comme approximation
      const paUnitaireEvolution = evoPaEvolution * (0.95 + rng.random() * 0.1); // Légère variation autour de l'évolution du PA total
      paUnitaire = {
        valeur: `${paUnitaireValue.toFixed(2)}€`,
        evolution: `${paUnitaireEvolution >= 0 ? '+' : ''}${paUnitaireEvolution.toFixed(2)}%`
      };
    }

    // Calculer Coût théorique unitaire pour les produits (basé sur coutTheorique et ca)
    let coutTheoriqueUnitaire: MetricDisplay | undefined = undefined;
    if (item.pv && item.coutTheorique) {
      // Coût théorique unitaire est généralement entre 50-75% du PV
      const pvValue = parseFloat(item.pv.valeur.replace(/[^0-9.-]/g, ''));
      const coutTheoriqueEvolution = parseFloat(item.coutTheorique.evolution.replace(/[^0-9.-]/g, ''));
      const coutTheoriqueUnitaireValue = pvValue * 0.60; // 60% du PV comme approximation
      const coutTheoriqueUnitaireEvolution = coutTheoriqueEvolution * (0.95 + rng.random() * 0.1); // Légère variation
      coutTheoriqueUnitaire = {
        valeur: `${coutTheoriqueUnitaireValue.toFixed(2)}€`,
        evolution: `${coutTheoriqueUnitaireEvolution >= 0 ? '+' : ''}${coutTheoriqueUnitaireEvolution.toFixed(2)}%`
      };
    }

    // Calculer margePvc avec la formule simple : PV - PA unitaire
    if (item.pv && paUnitaire) {
      const pvValue = parseFloat(item.pv.valeur.replace(/[^0-9.-]/g, ''));
      const paValue = parseFloat(paUnitaire.valeur.replace(/[^0-9.-]/g, ''));
      const pvEvolution = parseFloat(item.pv.evolution.replace(/[^0-9.-]/g, ''));
      const paEvolution = parseFloat(paUnitaire.evolution.replace(/[^0-9.-]/g, ''));

      const margeValue = pvValue - paValue;
      const margeEvolution = pvEvolution - paEvolution;

      margePvc = {
        valeur: `${margeValue.toFixed(2)}€`,
        evolution: `${margeEvolution >= 0 ? '+' : ''}${margeEvolution.toFixed(2)}%`
      };
    }

    // Calculer margePvLcl avec la formule simple : PV LCL - PA unitaire
    if (item.pvLeclerc && paUnitaire) {
      const pvLclValue = parseFloat(item.pvLeclerc.valeur.replace(/[^0-9.-]/g, ''));
      const paValue = parseFloat(paUnitaire.valeur.replace(/[^0-9.-]/g, ''));
      const pvLclEvolution = parseFloat(item.pvLeclerc.evolution.replace(/[^0-9.-]/g, ''));
      const paEvolution = parseFloat(paUnitaire.evolution.replace(/[^0-9.-]/g, ''));

      const margeValue = pvLclValue - paValue;
      const margeEvolution = pvLclEvolution - paEvolution;

      margePvLcl = {
        valeur: `${margeValue.toFixed(2)}€`,
        evolution: `${margeEvolution >= 0 ? '+' : ''}${margeEvolution.toFixed(2)}%`
      };
    }

    // Générer des données de volume simulées (UVC et Tonne) avec CAD et CAM
    const caValue = parseFloat(item.ca.valeur.replace(/[^0-9.-]/g, ''));
    const caEvolution = parseFloat(item.ca.evolution.replace(/[^0-9.-]/g, ''));

    // Déterminer le niveau hiérarchique de l'élément
    // Plus le niveau est élevé (proche de Marché), plus les valeurs sont grandes
    let hierarchyLevel = 1; // Par défaut : niveau le plus bas
    if (!item.marche) {
      // C'est un marché
      hierarchyLevel = 7;
    } else if (!item.marcheDetaille) {
      // C'est un marché détaillé
      hierarchyLevel = 6;
    } else if (!item.categorie) {
      // C'est une catégorie
      hierarchyLevel = 5;
    } else if (!item.groupeFamille) {
      // C'est un groupe famille
      hierarchyLevel = 4;
    } else if (!item.famille) {
      // C'est une famille
      hierarchyLevel = 3;
    } else if (!item.sousFamille) {
      // C'est une sous famille
      hierarchyLevel = 2;
    } // sinon c'est un produit (niveau 1)

    // Générer un volume UVC (entre 5000 et 10000)
    // Plus le niveau est élevé, plus le volume est grand
    const uvcMin = 5000 + (hierarchyLevel - 1) * 500; // 5000 à 8000
    const uvcMax = 7000 + (hierarchyLevel - 1) * 500; // 7000 à 10000
    const randomVariation = rng.random() * (uvcMax - uvcMin);
    const volumeUVCCAD = Math.round(uvcMin + randomVariation);
    const volumeUVCCAM = Math.round(volumeUVCCAD * 1.10); // CAM généralement 10% supérieur à CAD

    const volumeUVCCADEvolution = caEvolution + (rng.random() * 2 - 1); // Variation légère autour de l'évolution du CA
    const volumeUVCCAMEvolution = volumeUVCCADEvolution + 0.47; // CAM a généralement une meilleure évolution

    // Générer un volume en Tonne (entre 2 et 200)
    // Plus le niveau est élevé, plus le volume est grand
    const tonneMin = 2 + (hierarchyLevel - 1) * 15; // 2 à 92
    const tonneMax = 30 + (hierarchyLevel - 1) * 28; // 30 à 198
    const tonneRandomVariation = rng.random() * (tonneMax - tonneMin);
    const volumeTonneCAD = tonneMin + tonneRandomVariation;
    const volumeTonneCAM = volumeTonneCAD * 1.10; // CAM généralement 10% supérieur à CAD
    const volumeTonneCADEvolution = volumeUVCCADEvolution + (rng.random() * 0.5 - 0.25); // Variation légère
    const volumeTonneCAMEvolution = volumeTonneCADEvolution + 0.55; // CAM a une meilleure évolution

    const volume = {
      UVC: {
        CAD: {
          valeur: Math.round(volumeUVCCAD).toString(), // Pas de décimales pour UVC
          evolution: `${volumeUVCCADEvolution >= 0 ? '+' : ''}${volumeUVCCADEvolution.toFixed(2)}%`
        },
        CAM: {
          valeur: Math.round(volumeUVCCAM).toString(), // Pas de décimales pour UVC
          evolution: `${volumeUVCCAMEvolution >= 0 ? '+' : ''}${volumeUVCCAMEvolution.toFixed(2)}%`
        }
      },
      Tonne: {
        CAD: {
          valeur: volumeTonneCAD.toFixed(3), // Max 3 décimales pour Tonne
          evolution: `${volumeTonneCADEvolution >= 0 ? '+' : ''}${volumeTonneCADEvolution.toFixed(2)}%`
        },
        CAM: {
          valeur: volumeTonneCAM.toFixed(3), // Max 3 décimales pour Tonne
          evolution: `${volumeTonneCAMEvolution >= 0 ? '+' : ''}${volumeTonneCAMEvolution.toFixed(2)}%`
        }
      }
    };

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
      paUnitaire: paUnitaire,
      coutTheoriqueUnitaire: coutTheoriqueUnitaire,
      pv: item.pv ? formatToCurrency(item.pv) : undefined,
      pvLeclerc: item.pvLeclerc ? formatToCurrency(item.pvLeclerc) : undefined,
      margePvLcl: margePvLcl,
      margePvc: margePvc,
      margeMoyenneCategorielle: margeMoyenneCategorielle,
      ean: item.ean,
      volume: volume,
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
    // Opportunité = PA - PA théorique, si négatif alors 0
    const newOpp = Math.max(0, newPA - newCout);

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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
    columns: ["CA", "MP", "Emballage", "PA", "Coût théorique", "Opportunités"],
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
