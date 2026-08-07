import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Bentornato, ${res.user.name}`);
    nav(res.user.role === "merchant" ? "/merchant/dashboard" : "/discounts");
  };

  return (
    <main data-testid="login-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-warm bg-[#141414] border border-white/10 p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Bentornato</div>
        <h1 className="mt-2 font-serif text-4xl">Accedi</h1>
        <p className="mt-2 text-sm text-white/70">Entra e riprendi lo sconto dove l'avevi lasciato.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              data-testid="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              autoComplete="current-password"
            />
          </div>
          <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full grad-fucsia-viola text-white hover:scale-105 transition">
            {loading ? "Accesso…" : "Accedi"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Non hai un account?{" "}
          <Link to="/register" className="text-terracotta hover:underline">
            Registrati
          </Link>
        </p>

        <div className="mt-6 rounded-md border border-warm bg-white/5 p-3 text-xs text-white/70">
          <strong>Demo:</strong> cliente@scontiroma.it / cliente123 · trattoria@scontiroma.it / merchant123
        </div>
      </Card>
    </main>
  );
}
