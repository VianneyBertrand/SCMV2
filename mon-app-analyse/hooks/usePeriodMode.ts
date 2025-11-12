"use client"

import { useState, useEffect } from 'react'

export type PeriodMode = 'CAD' | 'CAM'

/**
 * Hook pour gérer le mode de période (CAD/CAM) avec persistance localStorage
 * @param key - Clé unique pour le localStorage (ex: "period-mode-ca", "period-mode-volume")
 * @param defaultMode - Mode par défaut (défaut: "CAD")
 */
export function usePeriodMode(key: string, defaultMode: PeriodMode = 'CAD') {
  const [mode, setMode] = useState<PeriodMode>(defaultMode)

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === 'CAD' || stored === 'CAM') {
        setMode(stored)
      }
    } catch (error) {
      console.error('Error loading period mode from localStorage:', error)
    }
  }, [key])

  // Sauvegarder dans localStorage à chaque changement
  const toggleMode = () => {
    const newMode = mode === 'CAD' ? 'CAM' : 'CAD'
    setMode(newMode)
    try {
      localStorage.setItem(key, newMode)
    } catch (error) {
      console.error('Error saving period mode to localStorage:', error)
    }
  }

  return { mode, toggleMode }
}
