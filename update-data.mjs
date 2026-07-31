
import { chromium } from "playwright";
import fs from "node:fs/promises";

const DATA_FILE = "app-data.json";
const CONFIG_FILE = "standings-config.json";
const now = new Date().toISOString();
const old = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const cfg = JSON.parse(await fs.readFile(CONFIG_FILE, "utf8"));

const out = {
  ...old,
  updatedAt: now,
  news: [],
  social: [],
  live: [],
  status: [],
  catalog: old.catalog || [],
  teams: old.teams || {},
  competitions: old.competitions || []
};

const clean = (s="") => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const uniq = (arr, key) => [...new Map(arr.filter(Boolean).map(x => [key(x), x])).values()];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchText(url) {
  const r = await fetch(url, {headers: {"user-agent": "Mozilla/5.0 HandbalHub/12.0"}});
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function xmlItems(xml, source) {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  const value = (block, tag) => clean(((block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")) || [])[1] || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
  return blocks.map(block => ({
    title: value(block, "title"),
    url: value(block, "link"),
    date: value(block, "pubDate") || now,
    summary: value(block, "description"),
    source: value(block, "source") || source,
    category: "Nieuws",
    image: ""
  })).filter(x => x.title && x.url);
}

async function addFeed(name, url) {
  try {
    out.news.push(...xmlItems(await fetchText(url), name));
    out.status.push({name, ok:true, type:"news"});
  } catch (e) {
    out.status.push({name, ok:false, type:"news", message:String(e.message||e)});
  }
}

for (const [name,url] of [
  ["Handbal Inside","https://www.handbalinside.nl/feed/"],
  ["Handbal Startpunt","https://www.handbalstartpunt.nl/feed/"],
  ["Handbal.nl","https://handbal.nl/feed/"],
  ["HandbalOost","https://handbaloost.nl/feed/"],
  ["Super Handball League","https://superhandballeague.com/feed/"]
]) await addFeed(name,url);

for (const query of ["Nederlands handbal","TeamNL handbal","Super Handball League","handbal transfer Nederland","handbal uitslag Nederland"]) {
  await addFeed(`Google Nieuws: ${query}`, `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=nl&gl=NL&ceid=NL:nl`);
}

out.news = uniq(out.news, x => x.title.toLowerCase())
  .sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,80);

const browser = await chromium.launch({headless:true});

async function enrich(article) {
  let page;
  try {
    page = await browser.newPage();
    await page.goto(article.url, {waitUntil:"domcontentloaded", timeout:22000});
    const meta = await page.evaluate(() => ({
      image: document.querySelector('meta[property="og:image"]')?.content ||
             document.querySelector('meta[name="twitter:image"]')?.content || "",
      description: document.querySelector('meta[property="og:description"]')?.content ||
                   document.querySelector('meta[name="description"]')?.content || ""
    }));
    if (meta.image) article.image = meta.image;
    if (meta.description && (!article.summary || article.summary.length < 60)) article.summary = clean(meta.description).slice(0,320);
  } catch {} finally { if(page) await page.close().catch(()=>{}); }
}
for (const n of out.news.slice(0,20)) await enrich(n);

// ---------- standings discovery ----------
function deepArrays(value, found=[], path="root") {
  if (Array.isArray(value)) {
    if (value.length >= 2 && value.every(x => x && typeof x === "object")) found.push({path, value});
    value.forEach((x,i) => deepArrays(x, found, `${path}[${i}]`));
  } else if (value && typeof value === "object") {
    for (const [k,v] of Object.entries(value)) deepArrays(v, found, `${path}.${k}`);
  }
  return found;
}
const get = (o, keys) => {
  for (const key of keys) if (o && o[key] != null && String(o[key]).trim() !== "") return clean(o[key]);
  return "";
};
function normalizeStandingArray(arr) {
  return arr.map((o,i) => ({
    position: get(o,["position","positie","rank","ranking","place","plaats","volgorde"]) || String(i+1),
    team: get(o,["team","teamName","teamnaam","name","naam","vereniging","club"]),
    played: get(o,["played","gespeeld","gamesPlayed","wedstrijden","g"]),
    points: get(o,["points","punten","pts","p"]),
    won: get(o,["won","gewonnen","w"]),
    draw: get(o,["draw","drawn","gelijk","g"]),
    lost: get(o,["lost","verloren","v"]),
    diff: get(o,["difference","doelsaldo","goalDifference","saldo","+/-"])
  })).filter(x => x.team);
}
function scoreStanding(rows, target) {
  if (rows.length < 4) return 0;
  let score = rows.filter(r => r.team).length;
  if (rows.some(r => /helius|quintus|aalsmeer|volendam/i.test(r.team))) score += 10;
  if (target && rows.some(r => r.team.toLowerCase().includes(target.club.toLowerCase()))) score += 30;
  if (rows.some(r => r.points !== "")) score += 8;
  return score;
}
function normalizeDomTable(table) {
  return table.rows.map((r,i) => ({
    position:r[0]||String(i+1), team:r[1]||"", played:r[2]||"", points:r[3]||"",
    won:r[4]||"", draw:r[5]||"", lost:r[6]||"", diff:r[9]||r[7]||""
  })).filter(x=>x.team);
}
async function extractPool(url, target) {
  const page = await browser.newPage({viewport:{width:1400,height:1100}});
  const jsonPayloads = [];
  page.on("response", async response => {
    try {
      const type = response.headers()["content-type"] || "";
      if (/json|graphql/i.test(type) || /api|stand|ranking|competition|pool|poule/i.test(response.url())) {
        const text = await response.text();
        if (/^\s*[\[{]/.test(text) && text.length < 5_000_000) jsonPayloads.push({url:response.url(), data:JSON.parse(text)});
      }
    } catch {}
  });
  try {
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForTimeout(3500);
    const tabTexts = ["Stand","Standen","Ranglijst"];
    for (const label of tabTexts) {
      const loc = page.getByText(label,{exact:false}).first();
      if (await loc.count()) { await loc.click({timeout:3000}).catch(()=>{}); await page.waitForTimeout(1800); }
    }
    const tables = await page.locator("table").evaluateAll(ts => ts.map(t => ({
      headers:[...t.querySelectorAll("th")].map(x=>(x.textContent||"").trim()),
      rows:[...t.querySelectorAll("tbody tr")].map(tr=>[...tr.querySelectorAll("td")].map(x=>(x.textContent||"").replace(/\s+/g," ").trim()))
    })));
    const candidates = [];
    for (const t of tables) {
      const rows = normalizeDomTable(t);
      if (rows.length) candidates.push({rows, method:"table"});
    }
    for (const payload of jsonPayloads) {
      for (const arr of deepArrays(payload.data)) {
        const rows = normalizeStandingArray(arr.value);
        if (rows.length >= 4) candidates.push({rows, method:"json", endpoint:payload.url});
      }
    }
    candidates.sort((a,b)=>scoreStanding(b.rows,target)-scoreStanding(a.rows,target));
    const best = candidates[0];
    return best && scoreStanding(best.rows,target) >= 6 ? {...best, url} : null;
  } finally { await page.close().catch(()=>{}); }
}

async function discoverPoolLinks(target) {
  const candidates = new Set();
  for (const sourceUrl of cfg.sourcePages) {
    const page = await browser.newPage({viewport:{width:1400,height:1000}});
    try {
      await page.goto(sourceUrl,{waitUntil:"domcontentloaded",timeout:45000});
      await page.waitForTimeout(3000);
      // Try every plausible search input.
      const inputs = page.locator('input[type="search"], input[placeholder*="zoek" i], input[type="text"]');
      for (let i=0;i<Math.min(await inputs.count(),4);i++) {
        const input=inputs.nth(i);
        await input.fill(target.club).catch(()=>{});
        await input.press("Enter").catch(()=>{});
        await page.waitForTimeout(2200);
      }
      const links = await page.locator('a[href*="competitie-poule"],a[href*="pool="],a[href*="poule"]').evaluateAll(as =>
        as.map(a=>({url:a.href,text:(a.textContent||"").replace(/\s+/g," ").trim()}))
      );
      for (const l of links) {
        if (/pool=|competitie-poule/i.test(l.url)) candidates.add(l.url);
      }
      // Links whose nearby text includes the team/club receive priority by insertion first.
      const relevant = links.filter(l => `${l.text}`.toLowerCase().includes(target.club.toLowerCase()));
      for (const l of relevant.reverse()) { candidates.delete(l.url); candidates.add(l.url); }
    } catch {} finally { await page.close().catch(()=>{}); }
  }
  // Existing URLs from old data/catalog are always attempted.
  for (const item of out.catalog || []) {
    if (item.poolUrl && (item.id===target.id || `${item.club} ${item.team}`.toLowerCase().includes(target.club.toLowerCase()))) candidates.add(item.poolUrl);
  }
  return [...candidates].slice(0,40);
}

const targets = uniq([
  ...(cfg.teams||[]),
  ...(out.catalog||[]).map(x=>({id:x.id,club:x.club||"",team:x.team||"",competition:x.competition||"",poolUrl:x.poolUrl||""}))
].filter(x=>x.id&&x.club), x=>x.id);

for (const target of targets) {
  const links = await discoverPoolLinks(target);
  let result = null, matchedUrl = "";
  for (const url of links) {
    const r = await extractPool(url,target).catch(()=>null);
    if (r && r.rows.some(row=>row.team.toLowerCase().includes(target.club.toLowerCase()))) {
      result=r; matchedUrl=url; break;
    }
    if (!result && r) { result=r; matchedUrl=url; }
  }
  const existing = out.teams[target.id] || {};
  if (result?.rows?.length) {
    const own = result.rows.find(r=>r.team.toLowerCase().includes(target.club.toLowerCase()));
    out.teams[target.id] = {
      ...existing,
      standing:result.rows,
      position:own?.position||existing.position||null,
      points:own?.points||existing.points||null,
      played:own?.played||existing.played||null,
      updatedAt:now,
      sourceUrl:matchedUrl,
      extractionMethod:result.method
    };
    const cat = out.catalog.find(x=>x.id===target.id);
    if (cat) cat.poolUrl=matchedUrl;
    else out.catalog.push({...target,poolUrl:matchedUrl});
    out.status.push({name:`Stand ${target.club} ${target.team}`,ok:true,type:"standings",sourceUrl:matchedUrl});
  } else {
    out.status.push({name:`Stand ${target.club} ${target.team}`,ok:false,type:"standings",message:"Geen openbare stand gevonden; laatst bekende gegevens behouden."});
  }
}

// Confirm actual live anchors; no fake live count.
try {
  const page=await browser.newPage();
  await page.goto("https://superhandballeague.tv/live",{waitUntil:"domcontentloaded",timeout:35000});
  await page.waitForTimeout(2500);
  out.live=await page.locator("a").evaluateAll(as=>as.map(a=>({title:(a.textContent||"").trim(),url:a.href}))
    .filter(x=>x.title&&/\blive\b|kijk live|watch live/i.test(x.title)).slice(0,10));
  out.live=uniq(out.live,x=>x.url).map(x=>({...x,source:"SHL TV",confirmed:true}));
  await page.close();
} catch {}

await browser.close();

out.social=["TeamNL","SHL","transfers","jeugd","beach","beker"].map(topic=>{
  const rel=out.news.find(n=>(n.title+" "+n.summary).toLowerCase().includes(topic.toLowerCase()));
  const q=encodeURIComponent(topic+" handbal");
  return {topic,preview:rel?.title||`Bekijk actuele openbare berichten rond ${topic}`,
    instagram:`https://www.instagram.com/explore/search/keyword/?q=${q}`,
    facebook:`https://www.facebook.com/search/top?q=${q}`,
    youtube:`https://www.youtube.com/results?search_query=${q}`,
    newsUrl:rel?.url||""};
});

out.competitions = uniq([
  ...(old.competitions||[]),
  ...out.catalog.filter(x=>x.poolUrl).map(x=>({id:x.id,name:x.competition||x.club,sourceUrl:x.poolUrl,poolUrl:x.poolUrl}))
],x=>x.id);

out.pulse={
  matches:Object.values(out.teams||{}).flatMap(t=>t.matches||[]).length,
  news:out.news.length,live:out.live.length,topics:out.social.length
};
await fs.writeFile(DATA_FILE,JSON.stringify(out,null,2));
console.log(`HandbalHub 12: ${out.news.length} nieuws, ${out.live.length} live, ${out.status.filter(x=>x.type==="standings"&&x.ok).length} standen bijgewerkt`);
