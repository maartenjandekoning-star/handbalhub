# HandbalHub 6.0 – V8 nieuwsengine

Dit is bewust weer de eenvoudige architectuur van de oude goedwerkende versies.

## Kernbestanden
- index.html
- styles.css
- app.js
- manifest.webmanifest
- service-worker.js

Daarnaast alleen de twee PWA-iconen.

## Nieuwsengine
Per RSS-bron probeert de app:
1. RSS2JSON
2. AllOrigins
3. CorsProxy

Handbal Startpunt krijgt een aparte HTML-uitlezer via dezelfde proxyfallbacks.

De laatste succesvolle feed wordt in localStorage opgeslagen. De ingebouwde noodfeed is altijd direct zichtbaar.

Geen GitHub Actions.
Geen Node.
Geen Playwright.
Geen news.json.
Geen submappen nodig.

Upload alle bestanden rechtstreeks naar de hoofdmap van GitHub Pages.
