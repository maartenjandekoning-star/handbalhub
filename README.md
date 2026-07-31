# HandbalNieuws Nederland v6

Deze versie is bewust geschikt gemaakt voor uploaden via een iPhone: alle bestanden staan in de hoofdmap.

Upload of vervang in GitHub alle bestanden uit deze map:
- index.html
- news.js
- netlify.toml
- manifest.webmanifest
- icon-192.png
- icon-512.png
- README.md

Netlify gebruikt `news.js` als serverfunctie doordat in `netlify.toml` de functiesmap op de hoofdmap staat. De app haalt bij het openen en via de vernieuwknop automatisch nieuws op.

Test na publicatie:
`https://JOUW-SITE.netlify.app/.netlify/functions/news`

Daar moet JSON zichtbaar zijn met `articles` en `sources`.
