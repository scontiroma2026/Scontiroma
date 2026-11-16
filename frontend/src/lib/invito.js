// Invito personale a un negozio: «La vostra pagina è pronta» (strategia approvata dal titolare, 14/11).
// Il link lo prepariamo noi, uno per negozio, e lo manda il titolare (mai invii di massa).
// Nel link ci sono solo dati pubblici dell'attività (insegna, categoria, zona) e l'idea di offerta:
// nessun dato di persone. Stanno nei parametri (?n=…), non nel percorso, così le statistiche anonime
// del sito (che contano solo il percorso) non li registrano. Niente viene salvato nel browser.
import { offertePronte } from "@/lib/offertePronte";

// Codice corto nel link → categoria dell'app
export const CATEGORIE_INVITO = {
  ristorante: "Ristorante",
  bar: "Bar & Caffè",
  pizzeria: "Pizzeria",
  gelateria: "Gelateria",
  beauty: "Beauty & SPA",
  sport: "Sport & Fitness",
  shopping: "Shopping",
  cultura: "Cultura",
  vino: "Vino & Gastronomia",
  servizi: "Servizi",
};

// Una foto di esempio per categoria (dalla nostra libreria in /esempi, senza persone riconoscibili).
// «Servizi» è troppo vario: resta il segnaposto «Nessuna foto».
const FOTO_ESEMPIO = {
  "Ristorante": "/esempi/1481931098730-318b6f776db0.jpg",
  "Bar & Caffè": "/esempi/1502165971801-35b35e7bbf9b.jpg",
  "Pizzeria": "/esempi/1574071318508-1cdbab80d002.jpg",
  "Gelateria": "/esempi/1570197788417-0e82375c9371.jpg",
  "Beauty & SPA": "/esempi/1625038032200-648fbcd800d0.jpg",
  "Sport & Fitness": "/esempi/1584735935682-2f2b69dff9d2.jpg",
  "Shopping": "/esempi/1489987707025-afc232f7ea0f.jpg",
  "Cultura": "/esempi/1542372147193-a7aca54189cd.jpg",
  "Vino & Gastronomia": "/esempi/1541529086526-db283c563270.jpg",
};

// Solo testo semplice: via i caratteri di controllo e i segni usati nel codice, spazi doppi, e taglio alla lunghezza massima.
// eslint-disable-next-line no-control-regex
const pulisci = (testo, max) => String(testo || "").replace(/[\u0000-\u001f<>{}[\]\\]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

/** Legge l'invito dai parametri del link. Tutto è facoltativo: senza dati la pagina resta generica. */
export function leggiInvito(params) {
  const codice = String(params.get("c") || "").toLowerCase();
  const categoria = CATEGORIE_INVITO[codice] || "";
  const pronte = offertePronte(categoria);
  const scelta = params.get("o");
  return {
    nome: pulisci(params.get("n"), 60),
    codice: categoria ? codice : "",
    categoria,
    zona: pulisci(params.get("z"), 40),
    offerta: pronte.find((o) => o.id === scelta) || pronte[0],
    foto: FOTO_ESEMPIO[categoria] || "",
  };
}

/** Link alla registrazione del negozio con nome, categoria e zona già compilati. */
export function linkRegistrazione(inv) {
  const p = new URLSearchParams({ role: "merchant" });
  if (inv.nome) p.set("n", inv.nome);
  if (inv.codice) p.set("c", inv.codice);
  if (inv.zona) p.set("z", inv.zona);
  return `/register?${p.toString()}`;
}

/** Trova nell'elenco il valore uguale a `cercato` senza badare a maiuscole e spazi (vuoto se non c'è). */
export function trovaValore(elenco, cercato) {
  const c = String(cercato || "").trim().toLowerCase();
  if (!c) return "";
  return (elenco || []).find((v) => String(v).trim().toLowerCase() === c) || "";
}
