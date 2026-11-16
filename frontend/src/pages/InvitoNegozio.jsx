import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Gift, MapPin } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FotoOfferta } from "@/components/NoPhoto";
import { CLASSE_WHATSAPP, DATI_WHATSAPP, IconaWhatsApp } from "@/components/TastoWhatsApp";
import { WHATSAPP_NUMERO } from "@/components/RiquadroCiPensiamoNoi";
import { trackClick } from "@/lib/analytics";
import { salvaFonte, registraVisitaFonte } from "@/lib/referral";
import { leggiInvito, linkRegistrazione } from "@/lib/invito";

const PASSI = [
  { n: "1", t: "Vi iscrivete", d: "Email, password e pochi dati del negozio. Nome, categoria e zona sono già compilati." },
  { n: "2", t: "Sistemate l'offerta", d: "Partite dall'idea qui sopra o da un'altra già pronta: scrivete il prezzo e mettete una vostra foto." },
  { n: "3", t: "Va online dopo il nostro controllo", d: "Chi abita vicino la trova nell'app e arriva in negozio con il QR." },
];

/**
 * «La vostra pagina è pronta»: anteprima personale per un negozio che non è ancora iscritto.
 * Il link lo prepariamo noi, uno per negozio (vedi `lib/invito.js`). Qui non si salva e non si pubblica nulla:
 * la pagina del negozio nasce solo se il negozio si iscrive e noi approviamo l'offerta.
 */
export default function InvitoNegozio() {
  const [params] = useSearchParams();
  const inv = leggiInvito(params);
  const fonte = params.get("fonte") || "invito";

  useEffect(() => {
    // Si ricorda da dove arriva il negozio (per l'iscrizione) e si conta la visita, in forma anonima
    salvaFonte(fonte);
    registraVisitaFonte(fonte, "negozio", (f, tipo) => api.post("/fonte/visita", { fonte: f, tipo }).catch(() => {}));
  }, [fonte]);

  useEffect(() => {
    // Anteprima personale: fuori dai motori di ricerca
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const o = inv.offerta;
  const omaggio = o?.tipo === "omaggio";
  const chi = inv.nome || "il vostro negozio";
  const whatsapp = `https://wa.me/39${WHATSAPP_NUMERO.replace(/\s/g, "")}?text=${encodeURIComponent(
    inv.nome
      ? `Ciao, sono di ${inv.nome}: ho visto la pagina pronta su Sconti Roma e vorrei saperne di più.`
      : "Ciao, ho visto la pagina pronta su Sconti Roma e vorrei saperne di più.",
  )}`;

  return (
    <main data-testid="invito-page" className="mx-auto max-w-xl px-6 py-10 text-foreground">
      <div className="text-xs uppercase tracking-[0.2em] text-gold">Per {chi}</div>
      <h1 data-testid="invito-titolo" className="mt-2 break-words font-serif text-4xl leading-tight sm:text-5xl">
        {inv.nome ? <>La pagina di {inv.nome} è pronta</> : <>La pagina del vostro negozio è pronta</>}
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        L'abbiamo preparata noi di Sconti Roma, l'app che porta nei negozi di Roma e dintorni le persone che abitano vicino.{" "}
        <strong className="text-foreground">Non è pubblica:</strong> nell'app non c'è finché non la attivate voi.
      </p>

      <section data-testid="invito-anteprima" aria-label="Anteprima della pagina" className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative aspect-[16/9] overflow-hidden">
          <FotoOfferta src={inv.foto} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider text-background">Anteprima</span>
        </div>
        <div className="space-y-2 p-5">
          {(inv.categoria || inv.zona) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {inv.categoria && <span className="font-semibold uppercase tracking-wider text-ciano">{inv.categoria}</span>}
              {inv.zona && <span className="flex items-center gap-1 text-muted-foreground"><MapPin size={12} aria-hidden="true" /> {inv.zona}</span>}
            </div>
          )}
          <h2 data-testid="invito-offerta" className="font-serif text-2xl leading-snug">{o.titolo}</h2>
          <p className="break-words text-sm text-muted-foreground">{chi}</p>
          <div className="border-t border-border pt-3">
            {omaggio ? (
              <div className="flex items-center gap-2 font-serif text-xl text-fucsia"><Gift size={18} aria-hidden="true" /> In omaggio</div>
            ) : (
              <div className="font-serif text-xl text-fucsia">Il prezzo lo decidete voi</div>
            )}
          </div>
        </div>
      </section>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        È solo un'idea: testo, foto e prezzo li cambiate come volete.{inv.foto ? " La foto è un esempio." : ""}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button asChild className="min-h-14 rounded-full grad-fucsia-viola px-8 text-base font-extrabold text-white">
          <Link data-testid="invito-attiva" to={linkRegistrazione(inv)} onClick={() => trackClick("invito_attiva")}>Attiva la pagina</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <strong className="text-foreground">2 mesi di prova gratuita.</strong> Vi iscrivete in due minuti dal telefono.
        </p>
        <a data-testid="invito-whatsapp" href={whatsapp} target="_blank" rel="noreferrer"
          onClick={() => trackClick("invito_whatsapp")}
          {...DATI_WHATSAPP} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-extrabold ${CLASSE_WHATSAPP}`}>
          <IconaWhatsApp />
          Scrivici su WhatsApp
        </a>
      </div>

      <section className="mt-10" aria-labelledby="invito-passi">
        <h2 id="invito-passi" className="font-serif text-3xl">Cosa succede se la attivate</h2>
        <ol className="mt-4 space-y-3">
          {PASSI.map((p) => (
            <li key={p.n} data-testid={`invito-passo-${p.n}`} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fucsia/10 font-serif text-lg text-fucsia">{p.n}</div>
              <div>
                <h3 className="font-serif text-xl">{p.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Volete capire meglio come funziona e quanto costa dopo la prova?{" "}
        <Link data-testid="invito-come-funziona" to="/per-i-commercianti" className="font-semibold text-foreground underline">Leggete la pagina per i commercianti</Link>.
      </p>
      <p data-testid="invito-no" className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Non vi interessa? Rispondete NO al nostro messaggio e non vi contattiamo più.
      </p>
    </main>
  );
}
