/* Service worker delle notifiche push per l'admin di Sconti Roma.
 * Fa solo due cose: mostra le notifiche che arrivano dal server e, al tocco, apre /admin.
 * Non intercetta le richieste del sito (nessun "fetch"): il resto del sito funziona come prima.
 * Viene registrato solo quando l'admin tocca «Attiva notifiche». */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function percorsoSicuro(url) {
  // Solo indirizzi interni al sito (es. "/admin"); qualsiasi altra cosa porta a /admin.
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/admin";
}

self.addEventListener("push", (event) => {
  let dati = {};
  try {
    dati = event.data ? event.data.json() : {};
  } catch (_) {
    dati = { title: event.data ? event.data.text() : "" };
  }
  const titolo = dati.title || "Sconti Roma";
  event.waitUntil(
    self.registration.showNotification(titolo, {
      body: dati.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      lang: "it-IT",
      data: { url: percorsoSicuro(dati.url) },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destinazione = new URL(percorsoSicuro(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    (async () => {
      const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const finestra of finestre) {
        if (finestra.url.startsWith(self.location.origin)) {
          try {
            await finestra.focus();
            if ("navigate" in finestra) await finestra.navigate(destinazione);
            return;
          } catch (_) {
            /* se non riesce, apre una finestra nuova qui sotto */
          }
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(destinazione);
    })()
  );
});
