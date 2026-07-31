
import { chromium } from "playwright";
import fs from "node:fs/promises";

const DATA_FILE = "app-data.json";
const now = new Date().toISOString();
const old = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const out = {
  ...old,
  updatedAt: now,
  news: [],
  social: [],
  live: [],
  status: [],
  catalog: old.catalog || [],
  teams: old.teams || {}
};

const clean = (s="") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const uniq = (arr, key) => [...new Map(arr.filter(Boolean).map(x => [key(x), x])).values()];

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {"user-agent": "Mozilla/5.0 HandbalHub/10.0 (+GitHub Actions)"}
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function xmlItems(xml, defaultSource) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  const value = (block, tag) => {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    return clean((match?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
  };
  return items.map(block => ({
    title: value(block, "title"),
    url: value(block, "link"),
    date: value(block, "pubDate") || now,
    summary: value(block, "description"),
    source: value(block, "source") || defaultSource,
    category: "Nieuws",
    image: ""
  })).filter(x => x.title && x.url);
}

async function addFeed(name, url) {
  try {
    out.news.push(...xmlItems(await fetchText(url), name));
    out.status.push({name, ok: true});
  } catch (error) {
    out.status.push({name, ok: false, message: String(error.message || error)});
  }
}

const feeds = [
  ["Handbal Inside", "https://www.handbalinside.nl/feed/"],
  ["Handbal Startpunt", "https://www.handbalstartpunt.nl/feed/"],
  ["Handbal.nl", "https://handbal.nl/feed/"],
  ["HandbalOost", "https://handbaloost.nl/feed/"],
  ["Super Handball League", "https://superhandballeague.com/feed/"]
];

for (const feed of feeds) await addFeed(...feed);

const newsQueries = [
  "Nederlands handbal",
  "TeamNL handbal",
  "Super Handball League",
  "handbal transfer Nederland",
  "handbal uitslag Nederland"
];

for (const query of newsQueries) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=nl&gl=NL&ceid=NL:nl`;
  await addFeed(`Google Nieuws: ${query}`, url);
}

out.news = uniq(out.news, x => x.title.toLowerCase())
  .sort((a,b) => new Date(b.date) - new Date(a.date))
  .slice(0, 80);

const browser = await chromium.launch({headless: true});

async function enrichArticle(article) {
  try {
    const page = await browser.newPage();
    await page.goto(article.url, {waitUntil: "domcontentloaded", timeout: 25000});
    const meta = await page.evaluate(() => ({
      image:
        document.querySelector('meta[property="og:image"]')?.content ||
        document.querySelector('meta[name="twitter:image"]')?.content ||
        "",
      description:
        document.querySelector('meta[property="og:description"]')?.content ||
        document.querySelector('meta[name="description"]')?.content ||
        ""
    }));
    await page.close();
    if (meta.image) article.image = meta.image;
    if (meta.description && (!article.summary || article.summary.length < 60)) {
      article.summary = clean(meta.description).slice(0, 320);
    }
  } catch {}
}

for (const article of out.news.slice(0, 24)) await enrichArticle(article);

// Confirmed live links only. A general SHL TV landing page is not labelled as live.
try {
  const page = await browser.newPage();
  await page.goto("https://superhandballeague.tv/live", {
    waitUntil: "domcontentloaded",
    timeout: 35000
  });
  await page.waitForTimeout(2500);
  const liveItems = await page.locator("a").evaluateAll(anchors =>
    anchors.map(a => ({title: (a.textContent || "").trim(), url: a.href}))
      .filter(x => x.title && /\blive\b|kijk live|watch live/i.test(x.title))
      .slice(0, 10)
  );
  out.live = uniq(liveItems, x => x.url).map(x => ({
    ...x,
    source: "SHL TV",
    confirmed: true
  }));
  out.status.push({name: "SHL TV", ok: true});
  await page.close();
} catch (error) {
  out.status.push({name: "SHL TV", ok: false, message: String(error.message || error)});
}

// Best-effort discovery of public Handbal.nl pool links.
// If the site exposes none in rendered HTML, the previous catalog remains intact.
try {
  const page = await browser.newPage();
  await page.goto("https://handbal.nl/programma-uitslagen-standen/", {
    waitUntil: "networkidle",
    timeout: 45000
  });
  await page.waitForTimeout(4000);
  const poolLinks = await page.locator('a[href*="competitie-poule"][href*="pool="]')
    .evaluateAll(anchors => anchors.map(a => ({
      name: (a.textContent || "").trim(),
      url: a.href
    })));
  if (poolLinks.length) {
    const discovered = uniq(poolLinks, x => x.url).map((x, index) => {
      const pool = new URL(x.url).searchParams.get("pool") || String(index);
      return {
        id: `pool-${pool}`,
        club: x.name || `Poule ${pool}`,
        team: "",
        competition: x.name || `Poule ${pool}`,
        poolUrl: x.url
      };
    });
    out.catalog = uniq([...(old.catalog || []), ...discovered], x => x.id);
  }
  out.status.push({name: "Handbal.nl competities", ok: true});
  await page.close();
} catch (error) {
  out.status.push({
    name: "Handbal.nl competities",
    ok: false,
    message: String(error.message || error)
  });
}

// Attempt to update standings for catalog entries that already contain a poolUrl.
// Existing data is preserved when parsing fails.
for (const item of out.catalog.filter(x => x.poolUrl).slice(0, 30)) {
  try {
    const page = await browser.newPage();
    await page.goto(item.poolUrl, {waitUntil: "networkidle", timeout: 45000});
    await page.waitForTimeout(4500);
    const tables = await page.locator("table").evaluateAll(tables =>
      tables.map(table => ({
        headers: [...table.querySelectorAll("th")].map(x => (x.textContent || "").trim()),
        rows: [...table.querySelectorAll("tbody tr")].map(row =>
          [...row.querySelectorAll("td")].map(x => (x.textContent || "").trim())
        )
      }))
    );
    const table = tables.find(t =>
      t.rows.length >= 2 &&
      (t.headers.some(h => /team|vereniging|ploeg/i.test(h)) || t.rows[0]?.length >= 4)
    );
    if (table) {
      const standing = table.rows.map((row, i) => ({
        position: row[0] || String(i + 1),
        team: row[1] || "",
        played: row[2] || "",
        points: row[3] || "",
        diff: row[9] || row[4] || ""
      })).filter(x => x.team);
      if (standing.length) {
        out.teams[item.id] = {
          ...(out.teams[item.id] || {}),
          standing,
          updatedAt: now
        };
      }
    }
    await page.close();
  } catch {}
}

await browser.close();

const topics = ["TeamNL", "SHL", "transfers", "jeugd", "beach", "beker"];
out.social = topics.map(topic => {
  const related = out.news.filter(n =>
    `${n.title} ${n.summary}`.toLowerCase().includes(topic.toLowerCase())
  ).slice(0, 2);
  const q = encodeURIComponent(`${topic} handbal`);
  return {
    topic,
    preview: related[0]?.title || `Bekijk actuele openbare berichten rond ${topic}`,
    instagram: `https://www.instagram.com/explore/search/keyword/?q=${q}`,
    facebook: `https://www.facebook.com/search/top?q=${q}`,
    youtube: `https://www.youtube.com/results?search_query=${q}`,
    newsUrl: related[0]?.url || ""
  };
});


out.competitions = [...new Map([
  ...(old.competitions || []),
  ...out.catalog.filter(x => x.poolUrl).map(x => ({
    id: x.id,
    name: x.competition || x.club || x.id,
    sourceUrl: x.poolUrl,
    poolUrl: x.poolUrl
  }))
].map(x => [x.id, x])).values()];

out.pulse = {
  matches: Object.values(out.teams || {}).flatMap(t => t.matches || []).length,
  news: out.news.length,
  live: out.live.length,
  topics: out.social.length
};

await fs.writeFile(DATA_FILE, JSON.stringify(out, null, 2));
console.log(`HandbalHub 10.0: ${out.news.length} artikelen, ${out.live.length} bevestigde live-items, ${out.catalog.length} catalogusitems`);
