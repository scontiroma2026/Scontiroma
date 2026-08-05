import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import DiscountCard from "@/components/DiscountCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/zones").then((r) => setZones(r.data.zones || []));
    api.get("/categories").then((r) => setCategories(r.data.categories || []));
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

  const count = discounts.length;

  return (
    <main data-testid="discounts-page" className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Sconti a Roma</div>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Trova il tuo sconto</h1>
        <p className="mt-3 text-espresso/70">Filtra per zona o categoria. Cambia ogni settimana, come i quartieri di Roma.</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
          <Input
            data-testid="search-input"
            placeholder="Cerca ristorante, offerta, quartiere…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <select
          data-testid="filter-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le zone</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select
          data-testid="filter-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-4 text-sm text-espresso/60">
        {loading ? "Caricamento…" : <span data-testid="results-count">{count} sconti trovati</span>}
      </div>

      {!loading && count === 0 && (
        <div className="rounded-xl border border-warm bg-parchment p-10 text-center text-espresso/70">
          Nessuno sconto per i filtri selezionati.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {discounts.map((d) => <DiscountCard key={d.id} discount={d} />)}
      </div>
    </main>
  );
}
