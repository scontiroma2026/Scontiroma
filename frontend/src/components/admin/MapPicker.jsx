import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PIN = L.divIcon({
  className: "picker-pin",
  html: `<div style="
    position:relative;width:32px;height:32px;
    background:#FF2E93;border:3px solid #fff;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(255,46,147,0.5);
  "><div style="position:absolute;top:50%;left:50%;width:8px;height:8px;background:#fff;border-radius:50%;transform:translate(-50%,-50%) rotate(45deg);"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Mini-mappa cliccabile: l'admin clicca il punto esatto del negozio.
 * value: [lat, lng] | null — onChange([lat, lng])
 */
export default function MapPicker({ value, onChange, height = 240 }) {
  return (
    <div data-testid="map-picker" className="overflow-hidden rounded-xl border border-white/10" style={{ height }}>
      <MapContainer
        center={value || [41.8933, 12.4829]}
        zoom={value ? 16 : 12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <ClickHandler onPick={onChange} />
        {value && <Marker position={value} icon={PIN} />}
      </MapContainer>
    </div>
  );
}
