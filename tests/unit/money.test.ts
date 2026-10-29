import { describe, expect, it } from "vitest";
import { centsToInput, formatEuro, parseEuroToCents, vatCents } from "@/lib/domain/money";

describe("parseEuroToCents", () => {
  it.each([
    ["80", 8000],
    ["80.5", 8050],
    ["1,250.75", 125075],
    ["€ 1.05", 105],
    ["0.07", 7],
  ])("parses %s", (input, expected) => {
    expect(parseEuroToCents(input)).toBe(expected);
  });

  it("avoids floating point drift", () => {
    expect(parseEuroToCents("1.005")).toBeNull();
    expect(parseEuroToCents("19.99")).toBe(1999);
  });

  it.each(["", "abc", "12.345", "1.2.3"])("rejects %j", (input) => {
    expect(parseEuroToCents(input)).toBeNull();
  });
});

describe("vatCents", () => {
  it("applies 23% VAT and rounds to the nearest cent", () => {
    expect(vatCents(10_000, 2300)).toBe(2300);
    expect(vatCents(333, 2300)).toBe(77);
  });

  it("handles 13.5% (bps precision)", () => {
    expect(vatCents(10_000, 1350)).toBe(1350);
  });
});

describe("formatting", () => {
  it("formats euro amounts", () => {
    expect(formatEuro(125075)).toBe("€1,250.75");
  });

  it("round-trips through form input", () => {
    expect(parseEuroToCents(centsToInput(4550))).toBe(4550);
  });
});
