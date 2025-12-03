// @ts-nocheck
'use client'

import { useState } from 'react'
import { useSimulationStore, MPVolumeItem, MPValueItem } from '@/stores/simulationStore'
import { MPRow } from './MPRow'
import { MPAddDropdown } from './MPAddDropdown'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

interface MPVolumeColumnProps {
  availableOptions: MPVolumeItem[]
  availableMPValues: MPValueItem[]
  columnType?: 'mp' | 'emballage'
}

/**
 * Colonne droite: MP/Emballage en Volume (%)
 * Reste identique quel que soit le type de période (defined ou future)
 */
export function MPVolumeColumn({ availableOptions, availableMPValues, columnType = 'mp' }: MPVolumeColumnProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; label: string } | null>(null)

  const simulatedData = useSimulationStore((state) => state.simulatedData)
  const originalData = useSimulationStore((state) => state.originalData)

  // Actions MP
  const updateMPVolume = useSimulationStore((state) => state.updateMPVolume)
  const addMPVolume = useSimulationStore((state) => state.addMPVolume)
  const addMPValue = useSimulationStore((state) => state.addMPValue)
  const removeMPVolume = useSimulationStore((state) => state.removeMPVolume)
  const removeMPValue = useSimulationStore((state) => state.removeMPValue)
  const updateMPReference = useSimulationStore((state) => state.updateMPReference)

  // Actions Emballage
  const updateEmballageVolume = useSimulationStore((state) => state.updateEmballageVolume)
  const addEmballageVolume = useSimulationStore((state) => state.addEmballageVolume)
  const addEmballageValue = useSimulationStore((state) => state.addEmballageValue)
  const removeEmballageVolume = useSimulationStore((state) => state.removeEmballageVolume)
  const removeEmballageValue = useSimulationStore((state) => state.removeEmballageValue)
  const updateEmballageReference = useSimulationStore((state) => state.updateEmballageReference)

  // Sélectionner les données en fonction du type de colonne
  const isEmballage = columnType === 'emballage'
  const items = isEmballage ? simulatedData.emballageVolumes : simulatedData.mpVolumes
  const originalItems = isEmballage ? originalData.emballageVolumes : originalData.mpVolumes
  const valueItems = isEmballage ? simulatedData.emballageValues : simulatedData.mpValues

  // Fonction pour trouver la valeur originale
  const getOriginalItem = (id: string) => originalItems.find(item => item.id === id)

  // Sélectionner les actions en fonction du type
  const updateVolume = isEmballage ? updateEmballageVolume : updateMPVolume
  const addVolume = isEmballage ? addEmballageVolume : addMPVolume
  const addValue = isEmballage ? addEmballageValue : addMPValue
  const removeVolume = isEmballage ? removeEmballageVolume : removeMPVolume
  const removeValue = isEmballage ? removeEmballageValue : removeMPValue
  const updateReference = isEmballage ? updateEmballageReference : updateMPReference

  // Handler pour demander la suppression (ouvre la dialog de confirmation)
  const handleRequestDelete = (id: string, label: string) => {
    setItemToDelete({ id, label })
    setDeleteDialogOpen(true)
  }

  // Handler pour confirmer la suppression (supprime des deux colonnes)
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      removeVolume(itemToDelete.id)
      removeValue(itemToDelete.id)
      setItemToDelete(null)
    }
  }

  // Ajouter un item dans les deux colonnes (gauche et droite)
  const handleAdd = (option: { id: string; label: string }) => {
    // Ajouter dans la colonne droite (Volume)
    const volumeToAdd = availableOptions.find(item => item.id === option.id)
    if (volumeToAdd) {
      addVolume(volumeToAdd)
    } else {
      addVolume({
        id: option.id,
        label: option.label,
        code: option.id,
        percentage: 0
      })
    }

    // Ajouter dans la colonne gauche (Valeur)
    const valueToAdd = availableMPValues.find(item => item.id === option.id)
    if (valueToAdd) {
      addValue(valueToAdd)
    } else {
      addValue({
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
  const total = items.reduce((sum, item) => sum + item.percentage, 0)

  // Combiner les deux listes pour le dropdown (union des items disponibles)
  const allAvailableItems = [
    ...availableOptions.map(opt => ({ id: opt.id, label: opt.label })),
    ...availableMPValues
      .filter(item => !availableOptions.some(opt => opt.id === item.id))
      .map(item => ({ id: item.id, label: item.label }))
  ]

  // Filtrer les options pour ne pas afficher celles déjà ajoutées
  const filteredOptions = allAvailableItems
    .filter(opt => !items.some(item => item.id === opt.id))
    .filter(opt => !valueItems.some(item => item.id === opt.id))

  const itemLabel = isEmballage ? 'un emballage' : 'une MP'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        <div className="space-y-1">
          {items.map((item) => {
            const originalItem = getOriginalItem(item.id)

            return (
              <MPRow
                key={item.id}
                label={item.label}
                code={item.code}
                mpId={item.id}
                onReferenceChange={(newCode, newLabel, priceFirst, priceLast) => updateReference(item.id, newCode, newLabel, priceFirst, priceLast)}
                value={`${item.percentage.toFixed(2)}%`}
                numericValue={item.percentage}
                originalValue={originalItem?.percentage}
                onIncrement01={() => updateVolume(item.id, item.percentage + 0.1)}
                onIncrement1={() => updateVolume(item.id, item.percentage + 1)}
                onDecrement01={() => updateVolume(item.id, Math.max(0, item.percentage - 0.1))}
                onDecrement1={() => updateVolume(item.id, Math.max(0, item.percentage - 1))}
                onRemove={() => handleRequestDelete(item.id, item.label)}
                onValueChange={(newValue) => updateVolume(item.id, newValue)}
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

      {/* Bouton Ajouter en bas */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <MPAddDropdown
          options={filteredOptions}
          onAdd={handleAdd}
          placeholder={`Rechercher ${itemLabel}...`}
          buttonLabel={`Ajouter ${itemLabel}`}
        />
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemLabel={itemToDelete?.label || ''}
        itemType={isEmballage ? 'emballage' : 'mp'}
      />
    </div>
  )
}
