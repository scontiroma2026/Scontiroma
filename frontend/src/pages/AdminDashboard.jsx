import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import HealthWidget from "@/components/admin/HealthWidget";
import FraudLog from "@/components/admin/FraudLog";
import ReviewsCenter from "@/components/admin/ReviewsCenter";
import AdminSubscribers from "@/components/admin/AdminSubscribers";
import GeocodeIssuesWidget from "@/components/admin/GeocodeIssuesWidget";
import MerchantDiscountsDialog from "@/components/admin/MerchantDiscountsDialog";
import AdminGate from "@/components/admin/AdminGate";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminPending from "@/components/admin/AdminPending";
import AdminLog from "@/components/admin/AdminLog";
import AdminMerchantsTable from "@/components/admin/AdminMerchantsTable";
import AdminReferralsByMerchant from "@/components/admin/AdminReferralsByMerchant";
import AdminRecoveryId from "@/components/admin/AdminRecoveryId";
import AdminAppFeedback from "@/components/admin/AdminAppFeedback";
import AdminEconomics from "@/components/admin/AdminEconomics";
import AdminTraffic from "@/components/admin/AdminTraffic";
import AdminNextMonth from "@/components/admin/AdminNextMonth";

/**
 * AdminDashboard — orchestratore snello.
 * Ogni tab è delegato a un sotto-componente in /components/admin/*.
 * Qui rimangono solo:
 *  - gestione del master token (gate) + sessione
 *  - fetch dei dati condivisi (stats, merchants, pending) + refresh
 *  - tab-switcher + toolbar
 *  - dialog "storico offerte" del merchant
 */
export default function AdminDashboard() {
  const [gated, setGated] = useState(true);
  const [stats, setStats] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("analytics");
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [discountsOpen, setDiscountsOpen] = useState(false);

  // L'auth master viaggia SOLO via cookie httpOnly (withCredentials): niente header extra.
  // Manteniamo hdrs() per compatibilità con i sotto-componenti che lo ricevono come prop.
  const hdrs = () => ({});

  // Verifica al mount se la sessione master (cookie) è ancora valida; se sì, sblocca e carica.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/session");
        if (data.master_verified) {
          setGated(false);
          loadData();
        } else {
          setGated(true);
        }
      } catch (err) {
        console.warn("[admin] session check failed:", err?.message || err);
        setGated(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verifica sessione una sola volta al mount
  }, []);

  const onVerified = () => {
    setGated(false);
    loadData();
  };

  const lockOut = async () => {
    try { await api.post("/admin/logout-master"); }
    catch (err) { console.warn("[admin] logout master failed:", err?.message || err); }
    setGated(true);
    setStats(null);
  };

  const loadData = async () => {
    try {
      const [s, m, p] = await Promise.all([
        api.get("/admin/stats", hdrs()),
        api.get("/admin/merchants", hdrs()),
        api.get("/admin/discounts/pending", hdrs()),
      ]);
      setStats(s.data);
      setMerchants(m.data.merchants || []);
      setPending(p.data.discounts || []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        // Sessione master scaduta o invalida → torna al gate
        setGated(true);
      } else {
        toast.error(formatApiError(err));
      }
    }
  };

  const forceEdit = async (id) => {
    if (!window.confirm("Consentire al commerciante di modificare l'offerta questo mese?")) return;
    try {
      await api.post(`/admin/discounts/${id}/force-edit`, {}, hdrs());
      toast.success("Sblocco concesso");
      loadData();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (gated) return <AdminGate onVerified={onVerified} />;
  if (!stats) return <div className="mx-auto max-w-7xl px-6 py-16 text-white/60">Caricamento…</div>;

  const tabs = [
    ["analytics", "Analytics"],
    ["economics", "Economics"],
    ["traffic", "Traffico"],
    ["subscribers", "Abbonati"],
    ["referrals", "Referral QR"],
    ["pending", `Offerte in attesa (${pending.length})`],
    ["nextmonth", "Prossimo Mese"],
    ["merchants", `Negozi (${merchants.length})`],
    ["fraud", "Registro Frodi"],
    ["reviews", "Feedback"],
    ["appfeedback", "Feedback App"],
    ["log", "Log completo"],
  ];

  return (
    <main data-testid="admin-dashboard" className="mx-auto max-w-7xl px-6 py-12 text-white">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ciano">Admin · Cabina di regia</div>
          <h1 className="mt-2 font-serif text-5xl text-grad">Sconti Roma Insights</h1>
        </div>
        <div className="flex gap-2">
          <AdminRecoveryId hdrs={hdrs} />
          <Button
            variant="outline"
            onClick={lockOut}
            className="rounded-full border-white/20 text-white hover:bg-white/10"
          >
            <LogOut size={14} className="mr-2" /> Blocca
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <HealthWidget />
      </div>

      <GeocodeIssuesWidget hdrs={hdrs} />

      <div className="mb-6 flex gap-2 border-b border-white/10 flex-wrap">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            data-testid={`tab-${k}`}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm border-b-2 transition ${
              tab === k
                ? "border-fucsia text-fucsia"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "analytics" && <AdminAnalytics stats={stats} />}
      {tab === "subscribers" && <AdminSubscribers hdrs={hdrs} />}
      {tab === "referrals" && <AdminReferralsByMerchant hdrs={hdrs} />}
      {tab === "pending" && <AdminPending pending={pending} hdrs={hdrs} onRefresh={loadData} />}
      {tab === "nextmonth" && <AdminNextMonth hdrs={hdrs} />}
      {tab === "merchants" && (
        <AdminMerchantsTable
          merchants={merchants}
          hdrs={hdrs}
          onRefresh={loadData}
          onForceEdit={forceEdit}
          onViewDiscounts={(id) => {
            setSelectedMerchantId(id);
            setDiscountsOpen(true);
          }}
        />
      )}
      {tab === "fraud" && <FraudLog />}
      {tab === "reviews" && <ReviewsCenter />}
      {tab === "appfeedback" && <AdminAppFeedback hdrs={hdrs} />}
      {tab === "economics" && <AdminEconomics hdrs={hdrs} />}
      {tab === "traffic" && <AdminTraffic hdrs={hdrs} />}
      {tab === "log" && <AdminLog recent={stats.recent} />}

      <MerchantDiscountsDialog
        merchantId={selectedMerchantId}
        open={discountsOpen}
        onOpenChange={(o) => {
          setDiscountsOpen(o);
          if (!o) setSelectedMerchantId(null);
        }}
      />
    </main>
  );
}
