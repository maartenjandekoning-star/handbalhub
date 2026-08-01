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
let saved=JSON.parse(localStorage.getItem("hh61_saved")||"[]");
let interest=JSON.parse(localStorage.getItem("hh61_interest")||"{}");
let pools=JSON.parse(localStorage.getItem("hh61_pools")||"[]");
let status={};

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const strip=s=>{const d=document.createElement("div");d.innerHTML=s||"";return(d.textContent||"").replace(/\s+/g," ").trim()};
const fmt=d=>{const x=new Date(d);return isNaN(x)?"":x.toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})};
const daysAgo=d=>(Date.now()-new Date(d).getTime())/86400000;

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
 return {title,summary,source,category:category(title+" "+summary),date:it.pubDate||it.date||new Date().toISOString(),url:it.link||it.url,image};
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
   return normalize({title:get("title"),link:get("link"),pubDate:get("pubDate"),description:get("description"),content:get("content\\:encoded")},source);
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
   out.push({title,summary,source:"Handbal Startpunt",category:category(title+" "+summary),date:new Date().toISOString(),url,image});
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
 return [...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function card(x){
 return`<article class="card"><div class="head"><div class="src"><span class="avatar">${esc(avatar(x.source))}</span><span><b>${esc(x.source)}</b><small>${fmt(x.date)}</small></span></div><span class="tag">${esc(x.category)}</span></div><h2>${esc(x.title)}</h2>${x.summary?`<p>${esc(x.summary)}</p>`:""}${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" onerror="this.remove()">`:""}<div class="card-actions"><a data-open="${esc(x.url)}" href="${esc(x.url)}" target="_blank" rel="noopener">Open originele bron →</a><button data-save="${esc(x.url)}">${saved.includes(x.url)?"♥":"♡"}</button></div></article>`
}
function personalScore(x){
 let score=Math.max(0,14-daysAgo(x.date))*2;
 score+=(interest[x.category]||0)*5+(interest[x.source]||0)*3;
 if(x.category==="TeamNL")score+=7;
 if(x.category==="Transfers")score+=4;
 if(saved.includes(x.url))score+=4;
 return score;
}
function renderToday(){
 const recent=items.filter(x=>daysAgo(x.date)<=2);
 let pool=(recent.length>=4?recent:items.slice(0,20)).slice();
 // Balance personal relevance with variety
 pool.sort((a,b)=>personalScore(b)-personalScore(a)||new Date(b.date)-new Date(a.date));
 const chosen=[],seenCats=new Set();
 for(const x of pool){
   if(chosen.length>=6)break;
   if(!seenCats.has(x.category)||chosen.length>=4){chosen.push(x);seenCats.add(x.category)}
 }
 $("#today").innerHTML=chosen.map((x,i)=>`<a class="today-link" data-open="${esc(x.url)}" href="${esc(x.url)}" target="_blank"><span>${["🔥","🇳🇱","🏆","📍","📰","🤾"][i]}</span><span><b>${esc(x.title)}</b><em>${esc(x.source)}</em></span><span>›</span></a>`).join("");
}
function renderStatus(){$("#sourceStatus").innerHTML=SOURCES.map(s=>`<span class="source-pill ${status[s.name]==="ok"?"ok":""}">${status[s.name]==="ok"?"●":"○"} ${esc(s.name)}</span>`).join("")}
function renderNews(){
 const q=($("#searchInput").value||"").toLowerCase();
 let list=items.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
 if(filter!=="Alles")list=list.filter(x=>x.category===filter);
 if(q)list=list.filter(x=>(x.title+" "+x.summary+" "+x.source).toLowerCase().includes(q));
 const recent=list.filter(x=>daysAgo(x.date)<=7);
 const older=list.filter(x=>daysAgo(x.date)>7);
 $("#recentTimeline").innerHTML=recent.map(card).join("")||`<div class="empty">Geen berichten binnen dit filter in de laatste 7 dagen.</div>`;
 $("#olderTimeline").innerHTML=older.slice(0,olderVisible).map(card).join("")||`<div class="empty">Geen ouder nieuws binnen dit filter.</div>`;
 $("#recentCount").textContent=`${recent.length} berichten`;
 $("#olderCount").textContent=`${older.length} berichten`;
 const cats=["Alles",...new Set(items.map(x=>x.category))];
 $("#chips").innerHTML=cats.map(c=>`<button class="chip ${c===filter?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
 renderToday();renderStatus();
}
function renderSaved(){
 const list=items.filter(x=>saved.includes(x.url));
 $("#savedTimeline").innerHTML=list.length?list.map(card).join(""):`<div class="empty">Nog niets opgeslagen. Tik bij een artikel op ♡.</div>`;
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
 const title=strip(doc.querySelector("h1")?.textContent||doc.querySelector("title")?.textContent||"Handbal.nl poule");
 const rows=[...doc.querySelectorAll("table tr")].map(tr=>strip(tr.textContent)).filter(x=>x.length>4&&x.length<160).slice(0,12);
 const headings=[...doc.querySelectorAll("h2,h3")].map(x=>strip(x.textContent)).filter(Boolean).slice(0,5);
 const summaryParts=[];
 if(rows.length)summaryParts.push(`Er zijn ${rows.length} zichtbare stand- of wedstrijdregels gevonden.`);
 if(headings.length)summaryParts.push(`Onderdelen: ${headings.join(", ")}.`);
 if(!summaryParts.length)summaryParts.push("HandbalHub heeft de poule gevonden. Open de officiële pagina voor de volledige gegevens.");
 return {title,summary:summaryParts.join(" "),rows:rows.slice(0,6),updated:new Date().toISOString()};
}
async function refreshPool(p){
 try{
   const data=await fetchPoolSummary(p.url);
   Object.assign(p,data,{status:"ok"});
   localStorage.setItem("hh61_pools",JSON.stringify(pools));
 }catch{p.status="fail"}
}
async function renderPools(refresh=False){
 $("#poolCount").textContent=`${pools.length} gevolgd`;
 if(!pools.length){$("#poolList").innerHTML=`<div class="empty">Nog geen eigen poules toegevoegd.</div>`;return}
 if(refresh)await Promise.all(pools.map(refreshPool));
 $("#poolList").innerHTML=pools.map((p,i)=>`<article class="card pool-card"><div class="head"><div class="src"><span class="avatar">🏆</span><span><b>${esc(p.title||"Mijn poule")}</b><small>${p.updated?`Bijgewerkt ${fmt(p.updated)}`:"Nog niet bijgewerkt"}</small></span></div><span class="tag">${p.status==="ok"?"Actueel":"Poule"}</span></div><div class="pool-summary">${esc(p.summary||"Tik op verversen om een samenvatting van deze Handbal.nl-poule te maken.")}</div>${(p.rows||[]).length?`<div class="pool-lines">${p.rows.map(r=>`<div class="pool-line"><span>${esc(r)}</span></div>`).join("")}</div>`:""}<div class="card-actions"><a href="${esc(p.url)}" target="_blank">Open op Handbal.nl →</a><button data-remove-pool="${i}">Verwijder</button></div></article>`).join("");
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
 $$(".view").forEach(v=>v.classList.remove("active"));
 $("#"+tab+"View").classList.add("active");
 $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(tab==="saved")renderSaved();
 if(tab==="live")renderLive();
 if(tab==="competitions")renderPools(false);
 scrollTo({top:0,behavior:"instant"});
}

