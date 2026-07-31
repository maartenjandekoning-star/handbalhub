# HandbalNieuws Nederland – PWA prototype

Dit is een werkende mobiele prototype-PWA. Alle nieuwskaarten, titels, afbeeldingen en uitgelichte berichten linken rechtstreeks door naar de oorspronkelijke website. De app bevat voorbeeldartikelen, zoeken, bron- en categoriefilters, favorieten, delen, offline cache, licht/donker thema, persoonlijke bronkeuze en een eenvoudige beheerweergave.

## Lokaal bekijken

Start in deze map een lokale webserver:

```bash
python3 -m http.server 8080
```

Open daarna `http://localhost:8080`.

## Publiceren

1. Plaats de volledige map op Netlify, Vercel, Cloudflare Pages of een andere HTTPS-host.
2. Open de HTTPS-link in Safari op de iPhone.
3. Tik op **Delen** → **Zet op beginscherm** → **Voeg toe**.

Een PWA en service worker werken alleen betrouwbaar via HTTPS of localhost.

## Live nieuwsfeeds

De openbare RSS/API-adressen van de drie gewenste bronnen konden bij het maken van dit prototype niet betrouwbaar worden bevestigd. Vul geen vermoedelijke URL in zonder toestemming of technische controle.

Voor productie wordt een serverless endpoint aanbevolen dat:

- uitsluitend officiële RSS-feeds of API's uitleest;
- per bron de voorwaarden en robots.txt respecteert;
- titel, samenvatting, afbeelding, datum, bron en originele URL normaliseert;
- HTML saneert;
- duplicaten op URL en genormaliseerde titel verwijdert;
- resultaten tijdelijk cachet;
- per bron fouten registreert zonder de hele feed te blokkeren.

De beheerpagina in het prototype bewaart feedadressen lokaal. Een productieversie moet dit server-side beveiligen met authenticatie en een database.

## Belangrijk

De nieuwsitems in `data/articles.json` zijn demonstratiegegevens en geen overgenomen nieuwsberichten. Vervang deze pas nadat officiële invoermethoden zijn vastgesteld.


## Rechtstreeks doorklikken

- Tik op de afbeelding, titel of knop **Lees op [bron]** om de oorspronkelijke website te openen.
- Bovenaan staan daarnaast vaste snelkoppelingen naar Handbal Inside, Handbal Startpunt en Handbal.nl.
- Externe pagina’s openen in een nieuw tabblad, zodat de PWA beschikbaar blijft.
