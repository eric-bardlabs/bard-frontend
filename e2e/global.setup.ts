import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { FullConfig, chromium } from "playwright/test";
import path from "path";
import { db } from "../db/dbClient";
import { user } from "../db/schema";
import { userJSON } from "./fixtures/fixtures";

async function globalSetup(config: FullConfig) {
  await dbSetup();
  await clerkSignIn(config);
}

async function dbSetup() {
  await db.delete(user);
  await db.insert(user).values(userJSON);
}

async function clerkSignIn(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  await clerkSetup();
  if (
    !process.env.E2E_CLERK_USER_USERNAME ||
    !process.env.E2E_CLERK_USER_PASSWORD
  ) {
    throw new Error(
      "Please provide E2E_CLERK_USER_USERNAME and E2E_CLERK_USER_PASSWORD environment variables."
    );
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL!);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier:
        process.env.E2E_CLERK_USER_USERNAME ||
        process.env.E2E_CLERK_USER_EMAIL!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
  await page.goto(baseURL!);
  await page.waitForSelector("h1:has-text('Welcome,')");

  const authFile = path.join(__dirname, "../playwright/.clerk/user.json");

  await page.context().storageState({ path: authFile });
}

export default globalSetup;
