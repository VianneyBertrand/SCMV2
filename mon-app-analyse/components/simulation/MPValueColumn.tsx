// @ts-nocheck
'use client'

import { useSimulationStore, MPValueItem } from '@/stores/simulationStore'
import { MPRow } from './MPRow'
import { MPAddDropdown } from './MPAddDropdown'

interface MPValueColumnProps {
  availableOptions: MPValueItem[]
}

/**
 * Colonne gauche: MP en Valeur (€) - Prix première période + Prix dernière période
 */
export function MPValueColumn({ availableOptions }: MPValueColumnProps) {
  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const originalData = useSimulationStore((state) => state.originalData)
  const updateMPPriceFirst = useSimulationStore((state) => state.updateMPPriceFirst)
  const updateMPPriceLast = useSimulationStore((state) => state.updateMPPriceLast)
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
                value={`${mp.priceFirst.toFixed(3)}€/kg`}
                numericValue={mp.priceFirst}
                originalValue={originalMP?.priceFirst}
                valueLabel="Prix 01/04/2024"
                secondValue={`${mp.priceLast.toFixed(3)}€/kg`}
                numericSecondValue={mp.priceLast}
                originalSecondValue={originalMP?.priceLast}
                secondValueLabel="Prix 01/04/2025"
                onIncrement01={() => updateMPPriceFirst(mp.id, mp.priceFirst * 1.001)}
                onIncrement1={() => updateMPPriceFirst(mp.id, mp.priceFirst * 1.01)}
                onDecrement01={() => updateMPPriceFirst(mp.id, Math.max(0, mp.priceFirst * 0.999))}
                onDecrement1={() => updateMPPriceFirst(mp.id, Math.max(0, mp.priceFirst * 0.99))}
                onSecondIncrement01={() => updateMPPriceLast(mp.id, mp.priceLast * 1.001)}
                onSecondIncrement1={() => updateMPPriceLast(mp.id, mp.priceLast * 1.01)}
                onSecondDecrement01={() => updateMPPriceLast(mp.id, Math.max(0, mp.priceLast * 0.999))}
                onSecondDecrement1={() => updateMPPriceLast(mp.id, Math.max(0, mp.priceLast * 0.99))}
                thirdValue={`${mp.evolution.toFixed(2)}%`}
                numericThirdValue={mp.evolution}
                originalThirdValue={originalMP?.evolution}
                thirdValueLabel="Évolution"
                onThirdIncrement01={() => updateMPEvolution(mp.id, mp.evolution + 0.1)}
                onThirdIncrement1={() => updateMPEvolution(mp.id, mp.evolution + 1)}
                onThirdDecrement01={() => updateMPEvolution(mp.id, mp.evolution - 0.1)}
                onThirdDecrement1={() => updateMPEvolution(mp.id, mp.evolution - 1)}
                onRemove={() => removeMPValue(mp.id)}
                onValueChange={(newValue) => updateMPPriceFirst(mp.id, newValue)}
                onSecondValueChange={(newValue) => updateMPPriceLast(mp.id, newValue)}
                onThirdValueChange={(newValue) => updateMPEvolution(mp.id, newValue)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
