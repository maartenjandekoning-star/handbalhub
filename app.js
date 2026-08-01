const FALLBACK_NEWS = [{"id": "teamnl-u18-argentinie", "title": "Oranje U18 klopt Argentinië op het WK", "summary": "Oranje U18 boekte een belangrijke overwinning en hield perspectief in het toernooi.", "source": "Handbal Inside", "category": "TeamNL", "date": "2026-08-01T00:00:00+02:00", "url": "https://www.google.com/search?q=Oranje+U18+Argentini%C3%AB+handbal", "image": ""}, {"id": "bekerprogramma", "title": "Programma en uitslagen bekercompetitie gepubliceerd", "summary": "De programma’s voor de landelijke bekercompetitie zijn gepubliceerd.", "source": "Handbal Startpunt", "category": "Competitie", "date": "2026-08-01T00:00:00+02:00", "url": "https://www.google.com/search?q=landelijke+bekercompetitie+handbal+programma", "image": ""}, {"id": "shl-tv", "title": "SHL TV bundelt livestreams en samenvattingen", "summary": "Livestreams en samenvattingen zijn beschikbaar via Super Handball League TV.", "source": "Super Handball League", "category": "SHL", "date": "2026-08-01T00:00:00+02:00", "url": "https://superhandballeague.tv/live", "image": ""}, {"id": "euro-pride", "title": "Euro Handball Pride Championship 2026 van start", "summary": "Amsterdam stond eind juli in het teken van het Euro Handball Pride Championship.", "source": "Handbal.nl", "category": "Algemeen", "date": "2026-07-28T10:00:00+02:00", "url": "https://www.google.com/search?q=Euro+Handball+Pride+Championship+2026", "image": ""}, {"id": "u18-roemenie", "title": "Wedstrijdblog Dames U18 IHF Championship 2026 in Roemenië", "summary": "Verslagen, updates en statistieken rond het WK voor de Nederlandse Dames U18.", "source": "Handbal.nl", "category": "Jeugd", "date": "2026-07-28T09:00:00+02:00", "url": "https://www.google.com/search?q=Dames+U18+IHF+Championship+2026+Roemeni%C3%AB", "image": ""}, {"id": "medigros", "title": "Nederlands Handbal Verbond en Medigros verlengen samenwerking", "summary": "De samenwerking wordt voortgezet rond de nationale selecties en jeugdselecties.", "source": "Handbal.nl", "category": "Algemeen", "date": "2026-07-22T10:00:00+02:00", "url": "https://www.google.com/search?q=NHV+Medigros+samenwerking", "image": ""}];

