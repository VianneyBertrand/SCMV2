"use client";

import * as React from "react";
import { useDrag } from "react-dnd";
import { Eye, EyeOff, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MPChipData {
  id: string;
  code: string;
  nom: string;
  unite?: string;
  paysDestination?: string;
}

interface MPChipProps {
  mp: MPChipData;
  isVisible: boolean;
  onToggleVisibility: (mpId: string) => void;
  onRemove: (mpId: string) => void;
  isDraggable?: boolean;
  alertElement?: React.ReactNode; // Pour injecter le bouton/popover d'alerte
}

export const MP_CHIP_DND_TYPE = "mp-chip";

export function MPChip({
  mp,
  isVisible,
  onToggleVisibility,
  onRemove,
  isDraggable = true,
  alertElement,
}: MPChipProps) {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: MP_CHIP_DND_TYPE,
      item: { mpId: mp.id, mpCode: mp.code, mpNom: mp.nom },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [mp.id]
  );

  return (
    <div
      ref={isDraggable ? preview : undefined}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all",
        isVisible
          ? "bg-white border-neutral text-foreground"
          : "bg-gray-100 border-gray-200 text-gray-400",
        isDragging && "opacity-50",
        isDraggable && "cursor-default"
      )}
    >
      {/* Drag handle */}
      {isDraggable && (
        <span ref={drag} className="cursor-grab hover:text-gray-600">
          <GripVertical className="w-3 h-3" />
        </span>
      )}

      {/* MP code + nom */}
      <span className={cn("font-medium text-[14px]", !isVisible && "line-through")}>
        {mp.code} - {mp.nom}
      </span>

      {/* Alert element (injected) */}
      {alertElement && (
        <span onClick={(e) => e.stopPropagation()}>{alertElement}</span>
      )}

      {/* Eye toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(mp.id);
        }}
        className="p-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors duration-150 hover:text-gray-600"
      >
        {isVisible ? (
          <Eye className="w-4 h-4 text-primary" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(mp.id);
        }}
        className="text-primary hover:text-primary/80"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
