import { MPValueItem, MPVolumeItem } from '@/stores/simulationStore'

/**
 * Table de correspondance entre les labels de la heatmap et les clés du graphique
 */
const MP_LABEL_TO_KEY_MAP: Record<string, string> = {
  // MPA
  'Farine de blé': 'farine-ble',
  'Sucre': 'sucre',
  'Sel': 'sel',
  'Lait en poudre': 'lait',
  'Beurre': 'beurre',
  'Huile végétale': 'huile',
  'Oeufs': 'oeufs',
  'Œufs': 'oeufs', // Variante
  'Levure': 'levure',
  'Amidon de maïs': 'amidon-mais',
  'Gélatine': 'gelatine',
  'Présure': 'presure',
  'Ferments lactiques': 'ferments-lactiques',
  'Crème fraîche': 'creme-fraiche',
  'Eau': 'eau',
  // MPI
  'Carton ondulé': 'carton-ondule',
  'Polypropylène': 'polypropylene',
  'Polyéthylène': 'polyethylene',
  'Aluminium': 'aluminium',
  'Verre': 'verre',
  'Acier': 'acier',
  'Papier kraft': 'papier-kraft',
  'Polystyrène expansé': 'polystyrene-expanse',
  'PET': 'pet',
  'Étiquettes papier': 'etiquettes-papier',
  'Encre d\'impression': 'encre-impression',
  'Colle alimentaire': 'colle-alimentaire',
  'Palettes bois': 'palettes-bois',
  'Film étirable': 'film-etirable',
  'Ruban adhésif': 'ruban-adhesif',
}

/**
 * Crée un ID normalisé à partir d'un nom de MP
 */
export function createMPId(name: string): string {
  // Utiliser la table de correspondance si disponible
  if (MP_LABEL_TO_KEY_MAP[name]) {
    return MP_LABEL_TO_KEY_MAP[name]
  }

  // Sinon, normaliser le nom
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s]/g, '') // Enlever les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
}

/**
 * Extrait les prix MP depuis les données du graphique
 * Retourne les prix de la première et dernière période
 */
export function extractMPValuesFromChartData(
  chartData: Array<Record<string, any>>,
  heatmapData: { items?: Array<{ label: string; evolution: string }> } | null | undefined,
  recetteData?: Array<{ name: string; code: string; percentage: number }> | null
): MPValueItem[] {
  if (!chartData || chartData.length === 0) {
    console.log('extractMPValuesFromChartData: no chart data')
    return []
  }

  // Prendre les données du premier et dernier mois
  const firstMonth = chartData[0]
  const lastMonth = chartData[chartData.length - 1]

  if (!firstMonth || !lastMonth || typeof firstMonth !== 'object' || typeof lastMonth !== 'object') {
    console.log('extractMPValuesFromChartData: invalid month data')
    return []
  }

  const mpValues: MPValueItem[] = []

  // Liste des MP à extraire du graphique (toutes sauf 'date', 'MPA', 'MPI')
  const mpKeys = Object.keys(lastMonth).filter(key => key !== 'date' && key !== 'MPA' && key !== 'MPI')

  console.log('extractMPValuesFromChartData: found', mpKeys.length, 'MP keys')

  mpKeys.forEach(key => {
    const priceFirst = firstMonth[key] as number
    const priceLast = lastMonth[key] as number

    if (typeof priceFirst !== 'number' || isNaN(priceFirst) || typeof priceLast !== 'number' || isNaN(priceLast)) {
      console.warn('Invalid price for key', key, priceFirst, priceLast)
      return
    }

    // Convertir la clé en label lisible
    const label = key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Trouver le code correspondant dans les données de recette
    let code = ''
    if (recetteData && Array.isArray(recetteData)) {
      const recetteItem = recetteData.find(item => createMPId(item.name) === key)
      if (recetteItem) {
        code = recetteItem.code
      }
    }

    // Calculer l'évolution entre première et dernière période
    let evolution = 0
    if (priceFirst !== 0) {
      evolution = ((priceLast - priceFirst) / priceFirst) * 100
    }

    mpValues.push({
      id: key,
      label,
      code,
      priceFirst,
      priceLast,
      evolution,
    })
  })

  console.log('extractMPValuesFromChartData: extracted', mpValues.length, 'MP values')
  return mpValues
}

/**
 * Extrait les volumes MP depuis les données de recette
 */
