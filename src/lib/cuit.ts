// =====================================================================
// CUIT / CUIL helpers (Argentine tax ID).
//
// The DB enforces the same checksum via validate_cuit_format(), but
// validating client-side gives instant feedback in the form.
// =====================================================================

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Strips dashes/spaces and returns the digit-only string. */
export function normalizeCuit(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/**
 * Returns true if the input (after normalization) is exactly 11 digits
 * AND passes the AFIP checksum.
 */
export function isValidCuit(input: string): boolean {
  const cuit = normalizeCuit(input);
  if (cuit.length !== 11) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cuit[i]) * WEIGHTS[i];
  }
  const expected = (11 - (sum % 11)) % 11;
  if (expected === 10) return false;
  return expected === Number(cuit[10]);
}

/** Formats 11 digits as XX-XXXXXXXX-X for display. Returns input unchanged if not 11 digits. */
export function formatCuit(input: string): string {
  const cuit = normalizeCuit(input);
  if (cuit.length !== 11) return input;
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}
