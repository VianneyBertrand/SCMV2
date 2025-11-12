import { useEffect, useRef } from 'react';

/**
 * Hook pour persister l'état d'une page dans sessionStorage
 * L'état est automatiquement sauvegardé et restauré lors de la navigation
 *
 * @param pageKey - Clé unique pour identifier la page (ex: 'analyse-valeur')
 * @param state - L'état actuel à sauvegarder
 * @param initialState - L'état initial à utiliser si aucun état n'est sauvegardé
 * @returns L'état restauré ou l'état initial
 */
export function usePageState<T>(
  pageKey: string,
  state: T,
  initialState: T
): T {
  const storageKey = `page-state-${pageKey}`;
  const isFirstRender = useRef(true);
  const restoredState = useRef<T | null>(null);

  // Restaurer l'état au premier rendu
  if (isFirstRender.current) {
    if (typeof window !== 'undefined') {
      try {
        const savedState = sessionStorage.getItem(storageKey);
        if (savedState) {
          restoredState.current = JSON.parse(savedState);
        }
      } catch (error) {
        console.error(`Erreur lors de la restauration de l'état de ${pageKey}:`, error);
      }
    }
    isFirstRender.current = false;
  }

  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde de l'état de ${pageKey}:`, error);
      }
    }
  }, [state, storageKey, pageKey]);

  // Retourner l'état restauré au premier rendu, sinon l'état initial
  return restoredState.current ?? initialState;
}

/**
 * Hook pour obtenir l'état sauvegardé d'une page
 * Utile pour initialiser l'état avec les valeurs sauvegardées
 *
 * @param pageKey - Clé unique pour identifier la page
 * @returns L'état sauvegardé ou null
 */
export function useRestoredPageState<T>(pageKey: string): T | null {
  const storageKey = `page-state-${pageKey}`;

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture de l'état de ${pageKey}:`, error);
  }

  return null;
}

/**
 * Hook pour effacer l'état sauvegardé d'une page
 *
 * @param pageKey - Clé unique pour identifier la page
 */
export function useClearPageState(pageKey: string): () => void {
  const storageKey = `page-state-${pageKey}`;

  return () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'état de ${pageKey}:`, error);
      }
    }
  };
}
