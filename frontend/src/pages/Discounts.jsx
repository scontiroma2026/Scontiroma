import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import DiscountCard from "@/components/DiscountCard";
import { Input } from "@/components/ui/input";
import { Search, LocateFixed } from "lucide-react";

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const [lat1, lon1] = a; const [lat2, lon2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [topDiscounts, setTopDiscounts] = useState([]);

  const requestLocation = () => {
    if (!navigator.geolocation) return setGeoStatus("error");
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setGeoStatus("granted"); },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run one-shot at mount
  }, []);

  useEffect(() => {
    api.get("/zones").then((r) => setZones(r.data.zones || []));
    api.get("/categories").then((r) => setCategories(r.data.categories || []));
    api.get("/merchants/top?limit=3")
      .then((r) => setTopDiscounts(r.data.merchants || []))
      .catch((err) => console.warn("[discounts] top merchants load failed:", err?.message || err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (zone) params.zone = zone;
    if (category) params.category = category;
    if (q) params.q = q;
    const t = setTimeout(() => {
      api.get("/discounts", { params })
        .then((r) => setDiscounts(r.data.discounts || []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [zone, category, q]);

  const sorted = useMemo(() => {
    if (!userPos) return discounts;
    return [...discounts]
      .map((d) => ({ ...d, _distKm: (d.merchant?.lat && d.merchant?.lng) ? haversineKm(userPos, [d.merchant.lat, d.merchant.lng]) : Infinity }))
      .sort((a, b) => a._distKm - b._distKm);
  }, [discounts, userPos]);
  const count = sorted.length;

  return (
    <main data-testid="discounts-page" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Sconti a Roma</div>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Trova il tuo sconto</h1>
        <p className="mt-3 text-white/70">Filtra per zona o categoria. Cambia ogni settimana, come i quartieri di Roma.</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            data-testid="search-input"
            placeholder="Cerca ristorante, offerta, quartiere…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-[#141414] border border-white/10"
          />
        </div>
        <select
          data-testid="filter-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full rounded-md border border-input bg-[#141414] border border-white/10 px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le zone</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select
          data-testid="filter-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-input bg-[#141414] border border-white/10 px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {topDiscounts.length > 0 && (
        <div data-testid="top-shops-section" className="mb-10 rounded-2xl border border-fucsia/20 bg-gradient-to-br from-fucsia/5 to-transparent p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h2 className="font-serif text-2xl text-white">I più richiesti questo mese</h2>
              </div>
              <p className="text-sm text-white/60 mt-1">Le 3 offerte più utilizzate dagli abbonati a Roma</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topDiscounts.map((d, i) => (
              <div key={d.id} className="relative">
                <div className={`absolute -top-3 -left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white font-bold shadow-lg ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-zinc-300 text-zinc-900" : "bg-orange-500"}`}>
                  {i + 1}°
                </div>
                <DiscountCard discount={d} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-sm text-white/60">
        <div>
          {loading ? "Caricamento…" : <span data-testid="results-count">{count} sconti trovati</span>}
          {userPos && !loading && <span className="ml-2 text-ciano">· ordinati per distanza</span>}
        </div>
        <button
          type="button"
          data-testid="discounts-locate-btn"
          onClick={requestLocation}
          className="inline-flex items-center gap-1.5 rounded-full border border-ciano/40 bg-ciano/10 text-ciano px-3 py-1.5 text-xs hover:bg-ciano/20 hover:text-white transition"
        >
          <LocateFixed size={12} />
          {geoStatus === "granted" ? "Aggiorna posizione" : "Trova quelli vicini a me"}
        </button>
      </div>

      {geoStatus === "denied" && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
          Posizione negata — abilitala nel browser per vedere prima gli sconti più vicini.
        </div>
      )}

      {!loading && count === 0 && (
        <div className="rounded-xl border border-warm bg-white/5 p-10 text-center text-white/70">
          Nessuno sconto per i filtri selezionati.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((d) => <DiscountCard key={d.id} discount={d} />)}
      </div>
    </main>
  );
}
