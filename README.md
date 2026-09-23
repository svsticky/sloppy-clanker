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

Bij elke push naar `main` bouwt `.github/workflows/docker.yml` de image en zet hem op
`ghcr.io/svsticky/sloppy-clanker` met de tags `latest`, `main` en `sha-<commit>`.

Op de server:

```sh
docker compose pull && docker compose up -d
```

Is de package op GitHub privé, log dan eerst in met `docker login ghcr.io`.
