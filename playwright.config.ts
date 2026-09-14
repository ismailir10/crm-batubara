import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the dev server on port 3000, reusing an already
 * running one so a developer with `npm run dev` open does not get a second.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "id-ID",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/masuk",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
