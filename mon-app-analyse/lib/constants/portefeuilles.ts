// Mapping des portefeuilles vers les catégories
export const PORTEFEUILLE_CATEGORIE_MAP: Record<string, string> = {
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

// Liste des noms de portefeuilles
export const PORTEFEUILLE_NAMES = Object.keys(PORTEFEUILLE_CATEGORIE_MAP)

// Liste des catégories
export const PORTEFEUILLE_CATEGORIES = Object.values(PORTEFEUILLE_CATEGORIE_MAP)
