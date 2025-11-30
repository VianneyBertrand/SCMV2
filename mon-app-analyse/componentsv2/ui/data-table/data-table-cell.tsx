import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * DataTableCell - Wrapper flex-col pour empiler 2 lignes dans une cellule
 * 
 * Styles automatiques:
 * - Tous les enfants: body-m (text-sm leading-5)
 * - Gap entre lignes: gap-0.5
 * 
 * Usage:
 * <TableCell>
 *   <DataTableCell>
 *     <span>284.6t</span>
 *     <span className="text-green-600">+1.45%</span>
 *   </DataTableCell>
 * </TableCell>
 * 
 * Avec bold sur la première ligne:
 * <TableCell>
 *   <DataTableCell bold>
 *     <span>FROMAGES</span>
 *     <div className="flex gap-2">
 *       <a href="#">11 GF</a>
 *     </div>
 *   </DataTableCell>
 * </TableCell>
 */
interface DataTableCellProps extends React.ComponentProps<"div"> {
  /** Applique font-semibold sur le premier enfant */
  bold?: boolean
}

function DataTableCell({
  className,
  bold = false,
  children,
  ...props
}: DataTableCellProps) {
  return (
    <div
      data-slot="data-table-cell"
      className={cn(
        "flex flex-col gap-0.5",
        // Tous les enfants = body-m
        "[&>*]:text-sm [&>*]:leading-5",
        // Premier enfant bold si prop bold
        bold && "[&>*:first-child]:font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { DataTableCell }
