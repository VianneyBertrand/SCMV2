// @ts-nocheck
'use client'

import { useSimulationStore } from '@/stores/simulationStore'

interface SimulationTagProps {
  /** Valeur d'évolution en pourcentage (ex: 1.23 pour +1.23%) */
  value?: number
  /** Générer une valeur aléatoire si non fournie */
  randomize?: boolean
  /** Seed pour la génération aléatoire (pour avoir des valeurs cohérentes) */
  seed?: string
  /** Pour Opportunité : logique de couleur inversée (positif = vert, négatif = rouge) */
  isOpportunity?: boolean
  /** Label MP pour récupérer l'évolution depuis le store (cohérent avec fenêtre simulation) */
  mpLabel?: string
  /** Type de donnée MP à récupérer: 'value' pour évolution prix, 'volume' pour delta pourcentage */
  mpType?: 'value' | 'volume'
}

/**
 * Tag affichant l'évolution simulée
 * - Fond blanc avec contour
 * - Positif : contour rouge + texte rouge (sauf Opportunité)
 * - Négatif : contour vert + texte vert (sauf Opportunité)
 * - Opportunité : logique inversée
 * N'apparaît qu'en mode simulation
 */
export function SimulationTag({ value, randomize = true, seed, isOpportunity = false, mpLabel, mpType = 'value' }: SimulationTagProps) {
  const isSimulationMode = useSimulationStore((state) => state.isSimulationMode)
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const originalData = useSimulationStore((state) => state.originalData)

  if (!isSimulationMode) return null

  // Récupérer la valeur depuis le store si mpLabel est fourni
  let displayValue = value

  if (displayValue === undefined && mpLabel) {
    if (mpType === 'value') {
      // Récupérer l'évolution du prix depuis mpValues
      const mpValue = simulatedData.mpValues.find(mp => mp.label === mpLabel)
      if (mpValue) {
        displayValue = mpValue.evolution
      }
    } else if (mpType === 'volume') {
      // Calculer le delta de pourcentage entre original et simulé
      const originalMp = originalData.mpVolumes.find(mp => mp.label === mpLabel)
      const simulatedMp = simulatedData.mpVolumes.find(mp => mp.label === mpLabel)
      if (originalMp && simulatedMp) {
        displayValue = simulatedMp.percentage - originalMp.percentage
      }
    }
  }

  // Générer une valeur aléatoire si nécessaire (fallback)
  if (displayValue === undefined && randomize) {
    // Utiliser le seed pour générer une valeur pseudo-aléatoire cohérente
    if (seed) {
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      // Valeur entre -5 et +5
      displayValue = ((Math.abs(hash) % 1000) / 100) - 5
    } else {
      // Valeur aléatoire entre -5 et +5
      displayValue = (Math.random() * 10) - 5
    }
  }

  if (displayValue === undefined) return null

  const isPositive = displayValue >= 0
  const formattedValue = `${isPositive ? '+' : ''}${displayValue.toFixed(2)}%`

  // Déterminer la couleur selon le type
  // Normal: positif = rouge (mauvais), négatif = vert (bon)
  // Opportunité: positif = vert (bon), négatif = rouge (mauvais)
  let colorClass: string
  if (isOpportunity) {
    colorClass = isPositive ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
  } else {
    colorClass = isPositive ? 'border-red-600 text-red-600' : 'border-green-600 text-green-600'
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 rounded font-bold bg-white border ml-2 ${colorClass}`}
      style={{ fontSize: '12px', height: '24px' }}
    >
      {formattedValue}
    </span>
  )
}
