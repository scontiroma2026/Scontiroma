import { trackClick } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { leggiReferral, salvaReferral } from "@/lib/referral";
import PasswordInput from "@/components/PasswordInput";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { LEGAL_LINKS } from "@/components/LegalFooter";
import ZoneOptions from "@/components/ZoneOptions";

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
  const [zoneAree, setZoneAree] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedSpecific, setAcceptedSpecific] = useState(false);   // solo commercianti
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  // Ricorda credenziali su questo dispositivo (default: attivo, come UX consumer)
  const [rememberCreds, setRememberCreds] = useState(true);

  useEffect(() => {
    api.get("/zones").then((r) => { setZones(r.data.zones || []); setZoneAree(r.data.areas || []); });
    api.get("/categories").then((r) => setCategories(r.data.categories || []));
  }, []);

  // Il negozio da cui arriva il cliente (?ref=) si ricorda anche se prima guarda gli sconti
  useEffect(() => { salvaReferral(params.get("ref")); }, [params]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    trackClick("register_started");
    if (!acceptedLegal) {
      toast.error("Devi dichiarare di avere almeno 18 anni e accettare Termini, Privacy e Cookie Policy per continuare");
      return;
    }
    if (role === "merchant" && !acceptedSpecific) {
      toast.error("Per continuare approva specificamente le clausole indicate sotto i Termini (artt. 7, 9 e 10)");
      return;
    }
    setLoading(true);
    const payload = { ...form, role, marketing_opt_in: marketingOptIn, legal_accepted: true };
    if (role === "merchant") payload.legal_specific_accepted = true;
    if (role === "client") {
      payload.name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
      delete payload.first_name; delete payload.last_name;
      delete payload.shop_name; delete payload.zone; delete payload.category; delete payload.phone; delete payload.address;
      // Referral tracking (?ref=merchant_id) — priorità URL, poi localStorage
      const ref = params.get("ref") || leggiReferral();
      if (ref) payload.referred_by = ref;
    } else {
      // Per il merchant usiamo il campo unico `name` (referente)
      delete payload.first_name; delete payload.last_name;
    }
    const res = await register(payload);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    // Salva credenziali sul dispositivo per prossimi accessi (email + ruolo)
    if (rememberCreds) {
      try {
        localStorage.setItem("last_email", form.email);
        localStorage.setItem("last_role", role);
      } catch (err) {
        console.warn("[register] localStorage save failed:", err?.message || err);
      }
    } else {
      try {
        localStorage.removeItem("last_email");
        localStorage.removeItem("last_role");
      } catch (err) {
        console.warn("[register] localStorage cleanup failed:", err?.message || err);
      }
    }
    toast.success("Benvenuto in Sconti Roma!");
    nav("/setup-security");
  };

  return (
    <main data-testid="register-page" className="mx-auto max-w-lg px-6 py-16">
      <Card className="border-warm bg-card border border-border p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Nuovo qui?</div>
        <h1 className="mt-2 font-serif text-4xl">Crea il tuo account</h1>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            data-testid="role-client"
            onClick={() => setRole("client")}
            className={`rounded-md py-2 text-sm transition ${role === "client" ? "bg-card border border-border text-terracotta shadow" : "text-muted-foreground"}`}
          >
            Sono un cliente
          </button>
          <button
            type="button"
            data-testid="role-merchant"
            onClick={() => setRole("merchant")}
            className={`rounded-md py-2 text-sm transition ${role === "merchant" ? "bg-card border border-border text-terracotta shadow" : "text-muted-foreground"}`}
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
            <Input
              data-testid="reg-email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              value={form.email}
              onChange={update("email")}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Password (min 6)</Label>
            <PasswordInput
              data-testid="reg-password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={update("password")}
              className="mt-1"
            />
          </div>

          {role === "merchant" && (
            <>
              <div>
                <Label>Nome attività</Label>
                <Input data-testid="reg-shop" required value={form.shop_name} onChange={update("shop_name")} className="mt-1" />
              </div>
              <div>
                <AddressAutocomplete
                  label="Indirizzo attività"
                  helperText="es. Via del Corso 100, 00186 Roma"
                  required
                  value={form.address}
                  onChange={(text) => setForm((f) => ({ ...f, address: text }))}
                  testId="reg-address"
                />
              </div>
              <div>
                <Label>Telefono attività <span className="text-xs text-muted-foreground">(es. +39 06 1234567)</span></Label>
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
                    className="mt-1 w-full rounded-md border border-input bg-card border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Seleziona…</option>
                    <ZoneOptions areas={zoneAree} zones={zones} />
                  </select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    data-testid="reg-category"
                    value={form.category}
                    onChange={update("category")}
                    required
                    className="mt-1 w-full rounded-md border border-input bg-card border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Seleziona…</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* GDPR legal checkbox */}
          <div className="rounded-xl border border-border bg-muted p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="legal-accept"
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-fucsia cursor-pointer"
              />
              <span className="text-xs text-foreground/80 leading-relaxed">
                <span className="text-fucsia">*</span> Dichiaro di avere almeno 18 anni, accetto i{" "}
                <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="text-fucsia hover:underline font-semibold" data-testid="link-terms">Termini e Condizioni</a>
                {" "}e confermo di aver letto la{" "}
                <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="text-ciano hover:underline font-semibold" data-testid="link-privacy">Privacy Policy</a>
                {" "}e la{" "}
                <a href={LEGAL_LINKS.cookie} target="_blank" rel="noopener noreferrer" className="text-neon hover:underline font-semibold" data-testid="link-cookie">Cookie Policy</a>.
              </span>
            </label>

            {role === "merchant" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  data-testid="legal-specific"
                  type="checkbox"
                  checked={acceptedSpecific}
                  onChange={(e) => setAcceptedSpecific(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-fucsia cursor-pointer"
                />
                <span className="text-xs text-foreground/80 leading-relaxed">
                  <span className="text-fucsia">*</span> Ai sensi degli artt. 1341 e 1342 c.c. approvo specificamente le clausole dei{" "}
                  <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="text-fucsia hover:underline font-semibold">Termini e Condizioni</a>
                  {" "}sulle <strong>limitazioni di responsabilità (art. 7)</strong>, sulle <strong>modifiche ai Termini (art. 9)</strong> e sul <strong>foro competente (art. 10)</strong>.
                </span>
              </label>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="marketing-optin"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-terracotta cursor-pointer"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Voglio ricevere <strong>comunicazioni promozionali</strong> via email su nuovi sconti e offerte esclusive del mese. <span className="text-muted-foreground">(facoltativo, puoi disdire quando vuoi)</span>
              </span>
            </label>
          </div>

          {/* Ricorda credenziali sul dispositivo */}
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border bg-muted p-3">
            <input
              data-testid="remember-creds"
              type="checkbox"
              checked={rememberCreds}
              onChange={(e) => setRememberCreds(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ciano cursor-pointer"
            />
            <span className="text-xs text-foreground/80 leading-relaxed">
              💾 <strong className="text-ciano">Salva queste credenziali su questo dispositivo</strong> per il prossimo accesso.
              <span className="block mt-0.5 text-muted-foreground">
                Al prossimo accesso troverai la tua email già scritta. L'iPhone (Portachiavi) o il browser ti proporrà di salvare anche la password.
              </span>
            </span>
          </label>

          <Button data-testid="reg-submit" type="submit" disabled={loading || !acceptedLegal || (role === "merchant" && !acceptedSpecific)} className="w-full grad-fucsia-viola text-white hover:scale-105 transition">
            {loading ? "Creazione…" : "Crea account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link to="/login" className="text-terracotta hover:underline">Accedi</Link>
        </p>
      </Card>
    </main>
  );
}
