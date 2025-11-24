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
  const originalData = useSimulationStore((state) => state.originalData)
  const updateMPPrice = useSimulationStore((state) => state.updateMPPrice)
  const updateMPEvolution = useSimulationStore((state) => state.updateMPEvolution)
  const addMPValue = useSimulationStore((state) => state.addMPValue)
  const removeMPValue = useSimulationStore((state) => state.removeMPValue)

  // Fonction pour trouver la valeur originale d'une MP
  const getOriginalMP = (id: string) => originalData.mpValues.find(mp => mp.id === id)

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
      <div className="px-4 py-2">
        <h3 className="font-bold text-gray-700" style={{ fontSize: '16px' }}>MP en Valeur (€)</h3>
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
          {simulatedData.mpValues.map((mp) => {
            const originalMP = getOriginalMP(mp.id)
            return (
              <MPRow
                key={mp.id}
                label={mp.label}
                code={mp.code}
                value={`${mp.price.toFixed(3)}€/kg`}
                originalValue={originalMP?.price}
                valueLabel="Prix"
                secondValue={`${mp.evolution >= 0 ? '+' : ''}${mp.evolution.toFixed(2)}%`}
                originalSecondValue={originalMP?.evolution}
                secondValueLabel="Évol."
                onIncrement01={() => updateMPPrice(mp.id, mp.price * 1.001)}
                onIncrement1={() => updateMPPrice(mp.id, mp.price * 1.01)}
                onDecrement01={() => updateMPPrice(mp.id, Math.max(0, mp.price * 0.999))}
                onDecrement1={() => updateMPPrice(mp.id, Math.max(0, mp.price * 0.99))}
                onSecondIncrement01={() => updateMPEvolution(mp.id, mp.evolution + 0.1)}
                onSecondIncrement1={() => updateMPEvolution(mp.id, mp.evolution + 1)}
                onSecondDecrement01={() => updateMPEvolution(mp.id, mp.evolution - 0.1)}
                onSecondDecrement1={() => updateMPEvolution(mp.id, mp.evolution - 1)}
                onRemove={() => removeMPValue(mp.id)}
                onValueChange={(newValue) => updateMPPrice(mp.id, newValue)}
                onSecondValueChange={(newValue) => updateMPEvolution(mp.id, newValue)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
