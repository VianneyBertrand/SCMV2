// @ts-nocheck
'use client'

import { useSimulationStore, MPVolumeItem, MPValueItem } from '@/stores/simulationStore'
import { MPRow } from './MPRow'
import { MPAddDropdown } from './MPAddDropdown'

interface MPVolumeColumnProps {
  availableOptions: MPVolumeItem[]
  availableMPValues: MPValueItem[]
}

/**
 * Colonne droite: MP en Volume (%)
 * Reste identique quel que soit le type de période (defined ou future)
 */
export function MPVolumeColumn({ availableOptions, availableMPValues }: MPVolumeColumnProps) {
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const originalData = useSimulationStore((state) => state.originalData)
  const updateMPVolume = useSimulationStore((state) => state.updateMPVolume)
  const addMPVolume = useSimulationStore((state) => state.addMPVolume)
  const addMPValue = useSimulationStore((state) => state.addMPValue)
  const removeMPVolume = useSimulationStore((state) => state.removeMPVolume)
  const updateMPReference = useSimulationStore((state) => state.updateMPReference)

  // Fonction pour trouver la valeur originale d'une MP
  const getOriginalMP = (id: string) => originalData.mpVolumes.find(mp => mp.id === id)

  // Ajouter une MP dans les deux colonnes (gauche et droite)
  const handleAdd = (option: { id: string; label: string }) => {
    // Ajouter dans la colonne droite (Volume)
    const mpVolumeToAdd = availableOptions.find(mp => mp.id === option.id)
    if (mpVolumeToAdd) {
      addMPVolume(mpVolumeToAdd)
    } else {
      // Si pas trouvé dans availableOptions, créer avec 0%
      addMPVolume({
        id: option.id,
        label: option.label,
        code: option.id,
        percentage: 0
      })
    }

    // Ajouter dans la colonne gauche (Valeur)
    const mpValueToAdd = availableMPValues.find(mp => mp.id === option.id)
    if (mpValueToAdd) {
      addMPValue(mpValueToAdd)
    } else {
      // Si pas trouvé, créer avec valeurs à 0
      addMPValue({
        id: option.id,
        label: option.label,
        code: option.id,
        priceFirst: 0,
        priceLast: 0,
        evolution: 0
      })
    }
  }

  // Calculer le total des pourcentages
  const total = simulatedData.mpVolumes.reduce((sum, mp) => sum + mp.percentage, 0)

  // Combiner les deux listes pour le dropdown (union des MP disponibles)
  const allAvailableMPs = [
    ...availableOptions.map(opt => ({ id: opt.id, label: opt.label })),
    ...availableMPValues
      .filter(mp => !availableOptions.some(opt => opt.id === mp.id))
      .map(mp => ({ id: mp.id, label: mp.label }))
  ]

  // Filtrer les options pour ne pas afficher celles déjà ajoutées (dans l'une ou l'autre colonne)
  const filteredOptions = allAvailableMPs
    .filter(opt => !simulatedData.mpVolumes.some(mp => mp.id === opt.id))
    .filter(opt => !simulatedData.mpValues.some(mp => mp.id === opt.id))

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2">
        <h3 className="font-bold text-gray-700" style={{ fontSize: '16px' }}>
          MP en Volume (%)
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          {simulatedData.mpVolumes.map((mp) => {
            const originalMP = getOriginalMP(mp.id)

            return (
              <MPRow
                key={mp.id}
                label={mp.label}
                code={mp.code}
                mpId={mp.id}
                onReferenceChange={(newCode, newLabel) => updateMPReference(mp.id, newCode, newLabel)}
                value={`${mp.percentage.toFixed(2)}%`}
                numericValue={mp.percentage}
                originalValue={originalMP?.percentage}
                onIncrement01={() => updateMPVolume(mp.id, mp.percentage + 0.1)}
                onIncrement1={() => updateMPVolume(mp.id, mp.percentage + 1)}
                onDecrement01={() => updateMPVolume(mp.id, Math.max(0, mp.percentage - 0.1))}
                onDecrement1={() => updateMPVolume(mp.id, Math.max(0, mp.percentage - 1))}
                onRemove={() => removeMPVolume(mp.id)}
                onValueChange={(newValue) => updateMPVolume(mp.id, newValue)}
              />
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Total:</span>
          <span className={`text-sm font-bold ${total > 100 ? 'text-red-600' : 'text-gray-900'}`}>
            {total.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Bouton Ajouter une MP en bas */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <MPAddDropdown
          options={filteredOptions}
          onAdd={handleAdd}
          placeholder="Rechercher une MP..."
          buttonLabel="Ajouter une MP"
        />
      </div>
    </div>
  )
}
