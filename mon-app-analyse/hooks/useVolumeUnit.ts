"use client"

import { useState, useEffect } from 'react'

export type VolumeUnit = 'UVC' | 'Tonne'

/**
 * Hook pour gérer l'unité de volume (UVC/Tonne) avec persistance localStorage
 * @param key - Clé unique pour le localStorage (ex: "volume-unit-accueil", "volume-unit-detail")
 * @param defaultUnit - Unité par défaut (défaut: "UVC")
 */
export function useVolumeUnit(key: string, defaultUnit: VolumeUnit = 'UVC') {
  const [unit, setUnit] = useState<VolumeUnit>(defaultUnit)

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === 'UVC' || stored === 'Tonne') {
        setUnit(stored)
      }
    } catch (error) {
      console.error('Error loading volume unit from localStorage:', error)
    }
  }, [key])

  // Sauvegarder dans localStorage à chaque changement
  const toggleUnit = () => {
    const newUnit = unit === 'UVC' ? 'Tonne' : 'UVC'
    setUnit(newUnit)
    try {
      localStorage.setItem(key, newUnit)
    } catch (error) {
      console.error('Error saving volume unit to localStorage:', error)
    }
  }

  return { unit, toggleUnit }
}
