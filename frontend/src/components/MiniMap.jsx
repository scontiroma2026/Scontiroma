import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

// Custom pin fucsia (coerente con MapView)
const SHOP_PIN = L.divIcon({
  className: "shop-mini-pin",
  html: `<div style="
    position:relative;width:32px;height:32px;
    background:#FF2E93;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(255,46,147,0.5);
  "><div style="
    position:absolute;top:50%;left:50%;
    width:8px;height:8px;background:#fff;border-radius:50%;
    transform:translate(-50%,-50%) rotate(45deg);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/**
 * Mini-mappa per una singola posizione (usata nella pagina di dettaglio sconto).
 * Richiede lat + lng validi (numeri).
 */
export default function MiniMap({ lat, lng, shopName, address, zoom = 16 }) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}#map=${zoom}/${lat}/${lng}`;

  return (
    <div data-testid="mini-map" className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
      {/* Stili leaflet coerenti con MapView */}
      <style>{`
        .mini-map-container .leaflet-container { background: #0A0A0A; }
        .mini-map-container .leaflet-tile { filter: brightness(0.65) invert(1) contrast(1.1) hue-rotate(180deg) saturate(0.4) brightness(0.85); }
        .mini-map-container .leaflet-popup-content-wrapper { background:#0A0A0A;color:#fff;border:1px solid rgba(255,46,147,0.4);border-radius:12px; }
        .mini-map-container .leaflet-popup-tip { background:#0A0A0A;border:1px solid rgba(255,46,147,0.4); }
        .mini-map-container .leaflet-control-attribution { background: rgba(0,0,0,0.6) !important; color: rgba(255,255,255,0.4) !important; font-size: 10px; }
        .mini-map-container .leaflet-control-attribution a { color: rgba(0,229,255,0.6) !important; }
        .mini-map-container .leaflet-control-zoom a { background:#141414 !important;color:#fff !important;border:1px solid rgba(255,255,255,0.1) !important; }
        .mini-map-container .leaflet-control-zoom a:hover { background:#FF2E93 !important; }
      `}</style>

      {/* Header con indirizzo + link "Portami qui" */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin size={16} className="text-fucsia mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-gold">Dove siamo</div>
            {shopName && (
              <div className="text-sm font-semibold text-white truncate">{shopName}</div>
            )}
            {address && (
              <div className="text-xs text-white/60 truncate" title={address}>
                {address}
              </div>
            )}
          </div>
        </div>
        <a
          data-testid="mini-map-directions"
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-fucsia/15 border border-fucsia/40 text-fucsia px-3 py-1.5 text-xs font-semibold hover:bg-fucsia/25 transition"
          title="Apri in Google Maps"
        >
          <Navigation size={12} /> Portami qui
        </a>
      </div>

      {/* Mappa */}
      <div className="mini-map-container" style={{ height: 260 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
          scrollWheelZoom={false}
          dragging
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={SHOP_PIN}>
            <Popup>
              <div className="text-xs">
                {shopName && <div className="font-semibold text-fucsia">{shopName}</div>}
                {address && <div className="text-white/70 mt-1">{address}</div>}
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-ciano hover:underline"
                >
                  Naviga →
                </a>
              </div>
            </Popup>
          </Marker>
          <ZoomControl position="topright" />
        </MapContainer>
      </div>
    </div>
  );
}
