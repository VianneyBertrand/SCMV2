// @ts-nocheck
'use client'

import { useSimulationStore, MPVolumeItem } from '@/stores/simulationStore'
import { MPRow } from './MPRow'
import { MPAddDropdown } from './MPAddDropdown'

interface MPVolumeColumnProps {
  availableOptions: MPVolumeItem[]
}

/**
 * Colonne droite: MP en Volume (% répartition)
 */
export function MPVolumeColumn({ availableOptions }: MPVolumeColumnProps) {
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const updateMPVolume = useSimulationStore((state) => state.updateMPVolume)
  const addMPVolume = useSimulationStore((state) => state.addMPVolume)
  const removeMPVolume = useSimulationStore((state) => state.removeMPVolume)

  const handleAdd = (option: { id: string; label: string }) => {
    const mpToAdd = availableOptions.find(mp => mp.id === option.id)
    if (mpToAdd) {
      addMPVolume(mpToAdd)
    }
  }

  // Calculer le total des pourcentages
  const total = simulatedData.mpVolumes.reduce((sum, mp) => sum + mp.percentage, 0)

  // Filtrer les options pour ne pas afficher celles déjà ajoutées
  const filteredOptions = availableOptions
    .filter(opt => !simulatedData.mpVolumes.some(mp => mp.id === opt.id))
    .map(opt => ({ id: opt.id, label: opt.label }))

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-700">MP en Volume (%)</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="mb-3">
          <MPAddDropdown
            options={filteredOptions}
            onAdd={handleAdd}
            placeholder="Rechercher une MP..."
          />
        </div>

        <div className="space-y-1">
          {simulatedData.mpVolumes.map((mp) => (
            <MPRow
              key={mp.id}
              label={mp.label}
              value={`${mp.percentage.toFixed(2)}%`}
              onIncrement={() => updateMPVolume(mp.id, mp.percentage + 0.1)}
              onDecrement={() => updateMPVolume(mp.id, Math.max(0, mp.percentage - 0.1))}
              onRemove={() => removeMPVolume(mp.id)}
            />
          ))}
        </div>
      </div>

      {/* Total - toujours visible */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Total:</span>
          <span className={`text-sm font-bold ${total > 100 ? 'text-red-600' : 'text-gray-900'}`}>
            {total.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
