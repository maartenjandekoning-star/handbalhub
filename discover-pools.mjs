
import { chromium } from "playwright";
import { CONFIG_FILE, readJson, writeJson, uniq } from "./update-shared.mjs";

const cfg=await readJson(CONFIG_FILE,{teams:[],discoveryPages:[]});
const browser=await chromium.launch({headless:true});
let found=0;
for(const team of cfg.teams||[]){
  if(team.poolUrl)continue;
  const candidates=[];
  for(const source of cfg.discoveryPages||[]){
    let page;
    try{
      page=await browser.newPage({viewport:{width:1400,height:1000}});
      await page.goto(source,{waitUntil:"domcontentloaded",timeout:15000});
      await page.waitForTimeout(1800);
      const inputs=page.locator('input[type="search"],input[placeholder*="zoek" i],input[type="text"]');
      for(let i=0;i<Math.min(await inputs.count(),2);i++){
        await inputs.nth(i).fill(team.club).catch(()=>{});
        await inputs.nth(i).press("Enter").catch(()=>{});
        await page.waitForTimeout(1400);
      }
      const links=await page.locator('a[href*="competitie-poule"],a[href*="pool="],a[href*="poule"]').evaluateAll(as=>as.map(a=>({url:a.href,text:(a.textContent||"").replace(/\s+/g," ").trim()})));
      candidates.push(...links);
    }catch{}finally{if(page)await page.close().catch(()=>{});}
  }
  const ordered=uniq(candidates,x=>x.url).sort((a,b)=>{
    const ar=(a.text||"").toLowerCase().includes(team.club.toLowerCase())?1:0;
    const br=(b.text||"").toLowerCase().includes(team.club.toLowerCase())?1:0;
    return br-ar;
  });
  if(ordered[0]?.url){
    team.poolUrl=ordered[0].url;
    found++;
    console.log(`Poule gevonden voor ${team.club} ${team.team}: ${team.poolUrl}`);
  }else console.log(`Geen poule gevonden voor ${team.club} ${team.team}`);
}
await browser.close();
await writeJson(CONFIG_FILE,cfg);
console.log(`Ontdekking klaar: ${found} nieuwe poulelinks`);
