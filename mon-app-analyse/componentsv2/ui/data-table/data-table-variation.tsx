import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Variation - Affichage d'une variation (pourcentage)
 *
 * Styles automatiques:
 * - Positif: text-green-600
 * - Négatif: text-red-600
 * - Neutre: text-muted-foreground
 *
 * @example
 * ```tsx
 * <Variation value={1.45} />   // → "+1.45%" en vert
 * <Variation value={-2.3} />   // → "-2.30%" en rouge
 * <Variation value={0} />      // → "+0.00%" en gris
 * ```
 */

interface VariationProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Valeur de la variation (ex: 1.45 pour +1.45%) */
  value: number
  /** Nombre de décimales (default: 2) */
  decimals?: number
}

function Variation({
  value,
  decimals = 2,
  className,
  ...props
}: VariationProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const formattedValue = `${isPositive ? "+" : ""}${value.toFixed(decimals)}%`

  return (
    <span
      data-slot="variation"
      className={cn(
        "text-sm leading-5",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {formattedValue}
    </span>
  )
}

export { Variation }
export type { VariationProps }
