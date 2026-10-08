import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { OSM_TILE_URL, OSM_ATTRIBUTION } from "@/lib/osm";

// Custom pin fucsia (coerente con MapView)
const SHOP_PIN = L.divIcon({
  className: "shop-mini-pin",
  html: `<div style="
    position:relative;width:32px;height:32px;
    background:#D81B72;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(34,30,27,0.35);
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
    <div data-testid="mini-map" className="rounded-2xl overflow-hidden border border-border bg-muted">
      {/* Stili leaflet coerenti con MapView */}
      <style>{`
        .mini-map-container .leaflet-container { background: #FAF8F5; }
        .mini-map-container .leaflet-popup-content-wrapper { background:#fff;color:#221E1B;border:1px solid #ECE7DF;border-radius:12px; }
        .mini-map-container .leaflet-popup-tip { background:#fff;border:1px solid #ECE7DF; }
        .mini-map-container .leaflet-control-attribution { background: rgba(255,255,255,0.92) !important; color: #5B544D !important; font-size: 10px; }
        .mini-map-container .leaflet-control-attribution a { color: #00798C !important; text-decoration: underline; }
        .mini-map-container .leaflet-control-zoom a { background:#fff !important;color:#221E1B !important;border:1px solid #A39B8F !important; }
        .mini-map-container .leaflet-control-zoom a:hover { background:#D81B72 !important;color:#fff !important; }
      `}</style>

      {/* Header con indirizzo + link "Portami qui" */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin size={16} className="text-fucsia mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-gold">Dove siamo</div>
            {shopName && (
              <div className="text-sm font-semibold text-foreground truncate">{shopName}</div>
            )}
            {address && (
              <div className="text-xs text-muted-foreground truncate" title={address}>
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
            attribution={OSM_ATTRIBUTION}
            url={OSM_TILE_URL}
          />
          <Marker position={[lat, lng]} icon={SHOP_PIN}>
            <Popup>
              <div className="text-xs">
                {shopName && <div className="font-semibold text-fucsia">{shopName}</div>}
                {address && <div className="text-muted-foreground mt-1">{address}</div>}
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
