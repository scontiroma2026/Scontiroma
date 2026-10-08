import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import DiscountCard from "@/components/DiscountCard";
import { Input } from "@/components/ui/input";
import { Search, LocateFixed, Heart } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import VistaPreferiti from "@/components/VistaPreferiti";
import { usePreferiti } from "@/context/PreferitiContext";
import ZoneOptions from "@/components/ZoneOptions";

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
  const [params, setParams] = useSearchParams();
  const { attivo: puoPreferiti, ids: preferiti } = usePreferiti();
  const vistaPreferiti = puoPreferiti && params.get("vista") === "preferiti";
  const [discounts, setDiscounts] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneAree, setZoneAree] = useState([]);
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
    api.get("/zones").then((r) => { setZones(r.data.zones || []); setZoneAree(r.data.areas || []); });
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
        <p className="mt-3 text-muted-foreground">Filtra per zona o categoria. Le offerte cambiano ogni mese.</p>
      </div>

      {puoPreferiti && (
        <div role="tablist" className="mb-6 flex gap-2">
          <button type="button" role="tab" aria-selected={!vistaPreferiti} data-testid="vista-tutti"
            onClick={() => setParams({})}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${!vistaPreferiti ? "bg-fucsia text-white" : "border border-input text-foreground"}`}>
            Tutti
          </button>
          <button type="button" role="tab" aria-selected={vistaPreferiti} data-testid="vista-preferiti-tab"
            onClick={() => setParams({ vista: "preferiti" })}
            className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${vistaPreferiti ? "bg-fucsia text-white" : "border border-input text-foreground"}`}>
            <Heart size={16} fill={vistaPreferiti ? "currentColor" : "none"} /> Preferiti · {preferiti.length}
          </button>
        </div>
      )}
      {vistaPreferiti ? <VistaPreferiti /> : (<>

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="search-input"
            placeholder="Cerca ristorante, offerta, quartiere…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-card border border-border"
          />
        </div>
        <select
          data-testid="filter-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full rounded-md border border-input bg-card border border-border px-3 h-11 text-sm md:w-56"
        >
          <option value="">Tutte le zone</option>
          <ZoneOptions areas={zoneAree} zones={zones} />
        </select>
        <select
          data-testid="filter-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-input bg-card border border-border px-3 h-11 text-sm md:w-56"
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
                <h2 className="font-serif text-2xl text-foreground">I più richiesti questo mese</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Le 3 offerte più utilizzate dai clienti</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topDiscounts.map((d, i) => (
              <div key={d.id} className="relative">
                <div className={`absolute -top-3 -left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-foreground font-bold shadow-lg ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-zinc-300 text-zinc-900" : "bg-orange-500"}`}>
                  {i + 1}°
                </div>
                <DiscountCard discount={d} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {loading ? "Caricamento…" : <span data-testid="results-count">{count === 1 ? "1 sconto trovato" : `${count} sconti trovati`}</span>}
          {userPos && !loading && <span className="ml-2 text-ciano">· ordinati per distanza</span>}
        </div>
        {geoStatus === "granted" && (
          <button
            type="button"
            data-testid="discounts-locate-btn"
            onClick={requestLocation}
            className="inline-flex items-center gap-1.5 rounded-full border border-ciano/40 bg-ciano/10 text-ciano px-3 py-1.5 text-xs hover:bg-ciano/20 hover:text-foreground transition"
          >
            <LocateFixed size={12} /> Aggiorna posizione
          </button>
        )}
      </div>

      {/* La posizione si chiede solo se il cliente tocca il pulsante: mai all'apertura della pagina */}
      {geoStatus !== "granted" && (
        <div data-testid="geo-invito" className="mb-6 flex flex-col gap-3 rounded-2xl border border-ciano/30 bg-ciano/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Vuoi trovare gli sconti vicino a te?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {geoStatus === "denied"
                ? "Posizione non disponibile: puoi attivarla nelle impostazioni del browser, oppure scegli la zona qui sopra."
                : "La posizione serve solo a ordinare le offerte sul tuo telefono: non la salviamo."}
            </p>
          </div>
          <button
            type="button"
            data-testid="discounts-locate-btn"
            onClick={requestLocation}
            disabled={geoStatus === "requesting"}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-ciano/50 bg-ciano/10 px-5 text-sm font-semibold text-ciano hover:bg-ciano/20 hover:text-foreground transition disabled:opacity-60"
          >
            <LocateFixed size={16} />
            {geoStatus === "requesting" ? "Cerco la posizione…" : "Usa la mia posizione"}
          </button>
        </div>
      )}

      {!loading && count === 0 && (
        <div className="rounded-xl border border-warm bg-muted p-10 text-center text-muted-foreground">
          Nessuno sconto per i filtri selezionati.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((d) => <DiscountCard key={d.id} discount={d} />)}
      </div>
      </>)}
    </main>
  );
}
