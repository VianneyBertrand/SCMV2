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
 * Retourne les prix du dernier mois disponible
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

  if (!heatmapData || !heatmapData.items || !Array.isArray(heatmapData.items)) {
    console.log('extractMPValuesFromChartData: invalid heatmap data', heatmapData)
    return []
  }

  // Prendre les données du dernier mois
  const lastMonth = chartData[chartData.length - 1]

  if (!lastMonth || typeof lastMonth !== 'object') {
    console.log('extractMPValuesFromChartData: invalid last month data')
    return []
  }

  const mpValues: MPValueItem[] = []

  // Liste des MP à extraire du graphique (toutes sauf 'date', 'MPA', 'MPI')
  const mpKeys = Object.keys(lastMonth).filter(key => key !== 'date' && key !== 'MPA' && key !== 'MPI')

  console.log('extractMPValuesFromChartData: found', mpKeys.length, 'MP keys')

  mpKeys.forEach(key => {
    const price = lastMonth[key] as number

    if (typeof price !== 'number' || isNaN(price)) {
      console.warn('Invalid price for key', key, price)
      return
    }

    // Trouver l'évolution correspondante dans la heatmap
    let evolution = 0
    const heatmapItem = heatmapData.items?.find(item => createMPId(item.label) === key)
    if (heatmapItem) {
      const evoStr = heatmapItem.evolution.replace('%', '').replace('+', '')
      evolution = parseFloat(evoStr)
      if (isNaN(evolution)) evolution = 0
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

    mpValues.push({
      id: key,
      label,
      code,
      price,
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
