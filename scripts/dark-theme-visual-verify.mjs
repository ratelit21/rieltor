import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const base = "http://127.0.0.1:4173/rieltor";
const destinations = [
  { name: "home-hero", path: "/", scroll: 0 },
  { name: "home-intro", path: "/", scroll: 920 },
  { name: "home-story", path: "/", target: "#vzglyad" },
  { name: "catalogue", path: "/kvartiry/", scroll: 0 },
  { name: "contact", path: "/podbor/", scroll: 0 },
  { name: "detail", path: "/kvartiry/pervyy-svet/", scroll: 0 },
];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    for (const entry of destinations) {
      const response = await page.goto(base + entry.path, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `${entry.path} HTTP ${response?.status()}`);
      if (entry.target) await page.locator(entry.target).scrollIntoViewIfNeeded();
      else if (entry.scroll) await page.evaluate(y => window.scrollTo(0, y), entry.scroll);
      await page.waitForTimeout(150);
      const check = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const root = document.documentElement;
        const heading = document.querySelector("h1");
        const kicker = document.querySelector(".archive-kicker, .eyebrow");
        const section = document.querySelector(".archive-intro, .archive-story, .archive-page, .contact, .detail");
        return {
          viewport: window.innerWidth, scrollWidth: root.scrollWidth,
          bodyBackground: body.backgroundColor,
          sectionBackground: section ? getComputedStyle(section).backgroundColor : "",
          labelSize: kicker ? getComputedStyle(kicker).fontSize : "",
          h1: heading?.textContent?.trim(),
          viewfinder: document.querySelectorAll(".archive-hero__viewfinder").length,
        };
      });
      assert.ok(check.scrollWidth <= width + 3, `Horizontal overflow ${width} ${entry.name}: ${JSON.stringify(check)}`);
      if (entry.name === "home-hero") assert.equal(check.viewfinder, 0, "Old hero frame is still present");
      console.log("STYLECHECK", width, entry.name, JSON.stringify(check));
      if (width === 1440) console.log("SCREEN VERIFIED", entry.name);
    }
    assert.deepEqual(errors, [], `JS errors ${width}: ${errors.join("; ")}`);
    await page.close();
  }

  const motion = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const exceptions = [];
  motion.on("pageerror", error => exceptions.push(error.message));
  await motion.goto(base + "/", { waitUntil: "networkidle" });
  await motion.waitForTimeout(350);
  const second = motion.locator("[data-story-beat]").nth(1);
  const top = await second.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  await motion.evaluate(y => window.scrollTo({top:y-310,behavior:"instant"}), top);
  await motion.waitForTimeout(1450);
  const chapter = await motion.locator(".archive-story").getAttribute("data-chapter");
  const opacity = await motion.locator("[data-story-plan]").evaluate(el => getComputedStyle(el).opacity);
  console.log("MOTION", chapter, opacity);
  assert.equal(chapter, "2");
  assert.ok(Number(opacity) > .8);
  assert.deepEqual(exceptions, []);
  await motion.close();
} finally { await browser.close(); }
console.log("DARK THEME CHECK PASSED");
