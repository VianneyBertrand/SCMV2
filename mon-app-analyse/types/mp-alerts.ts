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