document.addEventListener("click",async e=>{
 const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;olderVisible=30;renderNews();return}
 const s=e.target.closest("[data-save]");if(s){saved=saved.includes(s.dataset.save)?saved.filter(x=>x!==s.dataset.save):[...saved,s.dataset.save];localStorage.setItem("hh61_saved",JSON.stringify(saved));renderNews();renderSaved();return}
 const o=e.target.closest("[data-open]");if(o){
   const x=items.find(i=>i.url===o.dataset.open);
   if(x){interest[x.category]=(interest[x.category]||0)+1;interest[x.source]=(interest[x.source]||0)+1;localStorage.setItem("hh61_interest",JSON.stringify(interest))}
 }
 const t=e.target.closest("[data-tab]");if(t){showTab(t.dataset.tab);return}
 const rm=e.target.closest("[data-remove-pool]");if(rm){pools.splice(Number(rm.dataset.removePool),1);localStorage.setItem("hh61_pools",JSON.stringify(pools));renderPools(false);return}
});

$("#searchBtn").onclick=()=>{$("#searchbar").hidden=!$("#searchbar").hidden;if(!$("#searchbar").hidden)$("#searchInput").focus()};
$("#searchInput").oninput=renderNews;
$("#refreshBtn").onclick=async()=>{await loadNews();await renderPools(true)};
$("#addPoolBtn").onclick=()=>{$("#poolForm").hidden=false;$("#poolUrl").focus()};
$("#cancelPoolBtn").onclick=()=>{$("#poolForm").hidden=true;$("#poolUrl").value=""};
$("#savePoolBtn").onclick=async()=>{
 const url=$("#poolUrl").value.trim();
 if(!/^https?:\/\//.test(url)){alert("Plak een geldige Handbal.nl-link.");return}
 const p={url,title:"Mijn poule",summary:"",rows:[],status:"new"};
 pools.unshift(p);localStorage.setItem("hh61_pools",JSON.stringify(pools));
 $("#poolForm").hidden=true;$("#poolUrl").value="";
 await refreshPool(p);renderPools(false);
};
new IntersectionObserver(es=>{if(es[0].isIntersecting){olderVisible+=25;renderNews()}},{rootMargin:"400px"}).observe($("#sentinel"));

loadNews();
renderPools(false);
if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
