# HandbalNieuws Nederland v5

Deze versie haalt nieuws automatisch op via een Netlify Function. Er is geen persoonlijke API-sleutel nodig.

## Eenmalig uploaden
Upload alle bestanden en mappen naar de hoofdmap van de GitHub-repository, inclusief:
- index.html
- netlify.toml
- service-worker.js
- manifest.webmanifest
- icons/
- netlify/functions/news.js

Netlify detecteert `netlify.toml` automatisch en publiceert de serverfunctie mee.

## Functies
- automatisch nieuws ophalen van Handbal Inside, Handbal Startpunt, Handbal.nl, HandbalOost, Super Handball League en Groot Hellevoet;
- directe links naar originele artikelen;
- livestreamknop voor superhandballeague.tv;
- uitslagen en standen via Handbal.nl;
- eigen favoriete competitielink bewaren op de iPhone;
- zoeken, bronfilters en artikelen opslaan;
- offline terugvallen op laatst geladen nieuws.

De app probeert eerst openbare RSS-feeds en gebruikt daarna beperkte uitlezing van openbare overzichtspagina's. Als een bron zijn site wijzigt, kan die bron tijdelijk geen berichten leveren; de overige bronnen blijven werken.
