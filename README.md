# HandbalHub 7.0 – betere afbeeldingen

Deze versie verandert alleen de afbeeldingslogica van de nieuwsfeed.

Volgorde:
1. afbeelding die RSS2JSON al levert;
2. RSS media:thumbnail / media:content / enclosure;
3. afbeelding in de RSS-omschrijving;
4. wanneer nog niets beschikbaar is: og:image / Twitter image van het oorspronkelijke artikel.

Belangrijk:
- de feed verschijnt meteen;
- het ophalen van ontbrekende artikelafbeeldingen gebeurt daarna op de achtergrond;
- maximaal 24 recente artikelen worden per sessie gecontroleerd;
- maximaal 3 artikelpagina's tegelijk;
- gevonden afbeeldingen worden lokaal gecachet;
- Google Nieuws-redirectlinks worden niet extra gescrapet;
- geen afbeelding wordt verzonnen.

De overige werking van HandbalHub 6.9 is ongemoeid gelaten.
