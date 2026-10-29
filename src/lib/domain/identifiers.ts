// DAFM herd numbers: one letter followed by seven digits, e.g. "G1234567".
export const HERD_NUMBER_PATTERN = /^[A-Z]\d{7}$/;

// Eircode: a routing key (letter + two digits, or D6W) then a four-character identifier.
const EIRCODE_PATTERN = /^(?:[ACDEFHKNPRTVWXY]\d{2}|D6W)[0-9ACDEFHKNPRTVWXY]{4}$/;

export function normaliseHerdNumber(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidHerdNumber(value: string): boolean {
  return HERD_NUMBER_PATTERN.test(normaliseHerdNumber(value));
}

export function normaliseEircode(value: string): string {
  const compact = value.toUpperCase().replace(/\s/g, "");
  return compact.length === 7 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
}

export function isValidEircode(value: string): boolean {
  return EIRCODE_PATTERN.test(value.toUpperCase().replace(/\s/g, ""));
}
