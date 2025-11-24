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

interface ConfirmCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Dialog de confirmation pour fermer la fenêtre avec modifications non enregistrées
 */
export function ConfirmCloseDialog({ open, onOpenChange, onConfirm }: ConfirmCloseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifications non enregistrées</DialogTitle>
          <DialogDescription>
            Vous avez des modifications non simulées. Voulez-vous vraiment abandonner ces changements ?
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
            onClick={onConfirm}
          >
            Abandonner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
