/**
 * Références de matières premières disponibles pour chaque type de MP
 * Structure: mpId -> liste de références disponibles
 */

export interface MPReference {
  code: string
  label: string
  market: string
}

export const mpReferences: Record<string, MPReference[]> = {
  // FARINE DE BLÉ
  'farine-ble': [
    { code: 'D7M2', label: 'Blé dur bio Milan', market: 'Milan' },
    { code: 'AD7VF', label: 'Blé dur bio France', market: 'Marché français' },
    { code: 'AD7DE', label: 'Blé dur La Pallice', market: 'Marché français' },
    { code: 'FK31E', label: 'Blé tendre bio', market: 'Marché français' },
    { code: 'QBWFC', label: 'Germe blé Milan', market: 'Milan' },
    { code: 'QBWWY', label: 'Son blé tendre bio', market: 'Marché français' },
    { code: 'FK3P6', label: 'Blé fourrager UE', market: 'Union européenne' },
    { code: 'FK3CK', label: 'Blé panifiable Italie', market: 'Italie' },
    { code: 'FK3YA', label: 'Blé meunier Rouen', market: 'Marché français' },
    { code: 'QBWF9', label: 'Son blé IDF', market: 'Marché français' },
    { code: 'FK3QJ', label: 'Blé meunier Bologne', market: 'Bologne' },
    { code: 'AD7PL', label: 'Blé dur Port Nouvelle', market: 'Marché français' },
    { code: 'QBWZU', label: 'Amidon blé UE', market: 'Union européenne' },
    { code: 'SIFG5', label: 'Indice SIFPAF', market: 'France' },
    { code: 'AD7MV', label: 'Blé dur Bologne', market: 'Bologne' },
    { code: 'FK3ZN', label: 'Farine T55 France', market: 'France' },
  ],

  // SUCRE
  'sucre': [
    { code: 'SU7R1', label: 'Sucre blanc spot', market: 'Londres' },
    { code: 'SU8P3', label: 'Sucre raffiné premium', market: 'Paris' },
    { code: 'SU9K2', label: 'Sucre roux canne', market: 'New York' },
    { code: 'SUB4F', label: 'Sucre bio équitable', market: 'France' },
    { code: 'SU6M7', label: 'Sucre glace indus', market: 'Union européenne' },
    { code: 'SU3V9', label: 'Sucre inverti', market: 'France' },
    { code: 'SU5H4', label: 'Vergeoise blonde', market: 'Nord France' },
    { code: 'SU2W8', label: 'Cassonade canne', market: 'Maurice' },
  ],

  // SEL
  'sel': [
    { code: 'SE4N1', label: 'Sel fin Guérande', market: 'France' },
    { code: 'SE7T3', label: 'Sel gemme indus', market: 'Allemagne' },
    { code: 'SE2K9', label: 'Fleur sel Camargue', market: 'France' },
    { code: 'SE8P5', label: 'Sel nitrité', market: 'Union européenne' },
    { code: 'SE1M4', label: 'Gros sel marin', market: 'Portugal' },
    { code: 'SE6V2', label: 'Sel iodé alim', market: 'France' },
  ],

  // LAIT EN POUDRE
  'lait': [
    { code: 'LA3K7', label: 'Lait écrémé spray', market: 'France' },
    { code: 'LA9P2', label: 'Lait entier 26%', market: 'Océanie' },
    { code: 'LA5M1', label: 'Lait écrémé bio', market: 'France' },
    { code: 'LA7T4', label: 'Lait demi-écrémé', market: 'Union européenne' },
    { code: 'LA2V8', label: 'Lait concentré sucré', market: 'France' },
    { code: 'LA8N6', label: 'Babeurre poudre', market: 'Pays-Bas' },
  ],

  // BEURRE
  'beurre': [
    { code: 'BU6R3', label: 'Beurre doux 82%', market: 'France' },
    { code: 'BU2M9', label: 'Beurre AOP Charentes', market: 'France' },
    { code: 'BU8K1', label: 'Beurre concentré', market: 'Union européenne' },
    { code: 'BU4P7', label: 'Beurre baratte bio', market: 'France' },
    { code: 'BU1T5', label: 'MGLA Océanie', market: 'Océanie' },
    { code: 'BU9V2', label: 'Beurre tourage', market: 'France' },
    { code: 'BU3N8', label: 'Beurre demi-sel', market: 'France' },
  ],

  // HUILE VÉGÉTALE
  'huile': [
    { code: 'HU5K4', label: 'Huile tournesol', market: 'Ukraine' },
    { code: 'HU9M2', label: 'Huile colza', market: 'France' },
    { code: 'HU3P8', label: 'Huile olive vierge', market: 'Espagne' },
    { code: 'HU7T1', label: 'Huile palme RSPO', market: 'Malaisie' },
    { code: 'HU2V6', label: 'Huile soja non OGM', market: 'Brésil' },
    { code: 'HU8N3', label: 'Huile arachide', market: 'Argentine' },
    { code: 'HU4R9', label: 'Huile coco bio', market: 'Philippines' },
    { code: 'HU1K7', label: 'Tournesol oléique', market: 'France' },
  ],

  // OEUFS
  'oeufs': [
    { code: 'OE6P2', label: 'Oeuf liquide', market: 'France' },
    { code: 'OE3M8', label: 'Jaune concentré', market: 'France' },
    { code: 'OE9K4', label: 'Blanc poudre', market: 'Union européenne' },
    { code: 'OE1T7', label: 'Oeuf bio plein air', market: 'France' },
    { code: 'OE5V1', label: 'Oeuf liquide sucré', market: 'France' },
    { code: 'OE8N5', label: 'Ovoproduit séché', market: 'Pays-Bas' },
  ],

  // LEVURE
  'levure': [
    { code: 'LV4K9', label: 'Levure fraîche', market: 'France' },
    { code: 'LV7P3', label: 'Levure sèche', market: 'France' },
    { code: 'LV2M6', label: 'Levure chimique', market: 'Union européenne' },
    { code: 'LV9T1', label: 'Levure bio', market: 'France' },
    { code: 'LV5V8', label: 'Levain déshydraté', market: 'Allemagne' },
  ],

  // AMIDON DE MAÏS
  'amidon-mais': [
    { code: 'AM3R7', label: 'Amidon maïs natif', market: 'France' },
    { code: 'AM8K2', label: 'Amidon modifié', market: 'Union européenne' },
    { code: 'AM1P5', label: 'Amidon waxy', market: 'États-Unis' },
    { code: 'AM6M9', label: 'Maltodextrine DE19', market: 'France' },
    { code: 'AM4T3', label: 'Sirop glucose', market: 'France' },
    { code: 'AM9V6', label: 'Amidon maïs bio', market: 'France' },
  ],

  // GÉLATINE
  'gelatine': [
    { code: 'GE5N4', label: 'Gélatine bovine', market: 'Allemagne' },
    { code: 'GE2K8', label: 'Gélatine porcine', market: 'France' },
    { code: 'GE7P1', label: 'Gélatine poisson', market: 'Union européenne' },
    { code: 'GE9M5', label: 'Gélatine feuilles', market: 'Allemagne' },
    { code: 'GE3T9', label: 'Collagène hydrolysé', market: 'France' },
  ],

  // PRÉSURE
  'presure': [
    { code: 'PR8K6', label: 'Présure animale', market: 'France' },
    { code: 'PR4P2', label: 'Coagulant microbien', market: 'Danemark' },
    { code: 'PR1M9', label: 'Chymosine', market: 'Union européenne' },
    { code: 'PR6T3', label: 'Présure végétale', market: 'Portugal' },
  ],

  // FERMENTS LACTIQUES
  'ferments-lactiques': [
    { code: 'FL7V5', label: 'Ferments mésophiles', market: 'Danemark' },
    { code: 'FL2K1', label: 'Ferments yaourt', market: 'France' },
    { code: 'FL9P8', label: 'Probiotiques', market: 'Union européenne' },
    { code: 'FL4M4', label: 'Ferments fromage', market: 'France' },
    { code: 'FL6T7', label: 'Levains bio', market: 'France' },
  ],

  // CRÈME FRAÎCHE
  'creme-fraiche': [
    { code: 'CR3N9', label: 'Crème 35% UHT', market: 'France' },
    { code: 'CR8K2', label: 'Crème Isigny AOP', market: 'France' },
    { code: 'CR5P6', label: 'Crème épaisse 30%', market: 'France' },
    { code: 'CR1M3', label: 'Crème légère 15%', market: 'France' },
    { code: 'CR7T7', label: 'Crème bio', market: 'France' },
  ],

  // EAU
  'eau': [
    { code: 'EA2V4', label: 'Eau process', market: 'Local' },
    { code: 'EA6K8', label: 'Eau osmosée', market: 'Local' },
    { code: 'EA9P1', label: 'Eau source', market: 'France' },
  ],

  // CARTON ONDULÉ
  'carton-ondule': [
    { code: 'CA4M7', label: 'Carton double BC', market: 'France' },
    { code: 'CA8K3', label: 'Carton simple E', market: 'Union européenne' },
    { code: 'CA1P9', label: 'Carton micro N', market: 'Allemagne' },
    { code: 'CA6T2', label: 'Carton triple', market: 'France' },
    { code: 'CA3V6', label: 'Carton recyclé FSC', market: 'France' },
  ],

  // POLYPROPYLÈNE
  'polypropylene': [
    { code: 'PP7N5', label: 'PP injection', market: 'Union européenne' },
    { code: 'PP2K1', label: 'PP film', market: 'Allemagne' },
    { code: 'PP9P8', label: 'PP alimentaire', market: 'France' },
    { code: 'PP4M4', label: 'PP recyclé', market: 'Union européenne' },
  ],

  // POLYÉTHYLÈNE
  'polyethylene': [
    { code: 'PE6T9', label: 'PEBD film souple', market: 'Union européenne' },
    { code: 'PE3K3', label: 'PEHD rigide', market: 'France' },
    { code: 'PE8P7', label: 'PEBD recyclé', market: 'Union européenne' },
    { code: 'PE1M2', label: 'PE barrière', market: 'Allemagne' },
  ],

  // ALUMINIUM
  'aluminium': [
    { code: 'AL5V6', label: 'Feuille alu 12µ', market: 'Union européenne' },
    { code: 'AL9K4', label: 'Barquette alu', market: 'France' },
    { code: 'AL2P1', label: 'Complexe alu/PE', market: 'Allemagne' },
    { code: 'AL7M8', label: 'Alu laqué', market: 'France' },
  ],

  // VERRE
  'verre': [
    { code: 'VE4T3', label: 'Bocal 370ml', market: 'France' },
    { code: 'VE8K7', label: 'Bouteille verte', market: 'France' },
    { code: 'VE1P5', label: 'Pot twist-off', market: 'Union européenne' },
    { code: 'VE6M9', label: 'Verre recyclé 30%', market: 'France' },
  ],

  // ACIER
  'acier': [
    { code: 'AC3N2', label: 'Fer blanc étamé', market: 'Union européenne' },
    { code: 'AC7K6', label: 'Acier chromé', market: 'Allemagne' },
    { code: 'AC9P4', label: 'Boîte soudée', market: 'France' },
    { code: 'AC2M8', label: 'Couvercle easy-open', market: 'France' },
  ],

  // PAPIER KRAFT
  'papier-kraft': [
    { code: 'PK5T1', label: 'Kraft brun 70g', market: 'Scandinavie' },
    { code: 'PK8K5', label: 'Kraft blanchi', market: 'France' },
    { code: 'PK2P9', label: 'Kraft sachets', market: 'France' },
    { code: 'PK6M3', label: 'Kraft recyclé FSC', market: 'Union européenne' },
  ],

  // POLYSTYRÈNE EXPANSÉ
  'polystyrene-expanse': [
    { code: 'PS4V7', label: 'PSE barquette', market: 'France' },
    { code: 'PS9K1', label: 'PSE haute densité', market: 'Union européenne' },
    { code: 'PS1P4', label: 'PSE recyclable', market: 'France' },
  ],

  // PET
  'pet': [
    { code: 'PT7N8', label: 'PET cristal', market: 'Union européenne' },
    { code: 'PT3K2', label: 'rPET recyclé 50%', market: 'France' },
    { code: 'PT6P6', label: 'PET thermoformage', market: 'Allemagne' },
    { code: 'PT2M9', label: 'PET barrière O2', market: 'France' },
  ],

  // ÉTIQUETTES PAPIER
  'etiquettes-papier': [
    { code: 'ET5T4', label: 'Étiquette couché', market: 'France' },
    { code: 'ET8K8', label: 'Étiquette PP', market: 'Union européenne' },
    { code: 'ET1P2', label: 'Manchon PET', market: 'France' },
    { code: 'ET4M6', label: 'Étiquette recyclable', market: 'France' },
  ],

  // ENCRE D'IMPRESSION
  'encre-impression': [
    { code: 'EN6V9', label: 'Encre UV flexo', market: 'Union européenne' },
    { code: 'EN2K3', label: 'Encre base eau', market: 'France' },
    { code: 'EN9P7', label: 'Encre low migration', market: 'Allemagne' },
    { code: 'EN3M1', label: 'Encre bio-sourcée', market: 'France' },
  ],

  // COLLE ALIMENTAIRE
  'colle-alimentaire': [
    { code: 'CO7T5', label: 'Colle caséine', market: 'France' },
    { code: 'CO4K9', label: 'Colle hotmelt', market: 'Union européenne' },
    { code: 'CO1P3', label: 'Colle amidon', market: 'France' },
  ],

  // PALETTES BOIS
  'palettes-bois': [
    { code: 'PB8N6', label: 'Palette EUR EPAL', market: 'Union européenne' },
    { code: 'PB3K2', label: 'Palette perdue', market: 'France' },
    { code: 'PB6P8', label: 'Palette CHEP', market: 'Union européenne' },
    { code: 'PB2M4', label: 'Palette recyclée', market: 'France' },
  ],

  // FILM ÉTIRABLE
  'film-etirable': [
    { code: 'FE9T7', label: 'Film manuel 17µ', market: 'France' },
    { code: 'FE4K1', label: 'Film machine', market: 'Union européenne' },
    { code: 'FE7P5', label: 'Film bio-sourcé', market: 'France' },
    { code: 'FE2M9', label: 'Film recyclé PCR', market: 'Union européenne' },
  ],

  // RUBAN ADHÉSIF
  'ruban-adhesif': [
    { code: 'RA5V3', label: 'Adhésif PP havane', market: 'France' },
    { code: 'RA8K7', label: 'Adhésif kraft', market: 'France' },
    { code: 'RA1P1', label: 'Adhésif recyclable', market: 'Union européenne' },
    { code: 'RA4M5', label: 'Adhésif imprimé', market: 'France' },
  ],
}

/**
 * Récupère les références disponibles pour une MP donnée
 */
export function getMPReferences(mpId: string): MPReference[] {
  return mpReferences[mpId] || []
}

/**
 * Trouve une référence par son code
 */
export function findReferenceByCode(mpId: string, code: string): MPReference | undefined {
  const refs = mpReferences[mpId] || []
  return refs.find(ref => ref.code === code)
}
