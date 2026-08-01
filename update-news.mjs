
import { chromium } from "playwright";
import { DATA_FILE, clean, uniq, readJson, writeJson, safeDate } from "./update-shared.mjs";

const now = new Date().toISOString();
const old = await readJson(DATA_FILE,{});
const out = {...old, updatedAt:now, news:[], social:[], live:[], status:[...(old.status||[]).filter(x=>x.type==="standings")]};

async function fetchText(url){
  const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 HandbalHub/13.0"}});
  if(!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
function xmlItems(xml,source){
  const blocks=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>m[1]);
  const value=(b,t)=>clean(((b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`,"i"))||[])[1]||"").replace(/<!\[CDATA\[|\]\]>/g,""));
  return blocks.map(b=>({
    title:value(b,"title"), url:value(b,"link"), date:value(b,"pubDate")||now,
    summary:value(b,"description"), source:value(b,"source")||source, category:"Nieuws", image:""
  })).filter(x=>x.title&&x.url);
}
async function addFeed(name,url){
  try{out.news.push(...xmlItems(await fetchText(url),name));out.status.push({name,ok:true,type:"news"});}
  catch(e){out.status.push({name,ok:false,type:"news",message:String(e.message||e)});}
}
for(const [name,url] of [
  ["Handbal Inside","https://www.handbalinside.nl/feed/"],
  ["Handbal Startpunt","https://www.handbalstartpunt.nl/feed/"],
  ["Handbal.nl","https://handbal.nl/feed/"],
  ["HandbalOost","https://handbaloost.nl/feed/"],
  ["Super Handball League","https://superhandballeague.com/feed/"]
]) await addFeed(name,url);

for(const q of ["Nederlands handbal","TeamNL handbal","Super Handball League","handbal transfer Nederland","handbal uitslag Nederland"]){
  await addFeed(`Google Nieuws: ${q}`,`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=nl&gl=NL&ceid=NL:nl`);
}
out.news=uniq(out.news,x=>x.title.toLowerCase()).sort((a,b)=>safeDate(b.date)-safeDate(a.date)).slice(0,80);

const browser=await chromium.launch({headless:true});
async function enrich(article){
  let page;
  try{
    page=await browser.newPage();
    await page.goto(article.url,{waitUntil:"domcontentloaded",timeout:12000});
    const meta=await page.evaluate(()=>({
      image:document.querySelector('meta[property="og:image"]')?.content||document.querySelector('meta[name="twitter:image"]')?.content||"",
      description:document.querySelector('meta[property="og:description"]')?.content||document.querySelector('meta[name="description"]')?.content||""
    }));
    if(meta.image)article.image=meta.image;
    if(meta.description&&(!article.summary||article.summary.length<60))article.summary=meta.description.replace(/\s+/g," ").trim().slice(0,320);
  }catch{} finally{if(page)await page.close().catch(()=>{});}
}
for(const n of out.news.slice(0,12)) await enrich(n);

try{
  const page=await browser.newPage();
  await page.goto("https://superhandballeague.tv/live",{waitUntil:"domcontentloaded",timeout:15000});
  await page.waitForTimeout(1800);
  out.live=await page.locator("a").evaluateAll(as=>as.map(a=>({title:(a.textContent||"").trim(),url:a.href}))
    .filter(x=>x.title&&/\blive\b|kijk live|watch live/i.test(x.title)).slice(0,10));
  out.live=uniq(out.live,x=>x.url).map(x=>({...x,source:"SHL TV",confirmed:true}));
  await page.close();
}catch{}
await browser.close();

out.social=["TeamNL","SHL","transfers","jeugd","beach","beker"].map(topic=>{
  const rel=out.news.find(n=>(n.title+" "+n.summary).toLowerCase().includes(topic.toLowerCase()));
  const q=encodeURIComponent(topic+" handbal");
  return{topic,preview:rel?.title||`Bekijk actuele openbare berichten rond ${topic}`,
    instagram:`https://www.instagram.com/explore/search/keyword/?q=${q}`,
    facebook:`https://www.facebook.com/search/top?q=${q}`,
    youtube:`https://www.youtube.com/results?search_query=${q}`,
    newsUrl:rel?.url||""};
});
out.pulse={...(out.pulse||{}),news:out.news.length,live:out.live.length,topics:out.social.length};
await writeJson(DATA_FILE,out);
console.log(`Nieuwsupdate klaar: ${out.news.length} nieuws, ${out.live.length} live`);
