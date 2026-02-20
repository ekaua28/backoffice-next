import { test, expect } from "@playwright/test";
import { resetApi } from "./_helpers";

test.beforeEach(async () => {
  await resetApi();
});

test("signup -> dashboard, shows Hello <first_name>, session persists, logout returns to signin", async ({
  page,
}) => {
  await page.goto("/auth/signup");

  await page.getByLabel("First name").fill("Alice");
  await page.getByLabel("Last name").fill("Admin");
  await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
  await page.getByRole("textbox", { name: /^Repeat password$/ }).fill("123456");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/Hello Alice/i)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/auth\/signin$/);
});

test("signup password validation works", async ({ page }) => {
  await page.goto("/auth/signup");

  await expect(page.getByText(/Passwords do not match/i)).toBeHidden();
  await page.getByLabel("First name").fill("Alice");
  await page.getByLabel("Last name").fill("Admin");
  await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
  await page.getByRole("textbox", { name: /^Repeat password$/ }).fill("123");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/auth\/signup$/);
  await expect(page.getByText(/Passwords do not match/i)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Passwords do not match/i)).toBeHidden();
  await expect(page).toHaveURL(/\/auth\/signup$/);
});

test("signin works (session id returned), routes require session", async ({
  page,
}) => {
  await page.goto("/auth/signup");

  await page.getByLabel("First name").fill("Bob");
  await page.getByLabel("Last name").fill("Boss");
  await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
  await page.getByRole("textbox", { name: /^Repeat password$/ }).fill("123456");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/auth\/signin$/);

  await page.getByLabel("First name").fill("Bob");
  await page.getByLabel("Last name").fill("Boss");
  await page.getByRole("textbox", { name: /^Password$/ }).fill("123456");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.evaluate(() => localStorage.removeItem("sessionId"));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signup$/);
});
