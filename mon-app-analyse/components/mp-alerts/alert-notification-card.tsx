"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TriggeredAlert } from "@/types/mp-alerts";
import { Button } from "@/components/ui/button";

interface AlertNotificationCardProps {
  alert: TriggeredAlert;
  onMarkAsRead?: (id: string) => void;
  onViewCourse?: (mpCode: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) {
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return dayNames[date.getDay()] + " " + date.getDate();
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTriggerSummary(alert: TriggeredAlert): {
  title: string;
  subtitle: string;
  isNegative: boolean;
} {
  const { trigger } = alert;

  if (trigger.type === "variation") {
    const periodLabel = trigger.period === "week" ? "la semaine" : "le mois";
    const sign = trigger.actualVariation >= 0 ? "+" : "";
    const isNegative = trigger.actualVariation < 0;

    return {
      title: `Variation ${sign}${trigger.actualVariation.toFixed(1)}% sur ${periodLabel}`,
      subtitle: `Seuil configuré : ${trigger.configuredThreshold}%`,
      isNegative,
    };
  } else {
    const directionLabel =
      trigger.direction === "above" ? "atteint" : "passé sous";
    const isNegative = trigger.direction === "below";

    return {
      title: `Prix ${directionLabel} ${trigger.actualPrice.toLocaleString("fr-FR")} ${trigger.unit}`,
      subtitle: `Seuil : ${trigger.configuredThreshold.toLocaleString("fr-FR")} ${trigger.unit}`,
      isNegative,
    };
  }
}

export function AlertNotificationCard({
  alert,
  onMarkAsRead,
  onViewCourse,
}: AlertNotificationCardProps) {
  const { title, subtitle, isNegative } = formatTriggerSummary(alert);
  const timeAgo = formatRelativeTime(alert.triggeredAt);

  const handleClick = () => {
    if (!alert.isRead && onMarkAsRead) {
      onMarkAsRead(alert.id);
    }
  };

  const handleViewCourse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewCourse) {
      onViewCourse(alert.mpCode);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative p-4 rounded-lg border transition-all cursor-pointer",
        "hover:bg-gray-50 hover:border-gray-300",
        alert.isRead
          ? "bg-white border-gray-200"
          : "bg-blue-50/50 border-blue-200"
      )}
    >
      {/* Indicateur non lu */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 w-2 h-2 rounded-full shrink-0",
            alert.isRead ? "bg-gray-300" : "bg-blue-500"
          )}
        />

        <div className="flex-1 min-w-0">
          {/* Header: MP name + time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={cn(
                "font-semibold text-sm truncate",
                alert.isRead ? "text-gray-700" : "text-gray-900"
              )}
            >
              {alert.mpCode} - {alert.mpLabel}
            </span>
            <span className="text-xs text-gray-500 shrink-0">{timeAgo}</span>
          </div>

          {/* Trigger info */}
          <div className="flex items-center gap-2 mb-1">
            {alert.trigger.type === "variation" ? (
              isNegative ? (
                <TrendingDown className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-600 shrink-0" />
              )
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                alert.isRead ? "text-gray-600" : "text-gray-800"
              )}
            >
              {title}
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-gray-500 mb-3">{subtitle}</p>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewCourse}
            className="h-7 text-xs gap-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            Voir le cours
          </Button>
        </div>
      </div>
    </div>
  );
}
