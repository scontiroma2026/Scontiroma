import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/PasswordInput";
import { ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminMasterReset() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw1 !== pw2) {
      toast.error("Le due password non coincidono");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/admin/master-reset", { token, new_password: pw1 });
      toast.success(data.message || "Master password aggiornata");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <Card className="border-white/10 bg-white/5 p-8">
        <div className="flex items-center gap-3 text-ciano">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ciano/20">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-fucsia">Area riservata</div>
            <h1 className="font-serif text-3xl text-white">Nuova Master Password</h1>
          </div>
        </div>
        {!token ? (
          <p data-testid="master-reset-notoken" className="mt-6 text-sm text-red-400">
            Link non valido: token mancante. Richiedi un nuovo link dalla pagina /admin.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-white/60">Minimo 10 caratteri. Verrà richiesta a ogni sblocco dell'area admin.</p>
            <PasswordInput
              data-testid="master-reset-pw1"
              placeholder="Nuova master password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              autoFocus
              className="bg-black/40 border-white/10 text-white"
            />
            <PasswordInput
              data-testid="master-reset-pw2"
              placeholder="Conferma master password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
            />
            <Button
              data-testid="master-reset-submit"
              type="submit"
              disabled={busy || pw1.length < 10 || !pw2}
              className="w-full grad-fucsia-viola text-white rounded-full py-6"
            >
              <KeyRound size={14} className="mr-2" /> {busy ? "Salvataggio…" : "Imposta master password"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
