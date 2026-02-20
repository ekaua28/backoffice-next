import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3000;
const API_PORT = 4000;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter api dev",
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        ENABLE_TEST_ROUTES : "true",
        PORT: String(API_PORT),
        DB_PATH: "./.data/e2e.sqlite",
      },
    },
    {
      command: "pnpm --filter web dev",
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
