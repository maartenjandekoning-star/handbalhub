let DATA={news:[],live:[],catalog:[],teams:{},competitions:[]};
let activeFilter="Alles", visibleCount=12;
let favorites=JSON.parse(localStorage.getItem("hh2_favorites")||"[]");
let saved=JSON.parse(localStorage.getItem("hh2_saved")||"[]");
let favoriteCompetitions=JSON.parse(localStorage.getItem("hh2_competitions")||"[]");
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clean=s=>(s||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const fmt=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?"":x.toLocaleDateString("nl-NL",{day:"numeric",month:"short"})};
function category(t=""){t=t.toLowerCase();if(/teamnl|oranje|nederland|wk|ek/.test(t))return"TeamNL";if(/transfer|contract|versterk/.test(t))return"Transfers";if(/shl|super handball/.test(t))return"SHL";if(/jeugd|u17|u18|u19|u20/.test(t))return"Jeugd";if(/beach/.test(t))return"Beach";if(/beker|competitie|programma|uitslag/.test(t))return"Competitie";return"Algemeen"}
function news(){return (DATA.news||[]).filter(n=>n?.title&&n?.url).map(n=>({...n,summary:clean(n.summary),category:n.category&&n.category!=="Nieuws"?n.category:category(n.title+" "+n.summary)}))}
function iconFor(c){return({TeamNL:"🇳🇱",Transfers:"↔️",SHL:"🏆",Jeugd:"🤾",Beach:"🌴",Competitie:"📅",Algemeen:"📰"})[c]||"📰"}
function show(id){$$(".view").forEach(x=>x.classList.toggle("active",x.id===id));$$(".bottom-nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===id));scrollTo({top:0,behavior:"instant"});if(id==="live")renderLive();if(id==="competitions")renderCompetitions();if(id==="myhandball")renderMyHandball()}
function hero(n){if(!n)return"";return`${n.image?`<img src="${esc(n.image)}" alt="" onerror="this.remove()">`:""}<div class="hero-copy"><span class="tag">${esc(n.category)}</span><h2>${esc(n.title)}</h2><p>${esc((n.summary||"").slice(0,180))}</p><a class="source-link" href="${esc(n.url)}" target="_blank" rel="noopener">Lees het verhaal →</a></div>`}
function row(n){return`<article class="news-row"><div class="news-thumb ${n.image?"":"no-image"}">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-image');this.remove()">`:`${esc(n.source||"HandbalHub")}`}</div><div class="news-info"><div class="news-meta">${fmt(n.date)} · ${esc(n.category)} · ${esc(n.source||"")}</div><h3>${esc(n.title)}</h3><p>${esc(n.summary||"")}</p><div class="news-actions"><a class="source-link" href="${esc(n.url)}" target="_blank" rel="noopener">Lees verder →</a><button class="save-btn" data-save="${esc(n.url)}">${saved.includes(n.url)?"♥":"♡"}</button></div></div></article>`}
function renderNews(){
 const all=news(),q=($("#newsSearch").value||"").toLowerCase();
 if(all.length)localStorage.setItem("hh2_news",JSON.stringify(all));
 $("#loadingState").hidden=true;
 if(!all.length){$("#newsContent").hidden=true;$("#emptyState").hidden=false;return}
 $("#emptyState").hidden=true;$("#newsContent").hidden=false;
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
 const u=DATA.updatedAt?new Date(DATA.updatedAt):null;
 $("#updatedText").textContent=u&&!isNaN(u)?`Bijgewerkt ${u.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}`:`${all.length} actuele berichten`;
}
function toggleSave(url){saved=saved.includes(url)?saved.filter(x=>x!==url):[...saved,url];localStorage.setItem("hh2_saved",JSON.stringify(saved));renderNews();renderMyHandball()}
function renderLive(){const l=DATA.live||[];$("#liveList").innerHTML=l.length?l.map(x=>`<div class="live-card"><div><span class="live-badge">LIVE</span><h3>${esc(x.title)}</h3><small>${esc(x.source||"Livestream")}</small></div><a class="primary-button" href="${esc(x.url)}" target="_blank">Kijken</a></div>`).join(""):`<div class="glass-card"><h3>Geen bevestigde livestream</h3><p>Nieuwe uitzendingen verschijnen hier automatisch.</p><a class="secondary-button" href="https://superhandballeague.tv/live" target="_blank">Open SHL TV</a></div>`}
function compList(){return[...new Map([...(DATA.competitions||[]),...(DATA.catalog||[]).map(x=>({id:x.id,name:x.competition||x.club,sourceUrl:x.poolUrl||""}))].filter(x=>x.id&&x.name).map(x=>[x.id,x])).values()]}
function renderCompetitions(){const q=($("#competitionSearch").value||"").toLowerCase(),list=compList().filter(x=>!q||x.name.toLowerCase().includes(q));$("#competitionCatalog").innerHTML=list.map(c=>`<div class="status-row"><div><b>${esc(c.name)}</b><small>${c.sourceUrl?"Standbron gekoppeld":"Stand volgt zodra de bron beschikbaar is"}</small></div><button class="secondary-button" data-comp="${esc(c.id)}">${favoriteCompetitions.includes(c.id)?"Gevolgd":"Volgen"}</button></div>`).join("");$("#favoriteCompetitions").innerHTML=favoriteCompetitions.map(id=>compList().find(x=>x.id===id)).filter(Boolean).map(c=>`<div class="competition-card"><h3>${esc(c.name)}</h3><p>Stand, programma en uitslagen staan uitsluitend hier, niet op de nieuwspagina.</p>${c.sourceUrl?`<a class="secondary-button" href="${esc(c.sourceUrl)}" target="_blank">Bekijk competitie</a>`:""}</div>`).join("")}
function renderMyHandball(){const q=($("#teamSearch").value||"").toLowerCase(),list=(DATA.catalog||[]).filter(t=>!q||(t.club+" "+t.team+" "+t.competition).toLowerCase().includes(q));$("#teamCatalog").innerHTML=list.map(t=>`<div class="status-row"><div><b>${esc(t.club)} ${esc(t.team)}</b><small>${esc(t.competition)}</small></div><button class="secondary-button" data-fav="${esc(t.id)}">${favorites.includes(t.id)?"Ontvolgen":"Volgen"}</button></div>`).join("");const sn=news().filter(n=>saved.includes(n.url));$("#savedNews").innerHTML=sn.length?sn.map(row).join(""):`<div class="glass-card"><p>Nog geen artikelen opgeslagen.</p></div>`}
async function boot(){
  // 1. Toon meteen de grootste eerder opgeslagen nieuwsfeed.
  const cacheKeys=["hh2_news","hh13_news","hh11_news"];
  const cachedFeeds=cacheKeys.map(k=>{
    try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}
  }).filter(x=>Array.isArray(x)&&x.length);

  if(cachedFeeds.length){
    const best=cachedFeeds.sort((a,b)=>b.length-a.length)[0];
    DATA.news=best;
    renderNews();
  }

  // 2. Haal de GitHub-data op zonder de bestaande pagina leeg te maken.
  try{
    const fresh=await fetch(`app-data.json?v=${Date.now()}`,{cache:"no-store"}).then(r=>{
      if(!r.ok)throw new Error("app-data niet bereikbaar");
      return r.json();
    });

    DATA={...DATA,...fresh};

    if(Array.isArray(fresh.news)&&fresh.news.length){
      localStorage.setItem("hh2_news",JSON.stringify(fresh.news));
    }else if(cachedFeeds.length){
      // Een tijdelijk leeg GitHub-bestand mag de zichtbare nieuwsfeed nooit wissen.
      DATA.news=cachedFeeds.sort((a,b)=>b.length-a.length)[0];
    }

    renderNews();
  }catch{
    if(!news().length)renderNews();
  }

  // 3. Registreer de service worker pas na het tonen van de inhoud.
  try{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
    }
  }catch{}
}
document.addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v){show(v.dataset.view);return}const f=e.target.closest("[data-filter]");if(f){activeFilter=f.dataset.filter;visibleCount=12;renderNews();return}const s=e.target.closest("[data-save]");if(s){e.preventDefault();toggleSave(s.dataset.save);return}const fav=e.target.closest("[data-fav]");if(fav){favorites=favorites.includes(fav.dataset.fav)?favorites.filter(x=>x!==fav.dataset.fav):[...favorites,fav.dataset.fav];localStorage.setItem("hh2_favorites",JSON.stringify(favorites));renderMyHandball();return}const c=e.target.closest("[data-comp]");if(c){favoriteCompetitions=favoriteCompetitions.includes(c.dataset.comp)?favoriteCompetitions.filter(x=>x!==c.dataset.comp):[...favoriteCompetitions,c.dataset.comp];localStorage.setItem("hh2_competitions",JSON.stringify(favoriteCompetitions));renderCompetitions();return}})
$("#newsSearch").addEventListener("input",()=>{visibleCount=12;renderNews()});$("#competitionSearch").addEventListener("input",renderCompetitions);$("#teamSearch").addEventListener("input",renderMyHandball);$("#loadMore").addEventListener("click",()=>{visibleCount+=12;renderNews()});$("#refreshButton").addEventListener("click",()=>location.reload());$("#emptyRefresh").addEventListener("click",()=>location.reload());boot();
