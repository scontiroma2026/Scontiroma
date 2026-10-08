import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Scheda } from "@/components/AreaUI";

/**
 * Cosa manca al negozio o va controllato, in parole semplici. Nessuna chiamata al server:
 * usa i dati che la dashboard ha già (utente, offerta, offerta del mese dopo).
 * Ogni voce porta alla schermata giusta; se è tutto a posto l'elenco sparisce.
 */
export function calcolaVoci({ user, discount, next }) {
  const voci = [];
  const foto = Boolean(discount?.image_url) || (Array.isArray(discount?.image_urls) && discount.image_urls.length > 0);

  if (!discount) {
    voci.push({ id: "offerta", tono: "rosa", to: "/merchant/discount", titolo: "Pubblica la tua offerta", sotto: "Così i clienti possono trovarla" });
  } else if (discount.approval_status === "rejected") {
    voci.push({ id: "rifiutata", tono: "rosa", to: "/merchant/discount", titolo: "Correggi l'offerta rifiutata", sotto: "Modificala e rimandala in revisione" });
  } else if (!foto && !discount.locked_this_month) {  // approvata e bloccata fino al 1° del mese: la foto non si può cambiare
    voci.push({ id: "foto", tono: "rosa", to: "/merchant/discount", titolo: "Aggiungi una foto all'offerta", sotto: "Si vede nella scheda che trovano i clienti" });
  }

  if (!(user?.shop_description || "").trim()) {
    voci.push({ id: "descrizione", tono: "viola", href: "#negozio", titolo: "Racconta il tuo negozio", sotto: "La descrizione manca: i clienti la leggono sulla tua offerta" });
  }
  if (!user?.orari) {
    voci.push({ id: "orari", tono: "viola", href: "#negozio", titolo: "Inserisci gli orari di apertura", sotto: "Così i clienti vedono «Aperto ora» o «Chiuso»" });
  }

  // Offerta del mese dopo: solo quando si può caricare e non si è scelto «Non rinnovo»
  const win = next?.window;
  if (discount?.approval_status === "approved" && win?.open && !next?.next_discount && !next?.no_renew) {
    voci.push({ id: "mese-prossimo", tono: "teal", to: "/merchant/discount?tab=next", titolo: `Prepara l'offerta di ${win.next_month_label || "il mese prossimo"}`, sotto: "Senza una nuova offerta, a fine mese la tua esce dall'elenco" });
  }

  if ((user?.biometric_devices || 0) === 0 && browserSupportsWebAuthn()) {
    voci.push({ id: "faceid", tono: "teal", to: "/setup-security?da=account", titolo: "Attiva Face ID", sotto: "Per entrare nell'area negozio senza digitare la password" });
  }
  return voci;
}

const BARRA = { rosa: "bg-ac-rosa", viola: "bg-ac-viola", teal: "bg-ac-teal" };

function Voce({ v }) {
  const contenuto = (
    <>
      <span aria-hidden="true" className={`h-[34px] w-1.5 shrink-0 rounded-full ${BARRA[v.tono]}`} />
      <span className="flex min-w-0 flex-1 flex-col py-2">
        <span className="text-[15px] font-bold">{v.titolo}</span>
        <span className="text-xs text-ac-soft">{v.sotto}</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ac-mute" />
    </>
  );
  const classe = "flex min-h-[60px] items-center gap-3 border-t border-ac-line px-1 text-ac-ink first:border-t-0 hover:bg-ac-tint/60";
  return v.to ? (
    <Link to={v.to} data-testid={`da-fare-${v.id}`} className={classe}>{contenuto}</Link>
  ) : (
    <a href={v.href} data-testid={`da-fare-${v.id}`} className={classe}>{contenuto}</a>
  );
}

export default function DaFareCard({ voci }) {
  if (voci.length === 0) {
    return (
      <Scheda titolo="Da fare" tono="verde" data-testid="da-fare">
        <p data-testid="da-fare-ok" className="flex items-center gap-3 rounded-2xl bg-ac-verdeBg px-4 py-3.5 text-sm font-bold text-ac-verde">
          <CheckCircle2 size={22} aria-hidden="true" className="shrink-0" />
          Tutto a posto: il negozio è completo.
        </p>
      </Scheda>
    );
  }
  return (
    <Scheda titolo="Da fare" tono="rosa" destra={voci.length === 1 ? "1 cosa" : `${voci.length} cose`} data-testid="da-fare">
      <ul>
        {voci.map((v) => <li key={v.id}><Voce v={v} /></li>)}
      </ul>
    </Scheda>
  );
}
