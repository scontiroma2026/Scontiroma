import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PaymentCancel() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-white">
      <Card className="border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white/60">
          <X size={32} />
        </div>
        <h1 className="mt-6 font-serif text-4xl">Pagamento annullato</h1>
        <p className="mt-2 text-white/70">Nessun problema, non è stato addebitato nulla.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/subscribe">
            <Button className="grad-fucsia-viola text-white rounded-full">Riprova</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">Torna alla home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
