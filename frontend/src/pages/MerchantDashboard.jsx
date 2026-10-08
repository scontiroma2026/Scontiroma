import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { QrCode, TicketPercent, ChevronRight, Eye, Pencil, PlusCircle } from "lucide-react";
import GdprSection from "@/components/GdprSection";
import MerchantReferralCard from "@/components/MerchantReferralCard";
import ShopCodeCard from "@/components/ShopCodeCard";
import ShopDescriptionCard from "@/components/ShopDescriptionCard";
import MerchantHours from "@/components/MerchantHours";
import NextOfferCard from "@/components/NextOfferCard";
import DaFareCard, { calcolaVoci } from "@/components/DaFareCard";
import RenewalBanner from "@/components/RenewalBanner";
import MerchantInsights from "@/components/MerchantInsights";
import { Scheda, Pillola, StatoVuoto, ErroreRiprova, Scheletro, CLASSE_PRIMARIO, CLASSE_BASE_SECONDARIO, CLASSE_BORDO } from "@/components/AreaUI";
import { useAppConfig } from "@/context/ConfigContext";

export default function MerchantDashboard() {
  const { user } = useAuth();
  const { trialEndLabel } = useAppConfig();
  const [stats, setStats] = useState({ total: 0, redeemed: 0, pending: 0 });
  const [discount, setDiscount] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [next, setNext] = useState(null); // offerta del mese dopo (serve a NextOfferCard e a «Da fare»)
  const [stato, setStato] = useState("carica"); // carica | ok | errore

  const carica = useCallback(() => {
    setStato("carica");
    Promise.all([
      api.get("/merchants/me/stats"),
      api.get("/merchants/me/discount"),
      api.get("/merchants/me/redemptions"),
    ])
      .then(([s, d, r]) => {
        setStats(s.data);
        setDiscount(d.data.discount);
        setRedemptions((r.data.redemptions || []).slice(0, 5));
        setStato("ok");
      })
      .catch(() => setStato("errore"));
  }, []);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => {
    api.get("/merchants/me/next-discount").then((r) => setNext(r.data)).catch(() => {});
  }, []);

  return (
    <main data-testid="merchant-dashboard" className="pb-6 text-ac-ink">
      {/* Testata: nome del negozio, stato dell'offerta, azione principale */}
      <section className="bg-ac-rosaSoft">
        <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 pb-5 pt-6 sm:px-6 md:flex-row md:items-end md:justify-between md:gap-6 md:pb-7">
          <div className="flex min-w-0 flex-col gap-2.5">
            <h1 className="break-words text-[30px] leading-[1.1] sm:text-4xl md:text-5xl">{user?.shop_name || user?.name}</h1>
            <p className="text-sm font-semibold text-ac-soft">{[user?.zone, user?.category].filter(Boolean).join(" · ")}</p>
            {stato === "ok" && <StatoOfferta discount={discount} />}
          </div>
          <Link
            to="/merchant/scan"
            data-testid="go-scan-btn"
            className={`${CLASSE_PRIMARIO} mt-2 w-full md:mt-0 md:w-auto md:shrink-0`}
          >
            <QrCode size={22} aria-hidden="true" /> Scansiona codice
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {trialEndLabel && (
          <div data-testid="trial-banner" className="mb-4 rounded-2xl border border-ac-teal/40 bg-ac-tealBg p-4 text-sm text-ac-ink">
            <strong className="text-ac-teal">Prova gratuita fino al {trialEndLabel}</strong>, poi 4,99 € al mese (IVA inclusa), prezzo bloccato per chi parte adesso.
            Ti avviseremo prima e non ti addebiteremo nulla senza la tua conferma.
          </div>
        )}
        <RenewalBanner />

        {stato === "errore" && (
          <div className="mb-4">
            <ErroreRiprova onRiprova={carica}>Non riusciamo a caricare i numeri e l'offerta. Controlla la connessione e riprova.</ErroreRiprova>
          </div>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            {stato === "ok" && user && <DaFareCard voci={calcolaVoci({ user, discount, next })} />}

            <Scheda titolo="I tuoi codici" tono="viola">
              <div className="grid grid-cols-3 gap-2">
                <Numero label="Codici generati" value={stats.total} tono="rosa" caricamento={stato === "carica"} />
                <Numero label="Codici utilizzati" value={stats.redeemed} tono="teal" caricamento={stato === "carica"} />
                <Numero label="In attesa" value={stats.pending} tono="viola" caricamento={stato === "carica"} />
              </div>
            </Scheda>

            <Scheda titolo="La tua offerta" tono="rosa">
              {stato === "carica" ? (
                <div className="space-y-3" aria-busy="true">
                  <Scheletro className="h-7 w-2/3" />
                  <Scheletro className="h-5 w-1/3" />
                  <Scheletro className="h-11 w-full" />
                </div>
              ) : discount ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-serif text-[21px] leading-tight">{discount.title}</h3>
                      <div className="mt-1.5 flex items-baseline gap-2 text-base">
                        <strong className="font-extrabold text-ac-rosa">€{discount.discounted_price.toFixed(2)}</strong>
                        <span className="text-ac-mute line-through">€{discount.original_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="ac-grad shrink-0 rounded-[10px] px-3 py-1.5 text-sm font-extrabold text-white">−{discount.percent_off}%</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link to="/merchant/discount" className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.rosa} min-h-[46px] flex-1`}>
                      <Pencil size={16} aria-hidden="true" /> Modifica offerta
                    </Link>
                    <Link to={`/discounts/${discount.id}`} className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola} min-h-[46px] flex-1`}>
                      <Eye size={16} aria-hidden="true" /> Vedi come i clienti
                    </Link>
                  </div>
                </>
              ) : (
                <StatoVuoto icona={<TicketPercent size={22} />} tono="rosa">
                  Non hai ancora pubblicato uno sconto.
                  <Link to="/merchant/discount" data-testid="create-offer-btn" className={`${CLASSE_PRIMARIO} mt-4 w-full`}>
                    <PlusCircle size={20} aria-hidden="true" /> Crea la tua offerta
                  </Link>
                </StatoVuoto>
              )}
            </Scheda>

            <NextOfferCard data={next} />

            <Scheda titolo="Ultimi codici" tono="verde" destra={stato === "ok" ? `${redemptions.length} recenti` : null}>
              {stato === "carica" ? (
                <div className="space-y-2" aria-busy="true">
                  <Scheletro className="h-12 w-full" />
                  <Scheletro className="h-12 w-full" />
                </div>
              ) : redemptions.length === 0 ? (
                <StatoVuoto icona={<QrCode size={22} />} tono="verde">
                  Ancora nessun codice riscattato.
                  <span className="mt-1 block text-xs font-medium text-ac-mute">Quando un cliente mostra il suo codice, lo trovi qui.</span>
                </StatoVuoto>
              ) : (
                <ul className="divide-y divide-ac-line">
                  {redemptions.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-testo text-base font-extrabold tracking-wider">{r.code}</div>
                        <div className="mt-0.5 text-xs text-ac-soft" data-testid={`redemption-info-${r.id}`}>
                          {new Date(r.redeemed_at || r.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          {" · "}{r.discount_title}
                          {" · "}{r.client_type === "returning" ? "Cliente di ritorno" : "Cliente nuovo"}
                        </div>
                      </div>
                      <Pillola tono={r.status === "redeemed" ? "verde" : "ambra"} className="shrink-0">
                        {r.status === "redeemed" ? "Utilizzato" : "In attesa"}
                      </Pillola>
                    </li>
                  ))}
                </ul>
              )}
            </Scheda>

            <MerchantInsights />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <nav aria-label="Vai a" className="rounded-[18px] border border-ac-line bg-white px-3.5 py-1.5">
              <RigaLink href="#negozio" tono="rosa" titolo="Il tuo negozio" sotto="Descrizione e orari" />
              <RigaLink to="/merchant/discount?tab=archivio" tono="viola" titolo="Archivio offerte" sotto="Le offerte dei mesi passati, con «Riusa»" />
              <RigaLink href="#qr" tono="teal" titolo="Il tuo QR e la locandina" sotto="Da mettere in cassa" />
              <RigaLink to="/setup-security?da=account" tono="rosa" titolo="Sicurezza" sotto="Password e Face ID" testid="security-link" />
              <RigaLink href="#dati" tono="viola" titolo="I miei dati" sotto="Scarica o elimina il tuo account" />
            </nav>

            <div id="negozio" className="scroll-mt-24 space-y-4">
              <ShopDescriptionCard />
              <MerchantHours />
            </div>

            <ShopCodeCard />

            <div id="qr" className="scroll-mt-24">
              <MerchantReferralCard />
            </div>

            <div id="dati" className="scroll-mt-24">
              <GdprSection claro />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** «2026-10-31» -> «31/10» (con l'anno se non è quello in corso). Vuoto se la data manca o non è valida. */
export function dataBreve(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return "";
  const [, anno, mese, giorno] = m;
  return Number(anno) === new Date().getFullYear() ? `${giorno}/${mese}` : `${giorno}/${mese}/${anno}`;
}

/** Pillola verde/ambra/grigia sotto il nome: dice in parole semplici se l'offerta si vede ai clienti. */
function StatoOfferta({ discount }) {
  let tono = "ambra";
  let testo = "Nessuna offerta pubblicata";
  if (discount) {
    if (discount.approval_status === "approved" && discount.active !== false) {
      tono = "verde";
      const fino = dataBreve(discount.valid_until); // senza data (server vecchio o dato mancante) resta la frase di prima
      testo = fino ? `Offerta visibile ai clienti fino al ${fino}` : "Offerta visibile ai clienti";
    }
    else if (discount.approval_status === "pending") { tono = "ambra"; testo = "Offerta in revisione"; }
    else if (discount.approval_status === "rejected") { tono = "rosso"; testo = "Offerta rifiutata: da correggere"; }
    else if (discount.approval_status === "expired") { tono = "ambra"; testo = "Offerta scaduta"; }
    else { tono = "ambra"; testo = "Offerta non visibile ai clienti"; }
  }
  return (
    <Pillola tono={tono} data-testid="stato-offerta" className="self-start !px-3 !py-[7px] !text-[13px]">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tono === "verde" ? "bg-ac-verde" : tono === "rosso" ? "bg-ac-rosso" : "bg-ac-ambra"}`} />
      {testo}
    </Pillola>
  );
}

function Numero({ label, value, tono, caricamento }) {
  const colori = { rosa: "bg-ac-rosaBg text-ac-rosa", teal: "bg-ac-tealBg text-ac-teal", viola: "bg-ac-violaBg text-ac-viola" }[tono];
  return (
    <div className={`flex flex-col gap-0.5 rounded-[14px] px-2.5 py-3 ${colori}`}>
      {caricamento ? (
        <Scheletro className="h-8 w-10 !bg-white/70" />
      ) : (
        <span className="font-serif text-[30px] font-bold leading-[1.05]">{value}</span>
      )}
      <span className="text-xs font-semibold leading-snug text-ac-soft">{label}</span>
    </div>
  );
}

const BARRA = { rosa: "bg-ac-rosa", viola: "bg-ac-viola", teal: "bg-ac-teal" };

function RigaLink({ to, href, tono, titolo, sotto, testid }) {
  const contenuto = (
    <>
      <span aria-hidden="true" className={`h-[30px] w-1.5 shrink-0 rounded-full ${BARRA[tono]}`} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-bold">{titolo}</span>
        <span className="text-xs text-ac-soft">{sotto}</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ac-mute" />
    </>
  );
  const classe = "flex min-h-[60px] items-center gap-3 border-t border-ac-line px-1 text-ac-ink first:border-t-0 hover:bg-ac-tint/60";
  return to ? (
    <Link to={to} data-testid={testid} className={classe}>{contenuto}</Link>
  ) : (
    <a href={href} className={classe}>{contenuto}</a>
  );
}
