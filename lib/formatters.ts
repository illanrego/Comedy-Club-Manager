/**
 * Shared formatting utilities for the application
 */

/**
 * Formats a number as Brazilian Real currency
 * @param value - The numeric value to format
 * @returns Formatted string like "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/**
 * Parses a Brazilian currency string back to a number
 * @param value - The currency string to parse
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Formats a number as percentage
 * @param value - The decimal value (e.g., 0.25 for 25%)
 * @param decimals - Number of decimal places (default 0)
 * @returns Formatted string like "25%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Formats a number with thousand separators (Brazilian format)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default 0)
 * @returns Formatted string with dots as thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value
    .toFixed(decimals)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatComicClass(comicClass: string | null | undefined): string {
  switch (comicClass) {
    case 'A':
      return 'Headliner'
    case 'B':
      return 'Elenco'
    case 'C':
      return 'Open'
    case 'S':
      return 'Classe S'
    default:
      return 'Sem Classe'
  }
}
