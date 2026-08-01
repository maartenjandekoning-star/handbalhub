const FALLBACK=[{"title": "Heren U20 pakken de titel op het EHF Championship 2026", "source": "Handbal.nl", "category": "TeamNL", "date": "2026-07-19T12:00:00+02:00", "url": "https://handbal.nl/heren-u20-pakken-de-titel-op-het-ehf-championship-2026/", "summary": "De Nederlandse Heren U20 veroverden de titel op het EHF Championship in Kosovo.", "image": ""}, {"title": "Brons Oranje op EHF Beach Handball Championship", "source": "Handbal Inside", "category": "Beach", "date": "2026-07-12T12:00:00+02:00", "url": "https://www.handbalinside.nl/brons-oranje-op-ehf-beach-handball-championship/", "summary": "De Nederlandse beachhandbalheren veroverden brons en verzekerden zich van deelname aan het EK.", "image": ""}, {"title": "Nederlands Handbal Verbond en Medigros verlengen samenwerking", "source": "Handbal.nl", "category": "Officieel", "date": "2026-07-22T10:00:00+02:00", "url": "https://handbal.nl/het-nederlands-handbal-verbond-en-medigros-verlengen-succesvolle-samenwerking/", "summary": "De samenwerking rond de nationale selecties en jeugdselecties wordt voortgezet.", "image": ""}];

const SOURCES=[
 {name:"Handbal.nl",kind:"rss",url:"https://handbal.nl/feed/"},
 {name:"Handbal Inside",kind:"rss",url:"https://www.handbalinside.nl/feed/"},
 {name:"Handbal Startpunt",kind:"page",url:"https://www.handbalstartpunt.nl/nieuws/",base:"https://www.handbalstartpunt.nl"},
 {name:"HandbalOost",kind:"rss",url:"https://handbaloost.nl/feed/"},
 {name:"Super Handball League",kind:"rss",url:"https://superhandballeague.com/feed/"},
 {name:"Groot Hellevoet",kind:"rss",url:"https://news.google.com/rss/search?q=site%3Agroothellevoet.nl%20handbal&hl=nl&gl=NL&ceid=NL%3Anl"},
 {name:"NOS Sport",kind:"rss",url:"https://news.google.com/rss/search?q=site%3Anos.nl%20handbal&hl=nl&gl=NL&ceid=NL%3Anl"},
 {name:"NU.nl Sport",kind:"rss",url:"https://news.google.com/rss/search?q=site%3Anu.nl%20handbal&hl=nl&gl=NL&ceid=NL%3Anl"},
 {name:"Google Nieuws",kind:"rss",url:"https://news.google.com/rss/search?q=%22handbal%22%20Nederland&hl=nl&gl=NL&ceid=NL%3Anl"}
];

const RSS2JSON="https://api.rss2json.com/v1/api.json?rss_url=";
const ALLORIGINS="https://api.allorigins.win/raw?url=";
const CORSPROXY="https://corsproxy.io/?url=";

let items=[],filter="Alles",olderVisible=30;
let interest=JSON.parse(localStorage.getItem("hh61_interest")||"{}");
let pools=JSON.parse(localStorage.getItem("hh61_pools")||"[]");
let status={};

let currentTab="news";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const strip=s=>{const d=document.createElement("div");d.innerHTML=s||"";return(d.textContent||"").replace(/\s+/g," ").trim()};
function validNewsDate(value){
 if(!value) return "";
 const d=new Date(value);
 if(isNaN(d.getTime())) return "";
 // reject implausible future dates; never replace missing dates with fetch time
 if(d.getTime()>Date.now()+12*60*60*1000) return "";
 return d.toISOString();
}
const hasReliableDate=x=>!!x.date&&!isNaN(new Date(x.date).getTime());
const fmt=d=>{if(!d)return "Datum onbekend";const x=new Date(d);return isNaN(x)?"Datum onbekend":x.toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})};
const daysAgo=d=>{if(!d)return Infinity;const t=new Date(d).getTime();return isNaN(t)?Infinity:(Date.now()-t)/86400000};

