import { Input } from "@/components/ui/input";
import { useAppConfig } from "@/context/ConfigContext";
import { DURATE_RAPIDE, DURATA_PREDEFINITA, MAX_SCONTO, MAX_OMAGGIO, dataIt, durataInParole, giornoIso, modoDurata } from "@/lib/durata";

const BOTTONE = "min-h-12 rounded-xl border-2 px-1 text-sm font-extrabold transition";
const ACCESO = "border-ac-rosa bg-ac-rosa text-white";
const SPENTO = "border-ac-campo bg-white text-ac-ink hover:border-ac-rosa";

/**
 * «Quanto dura l'offerta?»: la sceglie il negozio (giorni, una data di fine o, solo per l'omaggio, senza
 * scadenza). `form` ha i campi duration_days, end_date, open_ended; `onChange` riceve solo quelli cambiati.
 * `parteIl`: per la prossima offerta, il giorno in cui andrà online (testo già pronto, es. «28 novembre»).
 */
export default function SceltaDurata({ form, onChange, disabled, parteIl, subitoDopoApprovazione }) {
  const { offerDuration } = useAppConfig();
  const omaggio = form.offer_type === "omaggio";
  const massimo = omaggio ? (offerDuration?.max_days_omaggio || MAX_OMAGGIO) : (offerDuration?.max_days_sconto || MAX_SCONTO);
  const modo = modoDurata(form);
  const giorni = Number(form.duration_days) || DURATA_PREDEFINITA;

  const scegliGiorni = (g) => onChange({ duration_days: g, end_date: "", open_ended: false });
  const scegliData = () => onChange({ end_date: form.end_date || giornoIso(DURATA_PREDEFINITA - 1), open_ended: false });
  const scegliAperta = () => onChange({ open_ended: true, end_date: "" });

  return (
    <div data-testid="disc-durata" className="rounded-2xl bg-ac-tint p-4">
      <div className="text-sm font-bold text-ac-ink">Quanto dura l'offerta?</div>
      <p className="mb-3 mt-1.5 text-xs leading-relaxed text-ac-mute">
        Decidi tu. {parteIl
          ? <>La durata parte dal <strong className="text-ac-ink">{parteIl}</strong>, quando finisce l'offerta di adesso.</>
          : subitoDopoApprovazione
            ? <>La durata parte dal giorno in cui va online, appena la approviamo.</>
            : <>La durata parte dal giorno in cui l'offerta va online, dopo il nostro controllo.</>}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label="Durata dell'offerta">
        {DURATE_RAPIDE.filter((x) => x.giorni <= massimo).map((x) => (
          <button
            key={x.giorni}
            type="button"
            data-testid={`disc-durata-${x.giorni}`}
            aria-pressed={modo === "giorni" && giorni === x.giorni}
            onClick={() => scegliGiorni(x.giorni)}
            disabled={disabled}
            className={`${BOTTONE} ${modo === "giorni" && giorni === x.giorni ? ACCESO : SPENTO}`}
          >
            {x.testo}
          </button>
        ))}
      </div>
      <div className={`mt-2 grid gap-2 ${omaggio ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          type="button"
          data-testid="disc-durata-data"
          aria-pressed={modo === "data"}
          onClick={scegliData}
          disabled={disabled}
          className={`${BOTTONE} ${modo === "data" ? ACCESO : SPENTO}`}
        >
          Fino a un giorno preciso
        </button>
        {omaggio && (
          <button
            type="button"
            data-testid="disc-durata-aperta"
            aria-pressed={modo === "aperta"}
            onClick={scegliAperta}
            disabled={disabled}
            className={`${BOTTONE} ${modo === "aperta" ? ACCESO : SPENTO}`}
          >
            Senza scadenza
          </button>
        )}
      </div>
      {modo === "data" && (
        <div className="mt-3">
          <label htmlFor="disc-end-date" className="text-sm font-bold text-ac-ink">Ultimo giorno dell'offerta</label>
          <Input
            id="disc-end-date"
            data-testid="disc-end-date"
            type="date"
            required
            min={giornoIso(0)}
            max={giornoIso(massimo - 1)}
            value={form.end_date || ""}
            onChange={(e) => onChange({ end_date: e.target.value, open_ended: false })}
            disabled={disabled}
            className="mt-1.5 h-12 rounded-xl border-ac-campo bg-white text-base text-ac-ink"
          />
        </div>
      )}
      <div data-testid="disc-durata-scelta" className="mt-3 text-sm text-ac-soft">
        Scelto: <span className="font-extrabold text-ac-rosa">{durataInParole(form)}</span>
        {modo === "aperta" && <>. Resta online finché non la cambi.</>}
        {modo === "data" && form.end_date && <>. Il {dataIt(form.end_date)} è l'ultimo giorno in cui i clienti la vedono.</>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ac-mute">
        Finché è online l'offerta non si può modificare né accorciare: prima della fine potrai prolungarla con un tocco o preparare la prossima.
        {!omaggio && <> Uno sconto può restare online al massimo {massimo} giorni di fila.</>}
      </p>
    </div>
  );
}
