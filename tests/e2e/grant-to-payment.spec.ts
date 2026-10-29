import { expect, test } from "@playwright/test";

// Walks the core workflow end to end: new client → grant application →
// document checklist → submission → invoice → part payment → paid → PDF.
test("a new client's grant can be applied for, invoiced and paid", async ({ page }) => {
  const herd = `E${String(Date.now()).slice(-7)}`;
  const lastName = `Playwright${herd.slice(-4)}`;

  await page.goto("/clients/new");
  await page.getByLabel("First name").fill("Eoin");
  await page.getByLabel("Last name").fill(lastName);
  await page.locator('select[name="enterpriseType"]').selectOption("SHEEP");
  await page.locator('select[name="county"]').selectOption("MAYO");
  await page.getByLabel("Total hectares").fill("42");

  // Invalid herd number is rejected and the rest of the form is kept.
  await page.getByLabel("Herd number").fill("12345");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("Herd numbers are one letter followed by seven digits")).toBeVisible();
  await expect(page.getByLabel("Last name")).toHaveValue(lastName);

  await page.getByLabel("Herd number").fill(herd.toLowerCase());
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByRole("heading", { name: `Eoin ${lastName}` })).toBeVisible();
  await expect(page.getByText(herd, { exact: true })).toBeVisible();

  // Start an ACRES application from the client page.
  await page.getByRole("link", { name: "New application" }).first().click();
  await page.locator('select[name="schemeId"]').selectOption({ label: "ACRES (ACRES)" });
  await expect(page.locator('input[name="deadline"]')).not.toHaveValue("");
  await page.getByRole("button", { name: "Create application" }).click();
  await expect(page.getByRole("heading", { name: /^ACRES \d{4}$/ })).toBeVisible();
  await expect(page.getByText("0 of 5 received")).toBeVisible();

  const markReceived = page.getByRole("button", { name: "Mark received" });
  for (let remaining = 5; remaining > 0; remaining--) {
    await markReceived.first().click();
    await expect(markReceived).toHaveCount(remaining - 1);
  }
  await expect(page.getByText("5 of 5 received")).toBeVisible();

  await page.getByRole("button", { name: "Move to ready to submit" }).click();
  await page.getByRole("button", { name: "Move to submitted" }).click();
  await expect(page.getByText("Marked as submitted.")).toBeVisible();

  // Invoice it: the scheme's default fee is pre-filled.
  await page.getByRole("link", { name: "Create invoice" }).click();
  await expect(page.getByLabel("Line 1 price")).toHaveValue("450.00");
  await expect(page.getByText("€553.50")).toBeVisible();
  await page.getByRole("button", { name: "Save & issue" }).click();
  await expect(page.getByRole("heading", { name: /INV-\d{4}-\d{4}/ })).toBeVisible();
  await expect(page.getByText("Issued", { exact: true })).toBeVisible();

  await page.getByLabel("Amount (€)").fill("200");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Part paid", { exact: true })).toBeVisible();
  await expect(page.getByText("€353.50").first()).toBeVisible();

  // The amount defaults to the remaining balance.
  await expect(page.getByLabel("Amount (€)")).toHaveValue("353.50");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record payment" })).toHaveCount(0);

  const pdfHref = await page.getByRole("link", { name: "PDF" }).getAttribute("href");
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
});

test("dashboard and client search load seeded data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Outstanding").first()).toBeVisible();
  await expect(page.getByText("Upcoming deadlines", { exact: true })).toBeVisible();

  await page.goto("/clients");
  await page.getByLabel("Search clients").fill("zzzz-no-such-farm");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByText("No clients match those filters")).toBeVisible();
});
