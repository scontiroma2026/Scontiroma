import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Copy, Check, ExternalLink, QrCode, Printer } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

/**
 * Card nella MerchantDashboard: mostra QR personalizzato del merchant per il
 * referral e link alla locandina personalizzata stampabile.
 * Le statistiche di attribuzione sono riservate all'admin.
 */
export default function MerchantReferralCard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/merchants/me/referrals")
      .then((r) => setData(r.data))
      .catch(() => setData({ error: true }));
  }, []);

  if (!data) return null;
  if (data.error) return null;

  const flyerUrl = data.flyer_url;
  const refUrl = data.referral_url;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopied(true);
      toast.success("Link copiato negli appunti");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare, seleziona manualmente");
    }
  };

  return (
    <Card
      data-testid="merchant-referral-card"
      className="border-fucsia/30 bg-gradient-to-br from-fucsia/10 via-viola/5 to-black/40 p-6"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-fucsia mb-4">
        <QrCode size={14} /> Il tuo QR personale
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        {/* QR Code */}
        <div className="flex justify-center md:justify-start">
          <div className="rounded-xl bg-white p-3 shadow-lg">
            <QRCodeSVG
              value={refUrl}
              size={140}
              level="H"
              fgColor="#0A0A0F"
              bgColor="#ffffff"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Info + azioni */}
        <div className="min-w-0">
          <p className="text-sm text-white/80 leading-relaxed">
            Metti questo QR in cassa: ogni cliente che si iscrive scansionandolo
            verrà <strong className="text-fucsia">attribuito al tuo negozio</strong>.
            Più clienti porti, più diventi un partner strategico di Sconti Roma.
          </p>

          {/* Link URL */}
          <div
            data-testid="referral-url-box"
            className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-2"
          >
            <code className="text-[11px] text-ciano flex-1 truncate">{refUrl}</code>
            <button
              data-testid="referral-copy"
              onClick={copyLink}
              className="shrink-0 rounded-md border border-white/15 bg-black/40 hover:bg-fucsia/20 text-white p-1.5 transition"
              title="Copia link"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <a
              data-testid="ref-open-flyer"
              href={flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 justify-center rounded-full border border-fucsia/40 bg-fucsia/10 text-fucsia px-4 py-2 text-sm font-semibold hover:bg-fucsia/20 transition"
            >
              <Printer size={14} /> Stampa la mia locandina
            </a>
            <a
              data-testid="ref-open-page"
              href={refUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 justify-center rounded-full border border-white/15 bg-transparent text-white/80 px-4 py-2 text-sm hover:bg-white/5 transition"
            >
              <ExternalLink size={14} /> Prova il link
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
