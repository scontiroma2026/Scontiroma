import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";

export default function AdminRecoveryId({ hdrs }) {
  const [open, setOpen] = useState(false);
  const [rid, setRid] = useState("");
  const [busy, setBusy] = useState(false);

  const regen = async () => {
    if (!window.confirm("Rigenerare il Recovery ID? Quello attuale smetterà subito di funzionare.")) return;
    setBusy(true);
    try {
      const { data } = await api.post("/admin/regenerate-recovery-id", {}, hdrs());
      setRid(data.recovery_id);
      setOpen(true);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rid);
      toast.success("Recovery ID copiato");
    } catch {
      toast.error("Copia non riuscita, annotalo manualmente");
    }
  };

  return (
    <>
      <Button
        data-testid="regen-recovery-id"
        variant="outline"
        disabled={busy}
        onClick={regen}
        className="rounded-full border-ciano/40 text-ciano hover:bg-ciano/10"
      >
        <KeyRound size={14} className="mr-2" /> Recovery ID
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#141419] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Il tuo nuovo Recovery ID</DialogTitle>
            <DialogDescription className="text-white/60">
              Conservalo in un posto sicuro: <strong className="text-fucsia">non verrà mai più mostrato</strong>.
              Serve per recuperare la master password in caso di dimenticanza.
            </DialogDescription>
          </DialogHeader>
          <div
            data-testid="recovery-id-value"
            className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-ciano/30 bg-black/40 px-4 py-3 font-mono text-lg tracking-widest text-ciano"
          >
            {rid}
            <Button data-testid="recovery-id-copy" size="sm" variant="ghost" onClick={copy} className="text-white/70 hover:text-white">
              <Copy size={16} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
