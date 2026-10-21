import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api, { formatApiError } from "@/lib/api";
import { useAppConfig } from "@/context/ConfigContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Stamp } from "lucide-react";
import { toast } from "sonner";

const data = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");

/**
 * «I tuoi Sconticini» (PROPOSTA, compare solo con SCONTICINI_ENABLED sul server): una tessera per negozio con la barra
 * «3 su 5», l'ultimo uso e, quando serve, il QR del premio. Gli sconticini arrivano solo da sconti usati e verificati
 * al banco; il premio lo offre il negozio.
 */
export default function SconticiniTessere() {
  const { sconticini } = useAppConfig();
  const [tessere, setTessere] = useState(null);
  const [errore, setErrore] = useState(false);
  const [aperto, setAperto] = useState(null); // id del premio di cui si mostra il QR

  const carica = useCallback(() => {
    api.get("/sconticini/me").then((r) => setTessere(r.data.tessere || [])).catch(() => setErrore(true));
  }, []);
  useEffect(() => { if (sconticini) carica(); }, [sconticini, carica]);

  if (!sconticini) return null;
  return (
    <section id="sconticini" data-testid="sconticini-tessere" className="mt-12 scroll-mt-24">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-3xl"><Stamp size={24} className="text-terracotta" /> I tuoi Sconticini</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Ogni sconto usato al banco, con il codice del negozio, ti dà uno sconticino per quel negozio. Quando arrivi alla
        soglia sblocchi il premio che il negozio ha scelto. <Link to="/sconticini/regolamento" className="text-fucsia underline">Regolamento</Link>
      </p>
      {errore ? (
        <Card className="border-warm bg-muted p-6 text-sm text-muted-foreground">Non riusciamo a caricare le tessere. Riprova più tardi.</Card>
      ) : !tessere ? (
        <p className="text-muted-foreground">Caricamento…</p>
      ) : tessere.length === 0 ? (
        <Card data-testid="sconticini-vuoto" className="border-warm bg-muted p-8 text-center text-muted-foreground">
          Non hai ancora nessuno sconticino. Usa uno sconto in un negozio che partecipa e comparirà qui la tua tessera.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tessere.map((t) => (
            <Tessera key={t.merchant_id} t={t} aperto={aperto} setAperto={setAperto} onCambio={carica} />
          ))}
        </div>
      )}
    </section>
  );
}

function Tessera({ t, aperto, setAperto, onCambio }) {
  const soglia = t.soglia || 0;
  const pct = soglia ? Math.min(100, Math.round((t.count / soglia) * 100)) : 0;
  const premiAttivi = t.premi.filter((p) => p.stato === "pending");
  const altri = t.premi.filter((p) => p.stato !== "pending");
  return (
    <Card data-testid={`tessera-${t.merchant_id}`} className="border-warm bg-card border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-serif text-xl">{t.shop_name}</div>
          {t.attivo && t.premio && <div className="mt-0.5 text-sm text-muted-foreground">Premio: {t.premio}</div>}
        </div>
        {soglia > 0 && t.attivo && (
          <div data-testid="tessera-conteggio" className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-bold">{t.count} su {soglia}</div>
        )}
      </div>

      {t.attivo && soglia > 0 ? (
        <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={soglia} aria-valuenow={t.count} aria-label={`${t.count} sconticini su ${soglia}`}>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full grad-fucsia-viola transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Questo negozio ha messo in pausa gli Sconticini: quelli che hai restano segnati.</p>
      )}
      <div className="mt-2 text-xs text-muted-foreground">
        {t.ultimo_uso_at ? `Ultimo sconticino: ${data(t.ultimo_uso_at)}` : "Nessuno sconticino ancora"}
      </div>

      {premiAttivi.map((p) => (
        <div key={p.id} data-testid="premio-attivo" className="mt-4 rounded-2xl border border-border bg-muted p-4">
          <div className="flex items-center gap-2 font-serif text-lg"><Gift size={18} className="text-terracotta" /> Premio sbloccato</div>
          <div className="mt-1 text-sm">{p.premio}</div>
          <div className="text-xs text-muted-foreground">Vale fino al {data(p.scade_il)}. Si usa una sola volta.</div>
          {aperto === p.id ? (
            <PremioQR premio={p} onChiudi={() => setAperto(null)} onScaduto={() => { setAperto(null); onCambio(); }} />
          ) : (
            <Button data-testid="premio-mostra-qr" onClick={() => setAperto(p.id)} className="mt-3 w-full grad-fucsia-viola text-white">
              Mostra il QR del premio
            </Button>
          )}
        </div>
      ))}
      {altri.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {altri.map((p) => (
            <li key={p.id}>
              {p.premio}: {p.stato === "redeemed" ? `usato il ${data(p.riscattato_il)}` : "scaduto"}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** QR del premio: cambia ogni 20 secondi (come quello degli sconti), quindi lo screenshot non serve. */
function PremioQR({ premio, onChiudi, onScaduto }) {
  const [tk, setTk] = useState(null);
  const [secondi, setSecondi] = useState(20);
  const timer = useRef(null);

  const preleva = useCallback(async () => {
    try {
      const { data: d } = await api.get(`/sconticini/premi/${premio.id}/token`);
      setTk(d);
      setSecondi(d.expires_in);
    } catch (err) {
      toast.error(formatApiError(err));
      onScaduto();
    }
  }, [premio.id, onScaduto]);

  useEffect(() => { preleva(); }, [preleva]);
  useEffect(() => {
    const finestra = (tk?.window_sec || 20) * 1000;
    const a = setInterval(preleva, finestra);
    timer.current = setInterval(() => setSecondi((s) => (s <= 1 ? (tk?.window_sec || 20) : s - 1)), 1000);
    return () => { clearInterval(a); clearInterval(timer.current); };
  }, [preleva, tk?.window_sec]);

  return (
    <div data-testid="premio-qr" className="mt-3 flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-4">
        <QRCodeSVG value={tk?.qr_value || premio.id} size={200} fgColor="#0A0A0A" bgColor="#ffffff" level="M" />
      </div>
      <div className="text-xs text-muted-foreground">Il QR cambia tra {secondi}s. Chi lavora al banco lo inquadra e scrive il codice del negozio.</div>
      {tk?.code && <div className="font-mono text-lg tracking-[0.25em]">{tk.code}</div>}
      <Button variant="outline" onClick={onChiudi} className="w-full">Chiudi</Button>
    </div>
  );
}
