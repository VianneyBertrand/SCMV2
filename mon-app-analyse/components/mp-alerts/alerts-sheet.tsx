// @ts-nocheck
"use client";

import * as React from "react";
import { ArrowLeft, CheckCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertNotificationCard } from "./alert-notification-card";
import type { TriggeredAlert } from "@/types/mp-alerts";
import { cn } from "@/lib/utils";

interface AlertsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: TriggeredAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

// Grouper les alertes par période
function groupAlertsByPeriod(alerts: TriggeredAlert[]): {
  today: TriggeredAlert[];
  yesterday: TriggeredAlert[];
  thisWeek: TriggeredAlert[];
  older: TriggeredAlert[];
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    today: [] as TriggeredAlert[],
    yesterday: [] as TriggeredAlert[],
    thisWeek: [] as TriggeredAlert[],
    older: [] as TriggeredAlert[],
  };

  // Trier par date décroissante
  const sorted = [...alerts].sort(
    (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()
  );

  for (const alert of sorted) {
    const alertDate = new Date(alert.triggeredAt);
    const alertDay = new Date(
      alertDate.getFullYear(),
      alertDate.getMonth(),
      alertDate.getDate()
    );

    if (alertDay.getTime() >= today.getTime()) {
      groups.today.push(alert);
    } else if (alertDay.getTime() >= yesterday.getTime()) {
      groups.yesterday.push(alert);
    } else if (alertDay.getTime() >= weekStart.getTime()) {
      groups.thisWeek.push(alert);
    } else {
      groups.older.push(alert);
    }
  }

  return groups;
}

function AlertGroup({
  title,
  alerts,
  onMarkAsRead,
}: {
  title: string;
  alerts: TriggeredAlert[];
  onMarkAsRead: (id: string) => void;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertNotificationCard
            key={alert.id}
            alert={alert}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
}

export function AlertsSheet({
  open,
  onOpenChange,
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
}: AlertsSheetProps) {
  const groups = groupAlertsByPeriod(alerts);
  const hasUnread = alerts.some((a) => !a.isRead);
  const isEmpty = alerts.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        hideCloseButton
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <SheetTitle className="text-lg font-semibold">Alertes</SheetTitle>
            </div>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-primary hover:text-primary/80 gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                Tout lire
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CheckCheck className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">
                Aucune alerte
              </p>
              <p className="text-sm text-gray-500">
                Vos alertes déclenchées apparaîtront ici
              </p>
            </div>
          ) : (
            <>
              <AlertGroup
                title="Aujourd'hui"
                alerts={groups.today}
                onMarkAsRead={onMarkAsRead}
              />
              <AlertGroup
                title="Hier"
                alerts={groups.yesterday}
                onMarkAsRead={onMarkAsRead}
              />
              <AlertGroup
                title="Cette semaine"
                alerts={groups.thisWeek}
                onMarkAsRead={onMarkAsRead}
              />
              <AlertGroup
                title="Plus ancien"
                alerts={groups.older}
                onMarkAsRead={onMarkAsRead}
              />
            </>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