function category(t=""){
 t=t.toLowerCase();
 if(/transfer|contract|versterk|keert terug|haalt .*speler|nieuwe speler/.test(t))return"Transfers";
 if(/shl|super handball|bevo|volendam|aalsmeer|hurry-up|lions/.test(t))return"SHL";
 if(/beach/.test(t))return"Beach";
 if(/jeugd|u17|u18|u19|u20/.test(t)&&!/oranje|nederland|teamnl/.test(t))return"Jeugd";
 if(/beker|competitie|programma|uitslag|stand/.test(t))return"Competitie";
 if(/helius|hellevoet|handbaloost|oost-nederland|regionaal/.test(t))return"Regionaal";
 // TeamNL deliberately strict:
 if(/teamnl|oranje|nederlands(e)? selectie|nationale selectie/.test(t))return"TeamNL";
 if(/\b(wk|ek)\b/.test(t)&&/nederland|oranje|teamnl/.test(t))return"TeamNL";
 return"Nieuws"
}
function excluded(title=""){return /privacy|cookie|algemene voorwaarden|contact|over ons|disclaimer|vacature|adverteren|nieuwsbrief/i.test(title)}
function avatar(s){return(s||"HH").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function imageFromHtml(html=""){const m=html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)/i);return m?.[1]||""}
function normalize(it,source){
 let image=it.thumbnail||it.enclosure?.link||it.enclosure?.thumbnail||imageFromHtml(it.description||it.content||"");
 let title=strip(it.title),summary=strip(it.description||it.content).slice(0,300);
 return {title,summary,source,category:category(title+" "+summary),date:validNewsDate(it.pubDate||it.published||it.updated||it["dc:date"]||it.date),url:it.link||it.url,image};
}
async function withTimeout(p,ms=9000){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))])}
async function rss2json(feed,source){
 const r=await withTimeout(fetch(RSS2JSON+encodeURIComponent(feed),{cache:"no-store"}));
 const j=await r.json();
 if(j.status!=="ok"||!Array.isArray(j.items)||!j.items.length)throw new Error("rss2json");
 return j.items.map(x=>normalize(x,source)).filter(x=>x.title&&x.url&&!excluded(x.title));
}
function parseXml(xml,source){
 const doc=new DOMParser().parseFromString(xml,"text/xml");
 return [...doc.querySelectorAll("item")].map(n=>{
   const get=t=>n.querySelector(t)?.textContent?.trim()||"";
   return normalize({title:get("title"),link:get("link"),pubDate:get("pubDate")||get("published")||get("updated")||get("dc\\:date"),description:get("description"),content:get("content\\:encoded")},source);
 }).filter(x=>x.title&&x.url&&!excluded(x.title));
}
async function proxyText(url,proxy){
 const r=await withTimeout(fetch(proxy+encodeURIComponent(url),{cache:"no-store"}));
 if(!r.ok)throw new Error("proxy");
 return await r.text();
}
async function rssViaFallback(feed,source){
 try{return parseXml(await proxyText(feed,ALLORIGINS),source)}catch{}
 return parseXml(await proxyText(feed,CORSPROXY),source);
}
async function loadRss(s){
 try{const x=await rss2json(s.url,s.name);status[s.name]="ok";return x}catch{}
 try{const x=await rssViaFallback(s.url,s.name);if(x.length){status[s.name]="ok";return x}}catch{}
 status[s.name]="fail";return[];
}

function parseDutchDate(value=""){
 const txt=strip(value).toLowerCase();
 if(!txt)return "";
 const months={januari:0,februari:1,maart:2,april:3,mei:4,juni:5,juli:6,augustus:7,september:8,oktober:9,november:10,december:11,
               jan:0,feb:1,mrt:2,apr:3,mei:4,jun:5,jul:6,aug:7,sep:8,okt:9,nov:10,dec:11};

 // 31 juli 2026 / 31 jul 2026
 let m=txt.match(/\b(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|okt|nov|dec)\s+(\d{4})\b/i);
 if(m){
   const d=new Date(Number(m[3]),months[m[2].toLowerCase()],Number(m[1]),12,0,0);
   return validNewsDate(d.toISOString());
 }

 // 31-07-2026 / 31/07/2026 / 31.07.2026
 m=txt.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})\b/);
 if(m){
   const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),12,0,0);
   return validNewsDate(d.toISOString());
 }

 // ISO date
 m=txt.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
 if(m){
   const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0);
   return validNewsDate(d.toISOString());
 }
 return "";
}