export function extractMPVolumesFromRecetteData(
  recetteData: Array<{ name: string; code: string; percentage: number }> | null | undefined
): MPVolumeItem[] {
  if (!recetteData || !Array.isArray(recetteData)) {
    console.log('extractMPVolumesFromRecetteData: invalid recette data')
    return []
  }

  console.log('extractMPVolumesFromRecetteData: processing', recetteData.length, 'items')

  const volumes = recetteData.map(item => ({
    id: createMPId(item.name),
    label: item.name,
    code: item.code,
    percentage: item.percentage,
  }))

  console.log('extractMPVolumesFromRecetteData: extracted', volumes.length, 'volumes')
  return volumes
}

/**
 * Fusionne les données MP depuis différentes sources
 * Priorise les données de volume sur les données de valeur si une MP est présente dans les deux
 */
export function mergeMPData(
  mpValues: MPValueItem[],
  mpVolumes: MPVolumeItem[]
): { mpValues: MPValueItem[]; mpVolumes: MPVolumeItem[] } {
  // Créer un Set des IDs présents dans les volumes
  const volumeIds = new Set(mpVolumes.map(mp => mp.id))

  // Filtrer les valeurs pour ne garder que celles qui ont un volume correspondant
  const filteredMPValues = mpValues.filter(mp => volumeIds.has(mp.id))

  return {
    mpValues: filteredMPValues,
    mpVolumes,
  }
}

/**
 * Fake data pour les emballages en valeur (prix)
 * Structure identique à MPValueItem
 */
export function getEmballageValues(): MPValueItem[] {
  return [
    { id: 'carton-ondule', label: 'Carton ondulé', code: 'EMB001', priceFirst: 0.892, priceLast: 0.903, evolution: 1.23 },
    { id: 'polypropylene', label: 'Polypropylène', code: 'EMB002', priceFirst: 1.245, priceLast: 1.216, evolution: -2.33 },
    { id: 'polyethylene', label: 'Polyéthylène', code: 'EMB003', priceFirst: 1.087, priceLast: 1.096, evolution: 0.83 },
    { id: 'aluminium', label: 'Aluminium', code: 'EMB004', priceFirst: 2.456, priceLast: 2.533, evolution: 3.14 },
    { id: 'verre', label: 'Verre', code: 'EMB005', priceFirst: 0.654, priceLast: 0.645, evolution: -1.38 },
    { id: 'acier', label: 'Acier', code: 'EMB006', priceFirst: 1.823, priceLast: 1.872, evolution: 2.69 },
    { id: 'papier-kraft', label: 'Papier kraft', code: 'EMB007', priceFirst: 0.567, priceLast: 0.563, evolution: -0.71 },
    { id: 'polystyrene-expanse', label: 'Polystyrène expansé', code: 'EMB008', priceFirst: 0.934, priceLast: 0.952, evolution: 1.93 },
    { id: 'pet', label: 'PET', code: 'EMB009', priceFirst: 1.156, priceLast: 1.178, evolution: 1.90 },
    { id: 'etiquettes-papier', label: 'Étiquettes papier', code: 'EMB010', priceFirst: 0.234, priceLast: 0.241, evolution: 2.99 },
  ]
}

/**
 * Fake data pour les emballages en volume (pourcentage)
 * Structure identique à MPVolumeItem
 */
export function getEmballageVolumes(): MPVolumeItem[] {
  return [
    { id: 'carton-ondule', label: 'Carton ondulé', code: 'EMB001', percentage: 22.34 },
    { id: 'polypropylene', label: 'Polypropylène', code: 'EMB002', percentage: 16.45 },
    { id: 'polyethylene', label: 'Polyéthylène', code: 'EMB003', percentage: 14.28 },
    { id: 'aluminium', label: 'Aluminium', code: 'EMB004', percentage: 11.92 },
    { id: 'verre', label: 'Verre', code: 'EMB005', percentage: 9.67 },
    { id: 'acier', label: 'Acier', code: 'EMB006', percentage: 8.53 },
    { id: 'papier-kraft', label: 'Papier kraft', code: 'EMB007', percentage: 7.21 },
    { id: 'polystyrene-expanse', label: 'Polystyrène expansé', code: 'EMB008', percentage: 4.89 },
    { id: 'pet', label: 'PET', code: 'EMB009', percentage: 3.21 },
    { id: 'etiquettes-papier', label: 'Étiquettes papier', code: 'EMB010', percentage: 1.50 },
  ]
}
