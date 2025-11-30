/**
 * Références de matières premières disponibles pour chaque type de MP
 * Structure: mpId -> liste de références disponibles
 * Chaque référence inclut priceFirst et priceLast pour permettre la mise à jour des prix
 * L'évolution est calculée dynamiquement: ((priceLast - priceFirst) / priceFirst) * 100
 */

export interface MPReference {
  code: string
  label: string
  market: string
  priceFirst: number  // Prix première période (€/kg ou €/unité)
  priceLast: number   // Prix dernière période
}

export const mpReferences: Record<string, MPReference[]> = {
  // FARINE DE BLÉ - Prix base ~0.45 €/kg
  'farine-ble': [
    { code: 'FE23', label: 'Farine T55 France', market: 'France', priceFirst: 0.452, priceLast: 0.478 },
    { code: 'D7M2', label: 'Blé dur bio Milan', market: 'Milan', priceFirst: 0.485, priceLast: 0.512 },
    { code: 'AD7VF', label: 'Blé dur bio France', market: 'France', priceFirst: 0.498, priceLast: 0.521 },
    { code: 'AD7DE', label: 'Blé dur La Pallice', market: 'France', priceFirst: 0.438, priceLast: 0.465 },
    { code: 'FK31E', label: 'Blé tendre bio', market: 'France', priceFirst: 0.472, priceLast: 0.495 },
    { code: 'FK3YA', label: 'Blé meunier Rouen', market: 'France', priceFirst: 0.425, priceLast: 0.448 },
    { code: 'FK3QJ', label: 'Blé meunier Bologne', market: 'Bologne', priceFirst: 0.442, priceLast: 0.468 },
    { code: 'SIFG5', label: 'Indice SIFPAF', market: 'France', priceFirst: 0.455, priceLast: 0.482 },
  ],

  // SUCRE - Prix base ~0.85 €/kg
  'sucre': [
    { code: 'FE23', label: 'Sucre blanc France', market: 'France', priceFirst: 0.852, priceLast: 0.895 },
    { code: 'SU7R1', label: 'Sucre blanc spot', market: 'Londres', priceFirst: 0.825, priceLast: 0.868 },
    { code: 'SU8P3', label: 'Sucre raffiné premium', market: 'Paris', priceFirst: 0.912, priceLast: 0.958 },
    { code: 'SU9K2', label: 'Sucre roux canne', market: 'New York', priceFirst: 0.798, priceLast: 0.842 },
    { code: 'SUB4F', label: 'Sucre bio équitable', market: 'France', priceFirst: 1.025, priceLast: 1.078 },
    { code: 'SU6M7', label: 'Sucre glace indus', market: 'UE', priceFirst: 0.895, priceLast: 0.938 },
  ],

  // SEL - Prix base ~0.15 €/kg
  'sel': [
    { code: 'FR34', label: 'Sel fin alimentaire', market: 'France', priceFirst: 0.148, priceLast: 0.152 },
    { code: 'SE4N1', label: 'Sel fin Guérande', market: 'France', priceFirst: 0.285, priceLast: 0.295 },
    { code: 'SE7T3', label: 'Sel gemme indus', market: 'Allemagne', priceFirst: 0.125, priceLast: 0.128 },
    { code: 'SE2K9', label: 'Fleur sel Camargue', market: 'France', priceFirst: 0.425, priceLast: 0.438 },
    { code: 'SE1M4', label: 'Gros sel marin', market: 'Portugal', priceFirst: 0.138, priceLast: 0.142 },
    { code: 'SE6V2', label: 'Sel iodé alim', market: 'France', priceFirst: 0.158, priceLast: 0.165 },
  ],

  // LAIT EN POUDRE - Prix base ~3.20 €/kg
  'lait': [
    { code: 'FR34', label: 'Lait poudre France', market: 'France', priceFirst: 3.185, priceLast: 3.352 },
    { code: 'LA3K7', label: 'Lait écrémé spray', market: 'France', priceFirst: 2.985, priceLast: 3.125 },
    { code: 'LA9P2', label: 'Lait entier 26%', market: 'Océanie', priceFirst: 3.425, priceLast: 3.598 },
    { code: 'LA5M1', label: 'Lait écrémé bio', market: 'France', priceFirst: 3.652, priceLast: 3.845 },
    { code: 'LA7T4', label: 'Lait demi-écrémé', market: 'UE', priceFirst: 3.085, priceLast: 3.242 },
    { code: 'LA8N6', label: 'Babeurre poudre', market: 'Pays-Bas', priceFirst: 2.785, priceLast: 2.925 },
  ],

  // BEURRE - Prix base ~6.50 €/kg
  'beurre': [
    { code: 'FR34', label: 'Beurre doux France', market: 'France', priceFirst: 6.485, priceLast: 6.825 },
    { code: 'BU6R3', label: 'Beurre doux 82%', market: 'France', priceFirst: 6.325, priceLast: 6.652 },
    { code: 'BU2M9', label: 'Beurre AOP Charentes', market: 'France', priceFirst: 7.125, priceLast: 7.485 },
    { code: 'BU8K1', label: 'Beurre concentré', market: 'UE', priceFirst: 7.852, priceLast: 8.245 },
    { code: 'BU4P7', label: 'Beurre baratte bio', market: 'France', priceFirst: 7.425, priceLast: 7.798 },
    { code: 'BU1T5', label: 'MGLA Océanie', market: 'Océanie', priceFirst: 5.985, priceLast: 6.285 },
  ],

  // HUILE VÉGÉTALE - Prix base ~1.25 €/kg
  'huile': [
    { code: 'FR34', label: 'Huile végétale France', market: 'France', priceFirst: 1.248, priceLast: 1.312 },
    { code: 'HU5K4', label: 'Huile tournesol', market: 'Ukraine', priceFirst: 1.125, priceLast: 1.182 },
    { code: 'HU9M2', label: 'Huile colza', market: 'France', priceFirst: 1.285, priceLast: 1.352 },
    { code: 'HU3P8', label: 'Huile olive vierge', market: 'Espagne', priceFirst: 4.852, priceLast: 5.095 },
    { code: 'HU7T1', label: 'Huile palme RSPO', market: 'Malaisie', priceFirst: 0.985, priceLast: 1.035 },
    { code: 'HU2V6', label: 'Huile soja non OGM', market: 'Brésil', priceFirst: 1.152, priceLast: 1.212 },
    { code: 'HU1K7', label: 'Tournesol oléique', market: 'France', priceFirst: 1.385, priceLast: 1.455 },
  ],

  // OEUFS - Prix base ~2.85 €/kg
  'oeufs': [
    { code: 'FR34', label: 'Oeufs liquides France', market: 'France', priceFirst: 2.852, priceLast: 2.995 },
    { code: 'OE6P2', label: 'Oeuf liquide', market: 'France', priceFirst: 2.785, priceLast: 2.925 },
    { code: 'OE3M8', label: 'Jaune concentré', market: 'France', priceFirst: 3.425, priceLast: 3.598 },
    { code: 'OE9K4', label: 'Blanc poudre', market: 'UE', priceFirst: 8.525, priceLast: 8.952 },
    { code: 'OE1T7', label: 'Oeuf bio plein air', market: 'France', priceFirst: 3.852, priceLast: 4.045 },
    { code: 'OE8N5', label: 'Ovoproduit séché', market: 'Pays-Bas', priceFirst: 7.125, priceLast: 7.482 },
  ],

  // LEVURE - Prix base ~2.15 €/kg
  'levure': [
    { code: 'FR34', label: 'Levure France', market: 'France', priceFirst: 2.148, priceLast: 2.255 },
    { code: 'LV4K9', label: 'Levure fraîche', market: 'France', priceFirst: 1.985, priceLast: 2.085 },
    { code: 'LV7P3', label: 'Levure sèche', market: 'France', priceFirst: 2.425, priceLast: 2.548 },
    { code: 'LV2M6', label: 'Levure chimique', market: 'UE', priceFirst: 1.852, priceLast: 1.945 },
    { code: 'LV9T1', label: 'Levure bio', market: 'France', priceFirst: 2.685, priceLast: 2.822 },
    { code: 'LV5V8', label: 'Levain déshydraté', market: 'Allemagne', priceFirst: 3.125, priceLast: 3.282 },
  ],

  // AMIDON DE MAÏS - Prix base ~0.75 €/kg
  'amidon-mais': [
    { code: 'FR34', label: 'Amidon maïs France', market: 'France', priceFirst: 0.748, priceLast: 0.785 },
    { code: 'AM3R7', label: 'Amidon maïs natif', market: 'France', priceFirst: 0.725, priceLast: 0.762 },
    { code: 'AM8K2', label: 'Amidon modifié', market: 'UE', priceFirst: 0.852, priceLast: 0.895 },
    { code: 'AM1P5', label: 'Amidon waxy', market: 'États-Unis', priceFirst: 0.798, priceLast: 0.838 },
    { code: 'AM6M9', label: 'Maltodextrine DE19', market: 'France', priceFirst: 0.925, priceLast: 0.972 },
    { code: 'AM9V6', label: 'Amidon maïs bio', market: 'France', priceFirst: 0.985, priceLast: 1.035 },
  ],

  // GÉLATINE - Prix base ~8.50 €/kg
  'gelatine': [
    { code: 'FR34', label: 'Gélatine France', market: 'France', priceFirst: 8.485, priceLast: 8.912 },
    { code: 'GE5N4', label: 'Gélatine bovine', market: 'Allemagne', priceFirst: 8.252, priceLast: 8.665 },
    { code: 'GE2K8', label: 'Gélatine porcine', market: 'France', priceFirst: 7.985, priceLast: 8.385 },
    { code: 'GE7P1', label: 'Gélatine poisson', market: 'UE', priceFirst: 12.525, priceLast: 13.152 },
    { code: 'GE9M5', label: 'Gélatine feuilles', market: 'Allemagne', priceFirst: 9.125, priceLast: 9.582 },
    { code: 'GE3T9', label: 'Collagène hydrolysé', market: 'France', priceFirst: 15.852, priceLast: 16.645 },
  ],

  // PRÉSURE - Prix base ~45.00 €/kg
  'presure': [
    { code: 'FR34', label: 'Présure France', market: 'France', priceFirst: 44.852, priceLast: 47.095 },
    { code: 'PR8K6', label: 'Présure animale', market: 'France', priceFirst: 42.525, priceLast: 44.652 },
    { code: 'PR4P2', label: 'Coagulant microbien', market: 'Danemark', priceFirst: 38.852, priceLast: 40.795 },
    { code: 'PR1M9', label: 'Chymosine', market: 'UE', priceFirst: 52.125, priceLast: 54.732 },
    { code: 'PR6T3', label: 'Présure végétale', market: 'Portugal', priceFirst: 48.525, priceLast: 50.952 },
  ],

  // FERMENTS LACTIQUES - Prix base ~125.00 €/kg
  'ferments-lactiques': [
    { code: 'FR34', label: 'Ferments France', market: 'France', priceFirst: 124.852, priceLast: 131.095 },
    { code: 'FL7V5', label: 'Ferments mésophiles', market: 'Danemark', priceFirst: 118.525, priceLast: 124.452 },
    { code: 'FL2K1', label: 'Ferments yaourt', market: 'France', priceFirst: 135.852, priceLast: 142.645 },
    { code: 'FL9P8', label: 'Probiotiques', market: 'UE', priceFirst: 185.125, priceLast: 194.382 },
    { code: 'FL4M4', label: 'Ferments fromage', market: 'France', priceFirst: 142.525, priceLast: 149.652 },
    { code: 'FL6T7', label: 'Levains bio', market: 'France', priceFirst: 158.852, priceLast: 166.795 },
  ],

  // CRÈME FRAÎCHE - Prix base ~3.25 €/kg
  'creme-fraiche': [
    { code: 'FR34', label: 'Crème fraîche France', market: 'France', priceFirst: 3.248, priceLast: 3.412 },
    { code: 'CR3N9', label: 'Crème 35% UHT', market: 'France', priceFirst: 3.125, priceLast: 3.282 },
    { code: 'CR8K2', label: 'Crème Isigny AOP', market: 'France', priceFirst: 4.525, priceLast: 4.752 },
    { code: 'CR5P6', label: 'Crème épaisse 30%', market: 'France', priceFirst: 3.425, priceLast: 3.598 },
    { code: 'CR1M3', label: 'Crème légère 15%', market: 'France', priceFirst: 2.852, priceLast: 2.995 },
    { code: 'CR7T7', label: 'Crème bio', market: 'France', priceFirst: 4.125, priceLast: 4.332 },
  ],

  // EAU - Prix base ~0.003 €/kg
  'eau': [
    { code: 'HE65', label: 'Eau process', market: 'Local', priceFirst: 0.00285, priceLast: 0.00292 },
    { code: 'EA2V4', label: 'Eau process indus', market: 'Local', priceFirst: 0.00275, priceLast: 0.00282 },
    { code: 'EA6K8', label: 'Eau osmosée', market: 'Local', priceFirst: 0.00425, priceLast: 0.00438 },
    { code: 'EA9P1', label: 'Eau source', market: 'France', priceFirst: 0.00352, priceLast: 0.00362 },
  ],

  // CARTON ONDULÉ - Prix base ~0.85 €/kg
  'carton-ondule': [
    { code: 'MP01', label: 'Carton ondulé std', market: 'France', priceFirst: 0.852, priceLast: 0.895 },
    { code: 'CA4M7', label: 'Carton double BC', market: 'France', priceFirst: 0.925, priceLast: 0.972 },
    { code: 'CA8K3', label: 'Carton simple E', market: 'UE', priceFirst: 0.752, priceLast: 0.790 },
    { code: 'CA1P9', label: 'Carton micro N', market: 'Allemagne', priceFirst: 0.885, priceLast: 0.930 },
    { code: 'CA3V6', label: 'Carton recyclé FSC', market: 'France', priceFirst: 0.798, priceLast: 0.838 },
  ],

  // POLYPROPYLÈNE - Prix base ~1.45 €/kg
  'polypropylene': [
    { code: 'MP02', label: 'Polypropylène std', market: 'France', priceFirst: 1.452, priceLast: 1.525 },
    { code: 'PP7N5', label: 'PP injection', market: 'UE', priceFirst: 1.385, priceLast: 1.455 },
    { code: 'PP2K1', label: 'PP film', market: 'Allemagne', priceFirst: 1.525, priceLast: 1.602 },
    { code: 'PP9P8', label: 'PP alimentaire', market: 'France', priceFirst: 1.585, priceLast: 1.665 },
    { code: 'PP4M4', label: 'PP recyclé', market: 'UE', priceFirst: 1.285, priceLast: 1.350 },
  ],

  // POLYÉTHYLÈNE - Prix base ~1.35 €/kg
  'polyethylene': [
    { code: 'MP03', label: 'Polyéthylène std', market: 'France', priceFirst: 1.352, priceLast: 1.420 },
    { code: 'PE6T9', label: 'PEBD film souple', market: 'UE', priceFirst: 1.285, priceLast: 1.350 },
    { code: 'PE3K3', label: 'PEHD rigide', market: 'France', priceFirst: 1.425, priceLast: 1.498 },
    { code: 'PE8P7', label: 'PEBD recyclé', market: 'UE', priceFirst: 1.185, priceLast: 1.245 },
    { code: 'PE1M2', label: 'PE barrière', market: 'Allemagne', priceFirst: 1.585, priceLast: 1.665 },
  ],

  // ALUMINIUM - Prix base ~2.85 €/kg
  'aluminium': [
    { code: 'MP04', label: 'Aluminium std', market: 'France', priceFirst: 2.852, priceLast: 2.995 },
    { code: 'AL5V6', label: 'Feuille alu 12µ', market: 'UE', priceFirst: 2.725, priceLast: 2.862 },
    { code: 'AL9K4', label: 'Barquette alu', market: 'France', priceFirst: 3.125, priceLast: 3.282 },
    { code: 'AL2P1', label: 'Complexe alu/PE', market: 'Allemagne', priceFirst: 3.425, priceLast: 3.598 },
    { code: 'AL7M8', label: 'Alu laqué', market: 'France', priceFirst: 3.252, priceLast: 3.415 },
  ],

  // VERRE - Prix base ~0.35 €/kg
  'verre': [
    { code: 'MP05', label: 'Verre std', market: 'France', priceFirst: 0.352, priceLast: 0.370 },
    { code: 'VE4T3', label: 'Bocal 370ml', market: 'France', priceFirst: 0.385, priceLast: 0.405 },
    { code: 'VE8K7', label: 'Bouteille verte', market: 'France', priceFirst: 0.325, priceLast: 0.342 },
    { code: 'VE1P5', label: 'Pot twist-off', market: 'UE', priceFirst: 0.365, priceLast: 0.384 },
    { code: 'VE6M9', label: 'Verre recyclé 30%', market: 'France', priceFirst: 0.312, priceLast: 0.328 },
  ],

  // ACIER - Prix base ~1.15 €/kg
  'acier': [
    { code: 'MP06', label: 'Acier std', market: 'France', priceFirst: 1.152, priceLast: 1.210 },
    { code: 'AC3N2', label: 'Fer blanc étamé', market: 'UE', priceFirst: 1.085, priceLast: 1.140 },
    { code: 'AC7K6', label: 'Acier chromé', market: 'Allemagne', priceFirst: 1.252, priceLast: 1.315 },
    { code: 'AC9P4', label: 'Boîte soudée', market: 'France', priceFirst: 1.185, priceLast: 1.245 },
    { code: 'AC2M8', label: 'Couvercle easy-open', market: 'France', priceFirst: 1.325, priceLast: 1.392 },
  ],

  // PAPIER KRAFT - Prix base ~0.72 €/kg
  'papier-kraft': [
    { code: 'MP07', label: 'Papier kraft std', market: 'France', priceFirst: 0.718, priceLast: 0.754 },
    { code: 'PK5T1', label: 'Kraft brun 70g', market: 'Scandinavie', priceFirst: 0.685, priceLast: 0.720 },
    { code: 'PK8K5', label: 'Kraft blanchi', market: 'France', priceFirst: 0.785, priceLast: 0.825 },
    { code: 'PK2P9', label: 'Kraft sachets', market: 'France', priceFirst: 0.752, priceLast: 0.790 },
    { code: 'PK6M3', label: 'Kraft recyclé FSC', market: 'UE', priceFirst: 0.652, priceLast: 0.685 },
  ],

  // POLYSTYRÈNE EXPANSÉ - Prix base ~2.25 €/kg
  'polystyrene-expanse': [
    { code: 'MP08', label: 'PSE std', market: 'France', priceFirst: 2.252, priceLast: 2.365 },
    { code: 'PS4V7', label: 'PSE barquette', market: 'France', priceFirst: 2.185, priceLast: 2.295 },
    { code: 'PS9K1', label: 'PSE haute densité', market: 'UE', priceFirst: 2.425, priceLast: 2.548 },
    { code: 'PS1P4', label: 'PSE recyclable', market: 'France', priceFirst: 2.085, priceLast: 2.190 },
  ],

  // PET - Prix base ~1.55 €/kg
  'pet': [
    { code: 'MP09', label: 'PET std', market: 'France', priceFirst: 1.552, priceLast: 1.630 },
    { code: 'PT7N8', label: 'PET cristal', market: 'UE', priceFirst: 1.485, priceLast: 1.560 },
    { code: 'PT3K2', label: 'rPET recyclé 50%', market: 'France', priceFirst: 1.685, priceLast: 1.770 },
    { code: 'PT6P6', label: 'PET thermoformage', market: 'Allemagne', priceFirst: 1.625, priceLast: 1.708 },
    { code: 'PT2M9', label: 'PET barrière O2', market: 'France', priceFirst: 1.785, priceLast: 1.875 },
  ],

  // ÉTIQUETTES PAPIER - Prix base ~3.85 €/kg
  'etiquettes-papier': [
    { code: 'MP10', label: 'Étiquettes std', market: 'France', priceFirst: 3.852, priceLast: 4.045 },
    { code: 'ET5T4', label: 'Étiquette couché', market: 'France', priceFirst: 3.725, priceLast: 3.912 },
    { code: 'ET8K8', label: 'Étiquette PP', market: 'UE', priceFirst: 4.125, priceLast: 4.332 },
    { code: 'ET1P2', label: 'Manchon PET', market: 'France', priceFirst: 4.525, priceLast: 4.752 },
    { code: 'ET4M6', label: 'Étiquette recyclable', market: 'France', priceFirst: 3.585, priceLast: 3.765 },
  ],

  // ENCRE D'IMPRESSION - Prix base ~12.50 €/kg
  'encre-impression': [
    { code: 'MP11', label: 'Encre std', market: 'France', priceFirst: 12.485, priceLast: 13.110 },
    { code: 'EN6V9', label: 'Encre UV flexo', market: 'UE', priceFirst: 14.252, priceLast: 14.965 },
    { code: 'EN2K3', label: 'Encre base eau', market: 'France', priceFirst: 11.852, priceLast: 12.445 },
    { code: 'EN9P7', label: 'Encre low migration', market: 'Allemagne', priceFirst: 15.525, priceLast: 16.302 },
    { code: 'EN3M1', label: 'Encre bio-sourcée', market: 'France', priceFirst: 13.852, priceLast: 14.545 },
  ],

  // COLLE ALIMENTAIRE - Prix base ~4.25 €/kg
  'colle-alimentaire': [
    { code: 'MP12', label: 'Colle std', market: 'France', priceFirst: 4.252, priceLast: 4.465 },
    { code: 'CO7T5', label: 'Colle caséine', market: 'France', priceFirst: 4.525, priceLast: 4.752 },
    { code: 'CO4K9', label: 'Colle hotmelt', market: 'UE', priceFirst: 3.985, priceLast: 4.185 },
    { code: 'CO1P3', label: 'Colle amidon', market: 'France', priceFirst: 3.725, priceLast: 3.912 },
  ],

  // PALETTES BOIS - Prix base ~8.50 €/unité
  'palettes-bois': [
    { code: 'MP13', label: 'Palette std', market: 'France', priceFirst: 8.485, priceLast: 8.910 },
    { code: 'PB8N6', label: 'Palette EUR EPAL', market: 'UE', priceFirst: 9.525, priceLast: 10.002 },
    { code: 'PB3K2', label: 'Palette perdue', market: 'France', priceFirst: 6.852, priceLast: 7.195 },
    { code: 'PB6P8', label: 'Palette CHEP', market: 'UE', priceFirst: 4.252, priceLast: 4.465 },
    { code: 'PB2M4', label: 'Palette recyclée', market: 'France', priceFirst: 7.125, priceLast: 7.482 },
  ],

  // FILM ÉTIRABLE - Prix base ~2.15 €/kg
  'film-etirable': [
    { code: 'MP14', label: 'Film étirable std', market: 'France', priceFirst: 2.152, priceLast: 2.260 },
    { code: 'FE9T7', label: 'Film manuel 17µ', market: 'France', priceFirst: 2.085, priceLast: 2.190 },
    { code: 'FE4K1', label: 'Film machine', market: 'UE', priceFirst: 1.985, priceLast: 2.085 },
    { code: 'FE7P5', label: 'Film bio-sourcé', market: 'France', priceFirst: 2.525, priceLast: 2.652 },
    { code: 'FE2M9', label: 'Film recyclé PCR', market: 'UE', priceFirst: 2.325, priceLast: 2.442 },
  ],

  // RUBAN ADHÉSIF - Prix base ~5.85 €/kg
  'ruban-adhesif': [
    { code: 'MP15', label: 'Ruban adhésif std', market: 'France', priceFirst: 5.852, priceLast: 6.145 },
    { code: 'RA5V3', label: 'Adhésif PP havane', market: 'France', priceFirst: 5.525, priceLast: 5.802 },
    { code: 'RA8K7', label: 'Adhésif kraft', market: 'France', priceFirst: 6.252, priceLast: 6.565 },
    { code: 'RA1P1', label: 'Adhésif recyclable', market: 'UE', priceFirst: 6.425, priceLast: 6.748 },
    { code: 'RA4M5', label: 'Adhésif imprimé', market: 'France', priceFirst: 7.125, priceLast: 7.482 },
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

/**
 * Trouve une référence par son code dans toutes les MP
 */
export function findReferenceByCodeGlobal(code: string): { mpId: string; reference: MPReference } | undefined {
  for (const [mpId, refs] of Object.entries(mpReferences)) {
    const ref = refs.find(r => r.code === code)
    if (ref) {
      return { mpId, reference: ref }
    }
  }
  return undefined
}
