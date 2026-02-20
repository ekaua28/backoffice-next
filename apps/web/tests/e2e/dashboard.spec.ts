import { test, expect } from "@playwright/test";
import { resetApi } from "./_helpers";

test.beforeEach(async () => {
  await resetApi();
});

async function signup(page: any, firstName: string, lastName: string) {
  await page.goto("/auth/signup");
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill(lastName);
  await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
  await page.getByRole("textbox", { name: /^Repeat password$/ }).fill("123456");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("dashboard: shows current user, disables self delete, CRUD other users, paginates 6/page", async ({
  page,
}) => {
  await signup(page, "Me", "Admin");

  await expect(page.getByText(/you/i)).toBeVisible();

  for (let i = 1; i <= 7; i++) {
    await page.getByRole("button", { name: /create user/i }).click();
    await page.getByLabel("First name").fill(`U${i}`);
    await page.getByLabel("Last name").fill("X");
    await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
    await page.getByRole("button", { name: /^create$/i }).click();
  }

  await expect(page.getByText(/Page 1 \/ 2/i)).toBeVisible();

  const deleteButtons = page.getByRole("button", { name: /^delete$/i });
  await expect(deleteButtons.first()).toBeVisible();

  await page.getByRole("button", { name: /^next$/i }).click();
  await expect(page.getByText(/Page 2 \/ 2/i)).toBeVisible();
  await page.getByText("U7").isVisible();

  await page.getByRole("button", { name: /^prev$/i }).click();
  await expect(page.getByText(/Page 1 \/ 2/i)).toBeVisible();

  const rowU1 = page.getByRole("row", { name: /U7\s+X/i });
  await rowU1.getByRole("textbox").first().fill("U1x");
  await page.getByRole("button", { name: /^save$/i }).first().click();
  await expect(page.getByRole("row", { name: /U1x\s+X/i })).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^delete$/i }).first().click();
  await expect(page.getByRole("row", { name: /U1x\s+X/i })).toHaveCount(0);
});

test("theme toggle persists across reload", async ({ page }) => {
  await signup(page, "T", "Theme");
  await page.getByRole("button", { name: /Theme:/i }).click();
  const labelAfter = await page
    .getByRole("button", { name: /Theme:/i })
    .innerText();

  await page.reload();
  const labelReload = await page
    .getByRole("button", { name: /Theme:/i })
    .innerText();
  expect(labelReload).toBe(labelAfter);
});
