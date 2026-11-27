// Job numbers, private codes and which product lives at which path.

/** Path segment for each product. A second product (the contact card) is one more line. */
export const PRODUCTS = ['rebuild'] as const;

export const isProduct = (value: string | undefined): boolean =>
  (PRODUCTS as readonly string[]).includes(value ?? '');

/** `rb-1001` becomes `RB-1001`; anything that is not a job number becomes null. */
export function parseNumber(raw: string | undefined): string | null {
  const number = (raw ?? '').toUpperCase();
  return /^[A-Z]{2}-\d{4,}$/.test(number) ? number : null;
}

/** The private code from the emailed link: 43 letters, digits, `-` or `_`. */
export const isCode = (value: string | null | undefined): value is string =>
  /^[A-Za-z0-9_-]{43}$/.test(value ?? '');
