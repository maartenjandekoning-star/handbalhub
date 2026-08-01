
let DATA={catalog:[],teams:{},news:[],social:[],live:[]};
let favorites=JSON.parse(localStorage.getItem("hh8_favorites")||"[]");
let saved=JSON.parse(localStorage.getItem("hh8_saved")||"[]");
let selected=favorites[0]||"";
let favoriteCompetitions=JSON.parse(localStorage.getItem("hh10_competitions")||"[]");
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=v=>{try{return new Date(v).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})}catch{return""}};
function team(id){return DATA.catalog.find(x=>x.id===id)||{id,club:id,team:"",competition:""}}
function tdata(id){return DATA.teams?.[id]||{standing:[],matches:[],news:[],social:[]}}
function clean(s){return (s||"").replace(/\s+/g," ").trim()}
function category(t){t=t.toLowerCase();if(/teamnl|oranje|wk|ek/.test(t))return"TeamNL";if(/transfer|contract|versterk/.test(t))return"Transfers";if(/shl|super handball/.test(t))return"SHL";if(/beach/.test(t))return"Beach";return"Nieuws"}
function editorial(n){const low=(n.title+" "+n.summary).toLowerCase();let lead="";if(/transfer|contract|versterk/.test(low))lead="Transfernieuws: ";else if(/teamnl|oranje|wk|ek/.test(low))lead="TeamNL-update: ";else if(/programma|beker|competitie/.test(low))lead="Competitienieuws: ";let s=clean(n.summary)||n.title;if(s.length>210)s=s.slice(0,207)+"…";return lead+s}
function proxy(url){return "https://api.allorigins.win/raw?url="+encodeURIComponent(url)}
function parseRss(txt,source){const doc=new DOMParser().parseFromString(txt,"text/xml");return [...doc.querySelectorAll("item,entry")].slice(0,18).map(n=>{const html=n.querySelector("content\\:encoded,content,description,summary")?.textContent||"";const div=document.createElement("div");div.innerHTML=html;const link=n.querySelector("link")?.getAttribute("href")||n.querySelector("link")?.textContent||"";return{title:clean(n.querySelector("title")?.textContent),url:link,date:n.querySelector("pubDate,published,updated")?.textContent||new Date().toISOString(),summary:clean(html).slice(0,260),source,category:category(n.querySelector("title")?.textContent||""),image:n.querySelector("enclosure")?.getAttribute("url")||div.querySelector("img")?.src||""}}).filter(x=>x.title&&x.url)}
async function loadNews(){
 const feeds=[["Handbal Inside","https://www.handbalinside.nl/feed/"],["Handbal Startpunt","https://www.handbalstartpunt.nl/feed/"],["Handbal.nl","https://handbal.nl/feed/"],["HandbalOost","https://handbaloost.nl/feed/"],["Super Handball League","https://superhandballeague.com/feed/"]];
 let news=[];
 for(const [name,url] of feeds){try{const r=await fetch(proxy(url),{cache:"no-store"});if(r.ok)news.push(...parseRss(await r.text(),name))}catch(e){}}
 const queries=["Nederlands handbal","TeamNL handbal","Super Handball League","handbal transfer Nederland"];
 for(const q of queries){try{const u=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=nl&gl=NL&ceid=NL:nl`;const r=await fetch(proxy(u),{cache:"no-store"});if(r.ok)news.push(...parseRss(await r.text(),"Google Nieuws"))}catch(e){}}
 const fallback=[
 {title:"Oranje U18 klopt Argentinië op WK",source:"Handbal Inside",date:new Date().toISOString(),summary:"Oranje U18 boekte een belangrijke overwinning en hield perspectief in het toernooi.",url:"https://www.handbalinside.nl/oranje-u18-klopt-argentinie-op-wk/",category:"TeamNL",image:""},
 {title:"Programma en uitslagen bekercompetitie gepubliceerd",source:"Handbal Startpunt",date:new Date().toISOString(),summary:"De programma’s voor de landelijke bekercompetitie zijn gepubliceerd.",url:"https://www.handbalstartpunt.nl/nieuws/",category:"Competitie",image:""},
 {title:"SHL TV bundelt livestreams en samenvattingen",source:"Super Handball League",date:new Date().toISOString(),summary:"Livestreams en samenvattingen zijn beschikbaar via SHL TV.",url:"https://superhandballeague.tv/",category:"Live",image:""}
 ];
 DATA.news=[...new Map([...news,...fallback].map(n=>[n.title.toLowerCase(),n])).values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,60);
 DATA.social=["TeamNL","SHL","transfers","jeugd","beach"].map(topic=>{const rel=DATA.news.find(n=>(n.title+" "+n.summary).toLowerCase().includes(topic.toLowerCase()));const q=encodeURIComponent(topic+" handbal");return{topic,preview:rel?.title||`Bekijk actuele berichten rond ${topic}`,instagram:`https://www.instagram.com/explore/search/keyword/?q=${q}`,facebook:`https://www.facebook.com/search/top?q=${q}`,youtube:`https://www.youtube.com/results?search_query=${q}`,newsUrl:rel?.url||""}});
 localStorage.setItem("hh8_news",JSON.stringify(DATA.news));renderAll()
}
function card(n){const yes=saved.includes(n.url);return`<article class="card news-card"><div class="news-image">${n.image?`<img src="${esc(n.image)}" onerror="this.remove()">`:""}<span>${esc(n.source)}</span></div><div class="news-body"><div class="meta">${fmt(n.date)} · ${esc(n.category)}</div><h3>${esc(n.title)}</h3><p>${esc(editorial(n))}</p><div class="news-actions"><a class="link" href="${esc(n.url)}" target="_blank">Lees bron →</a><button class="save" onclick='toggleSave(${JSON.stringify(n.url)})'>${yes?"♥":"♡"}</button></div></div></article>`}
function toggleSave(u){saved=saved.includes(u)?saved.filter(x=>x!==u):[...saved,u];localStorage.setItem("hh8_saved",JSON.stringify(saved));renderAll()}
function toggleFav(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem("hh8_favorites",JSON.stringify(favorites));if(!selected&&favorites.length)selected=favorites[0];renderAll()}
function show(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));scrollTo(0,0)}
function socialCard(x){return`<div class="social-card"><h3>🔥 ${esc(x.topic)}</h3><p>${esc(x.preview)}</p><div class="social-links"><a href="${x.instagram}" target="_blank">Instagram</a><a href="${x.facebook}" target="_blank">Facebook</a><a href="${x.youtube}" target="_blank">YouTube</a>${x.newsUrl?`<a href="${x.newsUrl}" target="_blank">Nieuws</a>`:""}</div></div>`}
function renderHeader(){const d=new Date(),h=d.getHours();$("#greeting").textContent=(h<12?"Goedemorgen":h<18?"Goedemiddag":"Goedenavond")+" Maarten-Jan! 👋";$("#date").textContent=d.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});$("#nTeams").textContent=favorites.length;$("#nNews").textContent=DATA.news.length;$("#nLive").textContent=DATA.live.length;$("#nMatches").textContent=Object.values(DATA.teams||{}).flatMap(x=>x.matches||[]).length}
function renderHome(){const pulse=[["Wedstrijden",$("#nMatches").textContent],["Nieuws",DATA.news.length],["Live",DATA.live.length],["Teams",favorites.length]];$("#pulse").innerHTML=pulse.map(x=>`<div><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");$("#teamStrip").innerHTML=favorites.length?favorites.map(id=>{const t=team(id);return`<button class="team-chip ${selected===id?"active":""}" onclick='selected=${JSON.stringify(id)};renderAll()'><h3>${esc(t.club)} ${esc(t.team)}</h3><p>${esc(t.competition)}</p></button>`}).join(""):"<div class='card empty'>Volg teams via Mijn teams.</div>";$("#today").innerHTML=DATA.news.slice(0,4).map((n,i)=>`<div class="today-item"><div>${["🇳🇱","🏆","🔁","📺"][i]}</div><div><h3>${esc(n.title)}</h3><p>${esc(editorial(n))}</p><div class="meta">${esc(n.source)}</div></div></div>`).join("");$("#homeNews").innerHTML=DATA.news.slice(0,6).map(card).join("");$("#livePreview").innerHTML=DATA.live.map(x=>`<div class="status-row"><div><b>${esc(x.title)}</b><div class="meta">${esc(x.source)}</div></div><a class="link" href="${x.url}" target="_blank">Open</a></div>`).join("")||"<div class='empty'>Geen livestream bevestigd.</div>";renderSelectedTeam()}
function renderSelectedTeam(){if(!selected){$("#teamSummary").innerHTML="<div class='empty'>Kies een favoriet team.</div>";$("#standing").innerHTML="<div class='empty'>Nog geen stand beschikbaar.</div>";return}const t=team(selected),d=tdata(selected),m=d.matches?.[0];$("#teamSummary").innerHTML=`<div class="section-head"><div><span class="badge">${esc(t.competition)}</span><h2>${esc(t.club)} ${esc(t.team)}</h2></div></div>${m?`<div class="card match-card"><div class="teams"><div class="team-name">${esc(m.home)}</div><div class="versus">${esc(m.score||"tegen")}</div><div class="team-name">${esc(m.away)}</div></div></div>`:"<div class='empty'>Nog geen komende wedstrijd gevonden.</div>"}`;const rows=d.standing||[];$("#standing").innerHTML=rows.length?`<table class="standing"><tr><th>#</th><th>Team</th><th>G</th><th>P</th></tr>${rows.map(r=>`<tr class="${(r.team||"").toLowerCase().includes(t.club.toLowerCase())?"fav":""}"><td>${r.position}</td><td>${esc(r.team)}</td><td>${r.played}</td><td>${r.points}</td></tr>`).join("")}</table>`:`<div class="data-state"><strong>Stand nog niet beschikbaar</strong><br>De actuele stand verschijnt automatisch zodra de competitiebron beschikbaar is. Tot die tijd tonen we geen verouderde of verzonnen gegevens.<div class="competition-actions"><button class="btn secondary" onclick="show('competitions')">Zoek competitie</button><a class="btn secondary" href="https://handbal.nl/programma-uitslagen-standen/" target="_blank">Open Handbal.nl</a></div></div>`}
function renderTeams(){const q=($("#teamSearch")?.value||"").toLowerCase();const list=DATA.catalog.filter(t=>!q||(t.club+" "+t.team+" "+t.competition).toLowerCase().includes(q));$("#catalog").innerHTML=list.map(t=>`<div class="status-row"><div><b>${esc(t.club)} ${esc(t.team)}</b><div class="meta">${esc(t.competition)}</div></div><button class="btn secondary" onclick='toggleFav(${JSON.stringify(t.id)})'>${favorites.includes(t.id)?"Ontvolgen":"Volgen"}</button></div>`).join("")}
function renderNews(){const q=($("#newsSearch")?.value||"").toLowerCase();$("#allNews").innerHTML=DATA.news.filter(n=>!q||(n.title+" "+n.summary+" "+n.source).toLowerCase().includes(q)).map(card).join("")}
function renderMore(){$("#social").innerHTML=DATA.social.map(socialCard).join("");$("#saved").innerHTML=DATA.news.filter(n=>saved.includes(n.url)).map(card).join("")||"<div class='empty'>Nog niets opgeslagen.</div>"}

function toggleCompetition(id){
 favoriteCompetitions=favoriteCompetitions.includes(id)?favoriteCompetitions.filter(x=>x!==id):[...favoriteCompetitions,id];
 localStorage.setItem("hh10_competitions",JSON.stringify(favoriteCompetitions));
 renderCompetitions();
}
function competitionList(){
 const base=DATA.competitions||[];
 const discovered=(DATA.catalog||[]).filter(x=>x.poolUrl).map(x=>({id:x.id,name:x.competition||x.club,sourceUrl:x.poolUrl,poolUrl:x.poolUrl}));
 return [...new Map([...base,...discovered].map(x=>[x.id,x])).values()];
}
function competitionCard(c){
 const teamEntry=(DATA.catalog||[]).find(x=>x.id===c.id||x.competition===c.name);
 const d=teamEntry?tdata(teamEntry.id):{standing:[],matches:[]};
 const rows=(d.standing||[]).slice(0,5);
 return `<div class="card competition-card"><span class="badge">Competitie</span><h3>${esc(c.name)}</h3><div class="meta">${rows.length?`${rows.length} standregels beschikbaar`:"Nog geen automatische stand"}</div>${rows.length?`<table class="standing"><tr><th>#</th><th>Team</th><th>P</th></tr>${rows.map(r=>`<tr><td>${esc(r.position)}</td><td>${esc(r.team)}</td><td>${esc(r.points)}</td></tr>`).join("")}</table>`:`<div class="data-state section"><strong>Automatische koppeling wordt gezocht.</strong><br>De laatst bekende gegevens verschijnen hier zodra de GitHub-workflow een openbare poule herkent.</div>`}<div class="competition-actions"><button class="btn secondary" onclick='toggleCompetition(${JSON.stringify(c.id)})'>${favoriteCompetitions.includes(c.id)?"Verwijder favoriet":"Maak favoriet"}</button>${c.sourceUrl?`<a class="btn secondary" href="${esc(c.sourceUrl)}" target="_blank">Officiële bron</a>`:""}</div></div>`;
}
function renderCompetitions(){
 const q=($("#competitionSearch")?.value||"").toLowerCase();
 const list=competitionList().filter(c=>!q||c.name.toLowerCase().includes(q));
 if($("#competitionCatalog"))$("#competitionCatalog").innerHTML=list.map(c=>`<div class="status-row"><div><b>${esc(c.name)}</b><div class="meta">${c.poolUrl?"Poulelink gevonden":"Algemene competitie"}</div></div><button class="btn secondary" onclick='toggleCompetition(${JSON.stringify(c.id)})'>${favoriteCompetitions.includes(c.id)?"Gevolgd":"Volgen"}</button></div>`).join("")||"<div class='empty'>Geen competitie gevonden.</div>";
 if($("#favoriteCompetitions"))$("#favoriteCompetitions").innerHTML=favoriteCompetitions.map(id=>list.find(c=>c.id===id)||competitionList().find(c=>c.id===id)).filter(Boolean).map(competitionCard).join("")||"<div class='card empty'>Je volgt nog geen competities.</div>";
}
function openMatchCenter(match,teamId){
 const t=team(teamId),m=match||{},q=encodeURIComponent(`${m.home||t.club} ${m.away||""} handbal`);
 $("#matchCenterContent").innerHTML=`<div class="card match-card"><span class="badge">${esc(m.competition||t.competition)}</span><div class="match-summary"><div class="club">${esc(m.home||t.club)}</div><div class="score">${esc(m.score||"vs")}</div><div class="club">${esc(m.away||"Tegenstander")}</div></div><div class="meta">${esc(m.date||"Nog geen datum gevonden")}</div></div><div class="grid grid-2 section"><div class="card"><h2>Nieuws rond de wedstrijd</h2><div class="social-links"><a href="https://news.google.com/search?q=${q}&hl=nl&gl=NL&ceid=NL:nl" target="_blank">Google Nieuws</a><a href="https://www.google.com/search?q=${q}" target="_blank">Lokale media</a></div></div><div class="card"><h2>Social & video</h2><div class="social-links"><a href="https://www.instagram.com/explore/search/keyword/?q=${q}" target="_blank">Instagram</a><a href="https://www.facebook.com/search/top?q=${q}" target="_blank">Facebook</a><a href="https://www.youtube.com/results?search_query=${q}" target="_blank">YouTube</a></div></div></div>`;
 show("matchcenter");
}

function renderAll(){renderHeader();renderHome();renderTeams();renderCompetitions();renderNews();renderMore()}
async function boot(){try{DATA=await fetch("app-data.json?"+Date.now()).then(r=>r.json())}catch(e){}const cached=JSON.parse(localStorage.getItem("hh8_news")||"null");if(cached?.length)DATA.news=cached;renderAll();loadNews()}
$$(".nav button").forEach(b=>b.onclick=()=>show(b.dataset.view));$("#teamSearch").oninput=renderTeams;$("#newsSearch").oninput=renderNews;if($("#competitionSearch"))$("#competitionSearch").oninput=renderCompetitions;boot();if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js");
