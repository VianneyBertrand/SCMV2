import { PORTEFEUILLE_CATEGORIE_MAP } from "@/lib/constants/portefeuilles";

// Types pour les périmètres
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

export const perimetreOptions: PerimetreType[] = [
  "Marché",
  "Marché détaillé",
  "Catégorie",
  "Groupe Famille",
  "Famille",
  "Sous Famille",
  "Produit",
  "Fournisseur",
  "Portefeuille",
  "Pays",
];

export const perimetreHierarchy: PerimetreType[] = [
  "Marché",
  "Marché détaillé",
  "Catégorie",
  "Groupe Famille",
  "Famille",
  "Sous Famille",
  "Produit",
  "Fournisseur",
  "Portefeuille",
  "Pays",
];

// Interface pour les métriques avec valeur et évolution
export interface Metric {
  valeur: string;
  evolution: string;
}

export interface PerimetreItem {
  id: string;
  nom: string;
  tags: string[];
  ca: Metric;
  mpa: Metric;
  mpi: Metric;
  evoPa: Metric;
  coutTheorique: Metric;
  opportunite: Metric;
  // Prix de vente (uniquement pour les produits)
  pv?: Metric;
  pvLeclerc?: Metric;
  // EAN (uniquement pour les produits) - 13 chiffres
  ean?: string;
  // Relations hiérarchiques
  marche?: string;
  marcheDetaille?: string;
  categorie?: string;
  groupeFamille?: string;
  famille?: string;
  sousFamille?: string;
  fournisseur?: string;
  portefeuille?: string;
  pays?: string;
  // Link pour navigation
  link?: string;
}

// Helper function pour créer une métrique
const m = (valeur: string, evolution: string): Metric => ({ valeur, evolution });

// Fonction utilitaire pour générer un nombre aléatoire dans une plage
const randRange = (min: number, max: number, seed: number = 0): number => {
  const x = Math.sin(seed) * 10000;
  const rand = x - Math.floor(x);
  return min + rand * (max - min);
};

// Fonction pour générer un code EAN-13 aléatoire (13 chiffres)
const generateEAN = (seed: number): string => {
  let ean = '';
  for (let i = 0; i < 13; i++) {
    const digit = Math.floor(randRange(0, 10, seed * (i + 1) * 7.89));
    ean += digit.toString();
  }
  return ean;
};

// Fonction pour déterminer MPA/MPI selon la catégorie
const getMargeProfil = (categorie: string, index: number): { mpa: number, mpi: number } => {
  // Catégories à forte MPA (60-75%)
  const forteMPA = ["FROMAGE", "LAIT BEURRE CREME", "ULTRA FRAIS", "SAURISSERIE"];

  // Catégories à forte MPI (50-60%)
  const forteMPI = ["SURGELE POISSON PLATS CUIS PDT", "SURGELE VIANDES LEGUMES", "SURGELES GLACE PPI"];

  let mpa: number;
  let mpi: number;

  if (forteMPA.some(cat => categorie?.includes(cat))) {
    // MPA entre 60-75%, MPI entre 15-25%
    mpa = randRange(60, 75, index * 3.14);
    mpi = randRange(15, 25, index * 2.71);
  } else if (forteMPI.some(cat => categorie?.includes(cat))) {
    // MPI entre 50-60%, MPA entre 25-35%
    mpa = randRange(25, 35, index * 3.14);
    mpi = randRange(50, 60, index * 2.71);
  } else {
    // Équilibré : MPA 45-55%, MPI 30-40%
    mpa = randRange(45, 55, index * 3.14);
    mpi = randRange(30, 40, index * 2.71);
  }

  // Normaliser pour que MPA + MPI + Autres = 100% (Autres = 10-15%)
  const total = mpa + mpi;
  const autres = randRange(10, 15, index * 1.61);
  const facteur = (100 - autres) / total;

  return {
    mpa: mpa * facteur,
    mpi: mpi * facteur
  };
};

// Fonction pour générer une évolution cohérente
const genEvolution = (index: number, isPositive: boolean = true): string => {
  // 70% de hausses, 30% de baisses
  const isHausse = randRange(0, 1, index * 7.89) < 0.7;

  if (isHausse) {
    const evo = randRange(0.3, 3, index * 4.56);
    return `+${evo.toFixed(2)}%`;
  } else {
    const evo = randRange(0.1, 1.5, index * 4.56);
    return `-${evo.toFixed(2)}%`;
  }
};

// Génération du CA avec évolution
const genCA = (base: number, index: number, categorie: string = ""): Metric => {
  const variation = randRange(0.95, 1.15, index * 2.33);
  const val = Math.round(base * variation);
  const evo = genEvolution(index);

  return m(`${val.toLocaleString('fr-FR')}€`, evo);
};

// Génération MPA avec évolution
const genMPA = (index: number, categorie: string = ""): Metric => {
  const profil = getMargeProfil(categorie, index);
  const mpa = profil.mpa;
  const evo = genEvolution(index + 100);

  return m(`${mpa.toFixed(2)}%`, evo);
};

// Génération MPI avec évolution
const genMPI = (index: number, categorie: string = ""): Metric => {
  const profil = getMargeProfil(categorie, index);
  const mpi = profil.mpi;
  const evo = genEvolution(index + 200);

  return m(`${mpi.toFixed(2)}%`, evo);
};

// Génération de l'évolution du PA
const genEvoPa = (ca: number, index: number): Metric => {
  // PA est environ 70-85% du CA (selon les marges)
  const ratio = randRange(0.70, 0.85, index * 3.78);
  const pa = ca * ratio;
  const val = Math.round(pa);
  const evo = genEvolution(index + 300);

  return m(`${val.toLocaleString('fr-FR')}€`, evo);
};

// Génération du coût théorique
const genCout = (ca: number, index: number, mpaVal: number, mpiVal: number): Metric => {
  // Coût théorique = CA * (1 - (MPA + MPI) / 100)
  const coutRatio = 1 - ((mpaVal + mpiVal) / 100);
  const cout = ca * coutRatio;
  const val = Math.round(cout);

  // Évolution du coût suit l'évolution pondérée de MPA et MPI
  const evo = genEvolution(index + 400);

  return m(`${val.toLocaleString('fr-FR')}€`, evo);
};

// Génération de l'opportunité
const genOpp = (pa: number, coutTheo: number, index: number): Metric => {
  // Opportunité = PA - Coût théorique (si positif, sinon 0)
  const opp = Math.max(0, pa - coutTheo);

  if (opp === 0) {
    return m("0.00€", "0.00%");
  }

  // Evo opportunité = baisse potentielle négociable (toujours négatif)
  const evoOpp = -(opp / pa) * 100;

  return m(`${Math.round(opp).toLocaleString('fr-FR')}€`, `${evoOpp.toFixed(2)}%`);
};

