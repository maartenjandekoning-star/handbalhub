
let DATA={catalog:[],teams:{},news:[],social:[],live:[],competitions:[]};
let favorites=JSON.parse(localStorage.getItem("hh13_favorites")||"[]");
let saved=JSON.parse(localStorage.getItem("hh13_saved")||"[]");
let favoriteCompetitions=JSON.parse(localStorage.getItem("hh13_competitions")||"[]");
let activeFilter="Alles";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clean=s=>(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const fmt=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toLocaleDateString("nl-NL",{day:"numeric",month:"short"})};

function category(text=""){
  const t=text.toLowerCase();
  if(/teamnl|oranje|wk|ek|nederland/.test(t))return"TeamNL";
  if(/transfer|contract|versterk/.test(t))return"Transfers";
  if(/shl|super handball/.test(t))return"SHL";
  if(/jeugd|u17|u18|u19|u20/.test(t))return"Jeugd";
  if(/beach/.test(t))return"Beach";
  if(/beker|competitie|programma|uitslag/.test(t))return"Competitie";
  return"Algemeen";
}
function editorial(n){
  let s=clean(n.summary)||n.title;
  if(s.length>190)s=s.slice(0,187)+"…";
  return s;
}
function show(id){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  window.scrollTo({top:0,behavior:"instant"});
  if(id==="teams")renderTeams();
  if(id==="competitions")renderCompetitions();
  if(id==="live")renderLive();
  if(id==="more")renderSaved();
}
function toggleSave(url){
  saved=saved.includes(url)?saved.filter(x=>x!==url):[...saved,url];
  localStorage.setItem("hh13_saved",JSON.stringify(saved));
  renderNews(); renderSaved();
}
function toggleFav(id){
  favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];
  localStorage.setItem("hh13_favorites",JSON.stringify(favorites));
  renderTeams();
}
function toggleCompetition(id){
  favoriteCompetitions=favoriteCompetitions.includes(id)?favoriteCompetitions.filter(x=>x!==id):[...favoriteCompetitions,id];
  localStorage.setItem("hh13_competitions",JSON.stringify(favoriteCompetitions));
  renderCompetitions();
}
function articleCard(n){
  const image=n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" onerror="this.remove()">`:"";
  return `<article class="card news-card" data-url="${esc(n.url)}">
    <div class="news-image">${image}<span>${esc(n.source||"Handbalnieuws")}</span></div>
    <div class="news-body">
      <div class="meta">${fmt(n.date)} · ${esc(n.category||category(n.title+" "+n.summary))}</div>
      <h3>${esc(n.title)}</h3>
      <p>${esc(editorial(n))}</p>
      <div class="news-actions">
        <a class="link article-link" href="${esc(n.url)}" target="_blank" rel="noopener">Lees artikel →</a>
        <button class="save" data-save="${esc(n.url)}" aria-label="Opslaan">${saved.includes(n.url)?"♥":"♡"}</button>
      </div>
    </div>
  </article>`;
}
function validNews(){
  return (DATA.news||[]).filter(n=>n&&n.title&&n.url);
}
function renderHeader(){
  const news=validNews();
  $("#nNews").textContent=news.length;
  $("#nSources").textContent=new Set(news.map(n=>n.source).filter(Boolean)).size;
  $("#nLive").textContent=(DATA.live||[]).length;
  const updated=DATA.updatedAt?new Date(DATA.updatedAt):null;
  $("#updatedText").textContent=updated&&!Number.isNaN(updated.getTime())
    ?`Bijgewerkt ${updated.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})} om ${updated.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}`
    :"De nieuwste berichten worden automatisch opgehaald";
}
function renderFilters(){
  const categories=["Alles",...new Set(validNews().map(n=>n.category||category(n.title+" "+n.summary)))];
  $("#newsFilters").innerHTML=categories.map(c=>`<button class="filter ${activeFilter===c?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
}
function renderNews(){
  const q=($("#newsSearch")?.value||"").toLowerCase();
  let list=validNews().map(n=>({...n,category:n.category||category(n.title+" "+n.summary)}));
  if(activeFilter!=="Alles")list=list.filter(n=>n.category===activeFilter);
  if(q)list=list.filter(n=>(n.title+" "+n.summary+" "+n.source).toLowerCase().includes(q));
  $("#allNews").innerHTML=list.map(articleCard).join("");
  $("#newsStatus").style.display=list.length?"none":"block";
  $("#newsStatus").textContent=validNews().length
    ?"Geen berichten gevonden binnen deze selectie."
    :"Nog geen actuele berichten beschikbaar. De GitHub-update vult deze pagina automatisch.";
  renderHeader();
  renderFilters();
}
function renderTeams(){
  const q=($("#teamSearch")?.value||"").toLowerCase();
  const list=(DATA.catalog||[]).filter(t=>!q||(t.club+" "+t.team+" "+t.competition).toLowerCase().includes(q));
  $("#catalog").innerHTML=list.map(t=>`<div class="status-row">
    <div><b>${esc(t.club)} ${esc(t.team)}</b><div class="meta">${esc(t.competition)}</div></div>
    <button class="btn secondary" data-fav="${esc(t.id)}">${favorites.includes(t.id)?"Ontvolgen":"Volgen"}</button>
  </div>`).join("")||"<div class='empty'>Geen teams gevonden.</div>";
}
function competitionList(){
  const base=DATA.competitions||[];
  const fromCatalog=(DATA.catalog||[]).map(x=>({id:x.id,name:x.competition||x.club,sourceUrl:x.poolUrl||""}));
  return [...new Map([...base,...fromCatalog].filter(x=>x.id&&x.name).map(x=>[x.id,x])).values()];
}
function renderCompetitions(){
  const q=($("#competitionSearch")?.value||"").toLowerCase();
  const list=competitionList().filter(c=>!q||c.name.toLowerCase().includes(q));
  $("#competitionCatalog").innerHTML=list.map(c=>`<div class="status-row">
    <div><b>${esc(c.name)}</b><div class="meta">${c.sourceUrl?"Bron gekoppeld":"Stand volgt automatisch"}</div></div>
    <button class="btn secondary" data-comp="${esc(c.id)}">${favoriteCompetitions.includes(c.id)?"Gevolgd":"Volgen"}</button>
  </div>`).join("")||"<div class='empty'>Geen competities gevonden.</div>";
  $("#favoriteCompetitions").innerHTML=favoriteCompetitions.map(id=>list.find(x=>x.id===id)||competitionList().find(x=>x.id===id)).filter(Boolean).map(c=>`<div class="card competition-card"><h3>${esc(c.name)}</h3><p class="meta">Stand, programma en uitslagen verschijnen zodra de bron beschikbaar is.</p>${c.sourceUrl?`<a class="btn secondary" href="${esc(c.sourceUrl)}" target="_blank">Open bron</a>`:""}</div>`).join("")||"<div class='card empty'>Je volgt nog geen competities.</div>";
}
function renderLive(){
  const list=DATA.live||[];
  $("#liveList").innerHTML=list.length?list.map(x=>`<div class="status-row"><div><b>${esc(x.title)}</b><div class="meta">${esc(x.source||"Live")}</div></div><a class="btn" href="${esc(x.url)}" target="_blank">Open</a></div>`).join(""):`<div class="empty">Er is nu geen bevestigde livestream.<br><br><a class="btn secondary" href="https://superhandballeague.tv/live" target="_blank">Open SHL TV</a></div>`;
}
function renderSaved(){
  const list=validNews().filter(n=>saved.includes(n.url));
  $("#saved").innerHTML=list.map(articleCard).join("")||"<div class='empty'>Nog niets opgeslagen.</div>";
}
async function boot(){
  // Remove obsolete caches/service workers once so old JS cannot block taps.
  try{
    const marker=localStorage.getItem("hh13_1_cache_reset");
    if(!marker&&"serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      localStorage.setItem("hh13_1_cache_reset","1");
    }
  }catch{}

  try{
    DATA=await fetch(`app-data.json?v=${Date.now()}`,{cache:"no-store"}).then(r=>{
      if(!r.ok)throw new Error("data");
      return r.json();
    });
  }catch{}

  // Never replace a larger server feed with an old 3-item local cache.
  const cached=JSON.parse(localStorage.getItem("hh13_news")||"null");
  if(Array.isArray(cached)&&cached.length>(DATA.news||[]).length)DATA.news=cached;
  if((DATA.news||[]).length)localStorage.setItem("hh13_news",JSON.stringify(DATA.news));

  renderNews(); renderTeams(); renderCompetitions(); renderLive(); renderSaved();
}

document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");
  if(nav){e.preventDefault();show(nav.dataset.view);return}
  const go=e.target.closest("[data-go]");
  if(go){e.preventDefault();show(go.dataset.go);return}
  const filter=e.target.closest("[data-filter]");
  if(filter){activeFilter=filter.dataset.filter;renderNews();return}
  const save=e.target.closest("[data-save]");
  if(save){e.preventDefault();e.stopPropagation();toggleSave(save.dataset.save);return}
  const fav=e.target.closest("[data-fav]");
  if(fav){toggleFav(fav.dataset.fav);return}
  const comp=e.target.closest("[data-comp]");
  if(comp){toggleCompetition(comp.dataset.comp);return}
});
$("#newsSearch").addEventListener("input",renderNews);
$("#teamSearch").addEventListener("input",renderTeams);
$("#competitionSearch").addEventListener("input",renderCompetitions);
$("#refreshButton").addEventListener("click",()=>location.reload());
boot();
