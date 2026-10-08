import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PaymentCancel() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-foreground">
      <Card className="border-border bg-muted p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <X size={32} />
        </div>
        <h1 className="mt-6 font-serif text-4xl">Pagamento annullato</h1>
        <p className="mt-2 text-muted-foreground">Nessun problema, non è stato addebitato nulla.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/subscribe">
            <Button className="grad-fucsia-viola text-white rounded-full">Riprova</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="rounded-full border-border text-foreground hover:bg-muted">Torna alla home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
