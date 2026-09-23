// Zet de teller van vandaag terug naar 0.
// Lokaal: `npm run reset`. In Docker: `docker compose exec zeimanyusu node reset.mjs`.
const port = Number(process.env.PORT) || 3000;
const res = await fetch(`http://127.0.0.1:${port}/api/yusu/reset`, { method: "POST" });
console.log(res.ok ? "Teller staat weer op 0." : `Reset mislukt: ${res.status} ${await res.text()}`);
process.exitCode = res.ok ? 0 : 1;
