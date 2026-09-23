import { createServer } from "node:http";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || "./data";
const DATA_FILE = join(DATA_DIR, "counts.json");
const PUBLIC_DIR = new URL("./public/", import.meta.url).pathname;

// Eén teller per kalenderdag in Nederlandse tijd. Om 00:00 (Europe/Amsterdam)
// verandert de sleutel, dus begint de teller vanzelf weer op 0.
const TZ = "Europe/Amsterdam";
export const dayKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// Alles gaat door één proces, dus tellen in het geheugen en daarna wegschrijven is veilig.
let counts = {};
try {
  counts = JSON.parse(await readFile(DATA_FILE, "utf8"));
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}
await mkdir(DATA_DIR, { recursive: true });

let writing = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(counts);
  writing = writing.catch(() => {}).then(async () => {
    await writeFile(DATA_FILE + ".tmp", snapshot);
    await rename(DATA_FILE + ".tmp", DATA_FILE);
  });
  return writing;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const json = (res, body, status = 200) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

function history(today) {
  return Object.keys(counts)
    .filter((k) => k < today)
    .sort()
    .reverse()
    .slice(0, 7)
    .map((day) => ({ day, count: counts[day] }));
}

const isLocal = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

async function api(req, res, url) {
  const day = dayKey();
  // Alleen vanaf de machine/container zelf, zodat bezoekers de teller niet kunnen wissen.
  if (url.pathname === "/api/yusu/reset" && req.method === "POST") {
    if (!isLocal(req)) return json(res, { error: "Forbidden" }, 403);
    delete counts[day];
    await save();
    return json(res, { day, count: 0 });
  }
  if (req.method === "POST") {
    counts[day] = (counts[day] ?? 0) + 1;
    const count = counts[day];
    await save();
    return json(res, { day, count });
  }
  if (req.method === "GET") {
    const body = { day, count: counts[day] ?? 0 };
    if (url.searchParams.has("history")) body.history = history(day);
    return json(res, body);
  }
  json(res, { error: "Method not allowed" }, 405);
}

async function serveStatic(req, res, url) {
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.endsWith("/")) path += "index.html";
  try {
    const body = await readFile(join(PUBLIC_DIR, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Niet gevonden");
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/yusu")) return await api(req, res, url);
    if (req.method === "GET" || req.method === "HEAD") return await serveStatic(req, res, url);
    res.writeHead(405).end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, { error: "Er ging iets mis" }, 500);
  }
}).listen(PORT, () => console.log(`zeimanyusu luistert op http://localhost:${PORT}`));
