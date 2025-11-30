import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * DataTableHeader - Wrapper flex pour aligner les éléments d'un header de colonne
 * 
 * Styles automatiques:
 * - Premier enfant (label): body-m-bold
 * - Gap entre éléments: gap-1.5
 * 
 * Usage:
 * <TableHead>
 *   <DataTableHeader>
 *     <span>Volume</span>
 *     <Badge variant="outline">Tonne</Badge>
 *     <IconButton variant="ghost-muted" size="xs"><Info /></IconButton>
 *   </DataTableHeader>
 * </TableHead>
 */
function DataTableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-header"
      className={cn(
        "flex items-center gap-1.5",
        // Premier enfant = label en body-m-bold
        "[&>*:first-child]:text-sm [&>*:first-child]:leading-5 [&>*:first-child]:font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { DataTableHeader }
