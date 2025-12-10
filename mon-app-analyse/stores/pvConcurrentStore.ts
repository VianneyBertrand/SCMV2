import { create } from 'zustand'

export type PvConcurrentType = "PV Leclerc" | "PV Super U" | "PV Intermarché"

interface PvConcurrentStore {
  pvConcurrent: PvConcurrentType
  setPvConcurrent: (value: PvConcurrentType) => void
}

export const usePvConcurrentStore = create<PvConcurrentStore>((set) => ({
  pvConcurrent: "PV Leclerc",
  setPvConcurrent: (value) => set({ pvConcurrent: value })
}))

// Helper pour obtenir l'abréviation du concurrent
export const getPvConcurrentAbbrev = (concurrent: PvConcurrentType): string => {
  switch (concurrent) {
    case "PV Leclerc": return "LCL"
    case "PV Super U": return "SU"
    case "PV Intermarché": return "ITM"
  }
}

// Helper pour obtenir le nom complet du concurrent
export const getPvConcurrentFullName = (concurrent: PvConcurrentType): string => {
  switch (concurrent) {
    case "PV Leclerc": return "Leclerc"
    case "PV Super U": return "Super U"
    case "PV Intermarché": return "Intermarché"
  }
}

// Fonction pour appliquer une variation de +/-5% selon le concurrent sélectionné
export const applyPvVariation = (value: string, concurrent: PvConcurrentType): string => {
  // Extraire le nombre de la chaîne (ex: "8.63€" -> 8.63)
  const numMatch = value.match(/[\d.,]+/)
  if (!numMatch) return value

  const num = parseFloat(numMatch[0].replace(',', '.'))
  if (isNaN(num)) return value

  // Appliquer un facteur selon le concurrent
  let factor = 1
  if (concurrent === "PV Super U") {
    factor = 1.05 // +5%
  } else if (concurrent === "PV Intermarché") {
    factor = 0.95 // -5%
  }

  const newNum = (num * factor).toFixed(2)
  // Remplacer le nombre dans la chaîne originale
  return value.replace(/[\d.,]+/, newNum)
}
