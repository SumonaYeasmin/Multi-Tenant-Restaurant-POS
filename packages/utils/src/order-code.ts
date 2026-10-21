/**
 * Generates or formats human-readable POS order reference code.
 * Example: ORD-20261021-0042
 */
export function formatOrderNumber(
  prefix: string = "ORD",
  sequence: number,
  padLength: number = 4
): string {
  const padded = String(sequence).padStart(padLength, "0");
  return `${prefix}-${padded}`;
}
