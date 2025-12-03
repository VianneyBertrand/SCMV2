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

interface TotalPercentageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mpTotal: number
  emballageTotal: number
  hasMPItems: boolean
  hasEmballageItems: boolean
}

/**
 * Dialog d'erreur quand le total des pourcentages n'est pas égal à 100%
 */
export function TotalPercentageDialog({
  open,
  onOpenChange,
  mpTotal,
  emballageTotal,
  hasMPItems,
  hasEmballageItems
}: TotalPercentageDialogProps) {
  const mpInvalid = hasMPItems && Math.abs(mpTotal - 100) > 0.01
  const emballageInvalid = hasEmballageItems && Math.abs(emballageTotal - 100) > 0.01

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md z-[80] data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0 data-[state=open]:!zoom-in-100 data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-top-0 data-[state=closed]:!zoom-out-100"
        overlayClassName="z-[80]"
      >
        <DialogHeader>
          <DialogTitle>Répartition incomplète</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              La somme des répartitions en volume doit être égale à 100% pour pouvoir simuler.
            </span>
            {mpInvalid && (
              <span className="block text-destructive">
                Matières premières : {mpTotal.toFixed(2)}% (attendu : 100%)
              </span>
            )}
            {emballageInvalid && (
              <span className="block text-destructive">
                Emballages : {emballageTotal.toFixed(2)}% (attendu : 100%)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
