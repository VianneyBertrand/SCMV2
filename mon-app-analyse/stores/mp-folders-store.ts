import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface MPFolder {
  id: string;
  name: string;
  mpIds: string[]; // IDs des MP dans ce dossier
  isOpen: boolean; // Dossier ouvert/fermé visuellement
  isVisible: boolean; // Visibilité du dossier (icône œil)
  isDefault?: boolean; // Dossier par défaut (ne peut pas être supprimé)
}

export interface MPVisibility {
  [mpId: string]: boolean; // true = visible, false = masqué
}

interface MPFoldersState {
  folders: MPFolder[];
  mpVisibility: MPVisibility; // Visibilité individuelle des MP
  _hasHydrated: boolean; // Pour gérer l'hydratation

  // Actions sur les dossiers
  createFolder: (name: string) => string; // Retourne l'ID du nouveau dossier
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderOpen: (folderId: string) => void;
  toggleFolderVisibility: (folderId: string) => void;
  getDefaultFolderId: () => string; // Retourne l'ID du dossier par défaut
  ensureDefaultFolder: () => void; // S'assure qu'un dossier par défaut existe

  // Actions sur les MP
  addMPToFolder: (mpId: string, folderId: string) => void;
  removeMPFromFolder: (mpId: string) => void;
  moveMPToFolder: (mpId: string, targetFolderId: string | null) => void; // null = dossier par défaut
  toggleMPVisibility: (mpId: string) => void;
  setMPVisibility: (mpId: string, visible: boolean) => void;
  ensureMPInFolder: (mpId: string) => void; // S'assure qu'une MP est dans un dossier

  // Getters
  getFolderForMP: (mpId: string) => MPFolder | null;
  isMPVisible: (mpId: string) => boolean;
  getMPsInFolder: (folderId: string) => string[];

  // Hydratation
  setHasHydrated: (state: boolean) => void;
}

// ID fixe pour le dossier par défaut
const DEFAULT_FOLDER_ID = "default-folder";
const DEFAULT_FOLDER_NAME = "Cours de mes matières premières";

// Dossier par défaut
const createDefaultFolder = (): MPFolder => ({
  id: DEFAULT_FOLDER_ID,
  name: DEFAULT_FOLDER_NAME,
  mpIds: [],
  isOpen: true,
  isVisible: true,
  isDefault: true,
});

// Générateur d'ID unique
const generateId = () => `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useMPFoldersStore = create<MPFoldersState>()(
  persist(
    (set, get) => ({
      folders: [createDefaultFolder()],
      mpVisibility: {},
      _hasHydrated: false,

      // === Hydratation ===
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // === Actions sur les dossiers ===

      ensureDefaultFolder: () => {
        const { folders } = get();
        const hasDefault = folders.some((f) => f.isDefault || f.id === DEFAULT_FOLDER_ID);
        if (!hasDefault) {
          set((state) => ({
            folders: [createDefaultFolder(), ...state.folders],
          }));
        }
      },

      getDefaultFolderId: () => {
        const { folders } = get();
        const defaultFolder = folders.find((f) => f.isDefault || f.id === DEFAULT_FOLDER_ID);
        return defaultFolder?.id ?? DEFAULT_FOLDER_ID;
      },

      createFolder: (name: string) => {
        const id = generateId();
        set((state) => ({
          folders: [
            ...state.folders,
            {
              id,
              name,
              mpIds: [],
              isOpen: true,
              isVisible: true,
            },
          ],
        }));
        return id;
      },

      renameFolder: (folderId: string, newName: string) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, name: newName } : f
          ),
        }));
      },

      deleteFolder: (folderId: string) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === folderId);
          // Ne pas supprimer le dossier par défaut
          if (!folder || folder.isDefault) return state;

          // Supprimer aussi la visibilité des MP du dossier supprimé
          const newVisibility = { ...state.mpVisibility };
          folder.mpIds.forEach((mpId) => {
            delete newVisibility[mpId];
          });

          return {
            folders: state.folders.filter((f) => f.id !== folderId),
            mpVisibility: newVisibility,
          };
        });
      },

      toggleFolderOpen: (folderId: string) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
          ),
        }));
      },

      toggleFolderVisibility: (folderId: string) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === folderId);
          if (!folder) return state;

          const newVisibility = !folder.isVisible;

          // Mettre à jour la visibilité de toutes les MP du dossier
          const newMPVisibility = { ...state.mpVisibility };
          folder.mpIds.forEach((mpId) => {
            newMPVisibility[mpId] = newVisibility;
          });

          return {
            folders: state.folders.map((f) =>
              f.id === folderId ? { ...f, isVisible: newVisibility } : f
            ),
            mpVisibility: newMPVisibility,
          };
        });
      },

      // === Actions sur les MP ===

      addMPToFolder: (mpId: string, folderId: string) => {
        set((state) => {
          // D'abord retirer la MP de tout autre dossier
          const updatedFolders = state.folders.map((f) => ({
            ...f,
            mpIds: f.mpIds.filter((id) => id !== mpId),
          }));

          // Puis l'ajouter au dossier cible
          return {
            folders: updatedFolders.map((f) =>
              f.id === folderId
                ? { ...f, mpIds: [...f.mpIds, mpId] }
                : f
            ),
            // Initialiser la visibilité si pas définie (hérite du dossier)
            mpVisibility: {
              ...state.mpVisibility,
              [mpId]: state.mpVisibility[mpId] ??
                (updatedFolders.find((f) => f.id === folderId)?.isVisible ?? true),
            },
          };
        });
      },

      removeMPFromFolder: (mpId: string) => {
        set((state) => ({
          folders: state.folders.map((f) => ({
            ...f,
            mpIds: f.mpIds.filter((id) => id !== mpId),
          })),
        }));
      },

      moveMPToFolder: (mpId: string, targetFolderId: string | null) => {
        // null = dossier par défaut
        const folderId = targetFolderId ?? get().getDefaultFolderId();
        get().addMPToFolder(mpId, folderId);
      },

      ensureMPInFolder: (mpId: string) => {
        const folder = get().getFolderForMP(mpId);
        if (!folder) {
          // Ajouter au dossier par défaut
          get().addMPToFolder(mpId, get().getDefaultFolderId());
        }
      },

      toggleMPVisibility: (mpId: string) => {
        set((state) => ({
          mpVisibility: {
            ...state.mpVisibility,
            [mpId]: !(state.mpVisibility[mpId] ?? true),
          },
        }));
      },

      setMPVisibility: (mpId: string, visible: boolean) => {
        set((state) => ({
          mpVisibility: {
            ...state.mpVisibility,
            [mpId]: visible,
          },
        }));
      },

      // === Getters ===

      getFolderForMP: (mpId: string) => {
        return get().folders.find((f) => f.mpIds.includes(mpId)) ?? null;
      },

      isMPVisible: (mpId: string) => {
        return get().mpVisibility[mpId] ?? true; // Visible par défaut
      },

      getMPsInFolder: (folderId: string) => {
        const folder = get().folders.find((f) => f.id === folderId);
        return folder?.mpIds ?? [];
      },
    }),
    {
      name: "mp-folders-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // S'assurer qu'il y a un dossier par défaut après hydratation
        state?.ensureDefaultFolder();
      },
    }
  )
);
