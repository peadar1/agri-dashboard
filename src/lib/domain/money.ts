const euroFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export function formatEuro(cents: number): string {
  return euroFormatter.format(cents / 100);
}

// Parses user-entered amounts like "1,250.50" or "€80" without going through floats.
export function parseEuroToCents(input: string): number | null {
  const cleaned = input.replace(/[€,\s]/g, "");
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const [, sign, whole, fraction = ""] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -cents : cents;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function vatCents(netCents: number, rateBps: number): number {
  return Math.round((netCents * rateBps) / 10_000);
}

export function formatVatRate(rateBps: number): string {
  return `${rateBps / 100}%`;
}
