"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MPAlert, MPAlertConfig } from "@/types/mp-alerts";
import { AlertForm } from "./alert-form";
import { AlertSummary } from "./alert-summary";

type PopoverMode = "create" | "view" | "edit";

interface AlertPopoverProps {
  mpId: string;
  mpLabel: string;
  alert: MPAlert | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MPAlertConfig) => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
  defaultUnit?: string;
  children: React.ReactNode;
}

export function AlertPopover({
  mpId,
  mpLabel,
  alert,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onToggleActive,
  defaultUnit = "€/t",
  children,
}: AlertPopoverProps) {
  const [mode, setMode] = useState<PopoverMode>(alert ? "view" : "create");

  // Reset mode when popover opens or alert changes
  useEffect(() => {
    if (open) {
      setMode(alert ? "view" : "create");
    }
  }, [open, alert]);

  const handleSave = (config: MPAlertConfig) => {
    onSave(config);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete();
    onOpenChange(false);
  };

  const handleModify = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setMode("view");
  };

  const getTitle = () => {
    if (mode === "create") return "Créer une alerte";
    if (mode === "edit") return "Modifier l'alerte";
    return "Alerte";
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-4"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        {/* Title - only for create/edit modes */}
        {(mode === "create" || mode === "edit") && (
          <>
            <div className="font-medium text-base mb-3">{getTitle()}</div>
            <div className="border-t border-gray-200 mb-4" />
          </>
        )}

        {/* Content based on mode */}
        {mode === "create" && (
          <AlertForm
            onSubmit={handleSave}
            submitLabel="Créer l'alerte"
            defaultUnit={defaultUnit}
          />
        )}

        {mode === "view" && alert && (
          <AlertSummary
            alert={alert}
            onToggleActive={onToggleActive}
            onModify={handleModify}
            onDelete={handleDelete}
          />
        )}

        {mode === "edit" && alert && (
          <AlertForm
            initialValues={alert.config}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            submitLabel="Modifier"
            defaultUnit={defaultUnit}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