function startpuntFromHtml(html){
 const doc=new DOMParser().parseFromString(html,"text/html"),out=[];
 [...doc.querySelectorAll("a[href]")].forEach(a=>{
   const h=a.querySelector("h1,h2,h3,h4")||a.closest("article,li,div")?.querySelector("h1,h2,h3,h4");
   const title=strip(h?.textContent||a.textContent);
   if(title.length<20||title.length>180||excluded(title))return;
   let url=a.href;if(!/^https?:/.test(url))url=new URL(a.getAttribute("href"),"https://www.handbalstartpunt.nl").href;
   if(!url.startsWith("https://www.handbalstartpunt.nl/"))return;
   const box=a.closest("article,li")||a.parentElement;
   const summary=strip(box?.querySelector("p")?.textContent||"").slice(0,300);
   const image=box?.querySelector("img")?.src||"";
   const articleBox=a.closest("article")||a.closest("li")||a.parentElement;
   const rawDate=
      articleBox?.querySelector("time")?.getAttribute("datetime")||
      articleBox?.querySelector("time")?.textContent||
      articleBox?.querySelector('[itemprop="datePublished"]')?.getAttribute("content")||
      articleBox?.querySelector('[itemprop="datePublished"]')?.getAttribute("datetime")||
      articleBox?.querySelector('[class*="date"],[class*="datum"],[class*="time"]')?.textContent||
      "";
   const surroundingText=strip(articleBox?.textContent||"");
   const articleDate=validNewsDate(rawDate)||parseDutchDate(rawDate)||parseDutchDate(surroundingText);
   out.push({title,summary,source:"Handbal Startpunt",category:category(title+" "+summary),date:articleDate,url,image});
 });
 return [...new Map(out.map(x=>[x.url,x])).values()].slice(0,20);
}
async function loadStartpunt(s){
 for(const proxy of [ALLORIGINS,CORSPROXY]){
   try{const html=await proxyText(s.url,proxy);const x=startpuntFromHtml(html);if(x.length){status[s.name]="ok";return x}}catch{}
 }
 status[s.name]="fail";return[];
}
async function loadSource(s){return s.kind==="page"?loadStartpunt(s):loadRss(s)}
function dedupe(arr){
 const map=new Map();
 for(const x of arr){
   if(!x?.title||!x?.url||excluded(x.title))continue;
   const key=(x.url.replace(/[?#].*$/,"").replace(/\/$/,"")||x.title.toLowerCase());
   if(!map.has(key))map.set(key,x);
 }
 return [...map.values()].sort((a,b)=>(hasReliableDate(b)-hasReliableDate(a))||((new Date(b.date).getTime()||0)-(new Date(a.date).getTime()||0)));
}
function card(x){
 return`<article class="card"><div class="head"><div class="src"><span class="avatar">${esc(avatar(x.source))}</span><span><b>${esc(x.source)}</b><small>${fmt(x.date)}</small></span></div><span class="tag">${esc(x.category)}</span></div><h2>${esc(x.title)}</h2>${x.summary?`<p>${esc(x.summary)}</p>`:""}${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" onerror="this.remove()">`:""}<div class="card-actions"><a data-open="${esc(x.url)}" href="${esc(x.url)}" target="_blank" rel="noopener">Open artikel →</a></div></article>`
}

function normalizeTopicText(value=""){
 return value.toLowerCase()
   .replace(/[-–—:|]/g," ")
   .replace(/[“”‘’'"`]/g,"")
   .replace(/\b(handbal\.nl|handbal inside|handbal startpunt|google nieuws|nos sport|nu\.nl sport)\b/g," ")
   .replace(/\b(wedstrijdblog|liveblog|update|nieuws|handbal)\b/g," ")
   .replace(/\b(de|het|een|en|van|voor|op|in|met|naar|bij|uit|om|te|is|zijn|wordt|werd)\b/g," ")
   .replace(/\s+/g," ")
   .trim();
}

function topicWords(x){
 return new Set(normalizeTopicText(`${x.title} ${x.summary||""}`)
   .split(" ")
   .filter(w=>w.length>=4)
   .slice(0,18));
}

function topicSimilarity(a,b){
 const A=topicWords(a),B=topicWords(b);
 if(!A.size||!B.size)return 0;
 let overlap=0;
 A.forEach(w=>{if(B.has(w))overlap++});
 return overlap/Math.min(A.size,B.size);
}

