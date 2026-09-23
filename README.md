# zeimanyusu.today

De pagina van zeimanyusu.today, met een gedeelde teller die bijhoudt hoe vaak Man vandaag yusu heeft gezegd.
Bij precies 20 verschijnt er overal "vo".

- `public/`: de site (`index.html`, `style.css`, `counter.js`)
- `server.mjs`: Node-server zonder dependencies; serveert `public/` en de API
  - `GET /api/yusu` → `{ day, count }` (voeg `?history` toe voor de afgelopen 7 dagen)
  - `POST /api/yusu` → +1, geeft de nieuwe stand terug
  - `POST /api/yusu/reset` → teller van vandaag naar 0, alleen vanaf localhost
- Opslag: `counts.json` in `DATA_DIR` (standaard `./data`, in Docker `/data`), één sleutel per dag
  (`YYYY-MM-DD` in Europe/Amsterdam). Om 00:00 Nederlandse tijd begint de teller dus weer op 0.

## Lokaal draaien

```sh
npm start          # http://localhost:3000
npm run reset      # teller van vandaag naar 0
```

Of in Docker:

```sh
docker compose up --build
docker compose exec zeimanyusu node reset.mjs
```

## Automatisch bouwen

Bij elke push naar `main` of `development` bouwt `.github/workflows/docker.yml` de image
(`ghcr.io/svsticky/sloppy-clanker:<branch>`) en triggert daarna via Aas een deploy op de server
(role `zeimanyusu` in svsticky/sadserver):

| Branch        | Omgeving   | Domein                 |
|---------------|------------|------------------------|
| `main`        | production | zeimanyusu.today       |
| `development` | staging    | dev.zeimanyusu.today   |

Nodig in de GitHub-repo, per environment (`production` en `development`):
- variable `AAS_URL`: `https://aas.svsticky.nl/webhook/zeimanyusu-deploy` (staging: `aas.dev.svsticky.nl`)
- secret `AAS_PRE_SHARED_KEY`: dezelfde waarde als `secret_zeimanyusu.aas_pre_shared_key` in Bitwarden
