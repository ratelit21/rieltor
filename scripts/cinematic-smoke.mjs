import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const origin = "http://127.0.0.1:4173/rieltor";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const paths = ["/", "/kvartiry/", "/kvartiry/pervyy-svet/", "/podbor/"];
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of paths) {
      const response = await page.goto(origin + path, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `${width} ${path} returned ${response?.status()}`);
      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        h1: document.querySelector("h1")?.textContent?.trim(),
      }));
      assert.ok(layout.document <= layout.viewport + 4,
        `${width} ${path} horizontal overflow: ${JSON.stringify(layout)}`);
      console.log("PASS", width, path, JSON.stringify(layout));
      if (path === "/") {
        assert.equal(await page.locator("[data-story-beat]").count(), 3);
        const hero = await page.locator(".archive-hero__image img").evaluate((img) => img.complete && img.naturalWidth > 0);
        assert.ok(hero, "Hero image not loaded");
      }
      if (path === "/kvartiry/") {
        await page.getByRole("button", { name: "1 комната", exact: true }).click();
        const count = await page.locator("[data-listing]").count();
        assert.equal(count, 1, "Rooms filter failed");
        await page.getByRole("button", { name: "Все", exact: true }).click();
        assert.equal(await page.locator("[data-listing]").count(), 6);
      }
      if (path === "/podbor/") {
        await page.locator('input[name="name"]').fill("Проверка");
        await page.locator('input[name="contact"]').fill("@test_account");
        await page.getByRole("button", { name: "Проверить запрос" }).click();
        await page.getByText("Демо-форма заполнена.", { exact: false }).waitFor();
      }
    }
    assert.deepEqual(errors, [], `JS exceptions on ${width}px`);
    await page.close();
  }
  // Motion-enabled pass: assert the new desktop scene actually changes as we scroll.
  const motionPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const motionErrors = [];
  motionPage.on("pageerror", (error) => motionErrors.push(error.message));
  await motionPage.goto(origin + "/", { waitUntil: "networkidle" });
  await motionPage.waitForTimeout(350);
  const second = motionPage.locator("[data-story-beat]").nth(1);
  const y = await second.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await motionPage.evaluate((target) => window.scrollTo({ top: target - 310, behavior: "instant" }), y);
  await motionPage.waitForTimeout(1400);
  const chapter = await motionPage.locator(".archive-story").getAttribute("data-chapter");
  const drawingOpacity = await motionPage.locator("[data-story-plan]").evaluate((el) => getComputedStyle(el).opacity);
  console.log("MOTION SCENE", JSON.stringify({ chapter, drawingOpacity }));
  assert.equal(chapter, "2", "Scroll scene did not advance to second chapter");
  assert.ok(Number(drawingOpacity) > 0.8, "Floorplan reveal did not occur");
  assert.deepEqual(motionErrors, [], "Motion-enabled page exceptions");
  await motionPage.close();
} finally {
  await browser.close();
}
console.log("BROWSER SMOKE PASSED");
