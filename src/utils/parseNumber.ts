/** Parse a numeric string, accepting both '.' and ',' as decimal separators. */
export function parseNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}
