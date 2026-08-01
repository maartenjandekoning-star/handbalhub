# HandbalHub 3.0 — altijd nieuws

Deze versie lost het lege startscherm fundamenteel op.

## Architectuur

- `news.json` — nieuws
- `live.json` — livevideo
- `standings.json` — standen
- `teams.json` kan later afzonderlijk worden toegevoegd

Geen enkel onderdeel kan een ander onderdeel meer leegmaken.

## Directe start

De app bevat bovendien een ingebouwde nieuwssnapshot in `app.js`. Daardoor ziet ook een nieuwe bezoeker direct artikelen, zelfs voordat `news.json` of GitHub Actions beschikbaar is.

## Nieuwsupdate

`update-news-rss.mjs` gebruikt alleen openbare RSS-feeds en geen Chromium of Playwright.

Een update wordt alleen opgeslagen als minimaal drie geldige artikelen zijn gevonden. Bij een storing blijft het bestaande `news.json` intact.

## GitHub

Upload alle zichtbare bestanden op de gebruikelijke manier.

Vervang daarna éénmalig de inhoud van `.github/workflows/main.yml` door de tekst uit:

`VERVANGENDE-WORKFLOW-TEKST.txt`

Daarna duurt een nieuwsupdate normaal geen kwartier, maar hooguit enkele minuten.
