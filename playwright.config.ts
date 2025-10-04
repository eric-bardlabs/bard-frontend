import { defineConfig, devices } from "playwright/test";
import path from "path";
import { loadEnvConfig } from "@next/env";

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
  testDir: path.join(__dirname, "e2e"),
  retries: 2,
  outputDir: "test-results/",

  webServer: {
    command: "NODE_ENV=test npm run dev",
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },

  use: {
    baseURL,
    trace: "retry-with-trace",
  },

  globalSetup: require.resolve("./e2e/global.setup.ts"),
  globalTeardown: require.resolve("./e2e/global.teardown.ts"),

  projects: [
    {
      name: "setup - clean song table",
      testMatch: /clean-song-table.setup.ts/,
      teardown: "teardown - clean song table",
    },
    {
      name: "teardown - clean song table",
      testMatch: /clean-song-table.teardown.ts/,
    },
    {
      name: "Authenticated tests",
      testMatch: /.*.spec.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup - clean song table"],
    },
  ],
});
