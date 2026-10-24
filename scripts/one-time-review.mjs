import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({headless:true,channel:"chrome",args:["--no-sandbox"]});
const base="http://127.0.0.1:4173/rieltor";
try {
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
    const shots=[
      {name:"hero",path:"/"},
      {name:"intro",path:"/",focus:".archive-intro"},
      {name:"principles",path:"/",focus:".archive-principles"},
      {name:"catalogue",path:"/kvartiry/"},
      {name:"listing-first",path:"/kvartiry/",focus:".listing:nth-child(1)"},
      {name:"listing-second",path:"/kvartiry/",focus:".listing:nth-child(2)"},
      {name:"contact",path:"/podbor/"},
      {name:"detail",path:"/kvartiry/pervyy-svet/"},
    ];
    for(const shot of shots) {
      const response=await page.goto(base+shot.path,{waitUntil:"networkidle"});
      assert.equal(response?.status(),200,shot.path+" failed");
      if(shot.focus)await page.locator(shot.focus).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const buffer=await page.screenshot({type:"jpeg",quality:35});
      console.log("REVIEW|"+width+"|"+shot.name+"|"+buffer.toString("base64"));
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<4,"Overflow "+shot.name+" "+overflow);
    }
    await page.close();
  }
} finally {await browser.close();}
console.log("REVIEW COMPLETE");
