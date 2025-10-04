import { test } from "playwright/test";

test.describe("create songs flow", () => {
  test("already signed in", async ({ page }) => {
    await page.goto("/songs");
    await page.waitForSelector("h1:has-text('All Songs')");

    await page.getByRole("button", { name: "Create New" }).click();
    await page.getByRole("menuitem", { name: "New Song" }).click();

    await page.getByLabel("Song Title").fill("Test Song");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Create Song" }).click();

    await page.waitForSelector("span:has-text('Songs without Album')");
    await page.getByText("Songs without Album").click();

    await page.waitForSelector("span:has-text('Test Song')");
  });
});
