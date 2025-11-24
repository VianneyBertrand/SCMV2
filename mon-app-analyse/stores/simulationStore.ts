import { create } from 'zustand'

/**
 * Interface pour une matière première en valeur (prix + évolution)
 */
export interface MPValueItem {
  id: string
  label: string
  code: string       // Code référence (ex: HE6545)
  price: number      // Prix en €
  evolution: number  // Évolution en %
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
  startSimulation: () => void
  exitSimulation: () => void
  resetToOriginal: () => void

  // Actions - Modifications MP Valeur
  updateMPPrice: (id: string, price: number) => void
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

  startSimulation: () => {
    set({
      isSimulationMode: true,
      isWindowOpen: false
    })
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
  updateMPPrice: (id: string, price: number) => {
    const { simulatedData } = get()
    const updatedMPValues = simulatedData.mpValues.map(mp =>
      mp.id === id ? { ...mp, price } : mp
    )
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
    const originalData = {
      mpValues: JSON.parse(JSON.stringify(mpValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
    }
    const simulatedData = {
      mpValues: JSON.parse(JSON.stringify(mpValues)),
      mpVolumes: JSON.parse(JSON.stringify(mpVolumes)),
    }
    set({
      originalData,
      simulatedData,
    })
  },
}))
