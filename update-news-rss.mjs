
import fs from "node:fs/promises";

const TARGET = "news.json";
const feeds = [
  ["Handbal Inside", "https://www.handbalinside.nl/feed/"],
  ["Handbal Startpunt", "https://www.handbalstartpunt.nl/feed/"],
  ["Handbal.nl", "https://handbal.nl/feed/"],
  ["HandbalOost", "https://handbaloost.nl/feed/"],
  ["Super Handball League", "https://superhandballeague.com/feed/"]
];

const decode = value => String(value || "")
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const pick = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decode(match?.[1] || "");
};

const category = text => {
  const value = text.toLowerCase();
  if (/teamnl|oranje|nederland|wk|ek/.test(value)) return "TeamNL";
  if (/transfer|contract|versterk/.test(value)) return "Transfers";
  if (/shl|super handball/.test(value)) return "SHL";
  if (/jeugd|u17|u18|u19|u20/.test(value)) return "Jeugd";
  if (/beach/.test(value)) return "Beach";
  if (/beker|competitie|programma|uitslag/.test(value)) return "Competitie";
  return "Algemeen";
};

const parseFeed = (xml, source) => {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => match[1]);
  return blocks.map(block => {
    const title = pick(block, "title");
    const url = pick(block, "link");
    const summary = pick(block, "description");
    const date = pick(block, "pubDate") || new Date().toISOString();
    return {
      id: Buffer.from(`${source}|${title}`).toString("base64url").slice(0, 48),
      title,
      summary: summary.slice(0, 320),
      source,
      category: category(`${title} ${summary}`),
      date,
      url,
      image: ""
    };
  }).filter(item => item.title && /^https?:\/\//.test(item.url));
};

const previous = JSON.parse(await fs.readFile(TARGET, "utf8"));
const collected = [];

for (const [source, url] of feeds) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "HandbalHub/3.0 (+GitHub Actions)" },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`${response.status}`);
    collected.push(...parseFeed(await response.text(), source));
    console.log(`${source}: opgehaald`);
  } catch (error) {
    console.warn(`${source}: overgeslagen (${error.message})`);
  }
}

const unique = [...new Map(collected.map(item => [item.title.toLowerCase(), item])).values()]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 100);

if (unique.length < 3) {
  console.log(`Geen veilige update: slechts ${unique.length} artikelen gevonden. Bestaand news.json blijft staan.`);
  process.exit(0);
}

await fs.writeFile(TARGET, JSON.stringify({
  version: 1,
  updatedAt: new Date().toISOString(),
  items: unique
}, null, 2));

console.log(`news.json bijgewerkt met ${unique.length} artikelen.`);
