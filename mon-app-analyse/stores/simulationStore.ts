import { create } from 'zustand'

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
  startSimulation: (perimetre?: string, label?: string) => void
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

  startSimulation: (perimetre?: string, label?: string) => {
    const updates: Partial<SimulationState> = {
      isSimulationMode: true,
      isWindowOpen: false
    }
    if (perimetre) updates.currentPerimetre = perimetre
    if (label) updates.currentLabel = label
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
        mpValues: [...simulatedData.mpValues, mp],
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
        mpVolumes: [...simulatedData.mpVolumes, mp],
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
  // Met également à jour originalData pour que les % d'évolution soient réinitialisés à 0%
  updateMPReference: (id: string, newCode: string, newLabel: string, priceFirst?: number, priceLast?: number) => {
    const { simulatedData, originalData } = get()

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
      // Mettre à jour les données simulées
      simulatedData: {
        ...simulatedData,
        mpValues: simulatedData.mpValues.map(updateMPValue),
        mpVolumes: simulatedData.mpVolumes.map(updateMPVolume),
      },
      // Mettre à jour aussi les données originales pour réinitialiser les % d'évolution
      originalData: {
        ...originalData,
        mpValues: originalData.mpValues.map(updateMPValue),
        mpVolumes: originalData.mpVolumes.map(updateMPVolume),
      },
    })
  },

  // Actions - Découpage MP
  updateMPDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const { simulatedData } = get()

    // Fonction pour générer les prix intermédiaires
    const generateIntermediatePrices = (priceFirst: number, priceLast: number): IntermediatePrice[] => {
      if (decoupage === 'none' || !period.from || !period.to) return []

      // Calculer le nombre de mois entre les deux dates
      const fromDate = new Date(period.from.year, period.from.month)
      const toDate = new Date(period.to.year, period.to.month)
      const totalMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())

      // Déterminer l'intervalle selon le découpage
      let intervalMonths = 1
      if (decoupage === '3months') intervalMonths = 3
      else if (decoupage === '6months') intervalMonths = 6
      else if (decoupage === '1year') intervalMonths = 12

      const prices: IntermediatePrice[] = []
      let currentDate = new Date(period.from.year, period.from.month)
      let periodIndex = 0

      while (currentDate <= toDate) {
        // Calculer le prix interpolé linéairement
        const monthsFromStart = (currentDate.getFullYear() - fromDate.getFullYear()) * 12 + (currentDate.getMonth() - fromDate.getMonth())
        const ratio = totalMonths > 0 ? monthsFromStart / totalMonths : 0
        const interpolatedPrice = priceFirst + (priceLast - priceFirst) * ratio

        prices.push({
          periodIndex,
          date: { month: currentDate.getMonth(), year: currentDate.getFullYear() },
          price: Math.round(interpolatedPrice * 1000) / 1000
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
    const updatedMPValues = simulatedData.mpValues.map(mp => {
      if (mp.id === id && mp.intermediatePrices) {
        const updatedPrices = mp.intermediatePrices.map(p =>
          p.periodIndex === periodIndex ? { ...p, price: Math.round(price * 1000) / 1000 } : p
        )
        // Mettre à jour priceFirst et priceLast si c'est la première ou dernière période
        let priceFirst = mp.priceFirst
        let priceLast = mp.priceLast
        if (periodIndex === 0) priceFirst = price
        if (periodIndex === updatedPrices.length - 1) priceLast = price
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
        emballageValues: [...simulatedData.emballageValues, emballage],
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
        emballageVolumes: [...simulatedData.emballageVolumes, emballage],
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
    const { simulatedData, originalData } = get()

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
      originalData: {
        ...originalData,
        emballageValues: originalData.emballageValues.map(updateEmballageValue),
        emballageVolumes: originalData.emballageVolumes.map(updateEmballageVolume),
      },
    })
  },

  // Actions - Découpage Emballage
  updateEmballageDecoupage: (id: string, decoupage: DecoupageType, period: { from?: { month: number; year: number }; to?: { month: number; year: number } }) => {
    const { simulatedData } = get()

    // Fonction pour générer les prix intermédiaires
    const generateIntermediatePrices = (priceFirst: number, priceLast: number): IntermediatePrice[] => {
      if (decoupage === 'none' || !period.from || !period.to) return []

      const fromDate = new Date(period.from.year, period.from.month)
      const toDate = new Date(period.to.year, period.to.month)
      const totalMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())

      let intervalMonths = 1
      if (decoupage === '3months') intervalMonths = 3
      else if (decoupage === '6months') intervalMonths = 6
      else if (decoupage === '1year') intervalMonths = 12

      const prices: IntermediatePrice[] = []
      let currentDate = new Date(period.from.year, period.from.month)
      let periodIndex = 0

      while (currentDate <= toDate) {
        const monthsFromStart = (currentDate.getFullYear() - fromDate.getFullYear()) * 12 + (currentDate.getMonth() - fromDate.getMonth())
        const ratio = totalMonths > 0 ? monthsFromStart / totalMonths : 0
        const interpolatedPrice = priceFirst + (priceLast - priceFirst) * ratio

        prices.push({
          periodIndex,
          date: { month: currentDate.getMonth(), year: currentDate.getFullYear() },
          price: Math.round(interpolatedPrice * 1000) / 1000
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
    const updatedEmballageValues = simulatedData.emballageValues.map(emb => {
      if (emb.id === id && emb.intermediatePrices) {
        const updatedPrices = emb.intermediatePrices.map(p =>
          p.periodIndex === periodIndex ? { ...p, price: Math.round(price * 1000) / 1000 } : p
        )
        let priceFirst = emb.priceFirst
        let priceLast = emb.priceLast
        if (periodIndex === 0) priceFirst = price
        if (periodIndex === updatedPrices.length - 1) priceLast = price
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
}))
