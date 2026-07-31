const SOURCES = [
  { name: 'Handbal Inside', key: 'handbalinside', base: 'https://www.handbalinside.nl', feeds: ['https://www.handbalinside.nl/feed/'] },
  { name: 'Handbal Startpunt', key: 'handbalstartpunt', base: 'https://www.handbalstartpunt.nl', feeds: ['https://www.handbalstartpunt.nl/feed/'] },
  { name: 'Handbal.nl', key: 'handbalnl', base: 'https://handbal.nl', feeds: ['https://handbal.nl/feed/'] },
  { name: 'HandbalOost', key: 'handbaloost', base: 'https://handbaloost.nl', feeds: ['https://handbaloost.nl/feed/'] },
  { name: 'Super Handball League', key: 'shl', base: 'https://superhandballeague.com', feeds: ['https://superhandballeague.com/feed/'] },
  { name: 'Groot Hellevoet', key: 'groothellevoet', base: 'https://www.groothellevoet.nl', feeds: ['https://www.groothellevoet.nl/rss', 'https://www.groothellevoet.nl/feed/'] }
];

const decode = s => (s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const first = (text, re) => (text.match(re) || [,''])[1] || '';
const absolute = (url, base) => { try { return new URL(url, base).href; } catch { return base; } };
const category = title => {
  const t = title.toLowerCase();
  if (/teamnl|oranje|nederland|wk|ek|ihf|ehf/.test(t)) return 'TeamNL';
  if (/transfer|contract|versterkt|naar /.test(t)) return 'Transfers';
  if (/beach/.test(t)) return 'Beach Handball';
  if (/super handball|shl|eredivisie/.test(t)) return 'Super Handball League';
  if (/jeugd|u17|u18|u19|u20|a-jeugd|b-jeugd|c-jeugd/.test(t)) return 'Jeugdhandbal';
  if (/scheids|arbitrage|spelregel/.test(t)) return 'Arbitrage en spelregels';
  if (/club|vereniging|helius/.test(t)) return 'Verenigingsnieuws';
  return 'Algemeen';
};
function parseRss(xml, source) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(m => m[0]);
  return blocks.slice(0, 15).map((b, i) => {
    const title = decode(first(b, /<title[^>]*>([\s\S]*?)<\/title>/i));
    const linkTag = first(b, /<link[^>]*>([\s\S]*?)<\/link>/i);
    const linkHref = first(b, /<link[^>]+href=["']([^"']+)["']/i);
    const url = absolute(decode(linkHref || linkTag), source.base);
    const description = decode(first(b, /<(description|summary|content:encoded)[^>]*>([\s\S]*?)<\/\1>/i).split('>').pop());
    const date = decode(first(b, /<(pubDate|published|updated)[^>]*>([\s\S]*?)<\/\1>/i).split('>').pop());
    const image = first(b, /<(?:media:content|enclosure)[^>]+url=["']([^"']+)["']/i) || first(b, /<img[^>]+src=["']([^"']+)["']/i);
    return { id: `${source.key}-${Buffer.from(url || title).toString('base64url').slice(0,24)}-${i}`, title, summary: description.slice(0, 220), source: source.name, sourceKey: source.key, date: date || new Date().toISOString(), category: category(title), url, image: image ? absolute(image, source.base) : '' };
  }).filter(x => x.title && x.url);
}
function parseJsonLd(html, source) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const raw = JSON.parse(m[1]);
      const queue = Array.isArray(raw) ? raw : [raw];
      for (const obj of queue) {
        const list = obj?.itemListElement || (obj?.['@graph'] || []);
        for (const entry of list) {
          const item = entry?.item || entry;
          const title = item?.headline || item?.name;
          const url = item?.url || item?.mainEntityOfPage?.['@id'];
          if (title && url) out.push({ id:`${source.key}-${Buffer.from(url).toString('base64url').slice(0,24)}`, title:decode(title), summary:decode(item.description||'').slice(0,220), source:source.name, sourceKey:source.key, date:item.datePublished||item.dateModified||new Date().toISOString(), category:category(title), url:absolute(url,source.base), image:Array.isArray(item.image)?item.image[0]:(item.image?.url||item.image||'') });
        }
      }
    } catch {}
  }
  return out;
}
function parseLinks(html, source) {
  const out=[]; const seen=new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url=absolute(m[1],source.base), title=decode(m[2]);
    if (title.length<25 || title.length>180 || seen.has(url) || !url.startsWith(source.base)) continue;
    if (/contact|privacy|login|agenda|stand|programma|home/i.test(title)) continue;
    seen.add(url); out.push({id:`${source.key}-${Buffer.from(url).toString('base64url').slice(0,24)}`,title,summary:'Lees het volledige bericht bij de oorspronkelijke bron.',source:source.name,sourceKey:source.key,date:new Date().toISOString(),category:category(title),url,image:''});
    if(out.length>=10) break;
  }
  return out;
}
async function fetchText(url) {
  const r = await fetch(url,{headers:{'user-agent':'HandbalNieuwsNederland/1.0 (+news aggregator; links to original sources)','accept':'application/rss+xml,application/xml,text/xml,text/html;q=0.9,*/*;q=0.8'},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error(`${r.status}`); return {text:await r.text(),type:r.headers.get('content-type')||''};
}
async function sourceNews(source){
  for(const feed of source.feeds){ try{const {text}=await fetchText(feed); const a=parseRss(text,source); if(a.length) return {articles:a,status:'rss'};}catch{} }
  try{const {text}=await fetchText(source.base); const a=[...parseJsonLd(text,source),...parseLinks(text,source)]; const unique=[...new Map(a.map(x=>[x.url,x])).values()]; return {articles:unique.slice(0,12),status:'website'};}catch(e){return {articles:[],status:'unavailable'};}
}
exports.handler = async () => {
  const results = await Promise.all(SOURCES.map(async s=>({source:s.name,...await sourceNews(s)})));
  const articles=[...new Map(results.flatMap(r=>r.articles).map(a=>[a.url,a])).values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,60);
  return {statusCode:200,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'},body:JSON.stringify({updatedAt:new Date().toISOString(),articles,sources:results.map(r=>({source:r.source,status:r.status,count:r.articles.length}))})};
};
