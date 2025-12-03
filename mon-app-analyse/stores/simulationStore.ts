import { create } from 'zustand'

/**
 * Date limite des prix connus (novembre 2025 inclus)
 * Les prix après cette date sont inconnus et doivent reprendre le dernier prix connu
 */
export const LAST_KNOWN_PRICE_DATE = { month: 10, year: 2025 } // Novembre 2025 (0-indexed)

/**
 * Vérifie si une date est après la date limite des prix connus
 */
export function isAfterKnownPriceDate(date: { month: number; year: number }): boolean {
  if (date.year > LAST_KNOWN_PRICE_DATE.year) return true
  if (date.year === LAST_KNOWN_PRICE_DATE.year && date.month > LAST_KNOWN_PRICE_DATE.month) return true
  return false
}

/**
 * Types de découpage disponibles
 */
export type DecoupageType = 'none' | '1month' | '3months' | '6months' | '1year'

/**
 * Interface pour un prix intermédiaire (pour le découpage)
 */
export interface IntermediatePrice {
  periodIndex: number    // Index de la période (0, 1, 2, ...)
  date: { month: number; year: number }  // Date de cette période
  price: number          // Prix en €/kg
}

/**
 * Interface pour une matière première en valeur (prix première période + prix dernière période + évolution)
 */
export interface MPValueItem {
  id: string
  label: string
  code: string           // Code référence (ex: HE6545)
  priceFirst: number     // Prix première période en €/kg
  priceLast: number      // Prix dernière période en €/kg
  evolution: number      // Évolution en %
  decoupage?: DecoupageType           // Type de découpage (défaut: 'none')
  intermediatePrices?: IntermediatePrice[]  // Prix intermédiaires quand découpage actif
}

/**
 * Interface pour une matière première en volume (% répartition)
 */
export interface MPVolumeItem {
  id: string
  label: string
  code: string       // Code référence (ex: HE6545)
  percentage: number // Pourcentage de répartition en volume
}

/**
 * État du store de simulation
 */
interface SimulationState {
  // État de la simulation
  isSimulationMode: boolean
  isWindowOpen: boolean
  buttonPosition: { top: number; left: number } | null

  // Contexte de la simulation (périmètre et label)
  currentPerimetre: string
  currentLabel: string

  // Périodes de la simulation
  simulationPeriod: { from?: { month: number; year: number }; to?: { month: number; year: number } } | null
  referencePeriod: { from?: { month: number; year: number }; to?: { month: number; year: number } } | null

  // Données originales (copiées à l'ouverture, pour reset)
  originalData: {
    mpValues: MPValueItem[]
    mpVolumes: MPVolumeItem[]
    emballageValues: MPValueItem[]
    emballageVolumes: MPVolumeItem[]
  }

  // Données simulées (modifiables)
  simulatedData: {
    mpValues: MPValueItem[]
    mpVolumes: MPVolumeItem[]
    emballageValues: MPValueItem[]
    emballageVolumes: MPVolumeItem[]
  }

