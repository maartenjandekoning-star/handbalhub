# HandbalHub 13.0 — stabiele updatearchitectuur

Versie 13 scheidt drie processen:

1. `update-news.mjs` — nieuws, afbeeldingen, social en live;
2. `update-standings.mjs` — alleen bekende poulelinks;
3. `discover-pools.mjs` — handmatige, begrensde ontdekking van nieuwe poulelinks.

## Voordelen

- nieuws blijft werken als standen mislukken;
- normale workflows duren geen kwartier meer;
- harde time-outs per onderdeel;
- bestaande poulelinks worden hergebruikt;
- veilige opslag met fetch + rebase;
- geen nieuwe submappen;
- alleen de bestaande `.github/workflows/main.yml`.

## Uploaden

Upload de zichtbare bestanden zoals gebruikelijk. Laat de bestaande map `.github/workflows` in GitHub staan.

Vervang daarna één keer de inhoud van `.github/workflows/main.yml` door de workflow uit deze zip, of upload de volledige mapstructuur vanaf een computer die verborgen mappen ondersteunt.

## Gebruik

Onder Actions → Update HandbalHub data → Run workflow kun je kiezen:

- `all`
- `news`
- `standings`
- `discover`

De geplande update draait iedere zes uur nieuws en standen. Poule-ontdekking draait alleen handmatig.

## Belangrijke beperking

Zonder officiële API kan een poulelink niet altijd automatisch worden gevonden. Zodra een concrete `poolUrl` in `standings-config.json` staat, wordt die stand snel en automatisch bijgewerkt.