function sourcePreference(x){
 const s=(x.source||"").toLowerCase();
 if(s.includes("handbal inside"))return 100;
 if(s.includes("handbal.nl"))return 90;
 if(s.includes("handbal startpunt"))return 80;
 if(s.includes("super handball"))return 75;
 if(s.includes("handbaloost"))return 70;
 if(s.includes("groot hellevoet"))return 65;
 if(s.includes("nos"))return 60;
 if(s.includes("nu.nl"))return 55;
 if(s.includes("google nieuws"))return 10;
 return 40;
}

function dedupeTopics(list){
 const groups=[];
 for(const item of list){
   let match=null;
   for(const g of groups){
     if(topicSimilarity(item,g.best)>=0.58){
       match=g;break;
     }
   }
   if(!match){
     groups.push({best:item,alternatives:[]});
   }else{
     match.alternatives.push(item);
     if(sourcePreference(item)>sourcePreference(match.best)){
       match.alternatives.push(match.best);
       match.best=item;
     }
   }
 }
 return groups.map(g=>({...g.best,alsoPublished:g.alternatives.map(x=>x.source).filter(Boolean)}));
}

function personalScore(x){
 let score=Math.max(0,14-daysAgo(x.date))*2;
 score+=(interest[x.category]||0)*5+(interest[x.source]||0)*3;
 if(x.category==="TeamNL")score+=7;
 if(x.category==="Transfers")score+=4;
  return score;
}
function renderToday(){
 const recent=items.filter(x=>hasReliableDate(x)&&daysAgo(x.date)>=-0.5&&daysAgo(x.date)<=1);
 let pool=(recent.length>=4?recent:items.filter(hasReliableDate).slice(0,30)).slice();

 // Eerst onderwerp-deduplicatie, daarna persoonlijke prioriteit.
 pool=dedupeTopics(pool);
 pool.sort((a,b)=>personalScore(b)-personalScore(a)||sourcePreference(b)-sourcePreference(a)||new Date(b.date)-new Date(a.date));

 const chosen=[],seenCats=new Set();
 for(const x of pool){
   if(chosen.length>=6)break;
   if(!seenCats.has(x.category)||chosen.length>=4){
     chosen.push(x);
     seenCats.add(x.category);
   }
 }

 $("#today").innerHTML=chosen.map((x,i)=>{
   const also=(x.alsoPublished||[]).filter(s=>s!==x.source);
   return `<a class="today-link" data-open="${esc(x.url)}" href="${esc(x.url)}" target="_blank">
     <span>${["🔥","🇳🇱","🏆","📍","📰","🤾"][i]}</span>
     <span>
       <b>${esc(x.title)}</b>
       <em>${esc(x.source)}${also.length?` · ook: ${esc([...new Set(also)].slice(0,2).join(", "))}`:""}</em>
     </span>
     <span>›</span>
   </a>`;
 }).join("");
}
function renderStatus(){$("#sourceStatus").innerHTML=SOURCES.map(s=>`<span class="source-pill ${status[s.name]==="ok"?"ok":""}">${status[s.name]==="ok"?"●":"○"} ${esc(s.name)}</span>`).join("")}
function renderNews(){
 const q=($("#searchInput").value||"").toLowerCase();
 let list=items.slice().sort((a,b)=>(hasReliableDate(b)-hasReliableDate(a))||((new Date(b.date).getTime()||0)-(new Date(a.date).getTime()||0)));
 if(filter!=="Alles")list=list.filter(x=>x.category===filter);
 if(q)list=list.filter(x=>(x.title+" "+x.summary+" "+x.source).toLowerCase().includes(q));
 const recent=list.filter(x=>hasReliableDate(x)&&daysAgo(x.date)>=-0.5&&daysAgo(x.date)<=7);
 const older=list.filter(x=>!hasReliableDate(x)||daysAgo(x.date)>7);
 $("#recentTimeline").innerHTML=recent.map(card).join("")||`<div class="empty">Geen berichten binnen dit filter in de laatste 7 dagen.</div>`;
 $("#olderTimeline").innerHTML=older.slice(0,olderVisible).map(card).join("")||`<div class="empty">Geen ouder nieuws binnen dit filter.</div>`;
 $("#recentCount").textContent=`${recent.length} berichten`;
 $("#olderCount").textContent=`${older.length} berichten`;
 const cats=["Alles",...new Set(items.map(x=>x.category))];
 $("#chips").innerHTML=cats.map(c=>`<button class="chip ${c===filter?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
 renderToday();renderStatus();
}


// LIVE: derive concrete stream-related items from current news plus provider searches.
function liveCandidates(){
 const rx=/live|livestream|rechtstreeks|uitzending|kijk live|stream/i;
 return items.filter(x=>rx.test(x.title+" "+x.summary))
   .map(x=>({...x,category:"Live"}))
   .sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function renderLive(){
 const cand=liveCandidates();
 const now=cand.filter(x=>Math.abs(daysAgo(x.date))<1);
 const upcoming=cand.filter(x=>daysAgo(x.date)<=7&&!now.includes(x));
 $("#liveNowCount").textContent=now.length?`${now.length} gevonden`:"";
 $("#liveUpcomingCount").textContent=upcoming.length?`${upcoming.length} gevonden`:"";
 $("#liveNow").innerHTML=now.length?now.map(x=>card(x).replace(`class="tag"`,`class="tag live"`)).join(""):`<div class="empty">Op dit moment is geen concrete handballivestream gevonden. Gebruik hierboven SHL TV of NOS voor hun actuele aanbod.</div>`;
 $("#liveUpcoming").innerHTML=upcoming.length?upcoming.map(x=>card(x).replace(`class="tag"`,`class="tag live"`)).join(""):`<div class="empty">Nog geen aankomende handballivestreams gevonden in de nieuwsbronnen.</div>`;
}

// COMPETITIONS: local list of Handbal.nl pool URLs and on-demand HTML summary.
async function fetchPoolSummary(url){
 let html="";
 for(const proxy of [ALLORIGINS,CORSPROXY]){
   try{html=await proxyText(url,proxy);if(html)break}catch{}
 }
 if(!html)throw new Error("Poule niet bereikbaar");

 const doc=new DOMParser().parseFromString(html,"text/html");
 const cleanText=s=>strip(s||"").replace(/\s+/g," ").trim();

 let title=cleanText(doc.querySelector("h1")?.textContent||"");

 // Handbal.nl toont vaak "Poule Coinmerce SHL Men"; voor de kaart willen we de echte poulenaam.
 if(title){
   title=title
     .replace(/^poule\s+/i,"")
     .replace(/^competitie\s*[-–—]\s*poule\s*[-–—]?\s*/i,"")
     .trim();
 }

 if(!title){
   // Kijk ook naar breadcrumbs/navigatie, waar de klasse vaak expliciet staat.
   const crumbs=[...doc.querySelectorAll("nav a, .breadcrumb a, .breadcrumbs a, [class*='breadcrumb'] a")]
     .map(a=>cleanText(a.textContent))
     .filter(Boolean);
   const candidate=crumbs.reverse().find(t=>!/home|competities|categorie|klasse/i.test(t));
   if(candidate) title=candidate;
 }

 if(!title){
   const t=cleanText(doc.querySelector("title")?.textContent||"");
   title=t
     .replace(/\s*[-|]\s*Handbal\.nl.*$/i,"")
     .replace(/^poule\s+/i,"")
     .trim();
 }

 if(!title||title.length<4) title="Mijn competitie";

 const tables=[...doc.querySelectorAll("table")].map(table=>{
   const rows=[...table.querySelectorAll("tr")].map(tr=>
     [...tr.querySelectorAll("th,td")].map(td=>cleanText(td.textContent)).filter(Boolean)
   ).filter(r=>r.length);
   return {rows,text:rows.flat().join(" ").toLowerCase()};
 });

 const standingsTable=tables.find(t=>/gespeeld|punten|saldo|gewonnen|verloren/.test(t.text));
 const fixturesTable=tables.find(t=>/datum/.test(t.text)&&/thuis/.test(t.text)&&/uit/.test(t.text));
 const resultsTable=tables.find(t=>/uitslag/.test(t.text)&&/thuis/.test(t.text)&&/uit/.test(t.text)) || fixturesTable;

 function parseStandings(table){
   if(!table) return [];
   const out=[];
   for(const r of table.rows){
     const txt=r.join(" ").toLowerCase();
     if(/stand team gespeeld punten|gespeeld punten gewonnen|positie team/.test(txt)) continue;
     if(r.length<3) continue;
     let pos="",team="",played="",points="";
     if(/^\d+$/.test(r[0]) && r.length>=4){pos=r[0];team=r[1];played=r[2];points=r[3]}
     else if(r.length>=3){team=r[0];played=r[1];points=r[2]}
     if(!team || /team|stand/i.test(team)) continue;
     if(!/\d/.test(played+" "+points)) continue;
     out.push({pos,team,played,points});
     if(out.length>=6) break;
   }
   return out;
 }

 function parseMatches(table){
   if(!table) return [];
   const out=[];
   for(const r of table.rows){
     const txt=r.join(" ").toLowerCase();
     if(/datum tijd thuis uit|datum.*thuis.*uit.*uitslag|stand team gespeeld punten/.test(txt)) continue;
     if(r.length<3) continue;

     let date="",time="",home="",away="",score="";
     if(r.length>=5){[date,time,home,away,score]=[r[0],r[1],r[2],r[3],r[4]]}
     else if(r.length===4){[date,home,away,score]=r}
     else {[home,away,score]=r}

     if(!home||!away) continue;
     if(/datum|tijd|thuis|uit|uitslag/i.test(home+" "+away)) continue;
     out.push({date,time,home,away,score});
     if(out.length>=10) break;
   }
   return out;
 }

 const standings=parseStandings(standingsTable);
 const matches=parseMatches(resultsTable);
 const played=matches.filter(m=>m.score&&/\d/.test(m.score));
 const upcoming=matches.filter(m=>!m.score||!/\d/.test(m.score));

 let summary="";
 if(standings.length){
   const leader=standings[0];
   summary=`${leader.team} staat bovenaan${leader.points?` met ${leader.points} punten`:""}.`;
   if(standings[1]) summary+=` ${standings[1].team} volgt daarachter.`;
 }
 if(upcoming.length){
   const m=upcoming[0];
   summary+=`${summary?" ":""}Eerstvolgende zichtbare wedstrijd: ${m.home} – ${m.away}${m.date?` op ${m.date}`:""}${m.time?` om ${m.time}`:""}.`;
 }
 if(!summary) summary="De poule is gevonden. Open Handbal.nl voor de volledige officiële gegevens.";

 return {
   title,
   summary,
   standings,
   recentResults:played.slice(0,3),
   upcoming:upcoming.slice(0,3),
   updated:new Date().toISOString()
 };
}

async function refreshPool(p){
 try{
   const data=await fetchPoolSummary(p.url);
   Object.assign(p,data,{status:"ok"}); if(p.manualTitle)p.title=p.manualTitle;
   localStorage.setItem("hh61_pools",JSON.stringify(pools));
 }catch{p.status="fail"}
}

async function renderPools(){
 const box=$("#poolList");
 if(!box)return;
 if($("#poolCount"))$("#poolCount").textContent=pools.length?`${pools.length} gevolgd`:"";

 if(!pools.length){
   box.innerHTML=`
     <div class="pool-empty">
       <div class="pool-empty-icon">🏆</div>
       <strong>Nog geen competities toegevoegd</strong>
       <span>Voeg je eerste poule toe om hem hier snel te openen.</span>
     </div>`;
   return;
 }

 box.innerHTML=pools.map((p,i)=>`
   <article class="pool-card-clean" data-pool-url="${esc(p.url)}" role="link" tabindex="0">
     <div class="pool-badge">🏆</div>
     <div class="pool-info">
       <strong>${esc(p.manualTitle||p.title||"Mijn competitie")}</strong>
       <span>Handbal.nl</span>
     </div>
     <a class="pool-open-clean" href="${esc(p.url)}" target="_blank" rel="noopener">Open ↗</a>
     <button class="pool-more-clean" data-pool-more="${i}" aria-label="Meer opties">•••</button>
   </article>
 `).join("");
}

async function loadNews(){
 try{const cache=JSON.parse(localStorage.getItem("hh61_news")||"null");items=Array.isArray(cache)&&cache.length>=5?cache:FALLBACK}catch{items=FALLBACK}
 renderNews();renderLive();
 const batches=await Promise.all(SOURCES.map(loadSource));
 const fresh=dedupe(batches.flat());
 if(fresh.length>=5){
   items=dedupe([...fresh,...items]).slice(0,150);
   localStorage.setItem("hh61_news",JSON.stringify(items));
 }
 renderNews();renderLive();
}
function showTab(tab){
 currentTab=tab;
 $$(".view").forEach(v=>v.classList.remove("active"));
 $("#"+tab+"View").classList.add("active");
 $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  if(tab==="live")renderLive();
 if(tab==="competitions")renderPools(false);
 scrollTo({top:0,behavior:"instant"});
}

document.addEventListener("click",async e=>{
 const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;olderVisible=30;renderNews();return}
 const o=e.target.closest("[data-open]");if(o){
   const x=items.find(i=>i.url===o.dataset.open);
   if(x){interest[x.category]=(interest[x.category]||0)+1;interest[x.source]=(interest[x.source]||0)+1;localStorage.setItem("hh61_interest",JSON.stringify(interest))}
 }
 const t=e.target.closest("[data-tab]");if(t){showTab(t.dataset.tab);return}
 const rn=e.target.closest("[data-rename-pool]");
 if(rn){
   const i=Number(rn.dataset.renamePool), current=pools[i];
   const name=prompt("Naam van competitie of poule:",current?.title||"");
   if(name&&name.trim()){
     current.title=name.trim();current.manualTitle=name.trim();
     localStorage.setItem("hh61_pools",JSON.stringify(pools));
     renderPools(false);
   }
   return;
 }
 const rm=e.target.closest("[data-remove-pool]");if(rm){pools.splice(Number(rm.dataset.removePool),1);localStorage.setItem("hh61_pools",JSON.stringify(pools));renderPools(false);return}
});

$("#searchBtn").onclick=()=>{$("#searchbar").hidden=!$("#searchbar").hidden;if(!$("#searchbar").hidden)$("#searchInput").focus()};
$("#searchInput").oninput=renderNews;
$("#refreshBtn").onclick=async()=>{
 const btn=$("#refreshBtn");
 btn?.classList.add("spinning");
 try{
   if(currentTab==="news"){
     await loadNews();
   }else if(currentTab==="live"){
     await loadNews();
     renderLive();
   }else if(currentTab==="competitions"){
     renderPools();
   }else{
     await loadNews();
   }
 }finally{
   setTimeout(()=>btn?.classList.remove("spinning"),350);
 }
};
new IntersectionObserver(es=>{if(es[0].isIntersecting){olderVisible+=25;renderNews()}},{rootMargin:"400px"}).observe($("#sentinel"));

loadNews();
renderPools(false);
if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});


document.addEventListener("click",e=>{
 const more=e.target.closest("[data-pool-more]");
 if(!more)return;
 const i=Number(more.dataset.poolMore), p=pools[i];
 if(!p)return;
 const choice=prompt("Kies een actie:\n1 = Naam wijzigen\n2 = Verwijderen","1");
 if(choice==="1"){
   const name=prompt("Naam van competitie of poule:",p.manualTitle||p.title||"");
   if(name&&name.trim()){
     p.manualTitle=name.trim();p.title=name.trim();
     localStorage.setItem("hh61_pools",JSON.stringify(pools));
     renderPools();
   }
 }else if(choice==="2"){
   if(confirm(`"${p.manualTitle||p.title||"Deze competitie"}" verwijderen?`)){
     pools.splice(i,1);
     localStorage.setItem("hh61_pools",JSON.stringify(pools));
     renderPools();
   }
 }
});

const addPoolBtn2=document.querySelector("#addPoolBtn2");
if(addPoolBtn2)addPoolBtn2.onclick=()=>{document.querySelector("#poolForm").hidden=false;document.querySelector("#poolName")?.focus();};


document.addEventListener("click",e=>{
 const card=e.target.closest("[data-pool-url]");
 if(!card)return;
 if(e.target.closest("a,button,input,label"))return;
 window.open(card.dataset.poolUrl,"_blank","noopener");
});
document.addEventListener("keydown",e=>{
 const card=e.target.closest?.("[data-pool-url]");
 if(!card||!(e.key==="Enter"||e.key===" "))return;
 if(e.target.closest("a,button,input,label"))return;
 e.preventDefault();
 window.open(card.dataset.poolUrl,"_blank","noopener");
});
