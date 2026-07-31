# HandbalHub 12.0 — automatische standen zonder officiële API

De standenoplossing gebruikt:

Handbal.nl → Playwright-browserrobot in GitHub → app-data.json → HandbalHub.

## Geen YAML kopiëren

Na upload open je:

`https://maartenjandekoning-star.github.io/handbalhub/install-automation.html`

Tik op **Automatische standen installeren**. GitHub opent het workflowbestand met:

- de juiste map;
- de juiste bestandsnaam;
- de volledige inhoud.

Je hoeft alleen op **Commit changes** te tikken. De eerste update start daarna automatisch.

## Wat de robot doet

- opent Handbal.nl als een echte browser;
- zoekt op club- en teamnamen;
- verzamelt openbare poulelinks;
- controleert dynamische netwerkreacties op standen;
- leest zichtbare tabellen;
- bewaart de laatst bekende stand wanneer een update mislukt;
- werkt daarnaast nieuws, afbeeldingen, socialonderwerpen en bevestigde livestreams bij.

## Belangrijk

Dit gebruikt geen officiële API en geen API-sleutel. Het blijft wel geautomatiseerd uitlezen van openbare pagina's. Wanneer Handbal.nl de technische paginaopbouw wijzigt, kan de herkenning een aanpassing nodig hebben.