let NEWS=[], LIVE=[], STANDINGS={competitions:{}}, activeFilter="Alles", visibleCount=12;
let saved=JSON.parse(localStorage.getItem("hh3_saved")||"[]");
let favorites=JSON.parse(localStorage.getItem("hh3_favorites")||"[]");
let favoriteCompetitions=JSON.parse(localStorage.getItem("hh3_competitions")||"[]");

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clean=s=>(s||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const fmt=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?"":x.toLocaleDateString("nl-NL",{day:"numeric",month:"short"})};
function category(t=""){t=t.toLowerCase();if(/teamnl|oranje|nederland|wk|ek/.test(t))return"TeamNL";if(/transfer|contract|versterk/.test(t))return"Transfers";if(/shl|super handball/.test(t))return"SHL";if(/jeugd|u17|u18|u19|u20/.test(t))return"Jeugd";if(/beach/.test(t))return"Beach";if(/beker|competitie|programma|uitslag/.test(t))return"Competitie";return"Algemeen"}
function items(){return NEWS.filter(n=>n?.title&&n?.url).map(n=>({...n,summary:clean(n.summary),category:n.category||category(n.title+" "+n.summary)}))}
function iconFor(c){return({TeamNL:"🇳🇱",Transfers:"↔️",SHL:"🏆",Jeugd:"🤾",Beach:"🌴",Competitie:"📅",Algemeen:"📰"})[c]||"📰"}
function show(id){$$(".view").forEach(x=>x.classList.toggle("active",x.id===id));$$(".bottom-nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===id));scrollTo({top:0,behavior:"instant"});if(id==="live")renderLive();if(id==="competitions")renderCompetitions();if(id==="myhandball")renderMyHandball()}
function hero(n){if(!n)return"";return`${n.image?`<img src="${esc(n.image)}" alt="" onerror="this.remove()">`:""}<div class="hero-copy"><span class="tag">${esc(n.category)}</span><h2>${esc(n.title)}</h2><p>${esc((n.summary||"").slice(0,180))}</p><a class="source-link" href="${esc(n.url)}" target="_blank" rel="noopener">Lees het verhaal →</a></div>`}
function row(n){return`<article class="news-row"><div class="news-thumb ${n.image?"":"no-image"}">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-image');this.remove()">`:`${esc(n.source||"HandbalHub")}`}</div><div class="news-info"><div class="news-meta">${fmt(n.date)} · ${esc(n.category)} · ${esc(n.source||"")}</div><h3>${esc(n.title)}</h3><p>${esc(n.summary||"")}</p><div class="news-actions"><a class="source-link" href="${esc(n.url)}" target="_blank" rel="noopener">Lees verder →</a><button class="save-btn" data-save="${esc(n.url)}">${saved.includes(n.url)?"♥":"♡"}</button></div></div></article>`}
function renderNews(){
 const all=items(),q=($("#newsSearch").value||"").toLowerCase();
 $("#loadingState").hidden=true;
 $("#emptyState").hidden=!!all.length;
 $("#newsContent").hidden=!all.length;
 if(!all.length)return;
 $("#heroStory").innerHTML=hero(all[0]);
 $("#todayLabel").textContent=new Date().toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"short"});
 $("#todayList").innerHTML=all.slice(0,4).map(n=>`<a class="today-item" href="${esc(n.url)}" target="_blank"><span class="today-icon">${iconFor(n.category)}</span><span><b>${esc(n.title)}</b><small>${esc(n.source||n.category)}</small></span><span>›</span></a>`).join("");
 const cats=["Alles",...new Set(all.map(n=>n.category))];
 $("#newsFilters").innerHTML=cats.map(c=>`<button class="filter ${activeFilter===c?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
 let list=all.slice(1);
 if(activeFilter!=="Alles")list=list.filter(n=>n.category===activeFilter);
 if(q)list=list.filter(n=>(n.title+" "+n.summary+" "+n.source).toLowerCase().includes(q));
 $("#resultCount").textContent=`${list.length} berichten`;
 $("#newsFeed").innerHTML=list.slice(0,visibleCount).map(row).join("");
 $("#loadMore").hidden=list.length<=visibleCount;
 $("#updatedText").textContent=`${all.length} berichten direct beschikbaar`;
}
function toggleSave(url){saved=saved.includes(url)?saved.filter(x=>x!==url):[...saved,url];localStorage.setItem("hh3_saved",JSON.stringify(saved));renderNews();renderMyHandball()}
function renderLive(){$("#liveList").innerHTML=LIVE.length?LIVE.map(x=>`<div class="live-card"><div><span class="live-badge">LIVE</span><h3>${esc(x.title)}</h3><small>${esc(x.source||"Livestream")}</small></div><a class="primary-button" href="${esc(x.url)}" target="_blank">Kijken</a></div>`).join(""):`<div class="glass-card"><h3>Geen bevestigde livestream</h3><p>Nieuwe uitzendingen verschijnen hier onafhankelijk van de nieuwsfeed.</p><a class="secondary-button" href="https://superhandballeague.tv/live" target="_blank">Open SHL TV</a></div>`}
function renderCompetitions(){
 const comps=Object.entries(STANDINGS.competitions||{});
 $("#competitionCatalog").innerHTML=comps.length?comps.map(([id,c])=>`<div class="status-row"><div><b>${esc(c.name||id)}</b><small>${c.updatedAt?"Stand bijgewerkt":"Nog geen actuele stand"}</small></div><button class="secondary-button" data-comp="${esc(id)}">${favoriteCompetitions.includes(id)?"Gevolgd":"Volgen"}</button></div>`).join(""):`<div class="status-row"><div><b>Standen worden apart geladen</b><small>Een probleem met standen kan nieuws nooit meer leegmaken.</small></div></div>`;
 $("#favoriteCompetitions").innerHTML="";
}
function renderMyHandball(){const sn=items().filter(n=>saved.includes(n.url));$("#teamCatalog").innerHTML=`<div class="status-row"><div><b>Mijn teams</b><small>Teamgegevens blijven apart van nieuws.</small></div></div>`;$("#savedNews").innerHTML=sn.length?sn.map(row).join(""):`<div class="glass-card"><p>Nog geen artikelen opgeslagen.</p></div>`}
async function loadJson(url,fallback){
 try{const r=await fetch(`${url}?v=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw 0;return await r.json()}catch{return fallback}
}
async function boot(){
 // Er staat altijd direct nieuws in de JavaScript-bundel.
 NEWS=FALLBACK_NEWS;
 try{const cached=JSON.parse(localStorage.getItem("hh3_news")||"null");if(Array.isArray(cached)&&cached.length>NEWS.length)NEWS=cached}catch{}
 renderNews();

 const [newsDoc,liveDoc,standingsDoc]=await Promise.all([
   loadJson("news.json",null),loadJson("live.json",{items:[]}),loadJson("standings.json",{competitions:{}})
 ]);
 if(Array.isArray(newsDoc?.items)&&newsDoc.items.length>=3){
   NEWS=newsDoc.items;
   localStorage.setItem("hh3_news",JSON.stringify(NEWS));
   renderNews();
 }
 LIVE=liveDoc?.items||[];
 STANDINGS=standingsDoc||{competitions:{}};
 try{if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js")}catch{}
}
document.addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v){show(v.dataset.view);return}const f=e.target.closest("[data-filter]");if(f){activeFilter=f.dataset.filter;visibleCount=12;renderNews();return}const s=e.target.closest("[data-save]");if(s){e.preventDefault();toggleSave(s.dataset.save);return}const c=e.target.closest("[data-comp]");if(c){favoriteCompetitions=favoriteCompetitions.includes(c.dataset.comp)?favoriteCompetitions.filter(x=>x!==c.dataset.comp):[...favoriteCompetitions,c.dataset.comp];localStorage.setItem("hh3_competitions",JSON.stringify(favoriteCompetitions));renderCompetitions()}});
$("#newsSearch").addEventListener("input",()=>{visibleCount=12;renderNews()});
$("#competitionSearch").addEventListener("input",renderCompetitions);
$("#teamSearch").addEventListener("input",renderMyHandball);
$("#loadMore").addEventListener("click",()=>{visibleCount+=12;renderNews()});
$("#refreshButton").addEventListener("click",()=>location.reload());
$("#emptyRefresh").addEventListener("click",()=>location.reload());
boot();
