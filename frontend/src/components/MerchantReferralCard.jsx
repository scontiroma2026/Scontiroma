import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Scheda } from "@/components/AreaUI";
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
    <Scheda data-testid="merchant-referral-card" titolo="Il tuo QR personale" tono="teal" icona={<QrCode size={15} />}>
      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        {/* QR Code: sempre scuro su bianco, per essere letto bene */}
        <div className="flex justify-center md:items-start md:justify-start">
          <div className="rounded-2xl border border-ac-line bg-white p-3">
            <QRCodeSVG
              value={refUrl}
              size={140}
              level="H"
              fgColor="#221E1B"
              bgColor="#ffffff"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Info + azioni */}
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-ac-soft">
            Metti questo QR in cassa: ogni cliente che si iscrive scansionandolo
            verrà <strong className="text-ac-ink">attribuito al tuo negozio</strong>.
            Più clienti porti, più diventi un partner strategico di Sconti Roma.
          </p>

          {/* Link URL */}
          <div
            data-testid="referral-url-box"
            className="mt-3 flex items-center gap-2 rounded-xl border border-ac-line bg-ac-tint p-1.5 pl-3"
          >
            <code className="flex-1 truncate text-xs font-bold text-ac-teal">{refUrl}</code>
            <button
              type="button"
              data-testid="referral-copy"
              onClick={copyLink}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ac-campo bg-white text-ac-ink transition hover:bg-ac-tealBg"
              title="Copia link"
              aria-label="Copia il link"
            >
              {copied ? <Check size={16} className="text-ac-verde" /> : <Copy size={16} />}
            </button>
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              data-testid="ref-open-flyer"
              href={flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ac-rosa px-4 text-sm font-extrabold text-ac-rosa transition hover:bg-ac-rosaSoft"
            >
              <Printer size={16} aria-hidden="true" /> Stampa la mia locandina
            </a>
            <a
              data-testid="ref-open-page"
              href={refUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ac-viola px-4 text-sm font-extrabold text-ac-viola transition hover:bg-ac-violaBg/60"
            >
              <ExternalLink size={16} aria-hidden="true" /> Prova il link
            </a>
          </div>
        </div>
      </div>
    </Scheda>
  );
}
