import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DiscountCard from "@/components/DiscountCard";
import { Button } from "@/components/ui/button";
import { salvaReferral } from "@/lib/referral";
import { MapPin } from "lucide-react";

/**
 * Pagina a cui porta il QR della locandina di un negozio: nome del negozio e offerta del mese
 * in corso (sempre aggiornata, anche se la locandina è stampata da mesi) e pulsante «Iscriviti».
 */
export default function NegozioQR() {
  const { id } = useParams();
  const { user } = useAuth();
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    salvaReferral(id);
    api.get(`/negozio/${encodeURIComponent(id)}`)
      .then(({ data }) => setDati(data))
      .catch(() => setErrore(true));
  }, [id]);

  if (errore) {
    return (
      <main data-testid="negozio-qr-errore" className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-3xl">Negozio non trovato</h1>
        <p className="mt-3 text-white/70">Il link potrebbe non essere più valido. Puoi comunque scoprire gli sconti dei negozi del tuo quartiere.</p>
        <Link to="/discounts"><Button className="mt-6 rounded-full grad-fucsia-viola text-white">Guarda gli sconti</Button></Link>
      </main>
    );
  }
  if (!dati) return <main className="mx-auto max-w-lg px-6 py-16 text-center text-white/60">Caricamento…</main>;

  const n = dati.negozio;
  return (
    <main data-testid="negozio-qr" className="mx-auto max-w-lg px-6 py-10">
      <div className="text-xs uppercase tracking-[0.2em] text-gold">Aderisce a Sconti Roma</div>
      <h1 data-testid="negozio-qr-nome" className="mt-2 font-serif text-4xl leading-tight">{n.shop_name}</h1>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
        <MapPin size={14} /> {[n.zone, n.category].filter(Boolean).join(" · ")}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-white/70">L'offerta di questo mese</h2>
      <div className="mt-3">
        {dati.discount ? (
          <DiscountCard discount={dati.discount} />
        ) : (
          <div data-testid="negozio-qr-senza-offerta" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            Offerta in arrivo: torna a trovarci tra poco.
          </div>
        )}
      </div>

      {user ? (
        <Link to="/discounts"><Button className="mt-8 w-full rounded-full border border-white/20 bg-white/5 py-6 text-white">Guarda gli altri sconti</Button></Link>
      ) : (
        <>
          <Link to={`/register?ref=${encodeURIComponent(n.id)}`}>
            <Button data-testid="negozio-qr-iscriviti" className="mt-8 w-full rounded-full grad-fucsia-viola py-6 text-base font-bold text-white">
              Iscriviti per usare lo sconto
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-white/50">Iscrizione gratuita. Bastano email e password.</p>
          <Link to="/discounts" className="mt-4 block text-center text-sm text-ciano underline underline-offset-2">Guarda gli altri sconti</Link>
        </>
      )}
    </main>
  );
}
