import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--no-sandbox"] });
const base = "http://127.0.0.1:4173/rieltor";
const routes = ["/", "/kvartiry/", "/kvartiry/pervyy-svet/", "/podbor/"];
const rgb = str => (str.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
const luminance = v => {
  const [r,g,b]=rgb(v).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});
  return .2126*r+.7152*g+.0722*b;
};
const contrast = (a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+.05)/(lo+.05)};
try {
  for (const width of [390,768,1440]) {
    const page = await browser.newPage({ viewport:{width,height:900}, reducedMotion:"reduce" });
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    for(const route of routes) {
      const response=await page.goto(base+route,{waitUntil:"networkidle"});
      assert.equal(response?.status(),200);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),width+" overflow in "+route);
      const props=await page.evaluate(()=>({
        body:getComputedStyle(document.body).backgroundColor,
        h1:document.querySelector("h1")?.innerText,
        icons:document.querySelectorAll("svg.lucide").length,
      }));
      if(route==="/") {
        const colors=await page.evaluate(()=>({
          intro:getComputedStyle(document.querySelector(".archive-intro")).backgroundColor,
          introText:getComputedStyle(document.querySelector(".archive-intro")).color,
          story:getComputedStyle(document.querySelector(".archive-story")).backgroundColor,
          storyText:getComputedStyle(document.querySelector(".archive-story")).color,
        }));
        assert.ok(contrast(colors.intro,colors.introText)>=4.5,"intro low contrast: "+JSON.stringify(colors));
        assert.ok(contrast(colors.story,colors.storyText)>=4.5,"story low contrast");
        assert.notEqual(colors.intro,colors.story,"sections not materially contrasted");
        assert.equal(await page.locator(".archive-story__end-arrow").count(),1);
        console.log("COLORS",width,JSON.stringify(colors));
      }
      if(route==="/kvartiry/"){
        const theme=await page.evaluate(()=>({
          bg:getComputedStyle(document.querySelector(".archive-page")).backgroundColor,
          ink:getComputedStyle(document.querySelector(".archive-page")).color,
          filter:getComputedStyle(document.querySelector('.filters button[aria-pressed="false"]')).color,
          activeBg:getComputedStyle(document.querySelector('.filters button[aria-pressed="true"]')).backgroundColor,
          activeFg:getComputedStyle(document.querySelector('.filters button[aria-pressed="true"]')).color,
          listing:getComputedStyle(document.querySelector(".listing")).backgroundColor,
        }));
        assert.ok(contrast(theme.bg,theme.ink)>=4.5,"catalogue contrast insufficient");
        assert.ok(contrast(theme.bg,theme.filter)>=4.5,"filter contrast insufficient");
        assert.ok(contrast(theme.activeBg,theme.activeFg)>=4.5,"selected filter contrast insufficient");
        assert.equal(await page.locator(".listing-image span").count(),0);
        assert.equal(await page.locator("svg.listing-copy__arrow").count(),6);
        const align=await page.locator(".listing-copy a").first().evaluate(el=>{
          const a=el.querySelector(".listing-copy__action-label").getBoundingClientRect();
          const b=el.querySelector(".listing-copy__arrow").getBoundingClientRect();
          return Math.abs(a.top+a.height/2-b.top-b.height/2);
        });
        assert.ok(align<=4,"arrow baseline offset "+align);
        await page.getByRole("button",{name:"1 комната",exact:true}).click();
        assert.equal(await page.locator("[data-listing]").count(),1);
        await page.getByRole("button",{name:"Все",exact:true}).click();
        console.log("CATALOG",width,JSON.stringify({...theme,arrowDelta:align}));
      }
      if(route==="/podbor/") {
        const color=await page.evaluate(()=>({
          bg:getComputedStyle(document.querySelector(".contact")).backgroundColor,
          fg:getComputedStyle(document.querySelector(".contact")).color,
          panel:getComputedStyle(document.querySelector(".contact-panel")).backgroundColor,
        }));
        assert.ok(contrast(color.bg,color.fg)>=4.5,"contact low contrast");
        await page.locator('input[name="name"]').fill("Проверка");
        await page.locator('input[name="contact"]').fill("@test");
        await page.getByRole("button",{name:"Проверить запрос"}).click();
        await page.getByText("Демо-форма заполнена.",{exact:false}).waitFor();
        console.log("CONTACT",width,JSON.stringify(color));
      }
      if(route.includes("/pervyy-svet/")) {
        const color=await page.evaluate(()=>({
          bg:getComputedStyle(document.querySelector(".detail")).backgroundColor,
          panel:getComputedStyle(document.querySelector(".detail-grid > div")).backgroundColor,
          plan:getComputedStyle(document.querySelector(".detail figure")).backgroundColor,
        }));
        assert.notEqual(color.bg,color.panel);
        console.log("DETAIL",width,JSON.stringify(color));
      }
      console.log("PASS",width,route,JSON.stringify(props));
      if(width===1440) {
        const buffer=await page.screenshot({type:"jpeg",quality:36});
        console.log("SCREENSHOT|"+route+"|"+buffer.toString("base64"));
      }
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"no-preference"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/",{waitUntil:"networkidle"});
  const plan=page.locator(".archive-story__plan");
  const second=page.locator("[data-story-beat]").nth(1);
  const secondY=await second.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
  await page.evaluate(y=>scrollTo({top:y-300,behavior:"instant"}),secondY);
  await page.waitForFunction(()=>document.querySelector(".archive-story")?.dataset.chapter==="2");
  const size=await plan.evaluate(el=>{
    const frame=document.querySelector(".archive-story__canvas").getBoundingClientRect(),r=el.getBoundingClientRect();
    const img=el.querySelector("img");
    return {width:r.width/frame.width,height:r.height/frame.height,
      imageLoaded:img.complete && img.naturalWidth>0};
  });
  assert.ok(size.width>.9 && size.height>.9,"plan too small "+JSON.stringify(size));
  assert.ok(size.imageLoaded,"plan not preloaded");
  await page.waitForTimeout(550);
  const state=await plan.evaluate(el=>({alpha:getComputedStyle(el).opacity,visible:getComputedStyle(el).visibility,transform:getComputedStyle(el).transform}));
  assert.ok(Number(state.alpha)>.95,"plan did not fade in: "+JSON.stringify(state));
  assert.equal(state.visible,"visible");
  console.log("PLAN CROSSFADE",JSON.stringify({size,state}));
  const next=page.locator("[data-story-beat]").nth(2);
  const y=await next.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
  await page.evaluate(v=>scrollTo({top:v-300,behavior:"instant"}),y);
  await page.waitForFunction(()=>document.querySelector(".archive-story")?.dataset.chapter==="3");
  await page.waitForTimeout(550);
  assert.ok(Number(await plan.evaluate(el=>getComputedStyle(el).opacity))<.05);
  assert.deepEqual(errors,[]);
  console.log("MOTION OK");
  await page.close();
} finally { await browser.close(); }
console.log("ALL CHECKS PASSED");
