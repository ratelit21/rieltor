import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const origin = "http://127.0.0.1:4173/rieltor";
const widths = [390, 768, 1440];
const paths = ["/", "/kvartiry/", "/kvartiry/pervyy-svet/", "/podbor/"];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));

    for (const path of paths) {
      const response = await page.goto(origin + path, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `HTTP ${response?.status()} ${path}`);
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        title: document.querySelector("h1")?.textContent?.trim(),
      }));
      assert.ok(layout.scrollWidth <= width + 3, `${width}px horizontal overflow in ${path}: ${JSON.stringify(layout)}`);
      if (path === "/") {
        assert.equal(await page.locator("[data-story-beat]").count(), 3);
        const colors = await page.evaluate(() => ({
          intro: getComputedStyle(document.querySelector(".archive-intro")).backgroundImage,
          story: getComputedStyle(document.querySelector(".archive-story")).backgroundColor,
          callout: getComputedStyle(document.querySelector(".archive-callout")).backgroundImage,
        }));
        assert.notEqual(colors.story, "rgb(19, 36, 28)", "Story should contrast with the forest canvas");
        console.log("MATERIALS", width, JSON.stringify(colors));
      }
      if (path === "/kvartiry/") {
        assert.equal(await page.locator(".listing-image span").count(), 0, "Obsolete plan badge remains");
        assert.equal(await page.locator(".listing-copy__action-label").count(), 6);
        if (width === 1440) {
          const centers = await page.locator(".listing-copy a").first().evaluate(el => {
            const [label, arrow] = [el.querySelector(".listing-copy__action-label"),el.querySelector(".listing-copy__arrow")];
            const a = label.getBoundingClientRect(), b = arrow.getBoundingClientRect();
            return { label: a.top + a.height/2, arrow: b.top+b.height/2 };
          });
          assert.ok(Math.abs(centers.label - centers.arrow) < 4, "Listing arrow is not vertically aligned: " + JSON.stringify(centers));
          console.log("ARROW CENTERS", JSON.stringify(centers));
        }
        await page.getByRole("button", { name: "1 комната", exact: true }).click();
        assert.equal(await page.locator("[data-listing]").count(), 1, "Catalogue room filter failed");
        await page.getByRole("button", { name: "Все", exact: true }).click();
        assert.equal(await page.locator("[data-listing]").count(), 6, "Catalogue reset failed");
      }
      if (path === "/podbor/") {
        await page.locator('input[name="name"]').fill("Тест");
        await page.locator('input[name="contact"]').fill("@test_account");
        await page.getByRole("button", { name: "Проверить запрос" }).click();
        await page.getByText("Демо-форма заполнена.", { exact: false }).waitFor();
      }
      console.log("PASS", width, path);
    }
    assert.deepEqual(errors, [], `Page JS errors at ${width}px`);
    await page.close();
  }

  // A rapid page jump should show the plan right away, without waiting a second
  // for overlapping entrance/exit tweens.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(origin + "/", { waitUntil: "networkidle" });
  const beat = page.locator("[data-story-beat]").nth(1);
  const y = await beat.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(target => window.scrollTo({top:target-310,behavior:"instant"}), y);
  await page.waitForFunction(() => document.querySelector(".archive-story")?.getAttribute("data-chapter") === "2", {timeout:800});
  const visible = await page.locator("[data-story-plan]").evaluate(el => {
    const image = el.querySelector("img");
    return { opacity:getComputedStyle(el).opacity, visibility:getComputedStyle(el).visibility,
      imageLoaded:image.complete && image.naturalWidth>0 };
  });
  assert.equal(visible.opacity, "1", "Plan should be fully visible as soon as chapter 02 activates");
  assert.equal(visible.visibility, "visible");
  assert.ok(visible.imageLoaded, "Plan image should be preloaded before fast scroll");
  console.log("FAST SCROLL PASS",JSON.stringify(visible));

  const next = page.locator("[data-story-beat]").nth(2);
  const nextY = await next.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(target => window.scrollTo({top:target-310,behavior:"instant"}), nextY);
  await page.waitForFunction(() => document.querySelector(".archive-story")?.getAttribute("data-chapter") === "3");
  assert.equal(await page.locator("[data-story-plan]").evaluate(el => getComputedStyle(el).opacity), "0");
  assert.deepEqual(errors,[], "Motion-enabled page errors");
  console.log("FAST NEXT CHAPTER PASS");
  await page.close();
} finally {
  await browser.close();
}
console.log("SMOKE AND FAST-SCROLL PASSED");
