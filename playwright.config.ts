import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173/Mrs.English/",
    viewport: { width: 844, height: 390 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
            (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
        },
      },
    },
    {
      // iPhone DPR=3 rendering in the headless software renderer is slower than desktop.
      name: "webkit",
      timeout: 120000,
      use: {
        ...devices["iPhone 13 landscape"],
        browserName: "webkit",
        viewport: { width: 844, height: 390 },
        screen: { width: 844, height: 390 },
      },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/Mrs.English/",
    reuseExistingServer: true,
  },
});
