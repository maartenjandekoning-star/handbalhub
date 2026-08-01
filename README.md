# HandbalHub 13.1 — nieuws als startpagina

Herstelversie voor:
- niet reagerende knoppen/navigatie;
- oude service-worker-cache;
- terugval naar een lokaal cachebestand met slechts drie artikelen;
- een te drukke homepagina.

De app start nu direct op de volledige nieuwspagina. Navigatie gebruikt centrale event delegation en is daardoor robuuster op iPad/Safari.

De app kiest altijd de grootste beschikbare nieuwsfeed en vervangt actuele serverdata nooit meer door een oude lokale 3-artikelen-cache.

Upload de zichtbare bestanden zoals gebruikelijk. Laat `.github/workflows/main.yml` staan.
