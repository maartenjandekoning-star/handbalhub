const FALLBACK=[{"title": "Heren U20 pakken de titel op het EHF Championship 2026", "source": "Handbal.nl", "category": "TeamNL", "date": "2026-07-19T12:00:00+02:00", "url": "https://handbal.nl/heren-u20-pakken-de-titel-op-het-ehf-championship-2026/", "summary": "De Nederlandse Heren U20 veroverden de titel op het EHF Championship in Kosovo.", "image": ""}, {"title": "Brons Oranje op EHF Beach Handball Championship", "source": "Handbal Inside", "category": "Beach", "date": "2026-07-12T12:00:00+02:00", "url": "https://www.handbalinside.nl/brons-oranje-op-ehf-beach-handball-championship/", "summary": "De Nederlandse beachhandbalheren veroverden brons en verzekerden zich van deelname aan het EK.", "image": ""}, {"title": "Nederlands Handbal Verbond en Medigros verlengen samenwerking", "source": "Handbal.nl", "category": "Officieel", "date": "2026-07-22T10:00:00+02:00", "url": "https://handbal.nl/het-nederlands-handbal-verbond-en-medigros-verlengen-succesvolle-samenwerking/", "summary": "De samenwerking rond de nationale selecties en jeugdselecties wordt voortgezet.", "image": ""}, {"title": "Nieuws uit de landelijke competities richting seizoen 2026-2027", "source": "Handbal Startpunt", "category": "Competitie", "date": "2026-07-22T09:00:00+02:00", "url": "https://www.handbalstartpunt.nl/nieuws/", "summary": "Handbal Startpunt volgt de landelijke competities, teams, trainers en transfers.", "image": ""}, {"title": "Regionaal handbalnieuws uit Oost-Nederland", "source": "HandbalOost", "category": "Regionaal", "date": "2026-07-21T12:00:00+02:00", "url": "https://handbaloost.nl/", "summary": "Nieuws en ontwikkelingen uit het handbal in Oost-Nederland.", "image": ""}, {"title": "HV Helius bestaat 50 jaar", "source": "Groot Hellevoet", "category": "Regionaal", "date": "2026-01-26T08:53:00+01:00", "url": "https://www.groothellevoet.nl/sport/sport/221010/hv-helius-bestaat-50-jaar-", "summary": "De Hellevoetse handbalvereniging vierde haar vijftigjarig bestaan.", "image": ""}];

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

