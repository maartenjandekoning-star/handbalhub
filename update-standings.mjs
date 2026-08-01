
import { chromium } from "playwright";
import { DATA_FILE, CONFIG_FILE, clean, readJson, writeJson } from "./update-shared.mjs";

const now=new Date().toISOString();
const data=await readJson(DATA_FILE,{});
const cfg=await readJson(CONFIG_FILE,{teams:[],pageTimeoutMs:15000});
data.teams=data.teams||{};
data.status=(data.status||[]).filter(x=>x.type!=="standings");

function normalizeTable(rows){
  return rows.map((r,i)=>({
    position:r[0]||String(i+1),team:r[1]||"",played:r[2]||"",points:r[3]||"",
    won:r[4]||"",draw:r[5]||"",lost:r[6]||"",diff:r[9]||r[7]||""
  })).filter(x=>x.team);
}
const browser=await chromium.launch({headless:true});
let updated=0;
for(const team of cfg.teams||[]){
  if(!team.poolUrl){
    data.status.push({name:`Stand ${team.club} ${team.team}`,ok:false,type:"standings",message:"Nog geen poulelink opgeslagen."});
    continue;
  }
  let page;
  try{
    page=await browser.newPage({viewport:{width:1400,height:1000}});
    await page.goto(team.poolUrl,{waitUntil:"domcontentloaded",timeout:cfg.pageTimeoutMs||15000});
    await page.waitForTimeout(1800);
    for(const label of ["Stand","Standen","Ranglijst"]){
      const loc=page.getByText(label,{exact:false}).first();
      if(await loc.count())await loc.click({timeout:1500}).catch(()=>{});
    }
    await page.waitForTimeout(1200);
    const tables=await page.locator("table").evaluateAll(ts=>ts.map(t=>({
      rows:[...t.querySelectorAll("tbody tr")].map(tr=>[...tr.querySelectorAll("td")].map(x=>(x.textContent||"").replace(/\s+/g," ").trim()))
    })));
    const standing=tables.map(t=>normalizeTable(t.rows)).find(rows=>rows.length>=4&&rows.some(r=>r.team.toLowerCase().includes(team.club.toLowerCase())));
    if(!standing)throw new Error("Geen bruikbare standentabel gevonden.");
    const own=standing.find(r=>r.team.toLowerCase().includes(team.club.toLowerCase()));
    data.teams[team.id]={...(data.teams[team.id]||{}),standing,position:own?.position||null,points:own?.points||null,played:own?.played||null,updatedAt:now,sourceUrl:team.poolUrl};
    data.status.push({name:`Stand ${team.club} ${team.team}`,ok:true,type:"standings",sourceUrl:team.poolUrl});
    updated++;
  }catch(e){
    data.status.push({name:`Stand ${team.club} ${team.team}`,ok:false,type:"standings",message:String(e.message||e)});
  }finally{if(page)await page.close().catch(()=>{});}
}
await browser.close();
data.pulse={...(data.pulse||{}),matches:Object.values(data.teams||{}).flatMap(x=>x.matches||[]).length};
await writeJson(DATA_FILE,data);
console.log(`Standenupdate klaar: ${updated} standen bijgewerkt`);
