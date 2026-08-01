
import fs from "node:fs/promises";

const sources = JSON.parse(await fs.readFile("sources.json", "utf8"));
const previous = JSON.parse(await fs.readFile("news.json", "utf8"));
const now = new Date().toISOString();

const decode = input => String(input || "")
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const tag = (block, name) => {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decode(match?.[1] || "");
};

const category = value => {
  const t = value.toLowerCase();
  if (/teamnl|oranje|nederland|wk|ek/.test(t)) return "TeamNL";
  if (/transfer|contract|versterk/.test(t)) return "Transfers";
  if (/shl|super handball/.test(t)) return "SHL";
  if (/jeugd|u17|u18|u19|u20/.test(t)) return "Jeugd";
  if (/beach/.test(t)) return "Beach";
  if (/scheids|arbitrage/.test(t)) return "Arbitrage";
  if (/opleiding|cursus/.test(t)) return "Opleidingen";
  if (/beker|competitie|programma|uitslag/.test(t)) return "Competitie";
  return "Nieuws";
};

const priority = (item) => {
  const t = `${item.title} ${item.summary}`.toLowerCase();
  let p = 50;
  if (/breaking|direct|liveblog/.test(t)) p += 35;
  if (/live|livestream/.test(t)) p += 30;
  if (/teamnl|oranje|nederland/.test(t)) p += 20;
  if (/transfer|contract/.test(t)) p += 10;
  if (/regionaal|helius|hellevoet|oost/.test(t)) p += 4;
  return p;
};

const resolveGoogleNews = async url => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {"user-agent":"Mozilla/5.0 HandbalHub/4.0"},
      signal: AbortSignal.timeout(12000)
    });
    const canonical = response.url;
    if (/^https?:\/\//.test(canonical) && !canonical.includes("news.google.com")) return canonical;
    const html = await response.text();
    const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)
      || html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
    return match?.[1] || url;
  } catch {
    return url;
  }
};

const parseRss = async (xml, sourceName, sourceType="news") => {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(x => x[1]);
  const items = [];
  for (const block of blocks.slice(0, 30)) {
    const title = tag(block, "title");
    let url = tag(block, "link");
    const summary = tag(block, "description").slice(0, 320);
    const date = tag(block, "pubDate") || now;
    const source = tag(block, "source") || sourceName;
    const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)/i)?.[1] || "";
    if (!title || !/^https?:\/\//.test(url)) continue;
    if (url.includes("news.google.com")) url = await resolveGoogleNews(url);
    const item = {
      id: Buffer.from(`${source}|${title}`).toString("base64url").slice(0, 50),
      type: sourceType,
      title,
      summary,
      source,
      category: category(`${title} ${summary}`),
      date,
      url,
      image: enclosure,
      priority: 0
    };
    item.priority = priority(item);
    items.push(item);
  }
  return items;
};

const collected = [];
for (const source of sources.news) {
  try {
    const response = await fetch(source.feed, {
      headers: {"user-agent":"Mozilla/5.0 HandbalHub/4.0"},
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(String(response.status));
    collected.push(...await parseRss(await response.text(), source.name));
    console.log(`${source.name}: OK`);
  } catch (error) {
    console.log(`${source.name}: overgeslagen (${error.message})`);
  }
}

for (const query of sources.googleNewsQueries) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query.query)}&hl=nl&gl=NL&ceid=NL:nl`;
    const response = await fetch(url, {
      headers: {"user-agent":"Mozilla/5.0 HandbalHub/4.0"},
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(String(response.status));
    collected.push(...await parseRss(await response.text(), query.name));
    console.log(`${query.name}: OK`);
  } catch (error) {
    console.log(`${query.name}: overgeslagen (${error.message})`);
  }
}

const previousItems = Array.isArray(previous.items) ? previous.items : [];
const combined = [...collected, ...previousItems];
const unique = [...new Map(combined.map(item => [item.url || item.title.toLowerCase(), item])).values()]
  .filter(item => item.title && item.url)
  .sort((a,b) => (b.priority||0)-(a.priority||0) || new Date(b.date)-new Date(a.date))
  .slice(0, 160);

if (collected.length < 5) {
  console.log(`Update afgekeurd: slechts ${collected.length} nieuwe items. Bestaand news.json blijft staan.`);
  process.exit(0);
}

await fs.writeFile("news.json", JSON.stringify({updatedAt:now,items:unique}, null, 2));
console.log(`news.json: ${unique.length} items`);
