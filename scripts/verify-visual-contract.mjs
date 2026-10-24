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
        const principles=await page.locator(".archive-principles").evaluate(el=>getComputedStyle(el).backgroundColor);
        assert.equal(principles,colors.intro,"Principles and introduction must share the warm-stone material");
        const heroAction=await page.locator(".archive-actions .archive-button").evaluate(el=>getComputedStyle(el).backgroundColor);
        assert.notEqual(heroAction,"rgb(247, 243, 237)","No white/porcelain button fills");
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
        // All six cards must show their full image frames, regardless of scroll
        // order and whether animations have hydrated.
        // Lazy-loaded floorplans should resolve when scrolled into view.
        for(let i=0;i<6;i++) {
          const image=page.locator(".listing-image img").nth(i);
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img=>img.decode());
        }
        const cards=await page.locator("[data-listing]").evaluateAll(nodes=>nodes.map(card=>{
          const outer=card.getBoundingClientRect();
          const frame=card.querySelector(".listing-image");
          const image=frame.querySelector("img");
          const rect=frame.getBoundingClientRect();
          const style=getComputedStyle(frame);
          return {card:outer.width,frame:rect.width,clip:style.clipPath,
            transform:style.transform,imageLoaded:image.complete&&image.naturalWidth>0};
        }));
        assert.equal(cards.length,6);
        for(const [i,card] of cards.entries()) {
          assert.equal(card.clip,"none","Listing "+(i+1)+" remains clipped");
          assert.equal(card.transform,"none","Listing "+(i+1)+" remains transformed");
          assert.ok(card.frame>200 && card.frame>=card.card*(width<=720?.95:.45),
            "Listing "+(i+1)+" isn't full width: "+JSON.stringify(card));
          assert.ok(card.imageLoaded,"Listing "+(i+1)+" plan did not load");
        }
        const widths=cards.map(card=>card.frame);
        assert.ok(Math.max(...widths)-Math.min(...widths)<=2,
          "Every listing must have the same full-width image frame: "+JSON.stringify(widths));
        const listingColors=await page.locator(".listing").evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).backgroundColor));
        assert.equal(new Set(listingColors).size,1,"All archive listings use one editorial surface");
        console.log("FULL CARDS",width,JSON.stringify(cards.map(x=>Math.round(x.frame))));
        const align=await page.locator(".listing-copy a").first().evaluate(el=>{
          const a=el.querySelector(".listing-copy__action-label").getBoundingClientRect();
          const b=el.querySelector(".listing-copy__arrow").getBoundingClientRect();
          return Math.abs(a.top+a.height/2-b.top-b.height/2);
        });
        assert.ok(align<=4,"arrow baseline offset "+align);
        await page.getByRole("button",{name:"1 комната",exact:true}).click();
        assert.equal(await page.locator("[data-listing]").count(),1);
        await page.getByRole("button",{name:"Все",exact:true}).click();
        // Visible CTA hover with readable foreground and a changed fill.
        const cta=page.locator(".listing-copy a").first();
        const getButton=()=>cta.evaluate(el=>{
          const style=getComputedStyle(el);
          return {bg:style.backgroundColor,fg:style.color,border:style.borderTopColor};
        });
        const normal=await getButton();
        await cta.hover();await page.waitForTimeout(340);
        const hovered=await getButton();
        assert.notEqual(hovered.bg,normal.bg,"CTA hover didn't visibly change fill");
        assert.ok(contrast(hovered.bg,hovered.fg)>=4.5,
          "CTA hover foreground lost contrast: "+JSON.stringify(hovered));
        assert.ok(contrast(hovered.bg,theme.bg)>=1.05,
          "CTA hover merged with whole page canvas");
        console.log("HOVER",width,JSON.stringify({normal,hovered}));
        console.log("CATALOG",width,JSON.stringify({...theme,arrowDelta:align}));
      }
      if(route==="/podbor/") {
        const color=await page.evaluate(()=>({
          bg:getComputedStyle(document.querySelector(".contact")).backgroundColor,
          fg:getComputedStyle(document.querySelector(".contact")).color,
          panel:getComputedStyle(document.querySelector(".contact-panel")).backgroundColor,
        }));
        assert.ok(contrast(color.bg,color.fg)>=4.5,"contact low contrast");
        const colorToken=await page.evaluate(name=>getComputedStyle(document.documentElement).getPropertyValue(name).trim(),"--champagne");
        const toRGB=hex=>"rgb("+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(", ")+")";
        assert.equal(color.panel,toRGB(colorToken),"Contact application sheet must use champagne");
        const submitBg=await page.locator(".contact-form__submit").evaluate(el=>getComputedStyle(el).backgroundColor);
        assert.ok(contrast(color.panel,submitBg)>=4.5,"Submit button must stand out against champagne form");
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
        const after=await page.locator(".detail figure").evaluate(el=>getComputedStyle(el,"::after").content);
        assert.equal(after,"none","No duplicate decorative framing over plans");
        console.log("DETAIL",width,JSON.stringify(color));
      }
      if(width===390&&route==="/"){
        const menu=page.getByRole("button",{name:"Открыть меню"});
        await menu.click();
        assert.equal(await page.locator("svg.lucide-x").count(),1);
        assert.equal(await page.locator(".mobile-menu__panel a").count(),2);
        await page.getByRole("button",{name:"Закрыть меню"}).click();
      }
      if(width===1440) {
        const selectors = route==="/" ?
          [".archive-actions .archive-button",".archive-actions .archive-text-link",
            ".archive-intro .intro-cta",".archive-callout .archive-button"] :
          route==="/podbor/" ? [".contact-form__submit",".page-nav .nav-cta"] :
          route.includes("pervyy-svet") ? [".detail .primary",".page-nav .nav-cta"] :
          [".archive-page__nav .nav-cta",'.filters button[aria-pressed="false"]'];
        for(const selector of selectors) {
          const target=page.locator(selector).first();
          const before=await target.evaluate(el=>getComputedStyle(el).backgroundColor);
          await target.hover(); await page.waitForTimeout(310);
          const state=await target.evaluate(el=>{
            const style=getComputedStyle(el);
            return {bg:style.backgroundColor,fg:style.color};
          });
          assert.notEqual(state.bg,before,"No visible hover background for "+selector);
          if(!state.bg.startsWith("rgba")) {
            assert.ok(contrast(state.bg,state.fg)>=4.5,
              "Hover contrast fails for "+selector+": "+JSON.stringify(state));
          }
          console.log("HOVER PASS",route,selector,JSON.stringify(state));
        }
      }
      console.log("PASS",width,route,JSON.stringify(props));


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