  // Actions - Gestion de la fenêtre
  openWindow: (buttonPosition?: { top: number; left: number }) => void
  closeWindow: () => void
  startSimulation: (perimetre?: string, label?: string, simulationPeriod?: { from?: { month: number; year: number }; to?: { month: number; year: number } }, referencePeriod?: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => void
  exitSimulation: () => void
  resetToOriginal: () => void
  setSimulationContext: (perimetre: string, label: string) => void

  // Actions - Modifications MP Valeur
  updateMPPriceFirst: (id: string, price: number) => void
  updateMPPriceLast: (id: string, price: number) => void
  updateMPEvolution: (id: string, evolution: number) => void
  addMPValue: (mp: MPValueItem) => void
  removeMPValue: (id: string) => void

  // Actions - Modifications MP Volume
  updateMPVolume: (id: string, percentage: number) => void
  addMPVolume: (mp: MPVolumeItem) => void
  removeMPVolume: (id: string) => void

  // Actions - Modification code et label référence (synchronisé entre les deux colonnes)
  // Inclut optionnellement les prix pour mise à jour automatique
  updateMPReference: (id: string, newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => void

  // Actions - Découpage MP
  updateMPDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => void
  updateMPIntermediatePrice: (id: string, periodIndex: number, price: number) => void

  // Actions - Modifications Emballage Valeur
  updateEmballagePriceFirst: (id: string, price: number) => void
  updateEmballagePriceLast: (id: string, price: number) => void
  updateEmballageEvolution: (id: string, evolution: number) => void
  addEmballageValue: (emballage: MPValueItem) => void
  removeEmballageValue: (id: string) => void

  // Actions - Modifications Emballage Volume
  updateEmballageVolume: (id: string, percentage: number) => void
  addEmballageVolume: (emballage: MPVolumeItem) => void
  removeEmballageVolume: (id: string) => void

  // Actions - Modification code et label référence emballage
  updateEmballageReference: (id: string, newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => void

  // Actions - Découpage Emballage
  updateEmballageDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => void
  updateEmballageIntermediatePrice: (id: string, periodIndex: number, price: number) => void

  // Helpers
  hasChanges: () => boolean
  initializeFromExistingData: (mpValues: MPValueItem[], mpVolumes: MPVolumeItem[], emballageValues?: MPValueItem[], emballageVolumes?: MPVolumeItem[]) => void

  // Action pour mettre à jour tous les découpages quand la période change
  updateAllDecoupagesForPeriod: (newPeriod: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => void
}

/**
 * Store Zustand pour la gestion de la simulation
 */
export const useSimulationStore = create<SimulationState>((set, get) => ({
  // État initial
  isSimulationMode: false,
  isWindowOpen: false,
  buttonPosition: null,
  currentPerimetre: '',
  currentLabel: '',
  simulationPeriod: null,
  referencePeriod: null,

  originalData: {
    mpValues: [],
    mpVolumes: [],
    emballageValues: [],
    emballageVolumes: [],
  },

  simulatedData: {
    mpValues: [],
    mpVolumes: [],
    emballageValues: [],
    emballageVolumes: [],
  },

  // Actions - Gestion de la fenêtre
  openWindow: (buttonPosition) => {
    set({ isWindowOpen: true, buttonPosition: buttonPosition || null })
  },

  closeWindow: () => {
    set({ isWindowOpen: false })
  },

  startSimulation: (perimetre?: string, label?: string, simulationPeriod?: { from?: { month: number; year: number }; to?: { month: number; year: number } }, referencePeriod?: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const updates: Partial<SimulationState> = {
      isSimulationMode: true,
      isWindowOpen: false
    }
    if (perimetre) updates.currentPerimetre = perimetre
    if (label) updates.currentLabel = label
    if (simulationPeriod) updates.simulationPeriod = simulationPeriod
    if (referencePeriod) updates.referencePeriod = referencePeriod
    set(updates)
  },

  setSimulationContext: (perimetre: string, label: string) => {
    set({ currentPerimetre: perimetre, currentLabel: label })
  },

  exitSimulation: () => {
    const { originalData } = get()
    set({
      isSimulationMode: false,
      isWindowOpen: false,
      simulatedData: {
        mpValues: JSON.parse(JSON.stringify(originalData.mpValues)),
        mpVolumes: JSON.parse(JSON.stringify(originalData.mpVolumes)),
        emballageValues: JSON.parse(JSON.stringify(originalData.emballageValues)),
        emballageVolumes: JSON.parse(JSON.stringify(originalData.emballageVolumes)),
      }
    })
  },

  resetToOriginal: () => {
    const { originalData } = get()
    set({
      simulatedData: {
        mpValues: JSON.parse(JSON.stringify(originalData.mpValues)),
        mpVolumes: JSON.parse(JSON.stringify(originalData.mpVolumes)),
        emballageValues: JSON.parse(JSON.stringify(originalData.emballageValues)),
        emballageVolumes: JSON.parse(JSON.stringify(originalData.emballageVolumes)),
      }
    })
  },

  // Actions - Modifications MP Valeur
  updateMPPriceFirst: (id: string, priceFirst: number) => {
    const { simulatedData } = get()
    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id) {
        // Recalculer l'évolution quand priceFirst change
        const evolution = priceFirst !== 0 ? ((mp.priceLast - priceFirst) / priceFirst) * 100 : 0
        return { ...mp, priceFirst, evolution }
      }
      return mp
    })
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
      }
    })
  },

