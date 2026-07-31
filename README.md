# HandbalHub 10.0

Versie 10 bevat:

- verbeterde nieuwskaarten zonder grote lege afbeeldingsvlakken;
- automatische Open Graph-afbeeldingen via GitHub Actions;
- aparte pagina Competities;
- meerdere favoriete teams én competities;
- duidelijke standstatus wanneer de openbare bron nog niet is gevonden;
- wedstrijdcentrum met nieuws-, Instagram-, Facebook- en YouTube-zoekingen;
- automatische RSS- en Google Nieuws-update;
- alleen bevestigde livestreams;
- automatische poging om openbare Handbal.nl-poules en standen uit te lezen;
- behoud van de laatst bekende gegevens bij een fout.

## Belangrijk voor iPad

De iPad Bestanden-app toont de verborgen map `.github` mogelijk niet.

Daarom staat de workflow dubbel in deze download:

1. correct op:
   `.github/workflows/update-handbalhub.yml`
2. zichtbaar in de hoofdmap als:
   `github-workflow.yml`

Wanneer de map `.github` niet wordt geüpload:

1. Ga in GitHub naar **Add file → Create new file**.
2. Typ als bestandsnaam:
   `.github/workflows/update-handbalhub.yml`
3. Open lokaal `github-workflow.yml`.
4. Kopieer de volledige inhoud en plak die in GitHub.
5. Commit direct naar `main`.

## Eerste automatische update

Ga daarna naar:

**Actions → Update HandbalHub data → Run workflow**

GitHub Pages blijft ingesteld op:

**main → /(root)**

## Eerlijke beperking

De standenrobot gebruikt openbare Handbal.nl-pagina's en is geen officiële Sportlink-koppeling. Wanneer de website geen poulelink of tabel beschikbaar stelt, toont HandbalHub geen verzonnen stand maar een duidelijke bronstatus en een link naar de officiële omgeving.
