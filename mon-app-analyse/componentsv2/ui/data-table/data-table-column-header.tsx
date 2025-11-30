"use client"

import * as React from "react"
import { Column } from "@tanstack/react-table"
import { ChevronUp, ChevronDown, ChevronsUpDown, Info, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconButton } from "@/components/ui/icon-button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataTableHeader } from "./data-table-header"

/**
 * DataTableColumnHeader - Header de colonne avec tri intégré
 *
 * Combine DataTableHeader avec les fonctionnalités TanStack Table :
 * - Icône de tri (asc/desc/none)
 * - Badge toggle unité (optionnel)
 * - Tooltip info (optionnel)
 */

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  tooltip?: string
  unitToggle?: {
    label: string
    onClick: () => void
  }
  sortable?: boolean
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  tooltip,
  unitToggle,
  sortable = true,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = sortable && column.getCanSort()

  // Sort icon based on current state
  const SortIcon = () => {
    if (!canSort) return null
    const sorted = column.getIsSorted()
    if (sorted === "asc") {
      return <ChevronUp className="size-4" />
    }
    if (sorted === "desc") {
      return <ChevronDown className="size-4" />
    }
    return <ChevronsUpDown className="size-4 text-muted-foreground" />
  }

  // Handle sort click - simple toggle
  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canSort) return
    
    // TanStack's toggleSorting handles the cycle automatically
    // false = asc first, true = desc first
    // If already sorted, it will toggle direction
    // Third click clears (if enableMultiSort is false)
    column.toggleSorting()
  }

  return (
    <DataTableHeader className={className}>
      {/* Title */}
      <span>{title}</span>

      {/* Unit toggle badge (optional) */}
      {unitToggle && (
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation()
            unitToggle.onClick()
          }}
        >
          <RefreshCw className="size-3" />
          {unitToggle.label}
        </Badge>
      )}

      {/* Tooltip info (optional) */}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              variant="ghost-muted"
              size="xs"
              aria-label={`Info: ${title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="size-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}

      {/* Sort button */}
      {canSort && (
        <IconButton
          variant="ghost-muted"
          size="xs"
          aria-label={`Trier par ${title}`}
          onClick={handleSortClick}
        >
          <SortIcon />
        </IconButton>
      )}
    </DataTableHeader>
  )
}

export { DataTableColumnHeader }
export type { DataTableColumnHeaderProps }
