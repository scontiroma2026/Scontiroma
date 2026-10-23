import { GIORNI } from "@/components/MerchantHours";
import { renderBold } from "@/lib/renderBold";

/**
 * Revisione admin: TUTTO quello che il commerciante ha inserito, per esteso, campi vuoti compresi
 * (segnati «Lasciato vuoto»). Si legge prima di approvare. Passare `offerta`, `negozio` o entrambi.
 */
const vuoto = (v) => v === null || v === undefined || (typeof v === "string" && !v.trim());

function Campo({ etichetta, valore, testo = true, id }) {
  const manca = vuoto(valore);
  return (
    <div data-testid={id} data-vuoto={manca ? "si" : "no"} className="min-w-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{etichetta}</dt>
      <dd className="mt-0.5 text-sm text-foreground break-words">
        {manca ? (
          <span className="inline-block rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Lasciato vuoto
          </span>
        ) : testo ? (
          <span className="whitespace-pre-line">{renderBold(String(valore))}</span>
        ) : valore}
      </dd>
    </div>
  );
}

function Orari({ orari }) {
  if (!orari?.giorni?.length) return null;
  return (
    <div className="space-y-0.5">
      {orari.chiusura_straordinaria && <div className="font-semibold">Chiuso temporaneamente{orari.nota_chiusura ? `: ${orari.nota_chiusura}` : ""}</div>}
      {orari.giorni.map((g, i) => (
        <div key={GIORNI[i]}>
          <span className="text-muted-foreground">{GIORNI[i]}:</span>{" "}
          {g.chiuso ? "Chiuso" : g.fasce.map((f) => `${f.apre}–${f.chiude}`).join(" · ")}
        </div>
      ))}
    </div>
  );
}

const euro = (n) => (typeof n === "number" ? `€${n.toFixed(2)}` : null);

export default function SchedaCompleta({ offerta, negozio, id }) {
  const o = offerta;
  const n = negozio;
  const campiOfferta = o ? [
    o.title, o.description, o.original_price, o.discounted_price, o.terms, o.plan_ahead, o.validity_info, o.additional_info,
  ] : [];
  const campiNegozio = n ? [
    n.shop_name, n.name, n.email, n.phone, n.piva, n.category, n.zone, n.address, n.shop_description, n.image_url, n.orari?.giorni?.length ? 1 : null,
  ] : [];
  const vuoti = [...campiOfferta, ...campiNegozio].filter(vuoto).length;
  const foto = o ? (Array.isArray(o.image_urls) && o.image_urls.length ? o.image_urls : (o.image_url ? [o.image_url] : [])) : [];

  return (
    <div data-testid={`scheda-completa-${id}`} className="mt-3 rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">
        Tutto quello che ha inserito il negozio{" "}
        <span data-testid={`scheda-vuoti-${id}`} className={vuoti ? "text-amber-800 dark:text-amber-300" : "text-emerald-700"}>
          {vuoti ? `· ${vuoti} ${vuoti === 1 ? "campo vuoto" : "campi vuoti"}` : "· nessun campo vuoto"}
        </span>
      </div>
      {o && (
        <>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-ciano">L'offerta</div>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Campo etichetta="Titolo" valore={o.title} id={`sc-titolo-${id}`} /></div>
            <div className="sm:col-span-2"><Campo etichetta="Descrizione" valore={o.description} id={`sc-descrizione-${id}`} /></div>
            <Campo etichetta="Prezzo pieno" valore={euro(o.original_price)} />
            <Campo etichetta="Prezzo scontato" valore={euro(o.discounted_price)} />
            <Campo etichetta="Sconto" valore={o.percent_off != null ? `−${o.percent_off}%` : null} />
            <Campo etichetta="Usi al mese per cliente" valore={`${o.max_uses_per_month || 1}`} />
            <div className="sm:col-span-2"><Campo etichetta="Termini e condizioni" valore={o.terms} id={`sc-termini-${id}`} /></div>
            <div className="sm:col-span-2"><Campo etichetta="Pianifica in anticipo" valore={o.plan_ahead} /></div>
            <div className="sm:col-span-2"><Campo etichetta="Inclusioni ed esclusioni (giorni e orari)" valore={o.validity_info} /></div>
            <div className="sm:col-span-2"><Campo etichetta="Informazioni aggiuntive" valore={o.additional_info} /></div>
            <Campo etichetta="Foto dell'offerta" valore={foto.length ? `${foto.length} (controllo qui sotto)` : null} />
            <Campo etichetta="Attiva nel catalogo" valore={o.active === false ? "No" : "Sì"} />
          </dl>
        </>
      )}
      {n && (
        <>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-ciano">Il negozio</div>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo etichetta="Nome del negozio" valore={n.shop_name} />
            <Campo etichetta="Referente" valore={n.name} />
            <Campo etichetta="Email" valore={n.email} />
            <Campo etichetta="Telefono" valore={n.phone} />
            <Campo etichetta="Partita IVA" valore={n.piva} />
            <Campo etichetta="Categoria" valore={n.category} />
            <Campo etichetta="Zona" valore={n.zone} />
            <Campo etichetta="Indirizzo" valore={n.address} />
            <div className="sm:col-span-2"><Campo etichetta="Descrizione del negozio" valore={n.shop_description} id={`sc-descr-negozio-${id}`} /></div>
            {!vuoto(n.description) && (
              <div className="sm:col-span-2"><Campo etichetta="Descrizione breve (vecchio campo)" valore={n.description} /></div>
            )}
            <Campo
              etichetta="Foto del negozio"
              testo={false}
              valore={n.image_url ? <img src={n.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" /> : null}
            />
            <Campo etichetta="Orari" testo={false} valore={n.orari?.giorni?.length ? <Orari orari={n.orari} /> : null} />
          </dl>
        </>
      )}
    </div>
  );
}
