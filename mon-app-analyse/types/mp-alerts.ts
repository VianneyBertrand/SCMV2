// Type d'alerte
export type AlertType = "variation" | "price_threshold";

// Période pour les alertes de variation
export type AlertPeriod = "week" | "month";

// Direction pour les alertes de seuil
export type PriceDirection = "above" | "below";

// Configuration d'une alerte variation
export interface VariationAlertConfig {
  type: "variation";
  threshold: number; // ex: 5 (pour 5%)
  period: AlertPeriod;
}

// Configuration d'une alerte seuil de prix
export interface PriceThresholdAlertConfig {
  type: "price_threshold";
  priceThreshold: number; // ex: 350
  direction: PriceDirection;
  unit: string; // ex: "€/t"
}

// Union des configs
export type MPAlertConfig = VariationAlertConfig | PriceThresholdAlertConfig;

// Alerte complète avec métadonnées
export interface MPAlert {
  id: string;
  mpId: string;
  config: MPAlertConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// Types pour les alertes déclenchées
// ========================================

// Détail du déclenchement pour une alerte variation
export interface VariationTriggerDetail {
  type: "variation";
  configuredThreshold: number; // seuil configuré (ex: 5%)
  actualVariation: number; // variation réelle (ex: 7.2%)
  period: AlertPeriod;
}

// Détail du déclenchement pour une alerte seuil de prix
export interface PriceThresholdTriggerDetail {
  type: "price_threshold";
  configuredThreshold: number; // seuil configuré (ex: 850)
  actualPrice: number; // prix réel (ex: 892)
  direction: PriceDirection;
  unit: string;
}

// Union des détails de déclenchement
export type TriggerDetail = VariationTriggerDetail | PriceThresholdTriggerDetail;

// Alerte déclenchée (notification)
export interface TriggeredAlert {
  id: string;
  alertId: string; // référence à l'alerte config (MPAlert.id)
  mpId: string;
  mpCode: string;
  mpLabel: string;
  triggeredAt: Date;
  trigger: TriggerDetail;
  isRead: boolean;
  readAt?: Date;
}
