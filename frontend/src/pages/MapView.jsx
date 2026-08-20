import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowRight, LocateFixed } from "lucide-react";

const ROME_CENTER = [41.8955, 12.4823];

// Haversine distance in km
function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Ricenter helper — usa useMap per aggiornare la posizione della mappa
function Recenter({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom ?? map.getZoom(), { duration: 0.8 });
  }, [position, zoom, map]);
  return null;
}

// Custom marker icon with fucsia glow
const buildIcon = (percent) => L.divIcon({
  className: "custom-pin",
  html: `<div style="
    position: relative;
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #FF2E93 0%, #7A5CFF 100%);
    border: 2px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 0 20px rgba(255,46,147,0.6);
  "><span style="
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    color: white; font-weight: 800; font-size: 11px; font-family: 'Archivo Black', sans-serif;
    white-space: nowrap;
  ">-${percent}%</span></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -38],
});

export default function MapView() {
  const [discounts, setDiscounts] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null); // [lat, lng]
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | requesting | granted | denied | error

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  // richiedi posizione al primo mount (silenzioso — il browser mostra il prompt)
  useEffect(() => { requestLocation(); }, []);

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
        .then((r) => setDiscounts((r.data.discounts || []).filter(d => d.merchant?.lat && d.merchant?.lng)))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [zone, category, q]);

  // Ordina per distanza se disponiamo della posizione utente
  const sortedDiscounts = useMemo(() => {
    if (!userPos) return discounts;
    return [...discounts]
      .map((d) => ({ ...d, _distKm: haversineKm(userPos, [d.merchant.lat, d.merchant.lng]) }))
      .sort((a, b) => a._distKm - b._distKm);
  }, [discounts, userPos]);

  const stats = useMemo(() => ({
    count: sortedDiscounts.length,
    maxOff: Math.max(0, ...sortedDiscounts.map(d => d.percent_off || 0)),
    nearest: userPos && sortedDiscounts[0] ? sortedDiscounts[0]._distKm : null,
  }), [sortedDiscounts, userPos]);

  return (
    <main data-testid="map-page" className="min-h-[calc(100vh-72px)] text-white">
      {/* Custom leaflet overrides */}
      <style>{`
        .leaflet-container { background: #0A0A0A; font-family: 'Manrope', sans-serif; }
        .leaflet-tile { filter: brightness(0.65) invert(1) contrast(1.1) hue-rotate(180deg) saturate(0.4) brightness(0.85); }
        .leaflet-popup-content-wrapper {
          background: #0A0A0A; color: white; border: 1px solid rgba(255,46,147,0.4);
          border-radius: 16px; padding: 0; box-shadow: 0 8px 30px rgba(255,46,147,0.3);
        }
        .leaflet-popup-tip { background: #0A0A0A; border: 1px solid rgba(255,46,147,0.4); }
        .leaflet-popup-content { margin: 0; width: 260px !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.6) !important; color: rgba(255,255,255,0.5) !important; }
        .leaflet-control-attribution a { color: rgba(0,229,255,0.7) !important; }
        .leaflet-control-zoom a { background: #141414 !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .leaflet-control-zoom a:hover { background: #FF2E93 !important; }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Sconti sulla mappa</div>
        <h1 className="mt-2 font-serif text-5xl">Roma <span className="text-grad">a colpo d'occhio</span></h1>
        <p className="mt-2 text-white/60">
          {stats.count} sconti attivi · fino a <span className="text-neon font-bold">−{stats.maxOff}%</span>
          {stats.nearest != null && (
            <> · più vicino a <span className="text-ciano font-bold">{stats.nearest.toFixed(1)} km</span></>
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Button
            data-testid="locate-me-btn"
            type="button"
            size="sm"
            variant="outline"
            onClick={requestLocation}
            className="rounded-full border-ciano/50 bg-ciano/10 text-ciano hover:bg-ciano/20 hover:text-white"
          >
            <LocateFixed size={12} className="mr-1.5" />
            {geoStatus === "granted" ? "Aggiorna posizione" : "Trova sconti vicino a me"}
          </Button>
          {geoStatus === "denied" && (
            <span className="text-yellow-300/80">Posizione negata — abilitala nel browser per vedere gli sconti più vicini.</span>
          )}
          {geoStatus === "requesting" && (
            <span className="text-white/50">Rilevo posizione…</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            data-testid="map-search"
            placeholder="Cerca locale o offerta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <select
          data-testid="map-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le zone</option>
          {zones.map((z) => <option key={z} value={z} className="bg-[#0A0A0A]">{z}</option>)}
        </select>
        <select
          data-testid="map-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm md:w-56"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>)}
        </select>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="relative overflow-hidden rounded-2xl border-2 border-white/10" style={{ height: "70vh", minHeight: 500 }}>
          <MapContainer center={ROME_CENTER} zoom={13} zoomControl={false} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            {userPos && <Recenter position={userPos} zoom={14} />}
            {userPos && (
              <CircleMarker
                center={userPos}
                radius={9}
                pathOptions={{ color: "#00E5FF", fillColor: "#00E5FF", fillOpacity: 0.9, weight: 3 }}
              >
                <Popup>La tua posizione</Popup>
              </CircleMarker>
            )}
            {sortedDiscounts.map((d) => (
              <Marker
                key={d.id}
                position={[d.merchant.lat, d.merchant.lng]}
                icon={buildIcon(d.percent_off || 0)}
              >
                <Popup>
                  <Link to={`/discounts/${d.id}`} className="block group">
                    <div className="relative">
                      <img
                        src={d.image_url || d.merchant.image_url}
                        alt={d.title}
                        className="h-32 w-full object-cover"
                      />
                      <div className="absolute right-2 top-2 rounded-full bg-fucsia px-2 py-1 text-xs font-bold text-white shadow-lg">
                        −{d.percent_off}%
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ciano">
                        <MapPin size={10} /> {d.merchant.zone} · {d.merchant.category}
                        {d._distKm != null && <span className="text-white/60">· {d._distKm.toFixed(1)} km</span>}
                      </div>
                      <div className="mt-1 font-serif text-lg text-white leading-tight group-hover:text-fucsia transition">
                        {d.title}
                      </div>
                      <div className="mt-1 text-xs text-white/60">{d.merchant.shop_name}</div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <span className="font-serif text-xl text-fucsia">€{d.discounted_price.toFixed(2)}</span>
                          <span className="ml-2 text-xs text-white/40 line-through">€{d.original_price.toFixed(2)}</span>
                        </div>
                        <ArrowRight size={14} className="text-fucsia" />
                      </div>
                    </div>
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[400] pointer-events-none">
              <div className="rounded-full bg-black/80 px-4 py-2 text-sm text-white">Caricamento sconti…</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
