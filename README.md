# HandbalHub 2.0.1 — direct nieuws

Deze herstelversie lost de trage lege startpagina op.

## Nieuwe laadstrategie

1. Laatst bekende nieuwsberichten worden direct uit het apparaat geladen.
2. De pagina wordt onmiddellijk zichtbaar.
3. `app-data.json` wordt daarna op de achtergrond vernieuwd.
4. Een tijdelijk leeg bestand mag bestaande nieuwsberichten nooit meer wissen.
5. De browsercache wordt niet meer bij iedere opening verwijderd.
6. De service worker bewaart de laatst succesvolle nieuwsdata.

Hierdoor hoeft de gebruiker niet te wachten tot GitHub Actions opnieuw nieuws heeft opgehaald.

## Uploaden

Upload de zichtbare bestanden naar de hoofdmap van de repository. Laat `.github/workflows/main.yml` ongewijzigd staan.