// Helper pour extraire la valeur numérique d'une métrique
const extractNumericValue = (metric: Metric): number => {
  const cleaned = metric.valeur.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

// Helper pour générer des données cohérentes avec PA et opportunité corrects
interface MetricsData {
  ca: Metric;
  mpa: Metric;
  mpi: Metric;
  evoPa: Metric;
  coutTheorique: Metric;
  opportunite: Metric;
}

const generateCoherentMetrics = (baseCA: number, index: number, categorie: string = ""): MetricsData => {
  // 1. Générer CA
  const ca = genCA(baseCA, index, categorie);
  const caVal = extractNumericValue(ca);

  // 2. Générer MPA et MPI
  const mpa = genMPA(index, categorie);
  const mpi = genMPI(index, categorie);
  const mpaVal = extractNumericValue(mpa);
  const mpiVal = extractNumericValue(mpi);

  // 3. Calculer PA (PA = CA / 1.6)
  const paVal = caVal / 1.6;
  const evoPa = m(`${Math.round(paVal).toLocaleString('fr-FR')}€`, genEvolution(index + 300));

  // 4. Calculer coût théorique (similaire au PA mais avec une légère variation)
  const coutTheoRatio = randRange(0.95, 1.05, index * 6.28);
  const coutTheoVal = paVal * coutTheoRatio;
  const coutTheorique = m(`${Math.round(coutTheoVal).toLocaleString('fr-FR')}€`, genEvolution(index + 400));

  // 5. Calculer opportunité
  const opportunite = genOpp(paVal, coutTheoVal, index);

  return { ca, mpa, mpi, evoPa, coutTheorique, opportunite };
};

// Helper pour générer des noms de produits cohérents par sous-famille
const productNamesBySousFamille: Record<string, string[]> = {
  // Produits de la mer
  "Anchois": ["Filets d'anchois à l'huile", "Anchois marinés", "Crème d'anchois", "Tapenade aux anchois"],
  "Blinis/croutons": ["Blinis nature", "Blinis sarrasin", "Croutons ail", "Croutons nature"],
  "Coquillages": ["Moules marinière", "Bulots cuits", "Coques", "Palourdes"],
  "Crevettes": ["Crevettes roses cuites", "Gambas", "Crevettes grises", "Cocktail de crevettes"],
  "Oeufs de poissons": ["Tarama rose", "Œufs de saumon", "Œufs de lump", "Tarama nature"],
  "Prépar.à tartiner/rillette": ["Rillettes de saumon", "Rillettes de thon", "Mousse de truite", "Rillettes de maquereau"],
  "Soupes/rouilles": ["Soupe de poisson", "Rouille provençale", "Bisque de homard", "Velouté de crustacés"],
  "Surimi": ["Bâtonnets de surimi", "Surimi saveur crabe", "Surimi à l'ancienne", "Surimi nature"],
  "Verrines/apéritifs": ["Verrine saumon", "Verrine crabe", "Tartelettes mer", "Bouchées apéritives"],
  "Autres poissons fumés": ["Truite fumée", "Maquereau fumé", "Flétan fumé", "Hareng fumé"],
  "Saumons fumés": ["Saumon fumé d'Ecosse", "Saumon fumé Norvège", "Saumon fumé bio", "Saumon fumé tradition"],

  // Charcuterie
  "Assortiments": ["Plateau charcuterie", "Assortiment apéritif", "Assiette terroir", "Mix charcuterie"],
  "Autre charcuterie cuite/crue/fumée": ["Bacon", "Lardons", "Jambon blanc", "Coppa"],
  "Jambons crus": ["Jambon de Bayonne", "Jambon Serrano", "Prosciutto", "Jambon de Parme"],
  "Saucisses (type Strasbourg, Francfort)": ["Saucisses Strasbourg", "Knacks", "Francfort", "Saucisses fumées"],
  "Saucissons cuits": ["Saucisson à l'ail", "Saucisson pistache", "Saucisson nature", "Cervelas"],
  "Foie gras": ["Foie gras canard", "Foie gras oie", "Bloc de foie gras", "Terrine de foie gras"],
  "Autres saucisses": ["Merguez", "Chipolatas", "Saucisses Toulouse", "Saucisses pur porc"],
  "Chorizo": ["Chorizo doux", "Chorizo fort", "Chorizo espagnol", "Chorizo tranches"],
  "Saucisses sèches": ["Saucisson sec", "Rosette", "Jesus", "Fuet"],
};

// Fonction pour générer des noms de produits cohérents
const getProductName = (sousFamilleNom: string, index: number): string => {
  const names = productNamesBySousFamille[sousFamilleNom];
  if (names && names[index % names.length]) {
    const baseName = names[index % names.length];
    const variant = Math.floor(index / names.length);
    return variant > 0 ? `${baseName} - V${variant + 1}` : baseName;
  }
  return `${sousFamilleNom} - Produit ${index + 1}`;
};

// Fonction pour générer des prix de vente crédibles
const generatePrixVente = (productCA: number, index: number, categorie: string): { pv: Metric, pvLeclerc: Metric } => {
  // Estimer un prix de vente unitaire basé sur le CA et un volume estimé
  // Pour des produits alimentaires, on peut estimer entre 2€ et 50€ selon la catégorie

  let prixBase: number;

  // Ajuster le prix selon la catégorie
  if (categorie?.includes("FOIE GRAS") || categorie?.includes("SAURISSERIE")) {
    prixBase = randRange(6, 25, index * 5.21); // Produits premium
  } else if (categorie?.includes("FROMAGE") || categorie?.includes("CHARCUTERIE")) {
    prixBase = randRange(2.5, 12, index * 4.53); // Produits moyens-haut
  } else if (categorie?.includes("SURGELE") || categorie?.includes("GLACE")) {
    prixBase = randRange(2.5, 10, index * 3.87); // Produits moyens
  } else if (categorie?.includes("ULTRA FRAIS") || categorie?.includes("LAIT")) {
    prixBase = randRange(1.5, 6, index * 2.91); // Produits de base
  } else {
    prixBase = randRange(2, 10, index * 3.33); // Défaut
  }

  // Arrondir à 2 décimales
  prixBase = Math.round(prixBase * 100) / 100;

  // Leclerc est généralement 3-8% moins cher que Carrefour
  const ecartLeclerc = randRange(0.03, 0.08, index * 7.11);
  const prixLeclerc = Math.round(prixBase * (1 - ecartLeclerc) * 100) / 100;

  // Générer des évolutions entre -5% et +5%
  const evoPV = randRange(-5, 5, index * 6.28);
  const evoPVLeclerc = randRange(-5, 5, index * 5.67);

  return {
    pv: m(
      `${prixBase.toFixed(2)}€`,
      `${evoPV >= 0 ? '+' : ''}${evoPV.toFixed(2)}%`
    ),
    pvLeclerc: m(
      `${prixLeclerc.toFixed(2)}€`,
      `${evoPVLeclerc >= 0 ? '+' : ''}${evoPVLeclerc.toFixed(2)}%`
    ),
  };
};

// Listes des valeurs pour les filtres
const pays = ["France", "Espagne", "Belgique", "Roumanie", "Pologne", "Italie"];
const fournisseurs = [
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
const portefeuilles = Object.keys(PORTEFEUILLE_CATEGORIE_MAP);

// Helper pour obtenir un élément aléatoire
const getRandomItem = <T,>(array: T[], index: number): T => {
  return array[index % array.length];
};

// Données des périmètres
export const perimetreData: Record<PerimetreType, PerimetreItem[]> = {
  Marché: [
    {
      id: "m1",
      nom: "PLS",
      tags: ["2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"],
      ...generateCoherentMetrics(1200000000, 0, ""),
    },
  ],

  "Marché détaillé": [
    {
      id: "md1",
      nom: "Carné Surgelés",
      tags: ["5 CAT", "8 GF", "20 FAM", "98 SF"],
      ...generateCoherentMetrics(600000000, 0, "SURGELE"),
      marche: "PLS",
    },
    {
      id: "md2",
      nom: "Laitier Traiteur",
      tags: ["5 CAT", "6 GF", "22 FAM", "88 SF"],
      ...generateCoherentMetrics(600000000, 1, "FROMAGE"),
      marche: "PLS",
    },
  ],

  Catégorie: [
    { id: "cat1", nom: "SAURISSERIE", tags: ["3 GF", "7 FAM", "23 SF"], ...generateCoherentMetrics(180000000, 0, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés" },
    { id: "cat2", nom: "SURGELE POISSON PLATS CUIS PDT", tags: ["1 GF", "5 FAM", "31 SF"], ...generateCoherentMetrics(150000000, 1, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés" },
    { id: "cat3", nom: "SURGELE VIANDES LEGUMES", tags: ["1 GF", "2 FAM", "11 SF"], ...generateCoherentMetrics(110000000, 2, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés" },
    { id: "cat4", nom: "SURGELES GLACE PPI", tags: ["2 GF", "6 FAM", "29 SF"], ...generateCoherentMetrics(120000000, 3, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés" },
    { id: "cat5", nom: "VOLAILLE CHARCUTERIE", tags: ["1 GF", "1 FAM", "9 SF"], ...generateCoherentMetrics(65000000, 4, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés" },
    { id: "cat6", nom: "FROMAGE", tags: ["1 GF", "5 FAM", "12 SF"], ...generateCoherentMetrics(187500000, 5, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur" },
    { id: "cat7", nom: "LAIT BEURRE CREME", tags: ["1 GF", "5 FAM", "14 SF"], ...generateCoherentMetrics(156250000, 6, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur" },
    { id: "cat8", nom: "ŒUF PPI", tags: ["2 GF", "3 FAM", "11 SF"], ...generateCoherentMetrics(93750000, 7, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur" },
    { id: "cat9", nom: "TRAITEUR  ", tags: ["1 GF", "2 FAM", "10 SF"], ...generateCoherentMetrics(125000000, 8, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur" },
    { id: "cat10", nom: "ULTRA FRAIS", tags: ["2 GF", "9 FAM", "50 SF"], ...generateCoherentMetrics(62500000, 9, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur" },
  ],

  "Groupe Famille": [
    { id: "gf1", nom: "Produits de la mer", tags: ["3 FAM", "11 SF"], ...generateCoherentMetrics(85000000, 0, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE" },
    { id: "gf2", nom: "Charcuterie", tags: ["3 FAM", "12 SF"], ...generateCoherentMetrics(60000000, 1, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE" },
    { id: "gf3", nom: "Traiteur", tags: ["1 FAM", "3 SF"], ...generateCoherentMetrics(35000000, 2, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE" },
    { id: "gf4", nom: "Produits surgelés", tags: ["5 FAM", "31 SF"], ...generateCoherentMetrics(150000000, 3, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT" },
    { id: "gf5", nom: "Produits surgelés", tags: ["2 FAM", "11 SF"], ...generateCoherentMetrics(110000000, 4, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES" },
    { id: "gf6", nom: "Glaces/desserts surgelés", tags: ["4 FAM", "25 SF"], ...generateCoherentMetrics(75000000, 5, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI" },
    { id: "gf7", nom: "Produits surgelés", tags: ["1 FAM", "4 SF"], ...generateCoherentMetrics(45000000, 6, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI" },
    { id: "gf8", nom: "Viandes/volailles LS", tags: ["1 FAM", "9 SF"], ...generateCoherentMetrics(65000000, 7, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE" },
    { id: "gf9", nom: "Fromages", tags: ["5 FAM", "12 SF"], ...generateCoherentMetrics(187500000, 8, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE" },
    { id: "gf10", nom: "Cremerie", tags: ["5 FAM", "14 SF"], ...generateCoherentMetrics(156250000, 9, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME" },
    { id: "gf11", nom: "Pain/viennoiserie/patisserie", tags: ["3 FAM", "11 SF"], ...generateCoherentMetrics(56250000, 10, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI" },
    { id: "gf12", nom: "Cremerie", tags: ["1 FAM", "1 SF"], ...generateCoherentMetrics(37500000, 11, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI" },
    { id: "gf13", nom: "Traiteur", tags: ["2 FAM", "10 SF"], ...generateCoherentMetrics(125000000, 12, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  " },
    { id: "gf14", nom: "Ultra frais", tags: ["8 FAM", "45 SF"], ...generateCoherentMetrics(37500000, 13, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS" },
  ],

  Famille: [
    // SAURISSERIE - Produits de la mer
    { id: "fam1", nom: "Autres produits de la mer", tags: ["9 SF"], ...generateCoherentMetrics(35000000, 0, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer" },
    { id: "fam2", nom: "Autres poissons fumés", tags: ["1 SF"], ...generateCoherentMetrics(25000000, 1, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer" },
    { id: "fam3", nom: "Saumons fumés", tags: ["1 SF"], ...generateCoherentMetrics(25000000, 2, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer" },
    // SAURISSERIE - Charcuterie
    { id: "fam4", nom: "Charcuterie cuite/crue/fumée", tags: ["5 SF"], ...generateCoherentMetrics(28000000, 3, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie" },
    { id: "fam5", nom: "Patés/Rillettes/Foie Gras", tags: ["1 SF"], ...generateCoherentMetrics(16000000, 4, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie" },
    { id: "fam6", nom: "Saucisserie Sèche", tags: ["3 SF"], ...generateCoherentMetrics(16000000, 5, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie" },
    // SAURISSERIE - Traiteur
    { id: "fam7", nom: "Traiteur/plats cuisinés frais", tags: ["3 SF"], ...generateCoherentMetrics(35000000, 6, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Traiteur" },
    // SURGELE POISSON - Produits surgelés
    { id: "fam8", nom: "Plats cuisinés surgelés", tags: ["5 SF"], ...generateCoherentMetrics(30000000, 7, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés" },
    { id: "fam9", nom: "Poissons/produits de la mer surgelés", tags: ["9 SF"], ...generateCoherentMetrics(45000000, 8, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés" },
    { id: "fam10", nom: "Entrées surgelées", tags: ["4 SF"], ...generateCoherentMetrics(25000000, 9, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés" },
    { id: "fam11", nom: "Pizzas surgelées", tags: ["3 SF"], ...generateCoherentMetrics(30000000, 10, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés" },
    { id: "fam12", nom: "Frites/pomme de terre transformées", tags: ["2 SF"], ...generateCoherentMetrics(20000000, 11, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés" },
    // SURGELE VIANDES - Produits surgelés
    { id: "fam13", nom: "Autres légume surgelé/soupe", tags: ["7 SF"], ...generateCoherentMetrics(60000000, 12, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés" },
    { id: "fam14", nom: "Viandes/volailles surgelés", tags: ["4 SF"], ...generateCoherentMetrics(50000000, 13, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés" },
    // SURGELES GLACE - Glaces/desserts surgelés
    { id: "fam15", nom: "Gâteaux/Pâtiss. Desserts surgelés", tags: ["4 SF"], ...generateCoherentMetrics(18750000, 14, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés" },
    { id: "fam16", nom: "Pdt panificat.&Aide patisserie surgelés", tags: ["4 SF"], ...generateCoherentMetrics(18750000, 15, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés" },
    { id: "fam17", nom: "Glace Snacking", tags: ["4 SF"], ...generateCoherentMetrics(18750000, 16, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés" },
    { id: "fam18", nom: "Glaces Bacs > 100 ml", tags: ["2 SF"], ...generateCoherentMetrics(18750000, 17, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés" },
    // SURGELES GLACE - Produits surgelés
    { id: "fam19", nom: "Fruits/jus fruits surgelés", tags: ["4 SF"], ...generateCoherentMetrics(45000000, 18, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Produits surgelés" },
    // VOLAILLE CHARCUTERIE
    { id: "fam20", nom: "Viande/volaille libre service", tags: ["9 SF"], ...generateCoherentMetrics(65000000, 19, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS" },
    // FROMAGE
    { id: "fam21", nom: "Fromages pâtes pressées", tags: ["5 SF"], ...generateCoherentMetrics(62500000, 20, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages" },
    { id: "fam22", nom: "Fromages persillés", tags: ["2 SF"], ...generateCoherentMetrics(37500000, 21, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages" },
    { id: "fam23", nom: "Chévre et Brebis", tags: ["1 SF"], ...generateCoherentMetrics(31250000, 22, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages" },
    { id: "fam24", nom: "Feta / Mozzarella", tags: ["2 SF"], ...generateCoherentMetrics(31250000, 23, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages" },
    { id: "fam25", nom: "Fromages frais à tartiner", tags: ["2 SF"], ...generateCoherentMetrics(25000000, 24, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages" },
    // LAIT BEURRE CREME - Cremerie
    { id: "fam26", nom: "Beurres", tags: ["3 SF"], ...generateCoherentMetrics(31250000, 25, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie" },
    { id: "fam27", nom: "Crèmes fraîches/sauces", tags: ["5 SF"], ...generateCoherentMetrics(31250000, 26, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie" },
    { id: "fam28", nom: "Margarines/corps gras", tags: ["3 SF"], ...generateCoherentMetrics(31250000, 27, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie" },
    { id: "fam29", nom: "Lait aromatisé", tags: ["1 SF"], ...generateCoherentMetrics(31250000, 28, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie" },
    { id: "fam30", nom: "Lait", tags: ["2 SF"], ...generateCoherentMetrics(31250000, 29, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie" },
    // ŒUF PPI - Pain
    { id: "fam31", nom: "Pains industriels", tags: ["7 SF"], ...generateCoherentMetrics(31250000, 30, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie" },
    { id: "fam32", nom: "Viennoiseries", tags: ["3 SF"], ...generateCoherentMetrics(18750000, 31, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie" },
    // ŒUF PPI - Cremerie
    { id: "fam33", nom: "Œufs", tags: ["1 SF"], ...generateCoherentMetrics(37500000, 32, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Cremerie" },
    // TRAITEUR - Traiteur
    { id: "fam34", nom: "Traiteur/plats cuisinés frais", tags: ["6 SF"], ...generateCoherentMetrics(75000000, 33, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur" },
    { id: "fam35", nom: "Pâtes fraiches/Quenelles", tags: ["4 SF"], ...generateCoherentMetrics(50000000, 34, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur" },
    // ULTRA FRAIS - Ultra frais
    { id: "fam36", nom: "Jus de fruits frais/légumes", tags: ["2 SF"], ...generateCoherentMetrics(4687500, 35, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam37", nom: "Desserts", tags: ["8 SF"], ...generateCoherentMetrics(4687500, 36, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam38", nom: "Fromage frais", tags: ["4 SF"], ...generateCoherentMetrics(4687500, 37, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam39", nom: "Yaourts aromatisés/fruits", tags: ["5 SF"], ...generateCoherentMetrics(4687500, 38, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam40", nom: "Compotes fraiches/desserts", tags: ["2 SF"], ...generateCoherentMetrics(4687500, 39, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam41", nom: "Yaourts santé/biologique", tags: ["4 SF"], ...generateCoherentMetrics(4687500, 40, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
    { id: "fam42", nom: "Yaourts à boire/Snacking", tags: ["1 SF"], ...generateCoherentMetrics(4687500, 41, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais" },
  ],

  "Sous Famille": [
    // SAURISSERIE > Produits de la mer > Autres produits de la mer (9 SF)
    { id: "sf1", nom: "Anchois", tags: [], ...generateCoherentMetrics(3888900, 0, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf2", nom: "Blinis/croutons", tags: [], ...generateCoherentMetrics(3888900, 1, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf3", nom: "Coquillages", tags: [], ...generateCoherentMetrics(3888900, 2, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf4", nom: "Crevettes", tags: [], ...generateCoherentMetrics(3888900, 3, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf5", nom: "Oeufs de poissons", tags: [], ...generateCoherentMetrics(3888900, 4, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf6", nom: "Prépar.à tartiner/rillette", tags: [], ...generateCoherentMetrics(3888900, 5, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf7", nom: "Soupes/rouilles", tags: [], ...generateCoherentMetrics(3888900, 6, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf8", nom: "Surimi", tags: [], ...generateCoherentMetrics(3888900, 7, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },
    { id: "sf9", nom: "Verrines/apéritifs", tags: [], ...generateCoherentMetrics(3888900, 8, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres produits de la mer" },

    // SAURISSERIE > Produits de la mer > Autres poissons fumés (1 SF)
    { id: "sf10", nom: "Autres poissons fumés", tags: [], ...generateCoherentMetrics(25000000, 9, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Autres poissons fumés" },

    // SAURISSERIE > Produits de la mer > Saumons fumés (1 SF)
    { id: "sf11", nom: "Saumons fumés", tags: [], ...generateCoherentMetrics(25000000, 10, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Produits de la mer", famille: "Saumons fumés" },

    // SAURISSERIE > Charcuterie > Charcuterie cuite/crue/fumée (5 SF)
    { id: "sf12", nom: "Assortiments", tags: [], ...generateCoherentMetrics(5600000, 11, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Charcuterie cuite/crue/fumée" },
    { id: "sf13", nom: "Autre charcuterie cuite/crue/fumée", tags: [], ...generateCoherentMetrics(5600000, 12, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Charcuterie cuite/crue/fumée" },
    { id: "sf14", nom: "Jambons crus", tags: [], ...generateCoherentMetrics(5600000, 13, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Charcuterie cuite/crue/fumée" },
    { id: "sf15", nom: "Saucisses (type Strasbourg, Francfort)", tags: [], ...generateCoherentMetrics(5600000, 14, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Charcuterie cuite/crue/fumée" },
    { id: "sf16", nom: "Saucissons cuits", tags: [], ...generateCoherentMetrics(5600000, 15, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Charcuterie cuite/crue/fumée" },

    // SAURISSERIE > Charcuterie > Patés/Rillettes/Foie Gras (1 SF)
    { id: "sf17", nom: "Foie gras", tags: [], ...generateCoherentMetrics(16000000, 16, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Patés/Rillettes/Foie Gras" },

    // SAURISSERIE > Charcuterie > Saucisserie Sèche (3 SF)
    { id: "sf18", nom: "Autres saucisses", tags: [], ...generateCoherentMetrics(5333333, 17, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Saucisserie Sèche" },
    { id: "sf19", nom: "Chorizo", tags: [], ...generateCoherentMetrics(5333333, 18, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Saucisserie Sèche" },
    { id: "sf20", nom: "Saucisses sèches", tags: [], ...generateCoherentMetrics(5333334, 19, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Charcuterie", famille: "Saucisserie Sèche" },

    // SAURISSERIE > Traiteur (3 SF)
    { id: "sf21", nom: "Plats cuisinés frais", tags: [], ...generateCoherentMetrics(11666667, 20, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf22", nom: "Salades traiteur", tags: [], ...generateCoherentMetrics(11666666, 21, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf23", nom: "Sandwichs/wraps", tags: [], ...generateCoherentMetrics(11666667, 22, "SAURISSERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SAURISSERIE", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },

    // SURGELE POISSON > Produits surgelés > Plats cuisinés surgelés (5 SF)
    { id: "sf24", nom: "Plats cuisinés viande", tags: [], ...generateCoherentMetrics(6000000, 23, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Plats cuisinés surgelés" },
    { id: "sf25", nom: "Plats cuisinés poisson", tags: [], ...generateCoherentMetrics(6000000, 24, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Plats cuisinés surgelés" },
    { id: "sf26", nom: "Plats cuisinés végétariens", tags: [], ...generateCoherentMetrics(6000000, 25, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Plats cuisinés surgelés" },
    { id: "sf27", nom: "Couscous/paellas surgelés", tags: [], ...generateCoherentMetrics(6000000, 26, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Plats cuisinés surgelés" },
    { id: "sf28", nom: "Gratins surgelés", tags: [], ...generateCoherentMetrics(6000000, 27, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Plats cuisinés surgelés" },

    // SURGELE POISSON > Produits surgelés > Poissons/produits de la mer surgelés (9 SF)
    { id: "sf29", nom: "Crevettes surgelées", tags: [], ...generateCoherentMetrics(5000000, 28, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf30", nom: "Coquilles St-Jacques surgelées", tags: [], ...generateCoherentMetrics(5000000, 29, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf31", nom: "Poissons panés surgelés", tags: [], ...generateCoherentMetrics(5000000, 30, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf32", nom: "Filets de poisson surgelés", tags: [], ...generateCoherentMetrics(5000000, 31, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf33", nom: "Saumon surgelé", tags: [], ...generateCoherentMetrics(5000000, 32, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf34", nom: "Fruits de mer surgelés", tags: [], ...generateCoherentMetrics(5000000, 33, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf35", nom: "Moules surgelées", tags: [], ...generateCoherentMetrics(5000000, 34, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf36", nom: "Calamars/seiches surgelés", tags: [], ...generateCoherentMetrics(5000000, 35, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },
    { id: "sf37", nom: "Autres poissons surgelés", tags: [], ...generateCoherentMetrics(5000000, 36, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Poissons/produits de la mer surgelés" },

    // SURGELE POISSON > Produits surgelés > Entrées surgelées (4 SF)
    { id: "sf38", nom: "Feuilletés surgelés", tags: [], ...generateCoherentMetrics(6250000, 37, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Entrées surgelées" },
    { id: "sf39", nom: "Quiches/tartes surgelées", tags: [], ...generateCoherentMetrics(6250000, 38, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Entrées surgelées" },
    { id: "sf40", nom: "Bouchées apéro surgelées", tags: [], ...generateCoherentMetrics(6250000, 39, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Entrées surgelées" },
    { id: "sf41", nom: "Nems/samoussas surgelés", tags: [], ...generateCoherentMetrics(6250000, 40, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Entrées surgelées" },

    // SURGELE POISSON > Produits surgelés > Pizzas surgelées (3 SF)
    { id: "sf42", nom: "Pizzas classiques surgelées", tags: [], ...generateCoherentMetrics(10000000, 41, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Pizzas surgelées" },
    { id: "sf43", nom: "Pizzas premium surgelées", tags: [], ...generateCoherentMetrics(10000000, 42, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Pizzas surgelées" },
    { id: "sf44", nom: "Pizzas végétariennes surgelées", tags: [], ...generateCoherentMetrics(10000000, 43, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Pizzas surgelées" },

    // SURGELE POISSON > Produits surgelés > Frites/pomme de terre transformées (2 SF)
    { id: "sf45", nom: "Frites surgelées", tags: [], ...generateCoherentMetrics(10000000, 44, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Frites/pomme de terre transformées" },
    { id: "sf46", nom: "Pommes de terre spécialités surgelées", tags: [], ...generateCoherentMetrics(10000000, 45, "SURGELE POISSON PLATS CUIS PDT"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE POISSON PLATS CUIS PDT", groupeFamille: "Produits surgelés", famille: "Frites/pomme de terre transformées" },

    // SURGELE VIANDES > Produits surgelés > Autres légume surgelé/soupe (7 SF)
    { id: "sf47", nom: "Légumes nature surgelés", tags: [], ...generateCoherentMetrics(8571429, 46, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf48", nom: "Légumes cuisinés surgelés", tags: [], ...generateCoherentMetrics(8571429, 47, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf49", nom: "Mélanges légumes surgelés", tags: [], ...generateCoherentMetrics(8571429, 48, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf50", nom: "Légumes bio surgelés", tags: [], ...generateCoherentMetrics(8571428, 49, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf51", nom: "Soupes surgelées", tags: [], ...generateCoherentMetrics(8571429, 50, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf52", nom: "Purées surgelées", tags: [], ...generateCoherentMetrics(8571428, 51, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },
    { id: "sf53", nom: "Herbes aromatiques surgelées", tags: [], ...generateCoherentMetrics(8571428, 52, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Autres légume surgelé/soupe" },

    // SURGELE VIANDES > Produits surgelés > Viandes/volailles surgelés (4 SF)
    { id: "sf54", nom: "Viandes hachées surgelées", tags: [], ...generateCoherentMetrics(12500000, 53, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Viandes/volailles surgelés" },
    { id: "sf55", nom: "Volailles entières surgelées", tags: [], ...generateCoherentMetrics(12500000, 54, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Viandes/volailles surgelés" },
    { id: "sf56", nom: "Morceaux volailles surgelés", tags: [], ...generateCoherentMetrics(12500000, 55, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Viandes/volailles surgelés" },
    { id: "sf57", nom: "Viandes rouges surgelées", tags: [], ...generateCoherentMetrics(12500000, 56, "SURGELE VIANDES LEGUMES"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELE VIANDES LEGUMES", groupeFamille: "Produits surgelés", famille: "Viandes/volailles surgelés" },

    // SURGELES GLACE > Glaces/desserts surgelés > Gâteaux/Pâtiss. Desserts surgelés (4 SF)
    { id: "sf58", nom: "Gâteaux surgelés", tags: [], ...generateCoherentMetrics(4687500, 57, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Gâteaux/Pâtiss. Desserts surgelés" },
    { id: "sf59", nom: "Pâtisseries surgelées", tags: [], ...generateCoherentMetrics(4687500, 58, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Gâteaux/Pâtiss. Desserts surgelés" },
    { id: "sf60", nom: "Tartes sucrées surgelées", tags: [], ...generateCoherentMetrics(4687500, 59, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Gâteaux/Pâtiss. Desserts surgelés" },
    { id: "sf61", nom: "Desserts glacés surgelés", tags: [], ...generateCoherentMetrics(4687500, 60, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Gâteaux/Pâtiss. Desserts surgelés" },

    // SURGELES GLACE > Glaces/desserts surgelés > Pdt panificat.&Aide patisserie surgelés (4 SF)
    { id: "sf62", nom: "Pâtes feuilletées/brisées surgelées", tags: [], ...generateCoherentMetrics(4687500, 61, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Pdt panificat.&Aide patisserie surgelés" },
    { id: "sf63", nom: "Croissants/pains surgelés", tags: [], ...generateCoherentMetrics(4687500, 62, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Pdt panificat.&Aide patisserie surgelés" },
    { id: "sf64", nom: "Brioches surgelées", tags: [], ...generateCoherentMetrics(4687500, 63, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Pdt panificat.&Aide patisserie surgelés" },
    { id: "sf65", nom: "Pains spéciaux surgelés", tags: [], ...generateCoherentMetrics(4687500, 64, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Pdt panificat.&Aide patisserie surgelés" },

    // SURGELES GLACE > Glaces/desserts surgelés > Glace Snacking (4 SF)
    { id: "sf66", nom: "Bâtonnets glacés", tags: [], ...generateCoherentMetrics(4687500, 65, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glace Snacking" },
    { id: "sf67", nom: "Cônes glacés", tags: [], ...generateCoherentMetrics(4687500, 66, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glace Snacking" },
    { id: "sf68", nom: "Sandwichs glacés", tags: [], ...generateCoherentMetrics(4687500, 67, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glace Snacking" },
    { id: "sf69", nom: "Mini-glaces snacking", tags: [], ...generateCoherentMetrics(4687500, 68, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glace Snacking" },

    // SURGELES GLACE > Glaces/desserts surgelés > Glaces Bacs > 100 ml (2 SF)
    { id: "sf70", nom: "Glaces en bac classiques", tags: [], ...generateCoherentMetrics(9375000, 69, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glaces Bacs > 100 ml" },
    { id: "sf71", nom: "Glaces en bac premium", tags: [], ...generateCoherentMetrics(9375000, 70, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Glaces/desserts surgelés", famille: "Glaces Bacs > 100 ml" },

    // SURGELES GLACE > Produits surgelés > Fruits/jus fruits surgelés (4 SF)
    { id: "sf72", nom: "Fruits rouges surgelés", tags: [], ...generateCoherentMetrics(11250000, 71, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Produits surgelés", famille: "Fruits/jus fruits surgelés" },
    { id: "sf73", nom: "Fruits exotiques surgelés", tags: [], ...generateCoherentMetrics(11250000, 72, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Produits surgelés", famille: "Fruits/jus fruits surgelés" },
    { id: "sf74", nom: "Mélanges fruits surgelés", tags: [], ...generateCoherentMetrics(11250000, 73, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Produits surgelés", famille: "Fruits/jus fruits surgelés" },
    { id: "sf75", nom: "Smoothies surgelés", tags: [], ...generateCoherentMetrics(11250000, 74, "SURGELES GLACE PPI"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "SURGELES GLACE PPI", groupeFamille: "Produits surgelés", famille: "Fruits/jus fruits surgelés" },

    // VOLAILLE CHARCUTERIE > Viandes/volailles LS (9 SF)
    { id: "sf76", nom: "Poulet frais", tags: [], ...generateCoherentMetrics(7222222, 75, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf77", nom: "Dinde fraîche", tags: [], ...generateCoherentMetrics(7222222, 76, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf78", nom: "Canard frais", tags: [], ...generateCoherentMetrics(7222222, 77, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf79", nom: "Bœuf frais", tags: [], ...generateCoherentMetrics(7222222, 78, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf80", nom: "Porc frais", tags: [], ...generateCoherentMetrics(7222222, 79, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf81", nom: "Veau frais", tags: [], ...generateCoherentMetrics(7222222, 80, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf82", nom: "Agneau frais", tags: [], ...generateCoherentMetrics(7222222, 81, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf83", nom: "Lapin frais", tags: [], ...generateCoherentMetrics(7222222, 82, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },
    { id: "sf84", nom: "Gibier frais", tags: [], ...generateCoherentMetrics(7222224, 83, "VOLAILLE CHARCUTERIE"), marche: "PLS", marcheDetaille: "Carné Surgelés", categorie: "VOLAILLE CHARCUTERIE", groupeFamille: "Viandes/volailles LS", famille: "Viande/volaille libre service" },

    // FROMAGE > Fromages > Fromages pâtes pressées (5 SF)
    { id: "sf85", nom: "Comté/Gruyère", tags: [], ...generateCoherentMetrics(12500000, 84, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages pâtes pressées" },
    { id: "sf86", nom: "Emmental", tags: [], ...generateCoherentMetrics(12500000, 85, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages pâtes pressées" },
    { id: "sf87", nom: "Cantal/Salers", tags: [], ...generateCoherentMetrics(12500000, 86, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages pâtes pressées" },
    { id: "sf88", nom: "Mimolette", tags: [], ...generateCoherentMetrics(12500000, 87, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages pâtes pressées" },
    { id: "sf89", nom: "Autres pâtes pressées", tags: [], ...generateCoherentMetrics(12500000, 88, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages pâtes pressées" },

    // FROMAGE > Fromages > Fromages persillés (2 SF)
    { id: "sf90", nom: "Roquefort", tags: [], ...generateCoherentMetrics(18750000, 89, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages persillés" },
    { id: "sf91", nom: "Bleu d'Auvergne/Fourme", tags: [], ...generateCoherentMetrics(18750000, 90, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages persillés" },

    // FROMAGE > Fromages > Chévre et Brebis (1 SF)
    { id: "sf92", nom: "Fromages chèvre et brebis", tags: [], ...generateCoherentMetrics(31250000, 91, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Chévre et Brebis" },

    // FROMAGE > Fromages > Feta / Mozzarella (2 SF)
    { id: "sf93", nom: "Feta", tags: [], ...generateCoherentMetrics(15625000, 92, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Feta / Mozzarella" },
    { id: "sf94", nom: "Mozzarella", tags: [], ...generateCoherentMetrics(15625000, 93, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Feta / Mozzarella" },

    // FROMAGE > Fromages > Fromages frais à tartiner (2 SF)
    { id: "sf95", nom: "Fromages frais nature", tags: [], ...generateCoherentMetrics(12500000, 94, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages frais à tartiner" },
    { id: "sf96", nom: "Fromages frais aromatisés", tags: [], ...generateCoherentMetrics(12500000, 95, "FROMAGE"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "FROMAGE", groupeFamille: "Fromages", famille: "Fromages frais à tartiner" },

    // LAIT BEURRE CREME > Cremerie > Beurres (3 SF)
    { id: "sf97", nom: "Beurre doux", tags: [], ...generateCoherentMetrics(10416667, 96, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Beurres" },
    { id: "sf98", nom: "Beurre demi-sel", tags: [], ...generateCoherentMetrics(10416666, 97, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Beurres" },
    { id: "sf99", nom: "Beurre spécialités", tags: [], ...generateCoherentMetrics(10416667, 98, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Beurres" },

    // LAIT BEURRE CREME > Cremerie > Crèmes fraîches/sauces (5 SF)
    { id: "sf100", nom: "Crème fraîche épaisse", tags: [], ...generateCoherentMetrics(6250000, 99, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Crèmes fraîches/sauces" },
    { id: "sf101", nom: "Crème fraîche liquide", tags: [], ...generateCoherentMetrics(6250000, 100, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Crèmes fraîches/sauces" },
    { id: "sf102", nom: "Crème UHT", tags: [], ...generateCoherentMetrics(6250000, 101, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Crèmes fraîches/sauces" },
    { id: "sf103", nom: "Crème légère", tags: [], ...generateCoherentMetrics(6250000, 102, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Crèmes fraîches/sauces" },
    { id: "sf104", nom: "Sauces à base de crème", tags: [], ...generateCoherentMetrics(6250000, 103, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Crèmes fraîches/sauces" },

    // LAIT BEURRE CREME > Cremerie > Margarines/corps gras (3 SF)
    { id: "sf105", nom: "Margarines classiques", tags: [], ...generateCoherentMetrics(10416667, 104, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Margarines/corps gras" },
    { id: "sf106", nom: "Margarines allégées", tags: [], ...generateCoherentMetrics(10416666, 105, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Margarines/corps gras" },
    { id: "sf107", nom: "Autres corps gras", tags: [], ...generateCoherentMetrics(10416667, 106, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Margarines/corps gras" },

    // LAIT BEURRE CREME > Cremerie > Lait aromatisé (1 SF)
    { id: "sf108", nom: "Lait aromatisé", tags: [], ...generateCoherentMetrics(31250000, 107, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Lait aromatisé" },

    // LAIT BEURRE CREME > Cremerie > Lait (2 SF)
    { id: "sf109", nom: "Lait entier", tags: [], ...generateCoherentMetrics(15625000, 108, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Lait" },
    { id: "sf110", nom: "Lait demi-écrémé/écrémé", tags: [], ...generateCoherentMetrics(15625000, 109, "LAIT BEURRE CREME"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "LAIT BEURRE CREME", groupeFamille: "Cremerie", famille: "Lait" },

    // ŒUF PPI > Pain/viennoiserie/patisserie > Pains industriels (7 SF)
    { id: "sf111", nom: "Pain de mie", tags: [], ...generateCoherentMetrics(4464286, 110, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf112", nom: "Pain complet", tags: [], ...generateCoherentMetrics(4464285, 111, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf113", nom: "Pain de campagne", tags: [], ...generateCoherentMetrics(4464286, 112, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf114", nom: "Biscottes", tags: [], ...generateCoherentMetrics(4464285, 113, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf115", nom: "Pain grillé", tags: [], ...generateCoherentMetrics(4464286, 114, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf116", nom: "Pain burger/hot-dog", tags: [], ...generateCoherentMetrics(4464286, 115, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },
    { id: "sf117", nom: "Autres pains", tags: [], ...generateCoherentMetrics(4464286, 116, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Pains industriels" },

    // ŒUF PPI > Pain/viennoiserie/patisserie > Viennoiseries (3 SF)
    { id: "sf118", nom: "Croissants/pains au chocolat", tags: [], ...generateCoherentMetrics(6250000, 117, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Viennoiseries" },
    { id: "sf119", nom: "Brioches", tags: [], ...generateCoherentMetrics(6250000, 118, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Viennoiseries" },
    { id: "sf120", nom: "Autres viennoiseries", tags: [], ...generateCoherentMetrics(6250000, 119, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Pain/viennoiserie/patisserie", famille: "Viennoiseries" },

    // ŒUF PPI > Cremerie > Œufs (1 SF)
    { id: "sf121", nom: "Œufs frais", tags: [], ...generateCoherentMetrics(37500000, 120, "ŒUF PPI"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ŒUF PPI", groupeFamille: "Cremerie", famille: "Œufs" },

    // TRAITEUR > Traiteur > Traiteur/plats cuisinés frais (6 SF)
    { id: "sf122", nom: "Plats cuisinés viande", tags: [], ...generateCoherentMetrics(12500000, 121, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf123", nom: "Plats cuisinés poisson", tags: [], ...generateCoherentMetrics(12500000, 122, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf124", nom: "Plats cuisinés végétariens", tags: [], ...generateCoherentMetrics(12500000, 123, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf125", nom: "Salades composées", tags: [], ...generateCoherentMetrics(12500000, 124, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf126", nom: "Sandwichs/wraps frais", tags: [], ...generateCoherentMetrics(12500000, 125, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },
    { id: "sf127", nom: "Autres plats traiteur", tags: [], ...generateCoherentMetrics(12500000, 126, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Traiteur/plats cuisinés frais" },

    // TRAITEUR > Traiteur > Pâtes fraiches/Quenelles (4 SF)
    { id: "sf128", nom: "Pâtes fraîches nature", tags: [], ...generateCoherentMetrics(12500000, 127, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Pâtes fraiches/Quenelles" },
    { id: "sf129", nom: "Pâtes fraîches farcies", tags: [], ...generateCoherentMetrics(12500000, 128, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Pâtes fraiches/Quenelles" },
    { id: "sf130", nom: "Quenelles nature", tags: [], ...generateCoherentMetrics(12500000, 129, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Pâtes fraiches/Quenelles" },
    { id: "sf131", nom: "Gnocchis/spécialités", tags: [], ...generateCoherentMetrics(12500000, 130, "TRAITEUR"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "TRAITEUR  ", groupeFamille: "Traiteur", famille: "Pâtes fraiches/Quenelles" },

    // ULTRA FRAIS > Ultra frais > Jus de fruits frais/légumes (2 SF)
    { id: "sf132", nom: "Jus de fruits frais", tags: [], ...generateCoherentMetrics(2343750, 131, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Jus de fruits frais/légumes" },
    { id: "sf133", nom: "Jus de légumes frais", tags: [], ...generateCoherentMetrics(2343750, 132, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Jus de fruits frais/légumes" },

    // ULTRA FRAIS > Ultra frais > Desserts (8 SF)
    { id: "sf134", nom: "Crèmes desserts", tags: [], ...generateCoherentMetrics(585938, 133, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf135", nom: "Mousses au chocolat", tags: [], ...generateCoherentMetrics(585937, 134, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf136", nom: "Flans/crèmes caramel", tags: [], ...generateCoherentMetrics(585938, 135, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf137", nom: "Riz au lait/semoules", tags: [], ...generateCoherentMetrics(585937, 136, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf138", nom: "Liégeois", tags: [], ...generateCoherentMetrics(585938, 137, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf139", nom: "Tiramisus", tags: [], ...generateCoherentMetrics(585938, 138, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf140", nom: "Panacottas", tags: [], ...generateCoherentMetrics(585937, 139, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },
    { id: "sf141", nom: "Autres desserts lactés", tags: [], ...generateCoherentMetrics(585937, 140, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Desserts" },

    // ULTRA FRAIS > Ultra frais > Fromage frais (4 SF)
    { id: "sf142", nom: "Fromage blanc nature", tags: [], ...generateCoherentMetrics(1171875, 141, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Fromage frais" },
    { id: "sf143", nom: "Fromage blanc aromatisé", tags: [], ...generateCoherentMetrics(1171875, 142, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Fromage frais" },
    { id: "sf144", nom: "Faisselles", tags: [], ...generateCoherentMetrics(1171875, 143, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Fromage frais" },
    { id: "sf145", nom: "Petits-suisses", tags: [], ...generateCoherentMetrics(1171875, 144, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Fromage frais" },

    // ULTRA FRAIS > Ultra frais > Yaourts aromatisés/fruits (5 SF)
    { id: "sf146", nom: "Yaourts nature", tags: [], ...generateCoherentMetrics(937500, 145, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts aromatisés/fruits" },
    { id: "sf147", nom: "Yaourts aux fruits", tags: [], ...generateCoherentMetrics(937500, 146, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts aromatisés/fruits" },
    { id: "sf148", nom: "Yaourts brassés", tags: [], ...generateCoherentMetrics(937500, 147, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts aromatisés/fruits" },
    { id: "sf149", nom: "Yaourts grecs", tags: [], ...generateCoherentMetrics(937500, 148, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts aromatisés/fruits" },
    { id: "sf150", nom: "Yaourts aromatisés", tags: [], ...generateCoherentMetrics(937500, 149, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts aromatisés/fruits" },

    // ULTRA FRAIS > Ultra frais > Compotes fraiches/desserts (2 SF)
    { id: "sf151", nom: "Compotes fraîches", tags: [], ...generateCoherentMetrics(2343750, 150, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Compotes fraiches/desserts" },
    { id: "sf152", nom: "Spécialités fruits", tags: [], ...generateCoherentMetrics(2343750, 151, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Compotes fraiches/desserts" },

    // ULTRA FRAIS > Ultra frais > Yaourts santé/biologique (4 SF)
    { id: "sf153", nom: "Yaourts bio", tags: [], ...generateCoherentMetrics(1171875, 152, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts santé/biologique" },
    { id: "sf154", nom: "Yaourts probiotiques", tags: [], ...generateCoherentMetrics(1171875, 153, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts santé/biologique" },
    { id: "sf155", nom: "Yaourts protéinés", tags: [], ...generateCoherentMetrics(1171875, 154, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts santé/biologique" },
    { id: "sf156", nom: "Yaourts allégés/0%", tags: [], ...generateCoherentMetrics(1171875, 155, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts santé/biologique" },

    // ULTRA FRAIS > Ultra frais > Yaourts à boire/Snacking (1 SF)
    { id: "sf157", nom: "Yaourts à boire", tags: [], ...generateCoherentMetrics(4687500, 156, "ULTRA FRAIS"), marche: "PLS", marcheDetaille: "Laitier Traiteur", categorie: "ULTRA FRAIS", groupeFamille: "Ultra frais", famille: "Yaourts à boire/Snacking" },
  ],

  Produit: [],

  Fournisseur: [
    { id: "four1", nom: "Labeyrie Fine Foods", tags: ["45 PRO"], ...generateCoherentMetrics(185000000, 0, "SAURISSERIE") },
    { id: "four2", nom: "Picard Surgelés", tags: ["68 PRO"], ...generateCoherentMetrics(245000000, 1, "SURGELE POISSON PLATS CUIS PDT") },
    { id: "four3", nom: "Lactalis Foodservice", tags: ["52 PRO"], ...generateCoherentMetrics(210000000, 2, "FROMAGE") },
    { id: "four4", nom: "Fleury Michon", tags: ["38 PRO"], ...generateCoherentMetrics(165000000, 3, "TRAITEUR") },
    { id: "four5", nom: "Danone Professionnel", tags: ["44 PRO"], ...generateCoherentMetrics(128000000, 4, "ULTRA FRAIS") },
    { id: "four6", nom: "Nestlé Professional", tags: ["36 PRO"], ...generateCoherentMetrics(98000000, 5, "ULTRA FRAIS") },
    { id: "four7", nom: "Sysco France", tags: ["78 PRO"], ...generateCoherentMetrics(320000000, 6, "SURGELE VIANDES LEGUMES") },
    { id: "four8", nom: "Transgourmet", tags: ["62 PRO"], ...generateCoherentMetrics(275000000, 7, "SURGELE POISSON PLATS CUIS PDT") },
    { id: "four9", nom: "Metro Cash & Carry", tags: ["55 PRO"], ...generateCoherentMetrics(235000000, 8, "SURGELE VIANDES LEGUMES") },
    { id: "four10", nom: "Brake France", tags: ["48 PRO"], ...generateCoherentMetrics(189000000, 9, "VOLAILLE CHARCUTERIE") },
  ],

  Portefeuille: [
    { id: "port1", nom: "Jean Dubois", tags: ["145 PRO"], ...generateCoherentMetrics(520000000, 0, "SAURISSERIE") },
    { id: "port2", nom: "Marie Grivault", tags: ["168 PRO"], ...generateCoherentMetrics(485000000, 1, "SURGELE POISSON PLATS CUIS PDT") },
    { id: "port3", nom: "Pierre Lefebvre", tags: ["132 PRO"], ...generateCoherentMetrics(395000000, 2, "SURGELE VIANDES LEGUMES") },
    { id: "port4", nom: "Sophie Martin", tags: ["124 PRO"], ...generateCoherentMetrics(365000000, 3, "SURGELES GLACE PPI") },
    { id: "port5", nom: "Thomas Bernard", tags: ["156 PRO"], ...generateCoherentMetrics(445000000, 4, "VOLAILLE CHARCUTERIE") },
    { id: "port6", nom: "Claire Durand", tags: ["138 PRO"], ...generateCoherentMetrics(410000000, 5, "FROMAGE") },
    { id: "port7", nom: "Antoine Rousseau", tags: ["115 PRO"], ...generateCoherentMetrics(325000000, 6, "LAIT BEURRE CREME") },
    { id: "port8", nom: "Isabelle Mercier", tags: ["142 PRO"], ...generateCoherentMetrics(425000000, 7, "TRAITEUR  ") },
    { id: "port9", nom: "Nicolas Laurent", tags: ["95 PRO"], ...generateCoherentMetrics(285000000, 8, "ULTRA FRAIS") },
    { id: "port10", nom: "Émilie Fournier", tags: ["88 PRO"], ...generateCoherentMetrics(245000000, 9, "ŒUF PPI") },
  ],

  Pays: [
    { id: "pays1", nom: "France", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(412000000, 0, "FRANCE") },
    { id: "pays2", nom: "Belgique", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(304000000, 1, "BELGIQUE") },
    { id: "pays3", nom: "Espagne", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(170000000, 2, "ESPAGNE") },
    { id: "pays4", nom: "Roumanie", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(100000000, 3, "ROUMANIE") },
    { id: "pays5", nom: "Italie", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(43000000, 4, "ITALIE") },
    { id: "pays6", nom: "Pologne", tags: ["1 MAR", "2 MD", "10 CAT", "14 GF", "42 FAM", "186 SF"], ...generateCoherentMetrics(25000000, 5, "POLOGNE") },
  ],
};

// Générer les produits dynamiquement basés sur les sous-familles
// Au moins 4 produits par sous-famille
const generateProducts = (): PerimetreItem[] => {
  const products: PerimetreItem[] = [];
  let productCounter = 1;

  perimetreData["Sous Famille"].forEach((sf) => {
    // Générer au moins 4 produits pour chaque sous-famille
    const numProducts = 4;
    const sfCa = extractNumericValue(sf.ca);
    const productCA = sfCa / numProducts;

    for (let i = 0; i < numProducts; i++) {
      const productName = getProductName(sf.nom, i);
      const prixVente = generatePrixVente(productCA, productCounter, sf.categorie || "");

      const product: PerimetreItem = {
        id: `prod${productCounter}`,
        nom: productName,
        tags: [],
        ...generateCoherentMetrics(productCA, productCounter, sf.categorie || ""),
        pv: prixVente.pv,
        pvLeclerc: prixVente.pvLeclerc,
        ean: generateEAN(productCounter),
        marche: sf.marche,
        marcheDetaille: sf.marcheDetaille,
        categorie: sf.categorie,
        groupeFamille: sf.groupeFamille,
        famille: sf.famille,
        sousFamille: sf.nom,
        fournisseur: getRandomItem(fournisseurs, productCounter),
        portefeuille: getRandomItem(portefeuilles, productCounter),
        pays: getRandomItem(pays, productCounter),
      };
      products.push(product);
      productCounter++;
    }
  });

  return products;
};

// Générer les produits
perimetreData.Produit = generateProducts();

// Informations disponibles pour les filtres
export const perimetreFilters: Record<PerimetreType, string[]> = {
  "Marché": ["pays", "fournisseur", "portefeuille"],
  "Marché détaillé": ["pays", "fournisseur", "portefeuille", "marche"],
  Catégorie: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille"],
  "Groupe Famille": ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie"],
  Famille: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille"],
  "Sous Famille": ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille", "famille"],
  Produit: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille", "famille", "sousFamille"],
  Fournisseur: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille", "famille", "sousFamille"],
  Portefeuille: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille", "famille", "sousFamille"],
  Pays: ["pays", "fournisseur", "portefeuille", "marche", "marcheDetaille", "categorie", "groupeFamille", "famille", "sousFamille"],
};

// Colonnes disponibles pour chaque périmètre
export const perimetreColumns: Record<PerimetreType, string[]> = {
  "Marché": [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  "Marché détaillé": [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Catégorie: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  "Groupe Famille": [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Famille: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  "Sous Famille": [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Produit: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Fournisseur: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Portefeuille: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
  Pays: [
    "CA",
    "MP",
    "Emballage",
    "Evo PA",
    "Coût théorique",
    "Opportunités",
  ],
};