let items=[],filter="Alles",visible=25,saved=JSON.parse(localStorage.getItem("hh6_saved")||"[]"),status={};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const strip=s=>{const d=document.createElement("div");d.innerHTML=s||"";return(d.textContent||"").replace(/\s+/g," ").trim()};
const fmt=d=>{const x=new Date(d);return isNaN(x)?"":x.toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})};
function category(t=""){t=t.toLowerCase();if(/teamnl|oranje|nederland|wk|ek/.test(t))return"TeamNL";if(/transfer|contract|versterk/.test(t))return"Transfers";if(/shl|super handball/.test(t))return"SHL";if(/jeugd|u17|u18|u19|u20/.test(t))return"Jeugd";if(/beach/.test(t))return"Beach";if(/beker|competitie|programma|uitslag/.test(t))return"Competitie";if(/helius|hellevoet|oost/.test(t))return"Regionaal";return"Nieuws"}
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
 return j.items.map(x=>normalize(x,source)).filter(x=>x.title&&x.url);
}
function parseXml(xml,source){
 const doc=new DOMParser().parseFromString(xml,"text/xml");
 return [...doc.querySelectorAll("item")].map(n=>{
   const get=t=>n.querySelector(t)?.textContent?.trim()||"";
   const desc=get("description"),content=get("content\\:encoded");
   return normalize({title:get("title"),link:get("link"),pubDate:get("pubDate"),description:desc,content},source);
 }).filter(x=>x.title&&x.url);
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
   if(title.length<20||title.length>180)return;
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
   if(!x?.title||!x?.url)continue;
   const key=(x.url.replace(/[?#].*$/,"").replace(/\/$/,"")||x.title.toLowerCase());
   if(!map.has(key))map.set(key,x);
 }
 return [...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function card(x){return`<article class="card"><div class="head"><div class="src"><span class="avatar">${esc(avatar(x.source))}</span><span><b>${esc(x.source)}</b><small>${fmt(x.date)}</small></span></div><span class="tag">${esc(x.category)}</span></div><h2>${esc(x.title)}</h2>${x.summary?`<p>${esc(x.summary)}</p>`:""}${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" onerror="this.remove()">`:""}<div class="card-actions"><a href="${esc(x.url)}" target="_blank" rel="noopener">Open originele bron →</a><button data-save="${esc(x.url)}">${saved.includes(x.url)?"♥":"♡"}</button></div></article>`}
function renderStatus(){$("#sourceStatus").innerHTML=SOURCES.map(s=>`<span class="source-pill ${status[s.name]==="ok"?"ok":""}">${status[s.name]==="ok"?"●":"○"} ${esc(s.name)}</span>`).join("")}
function render(){
 const q=($("#searchInput").value||"").toLowerCase();
 let list=items;if(filter!=="Alles")list=list.filter(x=>x.category===filter);if(q)list=list.filter(x=>(x.title+" "+x.summary+" "+x.source).toLowerCase().includes(q));
 $("#timeline").innerHTML=list.slice(0,visible).map(card).join("");
 const cats=["Alles",...new Set(items.map(x=>x.category))];$("#chips").innerHTML=cats.map(c=>`<button class="chip ${c===filter?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
 $("#today").innerHTML=items.slice(0,6).map((x,i)=>`<a class="today-link" href="${esc(x.url)}" target="_blank"><span>${["🔥","🇳🇱","🏆","📍","📰","🤾"][i]}</span><span><b>${esc(x.title)}</b><em>${esc(x.source)}</em></span><span>›</span></a>`).join("");
 renderStatus();
}
function renderSaved(){const list=items.filter(x=>saved.includes(x.url));$("#savedTimeline").innerHTML=list.length?list.map(card).join(""):`<article class="card"><h2>Nog niets opgeslagen</h2><p>Tik bij een artikel op ♡ om het hier te bewaren.</p></article>`}
async function loadNews(){
 try{const cache=JSON.parse(localStorage.getItem("hh6_news")||"null");items=Array.isArray(cache)&&cache.length>=5?cache:FALLBACK}catch{items=FALLBACK}
 render();
 const batches=await Promise.all(SOURCES.map(loadSource));
 const fresh=dedupe(batches.flat());
 if(fresh.length>=5){
   items=dedupe([...fresh,...items]).slice(0,120);
   localStorage.setItem("hh6_news",JSON.stringify(items));
 }
 render();
}
document.addEventListener("click",e=>{
 const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;visible=25;render();return}
 const s=e.target.closest("[data-save]");if(s){saved=saved.includes(s.dataset.save)?saved.filter(x=>x!==s.dataset.save):[...saved,s.dataset.save];localStorage.setItem("hh6_saved",JSON.stringify(saved));render();renderSaved();return}
 const t=e.target.closest("[data-tab]");if(t){const savedTab=t.dataset.tab==="saved";$("#newsView").hidden=savedTab;$("#savedView").hidden=!savedTab;$$(".nav button").forEach(b=>b.classList.toggle("active",b===t));if(savedTab)renderSaved();return}
});
$("#searchBtn").onclick=()=>{$("#searchbar").hidden=!$("#searchbar").hidden;if(!$("#searchbar").hidden)$("#searchInput").focus()};
$("#searchInput").oninput=render;
$("#refreshBtn").onclick=()=>loadNews();
new IntersectionObserver(es=>{if(es[0].isIntersecting){visible+=20;render()}},{rootMargin:"400px"}).observe($("#sentinel"));
loadNews();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
