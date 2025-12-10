"use client";

import * as React from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MPAlert } from "@/types/mp-alerts";

export type AlertIconState = "no-alert" | "alert-active" | "alert-paused";

interface AlertIconProps {
  alert: MPAlert | null | undefined;
  className?: string;
}

export function getAlertState(alert: MPAlert | null | undefined): AlertIconState {
  if (!alert) return "no-alert";
  return alert.isActive ? "alert-active" : "alert-paused";
}

export function AlertIcon({ alert, className }: AlertIconProps) {
  const state = getAlertState(alert);

  const iconClasses = cn(
    "w-4 h-4 transition-transform duration-150",
    {
      "text-gray-400": state === "no-alert" || state === "alert-paused",
      "text-blue-500": state === "alert-active",
    },
    className
  );

  if (state === "alert-paused") {
    return <BellOff className={iconClasses} />;
  }

  return (
    <Bell
      className={iconClasses}
      fill={state === "alert-active" ? "currentColor" : "none"}
    />
  );
}
