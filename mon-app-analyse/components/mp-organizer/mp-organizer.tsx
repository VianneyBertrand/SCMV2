"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MPChip, MPChipData } from "./mp-chip";
import { MPFolder } from "./mp-folder";
import { useMPFoldersStore, type MPFolder as MPFolderType } from "@/stores/mp-folders-store";

interface MPOrganizerProps {
  selectedMPs: MPChipData[];
  onRemoveMP: (mpId: string) => void;
  renderAlert?: (mp: MPChipData) => React.ReactNode;
  className?: string;
}

function MPOrganizerContent({
  selectedMPs,
  onRemoveMP,
  renderAlert,
  className,
}: MPOrganizerProps) {
  const {
    folders,
    mpVisibility,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderOpen,
    toggleFolderVisibility,
    moveMPToFolder,
    toggleMPVisibility,
    ensureMPInFolder,
    getDefaultFolderId,
    _hasHydrated,
  } = useMPFoldersStore();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<MPFolderType | null>(null);

  // S'assurer que toutes les MP sélectionnées sont dans un dossier
  useEffect(() => {
    if (_hasHydrated) {
      selectedMPs.forEach((mp) => {
        ensureMPInFolder(mp.id);
      });
    }
  }, [selectedMPs, _hasHydrated, ensureMPInFolder]);

  // Créer un nouveau dossier
  const handleCreateFolder = useCallback(() => {
    createFolder("Nouveau dossier");
  }, [createFolder]);

  // Demander confirmation avant suppression
  const handleRequestDelete = useCallback((folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    // Ne pas permettre la suppression du dossier par défaut
    if (folder && !folder.isDefault) {
      setFolderToDelete(folder);
      setDeleteConfirmOpen(true);
    }
  }, [folders]);

  // Confirmer la suppression
  const handleConfirmDelete = useCallback(() => {
    if (folderToDelete) {
      // Supprimer aussi les MP du dossier de la sélection
      folderToDelete.mpIds.forEach((mpId) => {
        onRemoveMP(mpId);
      });
      deleteFolder(folderToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setFolderToDelete(null);
  }, [folderToDelete, deleteFolder, onRemoveMP]);

  // Drop une MP dans un dossier
  const handleDropMPToFolder = useCallback(
    (mpId: string, folderId: string) => {
      moveMPToFolder(mpId, folderId);
    },
    [moveMPToFolder]
  );

  // Supprimer une MP (du dossier ET de la sélection)
  const handleRemoveMP = useCallback(
    (mpId: string) => {
      onRemoveMP(mpId);
    },
    [onRemoveMP]
  );

  // Récupérer les MP d'un dossier
  const getMPsForFolder = useCallback(
    (folder: MPFolderType): MPChipData[] => {
      return folder.mpIds
        .map((mpId) => selectedMPs.find((mp) => mp.id === mpId))
        .filter((mp): mp is MPChipData => mp !== undefined);
    },
    [selectedMPs]
  );

  // Attendre l'hydratation pour éviter les erreurs de mismatch SSR/Client
  if (!_hasHydrated) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 ml-auto mb-3"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (selectedMPs.length === 0) {
    return (
      <div className={cn("text-sm text-gray-500 italic", className)}>
        Aucune matière première sélectionnée
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Bouton créer dossier */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateFolder}
          className="gap-1.5"
        >
          <FolderPlus className="w-4 h-4" />
          Nouveau dossier
        </Button>
      </div>

      {/* Liste des dossiers */}
      {folders.length > 0 && (
        <div className="space-y-2">
          {folders.map((folder) => (
            <MPFolder
              key={folder.id}
              id={folder.id}
              name={folder.name}
              mps={getMPsForFolder(folder)}
              isOpen={folder.isOpen}
              isVisible={folder.isVisible}
              mpVisibility={mpVisibility}
              onToggleOpen={toggleFolderOpen}
              onToggleVisibility={toggleFolderVisibility}
              onRename={renameFolder}
              onDelete={handleRequestDelete}
              onDropMP={handleDropMPToFolder}
              onToggleMPVisibility={toggleMPVisibility}
              onRemoveMP={handleRemoveMP}
              renderAlert={renderAlert}
              isDefault={folder.isDefault}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier "{folderToDelete?.name}" contient{" "}
              {folderToDelete?.mpIds.length || 0} matière(s) première(s).
              <br />
              <strong>
                Ces MP seront également supprimées de votre sélection.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrapper avec DndProvider
export function MPOrganizer(props: MPOrganizerProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <MPOrganizerContent {...props} />
    </DndProvider>
  );
}
