# HandbalHub 6.3 – correcte nieuwsdatums

Gerichte reparatie van de nieuwsdatums.

- De ophaaltijd wordt nooit meer als publicatiedatum gebruikt.
- RSS/Atom gebruikt pubDate, published, updated of dc:date.
- Handbal Startpunt HTML-fallback probeert de echte datum uit time/datePublished te halen.
- Zonder betrouwbare datum staat er 'Datum onbekend'.
- Artikelen zonder datum komen niet in 'In het nieuws vandaag' of 'Laatste 7 dagen'.
- 'In het nieuws vandaag' gebruikt alleen betrouwbaar gedateerde berichten van circa de laatste 24 uur.
- Oud/ongedateerd nieuws blijft beschikbaar onder ouder nieuws.
- De competitieverbeteringen van 6.2 blijven behouden.
