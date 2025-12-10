"use client";

import * as React from "react";
import { Button } from "@/componentsv2/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import type { MPAlert } from "@/types/mp-alerts";
import { formatAlertSummary } from "@/lib/alert-utils";

interface AlertSummaryProps {
  alert: MPAlert;
  onToggleActive: (active: boolean) => void;
  onModify: () => void;
  onDelete: () => void;
}

export function AlertSummary({
  alert,
  onToggleActive,
  onModify,
  onDelete,
}: AlertSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Header avec toggle */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-base">Alerte</span>
        <Switch
          checked={alert.isActive}
          onCheckedChange={onToggleActive}
          aria-label="Activer/désactiver l'alerte"
        />
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200" />

      {/* Résumé de la configuration */}
      <div className="text-base text-foreground mb-2">
        {formatAlertSummary(alert.config)}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onModify}>
          Modifier
        </Button>
        <Button
          variant="outline-destructive"
          size="sm"
          onClick={onDelete}
        >
          Supprimer
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
