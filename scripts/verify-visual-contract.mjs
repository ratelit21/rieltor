import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const base = "http://127.0.0.1:4173/rieltor";
const routes = ["/", "/kvartiry/", "/kvartiry/pervyy-svet/", "/podbor/"];
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });

const rgb = s => (s.match(/[\d.]+/g) ?? []).slice(0,3).map(Number);
function luminance(s) {
  const [r,g,b] = rgb(s).map(n => {
    const x = n / 255;
    return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
  });
  return r * .2126 + g * .7152 + b * .0722;
}
function contrast(a,b) {
  const [hi,lo] = [luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (hi+.05)/(lo+.05);
}
const DARK="rgb(37, 43, 40)", STONE="rgb(220, 207, 191)", GOLD="rgb(215, 188, 151)";
function equal(actual,expected,description) {
  assert.equal(actual,expected,description+" expected "+expected+", got "+actual);
}
async function pair(page,selector,bgOwner=selector) {
  return page.locator(selector).first().evaluate((el,owner)=>{
    const container=owner===el.className ? el : document.querySelector(owner);
    const txt=getComputedStyle(el), surf=getComputedStyle(container||el);
    return { fg:txt.color,bg:surf.backgroundColor };
  },bgOwner);
}
async function buttonHover(page,selector,expectedSurface) {
  const btn=page.locator(selector).first();
  await btn.scrollIntoViewIfNeeded();
  await page.mouse.move(0,0);
  const before=await btn.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
  await btn.hover();
  await page.waitForTimeout(260);
  const after=await btn.evaluate(el=>({
    bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,
    border:getComputedStyle(el).borderTopColor,
    outline:getComputedStyle(el).outlineStyle,
    decoration:getComputedStyle(el).textDecorationLine
  }));
  assert.ok(after.bg!==before.background || after.color!==before.color ||
    after.outline==="solid" || after.decoration.includes("underline"),
    "Hover invisible: "+selector);
  const surface=after.bg==="rgba(0, 0, 0, 0)"?expectedSurface:after.bg;
  assert.ok(contrast(surface,after.color)>=4.5,selector+" hover illegible "+JSON.stringify(after));
  if(after.bg==="rgba(0, 0, 0, 0)") {
    assert.ok(contrast(expectedSurface,after.color)>=4.5,selector+" transparent hover lost contrast");
  }
  console.log("HOVER",selector,JSON.stringify({before,after}));
}
async function snapshot(page,name) {
  const png=await page.screenshot({type:"jpeg",quality:38});
  console.log("VISUAL|"+name+"|"+png.toString("base64"));
}

try {
  for(const width of [390,768,1440]) {
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
    const exceptions=[];
    page.on("pageerror",e=>exceptions.push(e.message));
    for(const route of routes) {
      const resp=await page.goto(base+route,{waitUntil:"networkidle"});
      equal(resp?.status(),200,"route "+route);
      const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(overflow.scrollWidth<=overflow.width+3,"Horizontal overflow "+width+" "+route+": "+JSON.stringify(overflow));
      const theme=await page.evaluate(()=>({
        body:getComputedStyle(document.body).backgroundColor,
        home:document.querySelector(".archive-intro")&&getComputedStyle(document.querySelector(".archive-intro")).backgroundColor,
        story:document.querySelector(".archive-story")&&getComputedStyle(document.querySelector(".archive-story")).backgroundColor,
        principles:document.querySelector(".archive-principles")&&getComputedStyle(document.querySelector(".archive-principles")).backgroundColor,
        canvas:document.querySelector(".archive-page,.contact,.detail")&&getComputedStyle(document.querySelector(".archive-page,.contact,.detail")).backgroundColor,
      }));
      equal(theme.body,DARK,"base dark green canvas");
      if(route==="/") {
        equal(theme.home,DARK,"home introduction");
        equal(theme.story,DARK,"scroll story");
        equal(theme.principles,STONE,"home principles");
        const heading=await page.locator(".archive-principles__heading h2").evaluate(el=>getComputedStyle(el).color);
        assert.ok(contrast(STONE,heading)>=4.5,"principles heading too light");
        equal(await page.locator(".archive-principles__grid article").count(),3,"three principle cards");
        const principles=await page.locator(".archive-principles__grid article").evaluateAll(els=>els.map(el=>({
          bg:getComputedStyle(el).backgroundColor,
          number:getComputedStyle(el.querySelector("span")).color,
          text:getComputedStyle(el.querySelector("h3")).color,
        })));
        for(const item of principles) {
          equal(item.bg,DARK,"principle panel");
          equal(item.number,GOLD,"champagne principle numeral");
          assert.ok(contrast(item.bg,item.number)>=3,"large number contrast");
          assert.ok(contrast(item.bg,item.text)>=4.5,"principle text contrast");
        }
        const heroPrimary=await page.locator(".archive-actions .archive-button").evaluate(el=>getComputedStyle(el).backgroundColor);
        equal(heroPrimary,GOLD,"hero champagne CTA");
        assert.equal(await page.locator("svg.archive-story__end-arrow").count(),1);
        if(width===390) {
          await page.getByRole("button",{name:"Открыть меню"}).click();
          equal(await page.locator(".mobile-menu__panel a").count(),2,"menu links");
          equal(await page.locator("svg.lucide-x").count(),1,"close svg");
          await page.getByRole("button",{name:"Закрыть меню"}).click();
        }
        if(width===1440) {
          await buttonHover(page,".archive-actions .archive-button",DARK);
          await buttonHover(page,".archive-actions .archive-text-link",DARK);
          await buttonHover(page,".archive-intro .intro-cta",DARK);
          await buttonHover(page,".archive-callout .archive-button",DARK);
          await page.locator(".archive-principles").scrollIntoViewIfNeeded();
          await snapshot(page,"principles-desktop");
        }
      }
      if(route==="/kvartiry/") {
        equal(theme.canvas,DARK,"catalogue canvas");
        equal(await page.locator("svg.listing-copy__arrow").count(),6,"all six arrow icons");
        const cardButton=await page.locator(".listing-copy a").first().evaluate(el=>({
          bg:getComputedStyle(el).backgroundColor, fg:getComputedStyle(el).color,
        }));
        equal(cardButton.bg,GOLD,"catalogue accent CTA");
        assert.ok(contrast(cardButton.bg,cardButton.fg)>=4.5,"catalogue accent button contrast");
        const selectedFilter=await page.locator('.filters button[aria-pressed="true"]').first().evaluate(el=>getComputedStyle(el).backgroundColor);
        equal(selectedFilter,GOLD,"selected champagne filter");
        equal(await page.locator(".listing-image span").count(),0,"no arbitrary plan badges");
        for(let i=0;i<6;i++) {
          const img=page.locator(".listing-image img").nth(i);
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el=>el.decode());
        }
        const cards=await page.locator("[data-listing]").evaluateAll(els=>els.map(el=>{
          const r=el.getBoundingClientRect();
          const frame=el.querySelector(".listing-image");
          const fr=frame.getBoundingClientRect();
          const f=getComputedStyle(frame);
          const cp=getComputedStyle(el.querySelector(".listing-copy"));
          return {total:r.width,frame:fr.width,clip:f.clipPath,transform:f.transform,
            bg:getComputedStyle(el).backgroundColor,fg:cp.color,
            loaded:el.querySelector(".listing-image img").naturalWidth>0};
        }));
        equal(cards.length,6,"six complete listings");
        cards.forEach((card,i)=>{
          equal(card.bg,STONE,"listing "+(i+1)+" stone");
          equal(card.clip,"none","no clipped frame "+(i+1));
          equal(card.transform,"none","no transformed frame "+(i+1));
          assert.ok(card.frame>200 && card.frame>=card.total*(width<=720?.95:.45),"listing "+(i+1)+" narrow");
          assert.ok(card.loaded,"listing "+(i+1)+" unloaded image");
          assert.ok(contrast(card.bg,card.fg)>=4.5,"listing "+(i+1)+" text");
        });
        const delta=await page.locator(".listing-copy a").first().evaluate(el=>{
          const a=el.querySelector(".listing-copy__action-label").getBoundingClientRect();
          const b=el.querySelector("svg").getBoundingClientRect();
          return Math.abs(a.top+a.height/2-b.top-b.height/2);
        });
        assert.ok(delta<4,"Listing arrow is off-center "+delta);
        await page.getByRole("button",{name:"1 комната",exact:true}).click();
        equal(await page.locator("[data-listing]").count(),1,"rooms filter");
        await page.getByRole("button",{name:"Все",exact:true}).click();
        equal(await page.locator("[data-listing]").count(),6,"filter reset");
        if(width===1440) {
          await buttonHover(page,".listing-copy a",STONE);
          await buttonHover(page,'.filters button[aria-pressed="false"]',DARK);
          await buttonHover(page,'.filters button[aria-pressed="true"]',DARK);
          await buttonHover(page,".archive-page__nav .nav-cta",DARK);
          await page.locator("[data-listing]").nth(1).scrollIntoViewIfNeeded();
          await snapshot(page,"catalogue-cards");
        }
        console.log("LISTINGS_OK",width,JSON.stringify({widths:cards.map(x=>Math.round(x.frame)),arrowDelta:delta}));
      }
      if(route==="/podbor/") {
        equal(theme.canvas,DARK,"contact dark canvas");
        const panel=await page.locator(".contact-panel").evaluate(el=>({
          bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,
          input:getComputedStyle(el.querySelector("input")).color,
        }));
        equal(panel.bg,STONE,"contact form stone");
        assert.ok(contrast(panel.bg,panel.color)>=4.5,"contact panel type contrast");
        assert.ok(contrast(panel.bg,panel.input)>=4.5,"contact input contrast");
        await page.locator('input[name="name"]').fill("Проверка");
        await page.locator('input[name="contact"]').fill("@test");
        await page.getByRole("button",{name:"Проверить запрос"}).click();
        await page.getByText("Демо-форма заполнена.",{exact:false}).waitFor();
        if(width===1440) await buttonHover(page,".contact-form__submit",STONE);
      }
      if(route.includes("pervyy-svet")) {
        equal(theme.canvas,DARK,"detail dark canvas");
        const card=await page.locator(".detail-grid > div").evaluate(el=>({
          bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color
        }));
        equal(card.bg,STONE,"detail panel stone");
        assert.ok(contrast(card.bg,card.fg)>=4.5,"detail panel type");
        if(width===1440) {
          await buttonHover(page,".detail .primary",STONE);
          const planAspect=await page.locator(".detail figure").evaluate(el=>{
            const r=el.getBoundingClientRect();return r.width/r.height;
          });
          assert.ok(planAspect>1.26&&planAspect<1.40,"Detail plan frame not 4:3: "+planAspect);
        }
      }
      if(width===1440) {
        if(route==="/") await page.evaluate(()=>scrollTo(0,0));
        await snapshot(page,"desktop-"+route.replaceAll("/","-"));
      }
      if(width===390 && ["/","/kvartiry/","/podbor/"].includes(route)) {
        await snapshot(page,"mobile-"+route.replaceAll("/","-"));
      }
      console.log("PASS",width,route,JSON.stringify(theme));
    }
    assert.deepEqual(exceptions,[],"browser JS errors at "+width);
    await page.close();
  }

  const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"no-preference"});
  const errors=[];p.on("pageerror",e=>errors.push(e.message));
  await p.goto(base+"/",{waitUntil:"networkidle"});
  const frame=p.locator(".archive-story__plan");
  const beat=p.locator("[data-story-beat]").nth(1);
  const y=await beat.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>scrollTo({top:y-300,behavior:"instant"}),y);
  await p.waitForFunction(()=>document.querySelector(".archive-story")?.dataset.chapter==="2");
  const frameSize=await frame.evaluate(el=>{
    const f=document.querySelector(".archive-story__canvas").getBoundingClientRect();
    const r=el.getBoundingClientRect(),img=el.querySelector("img");
    return {x:r.width/f.width,y:r.height/f.height,loaded:img.complete&&img.naturalWidth>0};
  });
  assert.ok(frameSize.x>.9&&frameSize.y>.9&&frameSize.loaded,"Plan must be large and preloaded");
  await p.waitForTimeout(600);
  assert.ok(Number(await frame.evaluate(el=>getComputedStyle(el).opacity))>.95,"Plan transition failed");
  const third=p.locator("[data-story-beat]").nth(2);
  const y3=await third.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>scrollTo({top:y-300,behavior:"instant"}),y3);
  await p.waitForFunction(()=>document.querySelector(".archive-story")?.dataset.chapter==="3");
  await p.waitForTimeout(600);
  assert.ok(Number(await frame.evaluate(el=>getComputedStyle(el).opacity))<.05,"Plan did not fade away");
  assert.deepEqual(errors,[],"story JS errors");
  await p.close();
  console.log("SCROLL_STORY_OK",JSON.stringify(frameSize));
} finally {
  await browser.close();
}
console.log("VISUAL CONTRACT PASSED");
