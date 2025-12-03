// @ts-nocheck
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemLabel: string
  itemType: 'mp' | 'emballage'
}

/**
 * Dialog de confirmation pour supprimer une MP ou un emballage
 */
export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, itemLabel, itemType }: ConfirmDeleteDialogProps) {
  const typeLabel = itemType === 'emballage' ? "l'emballage" : 'la matière première'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md z-[80] data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0 data-[state=open]:!zoom-in-100 data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-top-0 data-[state=closed]:!zoom-out-100"
        overlayClassName="z-[80]"
      >
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Voulez-vous vraiment supprimer {typeLabel} <strong>{itemLabel}</strong> de la simulation ? Cette action retirera également cette ligne de la colonne des valeurs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
