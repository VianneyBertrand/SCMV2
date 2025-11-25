import { create } from 'zustand'

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
  }

  // Données simulées (modifiables)
  simulatedData: {
    mpValues: MPValueItem[]
    mpVolumes: MPVolumeItem[]
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

  // Helpers
  hasChanges: () => boolean
  initializeFromExistingData: (mpValues: MPValueItem[], mpVolumes: MPVolumeItem[]) => void
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
  },

  simulatedData: {
    mpValues: [],
    mpVolumes: [],
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
      }
    })
  },

  resetToOriginal: () => {
    const { originalData } = get()
    set({
      simulatedData: {
        mpValues: JSON.parse(JSON.stringify(originalData.mpValues)),
        mpVolumes: JSON.parse(JSON.stringify(originalData.mpVolumes)),
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
    const updatedMPValues = simulatedData.mpValues.map(mp =>
      mp.id === id ? { ...mp, evolution } : mp
    )
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

  // Helpers
  hasChanges: () => {
    const { originalData, simulatedData } = get()
    return JSON.stringify(originalData) !== JSON.stringify(simulatedData)
  },

  initializeFromExistingData: (mpValues: MPValueItem[], mpVolumes: MPVolumeItem[]) => {
    console.log('Store - initializeFromExistingData called with mpValues:', mpValues.length, 'mpVolumes:', mpVolumes.length)

    // Arrondir les prix à 3 décimales et recalculer l'évolution
    const recalculatedMPValues = mpValues.map(mp => {
      // Arrondir à 3 décimales pour cohérence avec l'affichage
      const priceFirst = Math.round(mp.priceFirst * 1000) / 1000
      const priceLast = Math.round(mp.priceLast * 1000) / 1000
      const evolution = priceFirst !== 0 ? ((priceLast - priceFirst) / priceFirst) * 100 : 0
      console.log(`Store - ${mp.label}: priceFirst=${priceFirst}, priceLast=${priceLast}, evolution=${evolution.toFixed(2)}%`)
      return { ...mp, priceFirst, priceLast, evolution }
    })

    const originalData = {
      mpValues: JSON.parse(JSON.stringify(recalculatedMPValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
    }
    const simulatedData = {
      mpValues: JSON.parse(JSON.stringify(recalculatedMPValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
    }
    console.log('Store - setting originalData.mpValues:', originalData.mpValues)
    set({
      originalData,
      simulatedData,
    })
  },
}))
