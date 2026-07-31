# HandbalHub 8.0

Deze zip bevat **geen submappen**. Upload alle bestanden rechtstreeks naar de hoofdmap van je publieke GitHub-repository `handbalhub`.

## Bestanden
- index.html
- styles.css
- app.js
- app-data.json
- manifest.webmanifest
- service-worker.js
- icon-192.png
- icon-512.png
- pages-workflow.txt
- README.md

## GitHub Pages zonder workflowmap
Ga na het uploaden naar:
Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save.

De app verschijnt daarna op:
https://maartenjandekoning-star.github.io/handbalhub/

## Automatische updates
Omdat je geen submappen in de zip wilt, is de verplichte workflowlocatie `.github/workflows/` niet opgenomen. De app haalt nieuws daarom bij het openen zelf op via openbare RSS-feeds en bewaart het laatste nieuws lokaal.

`pages-workflow.txt` bevat een optionele Pages-workflow. Die is alleen nodig wanneer je later voor Source: GitHub Actions kiest; GitHub vereist dan dat dit bestand op `.github/workflows/pages.yml` staat.
