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
export default function GdprSection() {
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

  return (
    <Card
      data-testid="gdpr-section"
      className="border-warm bg-[#141414] border border-white/10 p-6"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
        <ShieldCheck size={14} /> I miei dati (GDPR)
      </div>
      <p className="mt-2 text-sm text-white/60">
        Come previsto dal Regolamento UE 2016/679 hai il pieno controllo sui
        tuoi dati personali.
      </p>

      {/* Marketing consent toggle */}
      <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail size={14} className="text-terracotta" />
            Comunicazioni promozionali
          </div>
          <div className="mt-1 text-xs text-white/60">
            Email mensili sui nuovi sconti del tuo quartiere. Puoi revocare
            quando vuoi.
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            data-testid="marketing-toggle"
            type="checkbox"
            className="peer sr-only"
            checked={marketing}
            onChange={(e) => toggleMarketing(e.target.checked)}
          />
          <div className="h-6 w-11 rounded-full bg-white/10 peer-checked:bg-fucsia transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"></div>
        </label>
      </div>

      {/* Actions */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          data-testid="gdpr-export"
          onClick={exportData}
          disabled={busy}
          variant="outline"
          className="border-ciano/40 bg-transparent text-ciano hover:bg-ciano/10"
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
            className="border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={16} className="mr-2" />
            Elimina il mio account
          </Button>
        ) : (
          <div className="col-span-full rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="text-sm font-semibold text-red-300">
              Sei sicuro? Questa operazione è irreversibile.
            </div>
            <div className="mt-1 text-xs text-white/60">
              I tuoi dati verranno cancellati definitivamente entro 30 giorni.
              Le fatture di legge saranno anonimizzate.
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                data-testid="gdpr-delete-confirm"
                onClick={deleteAccount}
                disabled={busy}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Sì, elimina definitivamente
              </Button>
              <Button
                data-testid="gdpr-delete-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/5"
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-white/40">
        Per esercitare altri diritti (rettifica, limitazione, opposizione,
        reclamo al Garante) scrivi a{" "}
        <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
          privacy@scontiroma.it
        </a>
        .
      </div>
    </Card>
  );
}
