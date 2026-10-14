import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

/** Riepilogo della settimana: cosa funziona, con il confronto con la settimana prima. Solo numeri. */
export default function AdminRiepilogo({ hdrs }) {
  const [d, setD] = useState(null);
  const [caricando, setCaricando] = useState(false);

  const carica = useCallback(() => {
    setCaricando(true);
    api.get("/admin/riepilogo-settimanale", hdrs())
      .then((r) => setD(r.data))
      .catch((e) => toast.error(formatApiError(e)))
      .finally(() => setCaricando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hdrs cambia a ogni render
  }, []);
  useEffect(() => { carica(); }, [carica]);

  if (!d) return <p className="text-muted-foreground">Caricamento…</p>;
  const s = d.situazione;
  return (
    <div data-testid="admin-riepilogo" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">La settimana</h2>
          <p data-testid="riepilogo-periodo" className="text-sm text-muted-foreground">{d.periodo.etichetta} · ↑ ↓ rispetto alla settimana prima</p>
        </div>
        <button
          type="button"
          data-testid="riepilogo-aggiorna"
          onClick={carica}
          disabled={caricando}
          className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
        >
          {caricando ? "Aggiorno…" : "Aggiorna"}
        </button>
      </div>

      <Card className="border-amber-400/50 bg-amber-400/10 p-5" data-testid="riepilogo-da-guardare">
        <h3 className="font-serif text-xl text-foreground">Da guardare</h3>
        {d.da_guardare.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/80">Niente di urgente questa settimana.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-foreground">
            {d.da_guardare.map((v) => <li key={v} data-testid="riepilogo-voce">{v}</li>)}
          </ol>
        )}
      </Card>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">I numeri</h3>
        <Tabella
          testid="riepilogo-metriche"
          intestazione={["Cosa", "Ora", "Prima"]}
          righe={d.metriche.map((m) => ({ k: m.chiave, cella: [m.etichetta, m.questa, m.precedente], freccia: m.freccia, testid: `riepilogo-${m.chiave}` }))}
        />
      </Card>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Iscrizioni per fonte</h3>
        <p className="mt-1 text-xs text-muted-foreground">Da volantino, social e altri link con «?fonte=». Le iscrizioni dai QR dei negozi sono nella tabella sopra.</p>
        {d.fonti.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nessuna iscrizione con una fonte ancora.</p>
        ) : (
          <Tabella
            testid="riepilogo-fonti"
            intestazione={["Fonte", "Ora", "Prima"]}
            righe={d.fonti.map((f) => ({ k: f.fonte, cella: [f.fonte, f.questa, f.precedente], freccia: f.freccia }))}
          />
        )}
      </Card>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Adesso</h3>
        <Tabella
          testid="riepilogo-situazione"
          intestazione={["Cosa", "Numero"]}
          righe={[
            { k: "att", cella: ["Offerte in attesa", s.offerte_in_attesa] },
            { k: "att3", cella: ["… da più di 3 giorni", s.offerte_in_attesa_oltre_3_giorni] },
            { k: "senza", cella: ["Negozi senza offerta", s.negozi_senza_offerta] },
            { k: "seg", cella: ["Segnalazioni aperte", s.segnalazioni_aperte] },
            { k: "rec", cella: ["Reclami aperti", s.reclami_aperti] },
          ]}
        />
        {s.negozi_senza_offerta_nomi.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Da contattare: {s.negozi_senza_offerta_nomi.join(", ")}.</p>
        )}
      </Card>

      <Card className="border-border bg-muted p-5" data-testid="riepilogo-zone">
        <h3 className="font-serif text-xl text-foreground">Zone che aspettano</h3>
        <p className="mt-1 text-xs text-muted-foreground">«Fammi sapere quando arrivate»: voti totali per zona, solo un numero.</p>
        {d.interesse_zone.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nessun voto ancora.</p>
        ) : (
          <Tabella intestazione={["Zona", "Voti"]} righe={d.interesse_zone.map((z) => ({ k: z.zona, cella: [z.zona, z.voti] }))} />
        )}
      </Card>

      {d.pagamenti && (
        <Card className="border-border bg-muted p-5" data-testid="riepilogo-pagamenti">
          <h3 className="font-serif text-xl text-foreground">Pagamenti dei negozi</h3>
          <Tabella
            intestazione={["Stato", "Negozi"]}
            righe={Object.entries(d.pagamenti.per_stato).map(([k, v]) => ({ k, cella: [k.replace("_", " "), v] }))}
          />
        </Card>
      )}
    </div>
  );
}

function Tabella({ intestazione, righe, testid }) {
  return (
    <table data-testid={testid} className="mt-3 w-full text-left text-sm text-foreground">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          {intestazione.map((t, i) => (
            <th key={t} scope="col" className={`py-2 font-semibold ${i > 0 ? "text-right" : "pr-3"}`}>{t}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {righe.map((r) => (
          <tr key={r.k} data-testid={r.testid} className="border-b border-border/60 last:border-0">
            {r.cella.map((c, i) => (
              <td key={i} className={`py-2.5 ${i === 0 ? "pr-3" : "text-right tabular-nums"} ${i === 1 ? "font-semibold" : ""}`}>
                {i === 1 && r.freccia ? <span aria-hidden="true" className="mr-1 text-muted-foreground">{r.freccia}</span> : null}{c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
