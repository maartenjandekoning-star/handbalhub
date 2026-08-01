const CACHE="handbalhub-2.0.1";
const CORE=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./handbalhub-logo.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);

  if(url.origin===location.origin && url.pathname.endsWith("app-data.json")){
    event.respondWith(
      caches.open(CACHE).then(async cache=>{
        const cached=await cache.match(event.request,{ignoreSearch:true});
        const network=fetch(event.request).then(response=>{
          if(response.ok)cache.put("app-data.json",response.clone());
          return response;
        }).catch(()=>null);

        return cached || await network || new Response('{"news":[]}',{
          headers:{"content-type":"application/json"}
        });
      })
    );
    return;
  }

  if(url.origin===location.origin){
    event.respondWith(
      caches.match(event.request,{ignoreSearch:true})
        .then(cached=>cached || fetch(event.request).then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        }))
    );
  }
});
