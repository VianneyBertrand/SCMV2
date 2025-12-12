"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

export function AlertBell({ unreadCount, onClick, className }: AlertBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-full transition-colors",
        "hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={hasUnread ? `${unreadCount} alertes non lues` : "Alertes"}
    >
      <Bell
        className={cn(
          "h-5 w-5 transition-colors",
          hasUnread ? "text-primary" : "text-gray-500"
        )}
      />
      {hasUnread && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1 text-[11px] font-semibold",
            "bg-red-500 text-white rounded-full",
            "animate-in zoom-in-50 duration-200"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
