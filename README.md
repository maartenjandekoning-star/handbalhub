# HandbalHub 12.0.1 — gecorrigeerde werkende basis

Deze versie bevat de automatische standenoplossing zonder officiële API:

Handbal.nl → Playwright-browserrobot → app-data.json → HandbalHub.

## Belangrijkste correctie

De GitHub Actions-workflow gebruikt geen npm-cache meer. Daardoor ontstaat niet langer de fout:

`Dependencies lock file is not found`

Node.js is tevens bijgewerkt naar versie 24.

## Uploaden

Upload alle bestanden naar de hoofdmap van je repository. Laat de bestaande map:

`.github/workflows/`

staan. Als je de volledige mapstructuur kunt uploaden, bevat deze zip ook al de juiste workflow.

## Workflow

De definitieve workflow staat op:

`.github/workflows/update-handbalhub.yml`

De zichtbare kopie voor de installatiepagina staat op:

`workflow-template.yml`

## Eerste test

Ga naar:

Actions → Update HandbalHub data → Run workflow

Bij succes worden nieuws, afbeeldingen, live-items en openbare standen bijgewerkt in `app-data.json`.

## Eerlijke beperking

De standen worden zonder officiële API uit openbare Handbal.nl-pagina's gehaald. Wanneer Handbal.nl de pagina-opbouw wijzigt of een competitie niet openbaar ontsluit, blijft de laatst bekende stand staan.
