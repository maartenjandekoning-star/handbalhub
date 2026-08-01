const C='handbalhub-7.9';
const F=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;const fresh=u.pathname.endsWith('/')||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/app.js')||u.pathname.endsWith('/styles.css');if(fresh){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));return;}e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));});
