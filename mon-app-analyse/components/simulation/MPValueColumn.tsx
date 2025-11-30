// @ts-nocheck
'use client'

import { useSimulationStore, MPValueItem, DecoupageType } from '@/stores/simulationStore'
import { MPValueItemCard } from './MPValueItemCard'

interface MPValueColumnProps {
  availableOptions: MPValueItem[]
  period?: { from?: { month: number; year: number }; to?: { month: number; year: number } }
  resetKey?: number
  columnType?: 'mp' | 'emballage'
}

/**
 * Colonne gauche: MP/Emballage en Valeur (€)
 * Mode période définie: Prix première période + Prix dernière période
 * Avec support du découpage temporel
 */
export function MPValueColumn({ availableOptions, period, resetKey, columnType = 'mp' }: MPValueColumnProps) {
  const simulatedData = useSimulationStore((state) => state.simulatedData)

  // Actions MP
  const updateMPPriceFirst = useSimulationStore((state) => state.updateMPPriceFirst)
  const updateMPPriceLast = useSimulationStore((state) => state.updateMPPriceLast)
  const removeMPValue = useSimulationStore((state) => state.removeMPValue)
  const updateMPReference = useSimulationStore((state) => state.updateMPReference)
  const updateMPDecoupage = useSimulationStore((state) => state.updateMPDecoupage)
  const updateMPIntermediatePrice = useSimulationStore((state) => state.updateMPIntermediatePrice)

  // Actions Emballage
  const updateEmballagePriceFirst = useSimulationStore((state) => state.updateEmballagePriceFirst)
  const updateEmballagePriceLast = useSimulationStore((state) => state.updateEmballagePriceLast)
  const removeEmballageValue = useSimulationStore((state) => state.removeEmballageValue)
  const updateEmballageReference = useSimulationStore((state) => state.updateEmballageReference)
  const updateEmballageDecoupage = useSimulationStore((state) => state.updateEmballageDecoupage)
  const updateEmballageIntermediatePrice = useSimulationStore((state) => state.updateEmballageIntermediatePrice)

  // Sélectionner les données en fonction du type de colonne
  const isEmballage = columnType === 'emballage'
  const items = isEmballage ? simulatedData.emballageValues : simulatedData.mpValues

  // Sélectionner les actions en fonction du type
  const updatePriceFirst = isEmballage ? updateEmballagePriceFirst : updateMPPriceFirst
  const updatePriceLast = isEmballage ? updateEmballagePriceLast : updateMPPriceLast
  const removeItem = isEmballage ? removeEmballageValue : removeMPValue
  const updateReference = isEmballage ? updateEmballageReference : updateMPReference
  const updateDecoupage = isEmballage ? updateEmballageDecoupage : updateMPDecoupage
  const updateIntermediatePrice = isEmballage ? updateEmballageIntermediatePrice : updateMPIntermediatePrice

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        <div className="space-y-1">
          {items.map((item) => (
            <MPValueItemCard
              key={item.id}
              id={item.id}
              label={item.label}
              code={item.code}
              priceFirst={item.priceFirst}
              priceLast={item.priceLast}
              decoupage={item.decoupage}
              intermediatePrices={item.intermediatePrices}
              period={period}
              onReferenceChange={(newCode, newLabel, priceFirst, priceLast) =>
                updateReference(item.id, newCode, newLabel, priceFirst, priceLast)
              }
              onPriceFirstChange={(price) => updatePriceFirst(item.id, price)}
              onPriceLastChange={(price) => updatePriceLast(item.id, price)}
              onDecoupageChange={(decoupage) => updateDecoupage(item.id, decoupage, period)}
              onIntermediatePriceChange={(periodIndex, price) =>
                updateIntermediatePrice(item.id, periodIndex, price)
              }
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