  updateMPPriceLast: (id: string, priceLast: number) => {
    const { simulatedData } = get()
    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id) {
        // Recalculer l'évolution quand priceLast change
        const evolution = mp.priceFirst !== 0 ? ((priceLast - mp.priceFirst) / mp.priceFirst) * 100 : 0
        return { ...mp, priceLast, evolution }
      }
      return mp
    })
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
      }
    })
  },

  updateMPEvolution: (id: string, evolution: number) => {
    const { simulatedData } = get()
    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id) {
        // Recalculer priceLast quand evolution change: priceLast = priceFirst * (1 + evolution/100)
        const priceLast = mp.priceFirst * (1 + evolution / 100)
        return { ...mp, evolution, priceLast: Math.round(priceLast * 1000) / 1000 }
      }
      return mp
    })
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
      }
    })
  },

  addMPValue: (mp: MPValueItem) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: [mp, ...simulatedData.mpValues],
      }
    })
  },

  removeMPValue: (id: string) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: simulatedData.mpValues.filter(mp => mp.id !== id),
      }
    })
  },

  // Actions - Modifications MP Volume
  updateMPVolume: (id: string, percentage: number) => {
    const { simulatedData } = get()
    const updatedMPVolumes = simulatedData.mpVolumes.map(mp =>
      mp.id === id ? { ...mp, percentage } : mp
    )
    set({
      simulatedData: {
        ...simulatedData,
        mpVolumes: updatedMPVolumes,
      }
    })
  },

  addMPVolume: (mp: MPVolumeItem) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        mpVolumes: [mp, ...simulatedData.mpVolumes],
      }
    })
  },

  removeMPVolume: (id: string) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        mpVolumes: simulatedData.mpVolumes.filter(mp => mp.id !== id),
      }
    })
  },

  // Mise à jour du code et label référence dans les deux colonnes
  // Si priceFirst et priceLast sont fournis, met à jour les prix et recalcule l'évolution
  // Ne modifie que simulatedData pour permettre la réinitialisation aux valeurs originales
  updateMPReference: (id: string, newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => {
    const { simulatedData } = get()

    const updateMPValue = (mp: MPValueItem) => {
      if (mp.id === id) {
        if (priceFirst !== undefined && priceLast !== undefined) {
          const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0
          return { ...mp, code: newCode, label: newLabel, priceFirst, priceLast, evolution }
        }
        return { ...mp, code: newCode, label: newLabel }
      }
      return mp
    }

    const updateMPVolume = (mp: MPVolumeItem) => {
      return mp.id === id ? { ...mp, code: newCode, label: newLabel } : mp
    }

    set({
      simulatedData: {
        ...simulatedData,
        mpValues: simulatedData.mpValues.map(updateMPValue),
        mpVolumes: simulatedData.mpVolumes.map(updateMPVolume),
      },
    })
  },

  // Actions - Découpage MP
  updateMPDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const { simulatedData } = get()

    // Fonction pour générer les prix intermédiaires
    // Les prix sont connus jusqu'à novembre 2025, après on copie le dernier prix connu
    const generateIntermediatePrices = (priceFirst: number, priceLast: number): IntermediatePrice[] => {
      if (decoupage === 'none' || !period.from || !period.to) return []

      // Calculer le nombre de mois entre les deux dates
      const fromDate = new Date(period.from.year, period.from.month)
      const toDate = new Date(period.to.year, period.to.month)

      // Date limite des prix connus (novembre 2025)
      const lastKnownDate = new Date(LAST_KNOWN_PRICE_DATE.year, LAST_KNOWN_PRICE_DATE.month)

      // Calculer les mois pour l'interpolation (jusqu'à la date limite ou la fin de période)
      const interpolationEndDate = toDate <= lastKnownDate ? toDate : lastKnownDate
      const totalKnownMonths = Math.max(0, (interpolationEndDate.getFullYear() - fromDate.getFullYear()) * 12 + (interpolationEndDate.getMonth() - fromDate.getMonth()))

      // Déterminer l'intervalle selon le découpage
      let intervalMonths = 1
      if (decoupage === '3months') intervalMonths = 3
      else if (decoupage === '6months') intervalMonths = 6
      else if (decoupage === '1year') intervalMonths = 12

      const prices: IntermediatePrice[] = []
      let currentDate = new Date(period.from.year, period.from.month)
      let periodIndex = 0
      let lastKnownPrice = priceFirst

      while (currentDate <= toDate) {
        const currentDateObj = { month: currentDate.getMonth(), year: currentDate.getFullYear() }
        let price: number

        if (!isAfterKnownPriceDate(currentDateObj)) {
          // Date connue: interpolation linéaire entre priceFirst et priceLast (jusqu'à la limite)
          const monthsFromStart = (currentDate.getFullYear() - fromDate.getFullYear()) * 12 + (currentDate.getMonth() - fromDate.getMonth())
          const ratio = totalKnownMonths > 0 ? Math.min(monthsFromStart / totalKnownMonths, 1) : 0
          price = priceFirst + (priceLast - priceFirst) * ratio
          lastKnownPrice = price
        } else {
          // Date future (après novembre 2025): copier le dernier prix connu
          price = lastKnownPrice
        }

        prices.push({
          periodIndex,
          date: currentDateObj,
          price: Math.round(price * 1000) / 1000
        })

        // Avancer à la prochaine période
        currentDate.setMonth(currentDate.getMonth() + intervalMonths)
        periodIndex++
      }

      return prices
    }

    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id) {
        const intermediatePrices = generateIntermediatePrices(mp.priceFirst, mp.priceLast)
        return { ...mp, decoupage, intermediatePrices }
      }
      return mp
    })

    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
      }
    })
  },

  updateMPIntermediatePrice: (id: string, periodIndex: number, price: number) => {
    const { simulatedData } = get()
    const roundedPrice = Math.round(price * 1000) / 1000

    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id && mp.intermediatePrices) {
        // Propager le prix à toutes les périodes suivantes (palier de prix)
        const updatedPrices = mp.intermediatePrices.map(p => {
          if (p.periodIndex === periodIndex) {
            // La période modifiée
            return { ...p, price: roundedPrice }
          } else if (p.periodIndex > periodIndex) {
            // Les périodes suivantes : propager le nouveau prix
            return { ...p, price: roundedPrice }
          }
          return p
        })

        // Mettre à jour priceFirst et priceLast
        let priceFirst = mp.priceFirst
        let priceLast = mp.priceLast
        if (periodIndex === 0) priceFirst = roundedPrice
        // priceLast est toujours le prix de la dernière période
        priceLast = updatedPrices[updatedPrices.length - 1].price
        const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0

        return { ...mp, intermediatePrices: updatedPrices, priceFirst, priceLast, evolution }
      }
      return mp
    })
    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
      }
    })
  },

  // Actions - Modifications Emballage Valeur
  updateEmballagePriceFirst: (id: string, priceFirst: number) => {
    const { simulatedData } = get()
    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id) {
        const evolution = priceFirst !== 0 ? ((emb.priceLast - priceFirst) / priceFirst) * 100 : 0
        return { ...emb, priceFirst, evolution }
      }
      return emb
    })
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: updatedEmballageValues,
      }
    })
  },

  updateEmballagePriceLast: (id: string, priceLast: number) => {
    const { simulatedData } = get()
    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id) {
        const evolution = emb.priceFirst !== 0 ? ((priceLast - emb.priceFirst) / emb.priceFirst) * 100 : 0
        return { ...emb, priceLast, evolution }
      }
      return emb
    })
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: updatedEmballageValues,
      }
    })
  },

  updateEmballageEvolution: (id: string, evolution: number) => {
    const { simulatedData } = get()
    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id) {
        // Recalculer priceLast quand evolution change: priceLast = priceFirst * (1 + evolution/100)
        const priceLast = emb.priceFirst * (1 + evolution / 100)
        return { ...emb, evolution, priceLast: Math.round(priceLast * 1000) / 1000 }
      }
      return emb
    })
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: updatedEmballageValues,
      }
    })
  },

  addEmballageValue: (emballage: MPValueItem) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: [emballage, ...simulatedData.emballageValues],
      }
    })
  },

  removeEmballageValue: (id: string) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: simulatedData.emballageValues.filter(emb => emb.id !== id),
      }
    })
  },

  // Actions - Modifications Emballage Volume
  updateEmballageVolume: (id: string, percentage: number) => {
    const { simulatedData } = get()
    const updatedEmballageVolumes = simulatedData.emballageVolumes.map(emb =>
      emb.id === id ? { ...emb, percentage } : emb
    )
    set({
      simulatedData: {
        ...simulatedData,
        emballageVolumes: updatedEmballageVolumes,
      }
    })
  },

  addEmballageVolume: (emballage: MPVolumeItem) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        emballageVolumes: [emballage, ...simulatedData.emballageVolumes],
      }
    })
  },

  removeEmballageVolume: (id: string) => {
    const { simulatedData } = get()
    set({
      simulatedData: {
        ...simulatedData,
        emballageVolumes: simulatedData.emballageVolumes.filter(emb => emb.id !== id),
      }
    })
  },

  updateEmballageReference: (id: string, newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => {
    const { simulatedData } = get()

    const updateEmballageValue = (emb: MPValueItem) => {
      if (emb.id === id) {
        if (priceFirst !== undefined && priceLast !== undefined) {
          const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0
          return { ...emb, code: newCode, label: newLabel, priceFirst, priceLast, evolution }
        }
        return { ...emb, code: newCode, label: newLabel }
      }
      return emb
    }

    const updateEmballageVolume = (emb: MPVolumeItem) => {
      return emb.id === id ? { ...emb, code: newCode, label: newLabel } : emb
    }

    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: simulatedData.emballageValues.map(updateEmballageValue),
        emballageVolumes: simulatedData.emballageVolumes.map(updateEmballageVolume),
      },
    })
  },

  // Actions - Découpage Emballage
  updateEmballageDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const { simulatedData } = get()

    // Fonction pour générer les prix intermédiaires
    // Les prix sont connus jusqu'à novembre 2025, après on copie le dernier prix connu
    const generateIntermediatePrices = (priceFirst: number, priceLast: number): IntermediatePrice[] => {
      if (decoupage === 'none' || !period.from || !period.to) return []

      const fromDate = new Date(period.from.year, period.from.month)
      const toDate = new Date(period.to.year, period.to.month)

      // Date limite des prix connus (novembre 2025)
      const lastKnownDate = new Date(LAST_KNOWN_PRICE_DATE.year, LAST_KNOWN_PRICE_DATE.month)

      // Calculer les mois pour l'interpolation (jusqu'à la date limite ou la fin de période)
      const interpolationEndDate = toDate <= lastKnownDate ? toDate : lastKnownDate
      const totalKnownMonths = Math.max(0, (interpolationEndDate.getFullYear() - fromDate.getFullYear()) * 12 + (interpolationEndDate.getMonth() - fromDate.getMonth()))

      let intervalMonths = 1
      if (decoupage === '3months') intervalMonths = 3
      else if (decoupage === '6months') intervalMonths = 6
      else if (decoupage === '1year') intervalMonths = 12

      const prices: IntermediatePrice[] = []
      let currentDate = new Date(period.from.year, period.from.month)
      let periodIndex = 0
      let lastKnownPrice = priceFirst

      while (currentDate <= toDate) {
        const currentDateObj = { month: currentDate.getMonth(), year: currentDate.getFullYear() }
        let price: number

        if (!isAfterKnownPriceDate(currentDateObj)) {
          // Date connue: interpolation linéaire entre priceFirst et priceLast (jusqu'à la limite)
          const monthsFromStart = (currentDate.getFullYear() - fromDate.getFullYear()) * 12 + (currentDate.getMonth() - fromDate.getMonth())
          const ratio = totalKnownMonths > 0 ? Math.min(monthsFromStart / totalKnownMonths, 1) : 0
          price = priceFirst + (priceLast - priceFirst) * ratio
          lastKnownPrice = price
        } else {
          // Date future (après novembre 2025): copier le dernier prix connu
          price = lastKnownPrice
        }

        prices.push({
          periodIndex,
          date: currentDateObj,
          price: Math.round(price * 1000) / 1000
        })

        currentDate.setMonth(currentDate.getMonth() + intervalMonths)
        periodIndex++
      }

      return prices
    }

    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id) {
        const intermediatePrices = generateIntermediatePrices(emb.priceFirst, emb.priceLast)
        return { ...emb, decoupage, intermediatePrices }
      }
      return emb
    })

    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: updatedEmballageValues,
      }
    })
  },

  updateEmballageIntermediatePrice: (id: string, periodIndex: number, price: number) => {
    const { simulatedData } = get()
    const roundedPrice = Math.round(price * 1000) / 1000

    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id && emb.intermediatePrices) {
        // Propager le prix à toutes les périodes suivantes (palier de prix)
        const updatedPrices = emb.intermediatePrices.map(p => {
          if (p.periodIndex === periodIndex) {
            // La période modifiée
            return { ...p, price: roundedPrice }
          } else if (p.periodIndex > periodIndex) {
            // Les périodes suivantes : propager le nouveau prix
            return { ...p, price: roundedPrice }
          }
          return p
        })

        // Mettre à jour priceFirst et priceLast
        let priceFirst = emb.priceFirst
        let priceLast = emb.priceLast
        if (periodIndex === 0) priceFirst = roundedPrice
        // priceLast est toujours le prix de la dernière période
        priceLast = updatedPrices[updatedPrices.length - 1].price
        const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0

        return { ...emb, intermediatePrices: updatedPrices, priceFirst, priceLast, evolution }
      }
      return emb
    })
    set({
      simulatedData: {
        ...simulatedData,
        emballageValues: updatedEmballageValues,
      }
    })
  },

  // Helpers
  hasChanges: () => {
    const { originalData, simulatedData } = get()
    return JSON.stringify(originalData) !== JSON.stringify(simulatedData)
  },

  initializeFromExistingData: (mpValues: MPValueItem[], mpVolumes: MPVolumeItem[], emballageValues: MPValueItem[] = [], emballageVolumes: MPVolumeItem[] = []) => {
    console.log('Store - initializeFromExistingData called with mpValues:', mpValues.length, 'mpVolumes:', mpVolumes.length, 'emballageValues:', emballageValues.length, 'emballageVolumes:', emballageVolumes.length)

    // Arrondir les prix à 3 décimales et recalculer l'évolution
    const recalculatedMPValues = mpValues.map(mp => {
      const priceFirst = Math.round(mp.priceFirst * 1000) / 1000
      const priceLast = Math.round(mp.priceLast * 1000) / 1000
      const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0
      return { ...mp, priceFirst, priceLast, evolution }
    })

    const recalculatedEmballageValues = emballageValues.map(emb => {
      const priceFirst = Math.round(emb.priceFirst * 1000) / 1000
      const priceLast = Math.round(emb.priceLast * 1000) / 1000
      const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0
      return { ...emb, priceFirst, priceLast, evolution }
    })

    const originalData = {
      mpValues: JSON.parse(JSON.stringify(recalculatedMPValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
      emballageValues: JSON.parse(JSON.stringify(recalculatedEmballageValues)),
      emballageVolumes: JSON.parse(JSON.stringify(emballageVolumes)),
    }
    const simulatedData = {
      mpValues: JSON.parse(JSON.stringify(recalculatedMPValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
      emballageValues: JSON.parse(JSON.stringify(recalculatedEmballageValues)),
      emballageVolumes: JSON.parse(JSON.stringify(emballageVolumes)),
    }
    console.log('Store - setting originalData.mpValues:', originalData.mpValues)
    set({
      originalData,
      simulatedData,
    })
  },

  // Mettre à jour tous les découpages quand la période change
  updateAllDecoupagesForPeriod: (newPeriod: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const { simulatedData } = get()
    if (!newPeriod.from || !newPeriod.to) return

    // Calculer le nombre de mois de la nouvelle période
    const fromDate = new Date(newPeriod.from.year, newPeriod.from.month)
    const toDate = new Date(newPeriod.to.year, newPeriod.to.month)
    const totalMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())

    // Fonction pour déterminer les découpages disponibles pour une durée donnée
    const getAvailableDecoupages = (months: number): DecoupageType[] => {
      const options: DecoupageType[] = ['none']
      if (months >= 2) options.push('1month')
      if (months >= 6) options.push('3months')
      if (months >= 12) options.push('6months')
      if (months >= 24) options.push('1year')
      return options
    }

    // Fonction pour trouver le découpage le plus proche disponible
    const getClosestDecoupage = (current: DecoupageType, available: DecoupageType[]): DecoupageType => {
      if (available.includes(current)) return current
      // Ordre de préférence: du plus fin au plus large
      const order: DecoupageType[] = ['1month', '3months', '6months', '1year', 'none']
      const currentIndex = order.indexOf(current)
      // Chercher le plus proche dans l'ordre
      for (let i = currentIndex; i < order.length; i++) {
        if (available.includes(order[i])) return order[i]
      }
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (available.includes(order[i])) return order[i]
      }
      return 'none'
    }

    // Fonction pour générer les prix intermédiaires en préservant les valeurs existantes
    const regenerateIntermediatePrices = (
      item: MPValueItem,
      decoupage: DecoupageType
    ): IntermediatePrice[] => {
      if (decoupage === 'none') return []

      // Déterminer l'intervalle selon le découpage
      let intervalMonths = 1
      if (decoupage === '3months') intervalMonths = 3
      else if (decoupage === '6months') intervalMonths = 6
      else if (decoupage === '1year') intervalMonths = 12

      const prices: IntermediatePrice[] = []
      const existingPrices = item.intermediatePrices || []
      let currentDate = new Date(newPeriod.from!.year, newPeriod.from!.month)
      let periodIndex = 0
      let lastKnownPrice = item.priceFirst

      while (currentDate <= toDate) {
        const dateKey = { month: currentDate.getMonth(), year: currentDate.getFullYear() }

        // Chercher si on a déjà un prix pour cette date
        const existingPrice = existingPrices.find(
          p => p.date.month === dateKey.month && p.date.year === dateKey.year
        )

        let price: number
        if (existingPrice) {
          // Utiliser le prix existant
          price = existingPrice.price
          lastKnownPrice = price
        } else {
          // Nouvelle période: copier le dernier prix connu
          price = lastKnownPrice
        }

        prices.push({
          periodIndex,
          date: dateKey,
          price: Math.round(price * 1000) / 1000
        })

        // Avancer à la prochaine période
        currentDate.setMonth(currentDate.getMonth() + intervalMonths)
        periodIndex++
      }

      return prices
    }

    const availableDecoupages = getAvailableDecoupages(totalMonths)

    // Mettre à jour les MP Values
    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (!mp.decoupage || mp.decoupage === 'none') return mp

      const newDecoupage = getClosestDecoupage(mp.decoupage, availableDecoupages)
      const newIntermediatePrices = regenerateIntermediatePrices(mp, newDecoupage)

      // Mettre à jour priceFirst et priceLast depuis les prix intermédiaires
      let priceFirst = mp.priceFirst
      let priceLast = mp.priceLast
      if (newIntermediatePrices.length > 0) {
        priceFirst = newIntermediatePrices[0].price
        priceLast = newIntermediatePrices[newIntermediatePrices.length - 1].price
      }
      const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0

      return {
        ...mp,
        decoupage: newDecoupage,
        intermediatePrices: newIntermediatePrices,
        priceFirst,
        priceLast,
        evolution
      }
    })

    // Mettre à jour les Emballage Values
    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (!emb.decoupage || emb.decoupage === 'none') return emb

      const newDecoupage = getClosestDecoupage(emb.decoupage, availableDecoupages)
      const newIntermediatePrices = regenerateIntermediatePrices(emb, newDecoupage)

      let priceFirst = emb.priceFirst
      let priceLast = emb.priceLast
      if (newIntermediatePrices.length > 0) {
        priceFirst = newIntermediatePrices[0].price
        priceLast = newIntermediatePrices[newIntermediatePrices.length - 1].price
      }
      const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0

      return {
        ...emb,
        decoupage: newDecoupage,
        intermediatePrices: newIntermediatePrices,
        priceFirst,
        priceLast,
        evolution
      }
    })

    set({
      simulatedData: {
        ...simulatedData,
        mpValues: updatedMPValues,
        emballageValues: updatedEmballageValues,
      }
    })
  },
}))
