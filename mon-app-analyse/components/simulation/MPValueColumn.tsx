// @ts-nocheck
'use client'

import { useSimulationStore, MPValueItem } from '@/stores/simulationStore'
import { MPRow } from './MPRow'
import { MPAddDropdown } from './MPAddDropdown'

interface MPValueColumnProps {
  availableOptions: MPValueItem[]
}

/**
 * Colonne gauche: MP en Valeur (€) avec évolution (%)
 */
export function MPValueColumn({ availableOptions }: MPValueColumnProps) {
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const updateMPPrice = useSimulationStore((state) => state.updateMPPrice)
  const updateMPEvolution = useSimulationStore((state) => state.updateMPEvolution)
  const addMPValue = useSimulationStore((state) => state.addMPValue)
  const removeMPValue = useSimulationStore((state) => state.removeMPValue)

  const handleAdd = (option: { id: string; label: string }) => {
    const mpToAdd = availableOptions.find(mp => mp.id === option.id)
    if (mpToAdd) {
      addMPValue(mpToAdd)
    }
  }

  // Filtrer les options pour ne pas afficher celles déjà ajoutées
  const filteredOptions = availableOptions
    .filter(opt => !simulatedData.mpValues.some(mp => mp.id === opt.id))
    .map(opt => ({ id: opt.id, label: opt.label }))

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-700">MP en Valeur (€)</h3>
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
          {simulatedData.mpValues.map((mp) => (
            <MPRow
              key={mp.id}
              label={mp.label}
              value={`${mp.price.toFixed(3)}€/kg`}
              valueLabel="Prix"
              secondValue={`${mp.evolution >= 0 ? '+' : ''}${mp.evolution.toFixed(2)}%`}
              secondValueLabel="Évol."
              onIncrement={() => updateMPPrice(mp.id, mp.price + 0.001)}
              onDecrement={() => updateMPPrice(mp.id, Math.max(0, mp.price - 0.001))}
              onSecondIncrement={() => updateMPEvolution(mp.id, mp.evolution + 0.1)}
              onSecondDecrement={() => updateMPEvolution(mp.id, mp.evolution - 0.1)}
              onRemove={() => removeMPValue(mp.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
