import { create } from "zustand";
import type { TriggeredAlert } from "@/types/mp-alerts";

// ========================================
// Mock data - Alertes déclenchées fictives
// ========================================

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
const thisWeekStart = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

export const mockTriggeredAlerts: TriggeredAlert[] = [
  // Aujourd'hui - non lues
  {
    id: "triggered-1",
    alertId: "alert-far01",
    mpId: "1",
    mpCode: "FAR01",
    mpLabel: "Farine de blé T55",
    triggeredAt: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10h aujourd'hui
    trigger: {
      type: "variation",
      configuredThreshold: 5,
      actualVariation: 7.2,
      period: "week",
    },
    isRead: false,
  },
  {
    id: "triggered-2",
    alertId: "alert-hui02",
    mpId: "11",
    mpCode: "HUI02",
    mpLabel: "Huile de tournesol",
    triggeredAt: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8h aujourd'hui
    trigger: {
      type: "price_threshold",
      configuredThreshold: 850,
      actualPrice: 892,
      direction: "above",
      unit: "€/t",
    },
    isRead: false,
  },
  // Hier - lue
  {
    id: "triggered-3",
    alertId: "alert-beu03",
    mpId: "3",
    mpCode: "BEU03",
    mpLabel: "Beurre doux 82% MG",
    triggeredAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 14h hier
    trigger: {
      type: "variation",
      configuredThreshold: 3,
      actualVariation: -4.8,
      period: "week",
    },
    isRead: true,
    readAt: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000),
  },
  // Cette semaine
  {
    id: "triggered-4",
    alertId: "alert-sau05",
    mpId: "5",
    mpCode: "SAU05",
    mpLabel: "Saumon atlantique fumé",
    triggeredAt: thisWeekStart,
    trigger: {
      type: "variation",
      configuredThreshold: 4,
      actualVariation: -6.1,
      period: "month",
    },
    isRead: true,
    readAt: new Date(thisWeekStart.getTime() + 2 * 60 * 60 * 1000),
  },
  // Semaine dernière
  {
    id: "triggered-5",
    alertId: "alert-oeu12",
    mpId: "12",
    mpCode: "OEU12",
    mpLabel: "Œufs frais calibre M",
    triggeredAt: lastWeek,
    trigger: {
      type: "price_threshold",
      configuredThreshold: 0.22,
      actualPrice: 0.25,
      direction: "above",
      unit: "€/pièce",
    },
    isRead: true,
    readAt: new Date(lastWeek.getTime() + 4 * 60 * 60 * 1000),
  },
  {
    id: "triggered-6",
    alertId: "alert-cre11",
    mpId: "11",
    mpCode: "CRE11",
    mpLabel: "Crème fraîche épaisse 35%",
    triggeredAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
    trigger: {
      type: "variation",
      configuredThreshold: 5,
      actualVariation: 5.8,
      period: "month",
    },
    isRead: true,
    readAt: new Date(lastWeek.getTime() + 26 * 60 * 60 * 1000),
  },
  // Plus ancien
  {
    id: "triggered-7",
    alertId: "alert-pou10",
    mpId: "10",
    mpCode: "POU10",
    mpLabel: "Filet poulet surgelé",
    triggeredAt: twoWeeksAgo,
    trigger: {
      type: "price_threshold",
      configuredThreshold: 6.0,
      actualPrice: 6.5,
      direction: "above",
      unit: "€/kg",
    },
    isRead: true,
    readAt: new Date(twoWeeksAgo.getTime() + 3 * 60 * 60 * 1000),
  },
];

// ========================================
// Store Zustand
// ========================================

interface TriggeredAlertsState {
  alerts: TriggeredAlert[];

  // Computed
  unreadCount: () => number;

  // Actions
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  deleteAlert: (alertId: string) => void;
  addAlert: (alert: TriggeredAlert) => void;
}

export const useTriggeredAlertsStore = create<TriggeredAlertsState>((set, get) => ({
  alerts: mockTriggeredAlerts,

  unreadCount: () => {
    return get().alerts.filter((a) => !a.isRead).length;
  },

  markAsRead: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? { ...a, isRead: true, readAt: new Date() }
          : a
      ),
    }));
  },

  markAllAsRead: () => {
    const now = new Date();
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.isRead ? a : { ...a, isRead: true, readAt: now }
      ),
    }));
  },

  deleteAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  addAlert: (alert: TriggeredAlert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
    }));
  },
}));
