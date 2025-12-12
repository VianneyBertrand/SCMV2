"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import {
  Folder,
  FolderOpen,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
  ChevronDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MPChip, MPChipData, MP_CHIP_DND_TYPE } from "./mp-chip";

interface MPFolderProps {
  id: string;
  name: string;
  mps: MPChipData[];
  isOpen: boolean;
  isVisible: boolean;
  mpVisibility: { [mpId: string]: boolean };
  onToggleOpen: (folderId: string) => void;
  onToggleVisibility: (folderId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
  onDropMP: (mpId: string, folderId: string) => void;
  onToggleMPVisibility: (mpId: string) => void;
  onRemoveMP: (mpId: string) => void;
  renderAlert?: (mp: MPChipData) => React.ReactNode;
  isDefault?: boolean; // Dossier par défaut (ne peut pas être supprimé)
}

export function MPFolder({
  id,
  name,
  mps,
  isOpen,
  isVisible,
  mpVisibility,
  onToggleOpen,
  onToggleVisibility,
  onRename,
  onDelete,
  onDropMP,
  onToggleMPVisibility,
  onRemoveMP,
  renderAlert,
  isDefault = false,
}: MPFolderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: MP_CHIP_DND_TYPE,
      drop: (item: { mpId: string }) => {
        onDropMP(item.mpId, id);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [id, onDropMP]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editName.trim() && editName !== name) {
      onRename(id, editName.trim());
    } else {
      setEditName(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditName(name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={drop}
      className={cn(
        "rounded-lg border transition-all",
        isOver && canDrop && "border-blue-400 bg-blue-50",
        !isVisible && "opacity-60"
      )}
    >
      {/* Header du dossier */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-t-lg",
          !isOpen && "rounded-b-lg"
        )}
        onClick={() => onToggleOpen(id)}
      >
        {/* Icône chevron */}
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}

        {/* Icône dossier */}
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-amber-500" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500" />
        )}

        {/* Nom du dossier (éditable) */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              className="h-6 text-sm px-2 py-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRename}
              className="h-6 w-6 p-0"
            >
              <Check className="w-3 h-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditName(name);
                setIsEditing(false);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <span className="flex-1 font-medium text-sm">{name}</span>
        )}

        {/* Badge nombre de MP */}
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {mps.length}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Renommer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
            title="Renommer"
          >
            <Pencil className="w-3 h-3" />
          </Button>

          {/* Visibilité */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(id)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
            title={isVisible ? "Masquer tout le dossier" : "Afficher tout le dossier"}
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            )}
          </Button>

          {/* Supprimer (pas pour le dossier par défaut) */}
          {!isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              title="Supprimer le dossier"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenu du dossier (MP) */}
      {isOpen && (
        <div className="px-3 py-2 border-t bg-gray-50/50 rounded-b-lg">
          {mps.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2 text-center">
              Glissez des MP ici
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mps.map((mp) => (
                <MPChip
                  key={mp.id}
                  mp={mp}
                  isVisible={mpVisibility[mp.id] ?? true}
                  onToggleVisibility={onToggleMPVisibility}
                  onRemove={onRemoveMP}
                  alertElement={renderAlert?.(mp)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
