import { describe, expect, it } from "vitest";
import { canTransition, checklistProgress, allowedTransitions } from "@/lib/domain/application";
import { isValidEircode, isValidHerdNumber, normaliseEircode, normaliseHerdNumber } from "@/lib/domain/identifiers";
import { deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { parseDateOnly, todayDateOnly } from "@/lib/domain/dates";

describe("herd numbers", () => {
  it("normalises spacing and case", () => {
    expect(normaliseHerdNumber(" g123 4567 ")).toBe("G1234567");
  });

  it.each(["G1234567", "m 7654321"])("accepts %s", (v) => expect(isValidHerdNumber(v)).toBe(true));
  it.each(["1234567", "GG123456", "G123456", "G12345678"])("rejects %s", (v) => expect(isValidHerdNumber(v)).toBe(false));
});

describe("eircodes", () => {
  it.each(["H91 E2K3", "f12x7y8", "D6W1234"])("accepts %s", (v) => expect(isValidEircode(v)).toBe(true));
  it.each(["B12 3456", "H91 E2K", "ZZZ ZZZZ"])("rejects %s", (v) => expect(isValidEircode(v)).toBe(false));

  it("formats with a space after the routing key", () => {
    expect(normaliseEircode("h91e2k3")).toBe("H91 E2K3");
  });
});

describe("application workflow", () => {
  it("allows forward progress and corrections", () => {
    expect(canTransition("DRAFT", "GATHERING_DOCS")).toBe(true);
    expect(canTransition("SUBMITTED", "APPROVED")).toBe(true);
    expect(canTransition("SUBMITTED", "READY")).toBe(true);
  });

  it("blocks skipping steps", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(false);
    expect(canTransition("REJECTED", "PAID_OUT")).toBe(false);
  });

  it("only offers payout after approval", () => {
    expect(allowedTransitions("APPROVED")).toContain("PAID_OUT");
    expect(allowedTransitions("SUBMITTED")).not.toContain("PAID_OUT");
  });
});

describe("checklistProgress", () => {
  it("ignores documents marked not required", () => {
    expect(
      checklistProgress([{ status: "RECEIVED" }, { status: "MISSING" }, { status: "NOT_REQUIRED" }]),
    ).toEqual({ required: 2, received: 1, percent: 50, complete: false });
  });

  it("treats an empty checklist as complete", () => {
    expect(checklistProgress([]).complete).toBe(true);
  });
});

describe("deadlines", () => {
  const today = parseDateOnly("2026-10-29")!;

  it.each([
    ["2026-10-28", "overdue"],
    ["2026-10-29", "urgent"],
    ["2026-11-05", "urgent"],
    ["2026-11-20", "soon"],
    ["2027-01-15", "later"],
  ])("%s is %s", (iso, urgency) => {
    expect(deadlineUrgency(parseDateOnly(iso)!, today)).toBe(urgency);
  });

  it("describes relative days", () => {
    expect(describeDaysUntil(0)).toBe("Today");
    expect(describeDaysUntil(5)).toBe("In 5 days");
    expect(describeDaysUntil(-3)).toBe("3 days ago");
  });
});

describe("dates", () => {
  it("uses the Irish calendar date, not UTC", () => {
    // 23:30 UTC on 31 May is already 1 June in Irish summer time.
    expect(todayDateOnly(new Date("2026-05-31T23:30:00Z")).toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("rejects impossible dates", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
  });
});
