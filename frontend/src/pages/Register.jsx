import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { LEGAL_LINKS } from "@/components/LegalFooter";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(params.get("role") === "merchant" ? "merchant" : "client");
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    name: "", // usato solo per merchant (nome referente)
    shop_name: "",
    zone: "",
    category: "",
    phone: "",
    address: "",
  });
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    api.get("/zones").then((r) => setZones(r.data.zones || []));
    api.get("/categories").then((r) => setCategories(r.data.categories || []));
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!acceptedLegal) {
      toast.error("Devi accettare Termini, Privacy e Cookie Policy per continuare");
      return;
    }
    setLoading(true);
    const payload = { ...form, role, marketing_opt_in: marketingOptIn, legal_accepted: true };
    if (role === "client") {
      // Concatena nome + cognome nel campo `name` che il backend si aspetta
      payload.name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
      delete payload.first_name; delete payload.last_name;
      delete payload.shop_name; delete payload.zone; delete payload.category; delete payload.phone; delete payload.address;
    } else {
      // Per il merchant usiamo il campo unico `name` (referente)
      delete payload.first_name; delete payload.last_name;
    }
    const res = await register(payload);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Benvenuto in Sconti Roma!");
    nav("/setup-security");
  };

  return (
    <main data-testid="register-page" className="mx-auto max-w-lg px-6 py-16">
      <Card className="border-warm bg-[#141414] border border-white/10 p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Nuovo qui?</div>
        <h1 className="mt-2 font-serif text-4xl">Crea il tuo account</h1>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1">
          <button
            type="button"
            data-testid="role-client"
            onClick={() => setRole("client")}
            className={`rounded-md py-2 text-sm transition ${role === "client" ? "bg-[#141414] border border-white/10 text-terracotta shadow" : "text-white/70"}`}
          >
            Sono un cliente
          </button>
          <button
            type="button"
            data-testid="role-merchant"
            onClick={() => setRole("merchant")}
            className={`rounded-md py-2 text-sm transition ${role === "merchant" ? "bg-[#141414] border border-white/10 text-terracotta shadow" : "text-white/70"}`}
          >
            Sono un commerciante
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {role === "client" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input data-testid="reg-first-name" required value={form.first_name} onChange={update("first_name")} className="mt-1" />
              </div>
              <div>
                <Label>Cognome</Label>
                <Input data-testid="reg-last-name" required value={form.last_name} onChange={update("last_name")} className="mt-1" />
              </div>
            </div>
          ) : (
            <div>
              <Label>Nome referente</Label>
              <Input data-testid="reg-name" required value={form.name} onChange={update("name")} className="mt-1" />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input data-testid="reg-email" type="email" required value={form.email} onChange={update("email")} className="mt-1" />
          </div>
          <div>
            <Label>Password (min 6)</Label>
            <PasswordInput data-testid="reg-password" required minLength={6} value={form.password} onChange={update("password")} className="mt-1" />
          </div>

          {role === "merchant" && (
            <>
              <div>
                <Label>Nome attività</Label>
                <Input data-testid="reg-shop" required value={form.shop_name} onChange={update("shop_name")} className="mt-1" />
              </div>
              <div>
                <Label>Indirizzo attività <span className="text-xs text-white/50">(es. Via del Corso 100, 00186 Roma)</span></Label>
                <Input
                  data-testid="reg-address"
                  required
                  placeholder="Via, numero civico, CAP e città"
                  value={form.address}
                  onChange={update("address")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefono attività <span className="text-xs text-white/50">(es. +39 06 1234567)</span></Label>
                <Input
                  data-testid="reg-phone"
                  type="tel"
                  required
                  placeholder="+39 ..."
                  value={form.phone}
                  onChange={update("phone")}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Zona</Label>
                  <select
                    data-testid="reg-zone"
                    value={form.zone}
                    onChange={update("zone")}
                    required
                    className="mt-1 w-full rounded-md border border-input bg-[#141414] border border-white/10 px-3 py-2 text-sm"
                  >
                    <option value="">Seleziona…</option>
                    {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    data-testid="reg-category"
                    value={form.category}
                    onChange={update("category")}
                    required
                    className="mt-1 w-full rounded-md border border-input bg-[#141414] border border-white/10 px-3 py-2 text-sm"
                  >
                    <option value="">Seleziona…</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* GDPR legal checkbox */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="legal-accept"
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-fucsia cursor-pointer"
              />
              <span className="text-xs text-white/80 leading-relaxed">
                <span className="text-fucsia">*</span> Accetto i{" "}
                <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="text-fucsia hover:underline font-semibold" data-testid="link-terms">Termini e Condizioni</a>
                {" "}e confermo di aver letto la{" "}
                <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="text-ciano hover:underline font-semibold" data-testid="link-privacy">Privacy Policy</a>
                {" "}e la{" "}
                <a href={LEGAL_LINKS.cookie} target="_blank" rel="noopener noreferrer" className="text-neon hover:underline font-semibold" data-testid="link-cookie">Cookie Policy</a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="marketing-optin"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-terracotta cursor-pointer"
              />
              <span className="text-xs text-white/70 leading-relaxed">
                Voglio ricevere <strong>comunicazioni promozionali</strong> via email su nuovi sconti e offerte esclusive del mese. <span className="text-white/50">(facoltativo, puoi disdire quando vuoi)</span>
              </span>
            </label>
          </div>

          <Button data-testid="reg-submit" type="submit" disabled={loading || !acceptedLegal} className="w-full grad-fucsia-viola text-white hover:scale-105 transition">
            {loading ? "Creazione…" : "Crea account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Hai già un account?{" "}
          <Link to="/login" className="text-terracotta hover:underline">Accedi</Link>
        </p>
      </Card>
    </main>
  );
}
