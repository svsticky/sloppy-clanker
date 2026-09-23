(() => {
  const TZ = "Europe/Amsterdam";
  const API = "/api/yusu";
  const POLL_MS = 5000;

  const $ = (id) => document.getElementById(id);
  const countEl = $("count");
  const plusEl = $("plus");
  const statusEl = $("status");
  const countdownEl = $("countdown");
  const historyEl = $("history");

  const clockFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const dayFmt = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  let day = null;
  let count = null;
  let pending = 0;
  let shown = null;

  const VO_AT = 20;

  function render() {
    if (count === null) return;
    const n = count + pending;
    countEl.textContent = n;
    countEl.classList.toggle("vo-mode", n === VO_AT);
    if (shown !== null && shown < VO_AT && n >= VO_AT) vo();
    shown = n;
  }

  // Bij 20: overal "vo".
  function vo() {
    const overlay = document.createElement("div");
    overlay.className = "vo-overlay";
    overlay.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 90; i++) {
      const word = document.createElement("span");
      word.className = "vo-word";
      word.textContent = "vo";
      word.style.left = Math.random() * 100 + "%";
      word.style.top = Math.random() * 100 + "%";
      word.style.fontSize = 1.5 + Math.random() * 6 + "rem";
      word.style.setProperty("--r", Math.round(Math.random() * 60 - 30) + "deg");
      word.style.animationDelay = Math.random() * 1.2 + "s";
      overlay.append(word);
    }
    document.body.append(overlay);
    setTimeout(() => overlay.classList.add("vo-out"), 4500);
    setTimeout(() => overlay.remove(), 5500);
  }

  function bump() {
    countEl.classList.remove("bump");
    void countEl.offsetWidth;
    countEl.classList.add("bump");
  }

  function renderHistory(rows) {
    historyEl.replaceChildren(
      ...rows.map(({ day, count }) => {
        const li = document.createElement("li");
        const d = document.createElement("span");
        d.textContent = dayFmt.format(new Date(day + "T12:00:00Z"));
        const n = document.createElement("span");
        n.className = "history-count";
        n.textContent = count;
        li.append(d, n);
        return li;
      }),
    );
  }

  async function refresh(withHistory = false) {
    try {
      const res = await fetch(API + (withHistory ? "?history" : ""), { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const newDay = day !== null && data.day !== day;
      if (count !== null && data.count > count && !newDay) bump();
      day = data.day;
      count = data.count;
      if (data.history) renderHistory(data.history);
      if (newDay) refresh(true);
      statusEl.textContent = "";
      render();
    } catch {
      statusEl.textContent = "Kan de teller niet bereiken.";
    }
  }

  async function plusOne() {
    pending++;
    render();
    bump();
    try {
      const res = await fetch(API, { method: "POST" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (data.day === day) count = Math.max(count, data.count);
      else refresh(true);
    } catch {
      statusEl.textContent = "Die yusu kwam niet door, probeer het nog eens.";
    } finally {
      pending--;
      render();
    }
  }

  function tick() {
    const p = Object.fromEntries(clockFmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
    const left = Math.max(0, 86400 - (p.hour * 3600 + p.minute * 60 + +p.second));
    const pad = (v) => String(v).padStart(2, "0");
    countdownEl.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  }

  plusEl.addEventListener("click", plusOne);
  tick();
  setInterval(tick, 1000);
  refresh(true);
  setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh());
})();
