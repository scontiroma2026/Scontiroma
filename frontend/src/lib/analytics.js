import { API } from "@/lib/api";

// Analytics first-party ANONIMA: vid casuale non collegato all'account,
// nessun dato personale, eventi batchati e inviati al nostro backend.
const VID_KEY = "sr_vid";

function vid() {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) {
      v = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch (_) {
    return "anon";
  }
}

let queue = [];
let timer = null;

function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ vid: vid(), events: queue.splice(0, 20) });
  try {
    const ok = navigator.sendBeacon?.(`${API}/track`, new Blob([body], { type: "application/json" }));
    if (ok) return;
  } catch (_) { /* fallback fetch sotto */ }
  fetch(`${API}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function enqueue(ev) {
  queue.push(ev);
  if (queue.length >= 15) {
    flush();
    return;
  }
  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, 4000);
  }
}

export function trackPageview(path) {
  enqueue({ type: "pageview", path: String(path).slice(0, 120) });
}

export function trackClick(name) {
  enqueue({ type: "click", name: String(name).slice(0, 60) });
}

export function trackOpen() {
  try {
    if (sessionStorage.getItem("sr_opened")) return;
    sessionStorage.setItem("sr_opened", "1");
  } catch (_) { /* sessionStorage bloccato: traccia comunque l'apertura */ }
  enqueue({ type: "open" });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
}
