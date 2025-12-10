import type { MPAlert, MPAlertConfig, AlertPeriod, PriceDirection } from "@/types/mp-alerts";

/**
 * Génère un résumé textuel d'une configuration d'alerte
 */
export function formatAlertSummary(config: MPAlertConfig): string {
  if (config.type === "variation") {
    const periodLabel = config.period === "week" ? "semaine" : "mois";
    return `Si la variation dépasse ${config.threshold}% sur une ${periodLabel}`;
  } else {
    const directionLabel = config.direction === "above" ? "dépasse" : "passe sous";
    return `Si le prix ${directionLabel} ${config.priceThreshold} ${config.unit}`;
  }
}

/**
 * Génère un résumé court pour le tooltip
 */
export function formatAlertTooltip(alert: MPAlert): string {
  if (!alert.isActive) {
    return "Alerte en pause";
  }
  return `Alerte : ${formatAlertSummary(alert.config)}`;
}

/**
 * Génère un ID unique pour une alerte
 */
export function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une nouvelle alerte avec les valeurs par défaut
 */
export function createAlert(mpId: string, config: MPAlertConfig): MPAlert {
  const now = new Date();
  return {
    id: generateAlertId(),
    mpId,
    config,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Valide une configuration d'alerte
 */
export function validateAlertConfig(config: Partial<MPAlertConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.type) {
    errors.push("Le type d'alerte est requis");
    return { valid: false, errors };
  }

  if (config.type === "variation") {
    if (config.threshold === undefined || config.threshold <= 0) {
      errors.push("Le seuil de variation doit être supérieur à 0");
    }
    if (!config.period) {
      errors.push("La période est requise");
    }
  } else if (config.type === "price_threshold") {
    if (config.priceThreshold === undefined || config.priceThreshold <= 0) {
      errors.push("Le seuil de prix doit être supérieur à 0");
    }
    if (!config.direction) {
      errors.push("La direction est requise");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Labels pour les périodes
 */
export const periodLabels: Record<AlertPeriod, string> = {
  week: "Semaine",
  month: "Mois",
};

/**
 * Labels pour les directions
 */
export const directionLabels: Record<PriceDirection, string> = {
  above: "À la hausse",
  below: "À la baisse",
};
