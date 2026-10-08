import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Check, Loader2, Ban, Lock } from "lucide-react";

// Attestato «Ricorda su questo telefono»: firmato dal server, 90 giorni, uno per negozio. Non contiene il codice.
const CHIAVE_TELEFONO = "sr_codice_negozio_v1";
function leggiTelefoni() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_TELEFONO) || "{}") || {}; } catch (_) { return {}; }
}
function salvaTelefono(shopId, token) {
  try {
    const t = leggiTelefoni();
    if (token) t[shopId] = token; else delete t[shopId];
    localStorage.setItem(CHIAVE_TELEFONO, JSON.stringify(t));
  } catch (_) { /* localStorage non disponibile: si riscrive il codice ogni volta */ }
}

export default function QRVerify() {
  const params = useParams();
  const [sp] = useSearchParams();
  const token = params.token || sp.get("token") || "";
  const { user, loading: authLoading } = useAuth();
  const [anteprima, setAnteprima] = useState(null); // risposta pubblica: solo valido/non valido, offerta e negozio
  const [result, setResult] = useState(null); // dopo «Applica sconto»: solo qui compare il nome del cliente
  const [loading, setLoading] = useState(true);
  const [codice, setCodice] = useState("");
  const [ricorda, setRicorda] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState(null); // {kind, message, left}
  const [telefono, setTelefono] = useState(null); // attestato salvato per questo negozio
  const [ricordato, setRicordato] = useState(false); // appena salvato in questo giro
  const autoProvato = useRef(false);

  useEffect(() => {
    if (!token) { setLoading(false); setAnteprima({ valid: false, reason: "Codice mancante" }); return; }
    api.get(`/qr/verify?token=${encodeURIComponent(token)}`)
      .then((r) => {
        setAnteprima(r.data);
        if (r.data?.shop_id) setTelefono(leggiTelefoni()[r.data.shop_id] || null);
      })
      .catch(() => setAnteprima({ valid: false, reason: "Errore di verifica" }))
      .finally(() => setLoading(false));
  }, [token]);

  const applica = useCallback(async (opzioni = {}) => {
    setInvio(true);
    setErrore(null);
    try {
      const { data } = await api.post("/qr/redeem", {
        token,
        permit: anteprima?.permit || undefined, // permesso breve: il QR non scade mentre si scrive il codice
        shop_code: opzioni.conCodice ? codice : undefined,
        device_token: opzioni.conTelefono ? telefono : undefined,
        remember: Boolean(opzioni.conCodice && ricorda),
      });
      if (data.device_token && anteprima?.shop_id) {
        salvaTelefono(anteprima.shop_id, data.device_token);
        setRicordato(true);
      }
      setResult(data);
    } catch (err) {
      const d = err?.response?.data || {};
      if (d.error === "device_invalid") {
        if (anteprima?.shop_id) salvaTelefono(anteprima.shop_id, null);
        setTelefono(null);
      }
      if (d.error === "wrong_code" || d.error === "locked") setCodice("");
      setErrore({ kind: d.error || "rete", message: d.reason || "Non siamo riusciti a contattare il server. Riprova.", left: d.attempts_left });
      if (d.error === "invalid" || d.error === "used" || d.error === "daily_limit") {
        setResult({ valid: false, reason: d.reason, daily_limit: d.daily_limit });
      }
    } finally {
      setInvio(false);
    }
  }, [token, codice, ricorda, telefono, anteprima]);

  // Il commerciante già collegato col suo account: nessun codice, come prima.
  useEffect(() => {
    if (autoProvato.current || authLoading || !anteprima?.valid || result) return;
    if (user && user.role === "merchant" && user.id === anteprima.shop_id) {
      autoProvato.current = true;
      applica({});
    }
  }, [authLoading, user, anteprima, result, applica]);

  if (loading || (anteprima?.valid && !result && authLoading)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
        <Loader2 size={48} className="animate-spin text-fucsia" />
      </div>
    );
  }

  const now = new Date();
  const mostra = result || anteprima;

  if (anteprima?.valid && !result) {
    const sonoIlCommerciante = user && user.role === "merchant" && user.id === anteprima.shop_id;
    return (
      <main data-testid="qr-codice-valido" className="fixed inset-0 z-[100] overflow-y-auto bg-white px-4 py-8 text-ac-ink">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ac-verdeBg text-ac-verde">
            <Check size={36} strokeWidth={3} aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-serif text-[34px] font-bold leading-tight">Codice valido</h1>
          <p data-testid="qr-offerta" className="mt-2 font-serif text-xl font-bold leading-snug">{anteprima.discount_title}</p>
          <p className="mt-0.5 text-base font-semibold text-ac-soft">{anteprima.shop_name}</p>

          {sonoIlCommerciante ? (
            <div className="mt-8 flex items-center gap-3 text-ac-soft" aria-live="polite">
              <Loader2 size={22} className="animate-spin" aria-hidden="true" /> Applico lo sconto…
            </div>
          ) : (
            <form
              className="mt-8 w-full text-left"
              onSubmit={(e) => { e.preventDefault(); applica(telefono ? { conTelefono: true } : { conCodice: true }); }}
            >
              {telefono ? (
                <p data-testid="telefono-ricordato" className="flex items-start gap-2 rounded-2xl bg-ac-tealBg px-4 py-3 text-sm font-semibold text-ac-teal">
                  <Lock size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> Questo telefono è ricordato: basta un tocco.
                </p>
              ) : (
                <>
                  <label htmlFor="codice-negozio" className="block text-sm font-extrabold text-ac-rosa">Codice del negozio</label>
                  <input
                    id="codice-negozio"
                    data-testid="shop-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    maxLength={4}
                    value={codice}
                    onChange={(e) => setCodice(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0000"
                    aria-describedby="codice-errore"
                    className="mt-2 h-16 w-full rounded-2xl border-2 border-ac-campo bg-white text-center font-testo text-3xl font-extrabold tracking-[0.5em] text-ac-ink placeholder:font-semibold placeholder:text-ac-campo focus:border-ac-viola focus:outline-none"
                  />
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ac-ink">
                    <input
                      data-testid="shop-code-remember"
                      type="checkbox"
                      checked={ricorda}
                      onChange={(e) => setRicorda(e.target.checked)}
                      className="h-6 w-6 shrink-0 accent-[#6D4AFF]"
                    />
                    Ricorda su questo telefono (90 giorni)
                  </label>
                </>
              )}

              <div id="codice-errore" aria-live="polite">
                {errore && (
                  <p data-testid="shop-code-error" role="alert" className="mt-3 rounded-2xl border-2 border-ac-rosso bg-ac-rossoBg px-4 py-3 text-sm font-extrabold text-ac-rosso">
                    {errore.message}
                    {errore.kind === "wrong_code" && errore.left != null && (
                      <span className="mt-0.5 block font-semibold text-ac-ink">
                        {errore.left > 0 ? `Ti restano ${errore.left} ${errore.left === 1 ? "tentativo" : "tentativi"}.` : "Tentativi finiti: attendi qualche minuto."}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button
                data-testid="shop-code-apply"
                type="submit"
                disabled={invio || (!telefono && codice.length !== 4)}
                className="ac-grad ac-ombra-rosa mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-6 text-lg font-extrabold text-white transition active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
              >
                {invio ? "Un attimo…" : "Applica sconto"}
              </button>

              {telefono && (
                <button
                  data-testid="shop-code-forget"
                  type="button"
                  onClick={() => { salvaTelefono(anteprima.shop_id, null); setTelefono(null); setErrore(null); }}
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-extrabold text-ac-viola underline underline-offset-4"
                >
                  Dimentica questo telefono
                </button>
              )}
            </form>
          )}
          <p className="mt-6 text-xs font-medium text-ac-mute">
            Il nome del cliente compare solo dopo il codice del negozio.
          </p>
        </div>
      </main>
    );
  }

  if (result?.valid) {
    return (
      <div data-testid="qr-valid" className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{background: "linear-gradient(135deg,#0B6B34 0%,#127A47 100%)"}}>
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl" style={{animation: "pop 0.4s ease-out"}}>
          <Check size={72} className="text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="font-serif text-[44px] tracking-tight sm:text-6xl sm:tracking-normal text-white text-center leading-none">SCONTO<br/>VALIDO</h1>
        <div className="mt-8 w-full max-w-sm rounded-3xl bg-black/20 backdrop-blur-md border border-white/40 p-6 text-white text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-white">Cliente</div>
          <div className="mt-1 font-serif text-3xl">{result.client_name}</div>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white">Sconto</div>
          <div className="mt-1 font-serif text-2xl leading-tight">{result.discount_title}</div>
          <div className="mt-1 text-lg text-white">{result.shop_name}</div>
          {result.discount_percent && (
            <div className="mt-4 inline-block rounded-full bg-white text-emerald-700 px-4 py-1.5 font-bold text-lg">
              −{result.discount_percent}%
            </div>
          )}
          {result.max_uses > 1 && (
            <div data-testid="usage-summary" className="mt-4 rounded-xl bg-black/25 px-4 py-2.5 text-sm">
              <div className="font-bold">Utilizzo {result.use_number} di {result.max_uses} questo mese</div>
              {result.prev_used_at && (
                <div className="mt-0.5 text-xs text-white">
                  Utilizzo precedente: {new Date(result.prev_used_at).toLocaleDateString("it-IT")}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-white">
          Applica lo sconto e concludi il pagamento.
        </p>
        {ricordato && (
          <p data-testid="telefono-salvato" className="mt-1 text-xs text-white">
            Telefono ricordato per 90 giorni.
          </p>
        )}
        <p className="mt-1 text-xs text-white">
          {now.toLocaleDateString("it-IT")} · {now.toLocaleTimeString("it-IT", {hour:'2-digit', minute:'2-digit'})}
        </p>
        <style>{`@keyframes pop { 0% {transform: scale(0)} 60% {transform: scale(1.15)} 100% {transform: scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div data-testid="qr-invalid" className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-8 overflow-y-auto" style={{background: "linear-gradient(135deg,#8B0F1F 0%,#B42318 100%)"}}>
      {/* Giant prohibition icon */}
      <div className="mb-6 relative">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl" style={{animation: "pop 0.4s ease-out"}}>
          <Ban size={104} className="text-red-600" strokeWidth={2.5} />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" style={{animationDuration: "1.6s"}} />
      </div>

      {/* Huge uppercase warning */}
      <h1 className="font-serif text-5xl md:text-6xl uppercase text-white text-center leading-[0.95] tracking-tight max-w-3xl">
        Attenzione
      </h1>
      <h2 className="mt-3 font-serif text-3xl md:text-4xl uppercase text-white text-center leading-tight tracking-tight max-w-3xl">
        Sconto <span className="underline decoration-4 underline-offset-4">non applicabile</span>
      </h2>

      {/* Full explanation */}
      <div className="mt-8 w-full max-w-lg rounded-2xl bg-black/20 backdrop-blur-md border border-white/40 p-5 text-white text-center">
        {mostra?.daily_limit || (mostra?.reason || "").toLowerCase().includes("giornaliero") ? (
          <>
            <p className="text-lg font-bold uppercase leading-snug" data-testid="daily-limit-msg">
              Limite giornaliero raggiunto:<br/>il cliente ha già usato questo sconto oggi.
            </p>
            <div className="my-4 h-px bg-white/25" />
            <p className="text-base font-semibold leading-snug">
              Gli utilizzi multipli valgono <span className="uppercase">1 al giorno</span>.<br/>
              <span className="text-2xl uppercase tracking-wide">Applicare il prezzo pieno del menu.</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold uppercase leading-snug">
              Codice non valido<br/>o scaduto.
            </p>
            <div className="my-4 h-px bg-white/25" />
            <p className="text-base font-semibold leading-snug">
              Riscandere un nuovo codice<br/>
              <span className="text-2xl uppercase tracking-wide">o applicare il prezzo pieno del menu.</span>
            </p>
          </>
        )}
      </div>

      {/* Small staff note */}
      <div className="mt-6 w-full max-w-lg rounded-xl border-2 border-white/35 bg-black/20 backdrop-blur px-4 py-3 text-white/95 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white mb-1 font-bold">Nota per il personale</div>
        <p className="text-xs leading-relaxed">
          Non applicare lo sconto manualmente per evitare ammanchi di cassa non autorizzati.
        </p>
      </div>

      <style>{`@keyframes pop { 0% {transform: scale(0)} 60% {transform: scale(1.15)} 100% {transform: scale(1)} }`}</style>
    </div>
  );
}
