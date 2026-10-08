import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Sezione GDPR nel profilo utente:
 * - Scarica i miei dati (art. 20 GDPR portabilità)
 * - Elimina il mio account (art. 17 GDPR diritto all'oblio)
 * - Toggle consenso marketing (art. 7 GDPR revoca)
 */
export default function GdprSection({ claro = false }) {
  const Titolo = claro ? "h2" : "div";
  const { user, logout } = useAuth();
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setMarketing(!!user?.consents?.marketing_opt_in);
  }, [user]);

  const exportData = async () => {
    setBusy(true);
    try {
      const res = await api.get("/gdpr/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sconti-roma-miei-dati-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Dati scaricati con successo");
    } catch (e) {
      toast.error("Errore durante l'export. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  const toggleMarketing = async (next) => {
    setMarketing(next);
    try {
      await api.post(`/gdpr/marketing-consent?opt_in=${next}`);
      toast.success(
        next
          ? "Riceverai le nostre email promozionali"
          : "Non riceverai più email promozionali"
      );
    } catch {
      setMarketing(!next);
      toast.error("Errore. Riprova.");
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.delete("/gdpr/delete-account");
      toast.success("Account eliminato. Addio!");
      // small delay to let toast render
      setTimeout(() => {
        logout && logout();
        window.location.href = "/";
      }, 1200);
    } catch {
      toast.error("Errore durante l'eliminazione. Contatta privacy@scontiroma.it");
      setBusy(false);
    }
  };

  // `claro`: variante «Bianco vivo» dell'area commerciante. Senza, resta l'aspetto scuro del cliente.
  const k = claro
    ? {
        card: "rounded-[18px] border border-ac-line bg-white p-[18px] shadow-[0_1px_0_rgba(26,21,48,0.03)]",
        titolo: "font-testo flex items-center gap-2 text-[13px] font-extrabold text-ac-viola",
        testo: "mt-2 text-sm leading-relaxed text-ac-soft",
        box: "mt-4 flex items-start justify-between gap-4 rounded-2xl border border-ac-line bg-ac-tint p-4",
        boxTitolo: "flex items-center gap-2 text-sm font-bold text-ac-ink",
        icona: "text-ac-rosa",
        boxTesto: "mt-1 text-xs text-ac-soft",
        toggle: "relative h-7 w-12 rounded-full bg-ac-campo peer-checked:bg-ac-rosa transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-ac-viola",
        scarica: "min-h-12 rounded-xl border-2 border-ac-teal bg-transparent font-extrabold text-ac-teal hover:bg-ac-tealBg",
        elimina: "min-h-12 rounded-xl border-2 border-ac-rosso bg-transparent font-extrabold text-ac-rosso hover:bg-ac-rossoBg",
        conferma: "col-span-full rounded-2xl border border-ac-rosso/40 bg-ac-rossoBg p-4",
        confermaTitolo: "text-sm font-extrabold text-ac-rosso",
        confermaTesto: "mt-1 text-xs text-ac-soft",
        siElimina: "min-h-12 rounded-xl bg-ac-rosso font-extrabold text-white hover:bg-ac-rosso/90",
        annulla: "min-h-12 rounded-xl border-2 border-ac-soft bg-white font-extrabold text-ac-ink hover:bg-ac-tint",
        nota: "mt-4 text-xs leading-relaxed text-ac-mute",
        link: "font-bold text-ac-rosa underline underline-offset-2",
      }
    : {
        card: "border-warm bg-[#141414] border border-white/10 p-6",
        titolo: "flex items-center gap-2 text-xs uppercase tracking-wider text-gold",
        testo: "mt-2 text-sm text-white/60",
        box: "mt-6 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-4",
        boxTitolo: "flex items-center gap-2 text-sm font-semibold text-white",
        icona: "text-terracotta",
        boxTesto: "mt-1 text-xs text-white/60",
        toggle: "h-6 w-11 rounded-full bg-white/10 peer-checked:bg-fucsia transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5",
        scarica: "border-ciano/40 bg-transparent text-ciano hover:bg-ciano/10",
        elimina: "border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10",
        conferma: "col-span-full rounded-xl border border-red-500/30 bg-red-500/5 p-4",
        confermaTitolo: "text-sm font-semibold text-red-300",
        confermaTesto: "mt-1 text-xs text-white/60",
        siElimina: "bg-red-600 text-white hover:bg-red-700",
        annulla: "border-white/20 bg-transparent text-white hover:bg-white/5",
        nota: "mt-4 text-xs text-white/40",
        link: "text-fucsia hover:underline",
      };

  return (
    <Card data-testid="gdpr-section" className={k.card}>
      <Titolo className={k.titolo}>
        <ShieldCheck size={claro ? 15 : 14} aria-hidden="true" /> I miei dati (GDPR)
      </Titolo>
      <p className={k.testo}>
        Come previsto dal Regolamento UE 2016/679 hai il pieno controllo sui
        tuoi dati personali.
      </p>

      {/* Marketing consent toggle */}
      <div className={k.box}>
        <div className="flex-1">
          <div className={k.boxTitolo}>
            <Mail size={14} className={k.icona} aria-hidden="true" />
            Comunicazioni promozionali
          </div>
          <div className={k.boxTesto}>
            Email mensili sui nuovi sconti del tuo quartiere. Puoi revocare
            quando vuoi.
          </div>
        </div>
        <label className={claro ? "relative inline-flex min-h-11 cursor-pointer items-center" : "relative inline-flex cursor-pointer items-center"}>
          {claro && <span className="sr-only">Comunicazioni promozionali</span>}
          <input
            data-testid="marketing-toggle"
            type="checkbox"
            className="peer sr-only"
            checked={marketing}
            onChange={(e) => toggleMarketing(e.target.checked)}
          />
          <div className={k.toggle}></div>
        </label>
      </div>

      {/* Actions */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          data-testid="gdpr-export"
          onClick={exportData}
          disabled={busy}
          variant="outline"
          className={k.scarica}
        >
          <Download size={16} className="mr-2" />
          Scarica i miei dati
        </Button>

        {!confirmDelete ? (
          <Button
            data-testid="gdpr-delete"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            variant="outline"
            className={k.elimina}
          >
            <Trash2 size={16} className="mr-2" />
            Elimina il mio account
          </Button>
        ) : (
          <div className={k.conferma}>
            <div className={k.confermaTitolo}>
              Sei sicuro? Questa operazione è irreversibile.
            </div>
            <div className={k.confermaTesto}>
              I tuoi dati verranno cancellati definitivamente entro 30 giorni.
              Le fatture di legge saranno anonimizzate.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                data-testid="gdpr-delete-confirm"
                onClick={deleteAccount}
                disabled={busy}
                className={k.siElimina}
              >
                Sì, elimina definitivamente
              </Button>
              <Button
                data-testid="gdpr-delete-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                variant="outline"
                className={k.annulla}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={k.nota}>
        Per esercitare altri diritti (rettifica, limitazione, opposizione,
        reclamo al Garante) scrivi a{" "}
        <a href="mailto:privacy@scontiroma.it" className={k.link}>
          privacy@scontiroma.it
        </a>
        .
      </div>
    </Card>
  );
}
