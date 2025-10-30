import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un montant en euros avec le suffixe approprié (M€, k€, €)
 * @param amount - Montant en euros
 * @returns Montant formaté avec 2 décimales et le suffixe approprié
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)} M€`
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)} k€`
  } else {
    return `${amount.toFixed(2)} €`
  }
}

/**
 * Calcule la valorisation en euros basée sur un pourcentage et un total
 * @param percentage - Pourcentage (ex: "34.43%")
 * @param totalPA - Prix d'achat total (ex: "114.00 M€")
 * @returns Valorisation formatée ou null si les données sont invalides
 */
export function calculateValorisation(percentage: string, totalPA: string): string | null {
  // Extraire le pourcentage
  const percentValue = parseFloat(percentage.replace('%', '').replace(',', '.'))
  if (isNaN(percentValue)) return null

  // Extraire la valeur numérique et le multiplicateur du total PA
  const paMatch = totalPA.match(/([\d.,]+)\s*(M€|k€|€)?/)
  if (!paMatch) return null

  let paValue = parseFloat(paMatch[1].replace(/\s/g, '').replace(',', '.'))
  if (isNaN(paValue)) return null

  // Convertir en euros selon le suffixe
  const suffix = paMatch[2] || '€'
  if (suffix === 'M€') {
    paValue *= 1_000_000
  } else if (suffix === 'k€') {
    paValue *= 1_000
  }

  // Calculer la valorisation
  const valorisationValue = (percentValue / 100) * paValue

  // Formater avec le bon suffixe
  return formatCurrency(valorisationValue)
}
