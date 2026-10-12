import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { OSM_TILE_URL, OSM_ATTRIBUTION } from "@/lib/osm";
import {
  PMTILES_URL,
  PMTILES_MAX_DATA_ZOOM,
  MAPPA_MAX_ZOOM,
  PROTOMAPS_ATTRIBUTION,
  pmtilesDisponibile,
} from "@/lib/mappa";

/**
 * Sfondo della mappa (da mettere dentro un MapContainer di react-leaflet).
 * - Se c'è il file roma.pmtiles: tile vettoriali Protomaps disegnati sul telefono (nostro sito, nessun servizio esterno).
 * - Altrimenti: tile pubblici di OpenStreetMap, come prima.
 * Il codice di Protomaps si carica solo quando serve (import dinamico).
 */
export default function MappaBase() {
  const map = useMap();
  const [modo, setModo] = useState(null); // null = verifica in corso, "pmtiles" | "osm"

  useEffect(() => {
    let vivo = true;
    pmtilesDisponibile().then((ok) => vivo && setModo(ok ? "pmtiles" : "osm"));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (modo !== "pmtiles") return undefined;
    let annullato = false;
    let layer = null;
    import("protomaps-leaflet")
      .then(({ leafletLayer }) => {
        if (annullato) return;
        if (!window.L) window.L = L; // protomaps-leaflet cerca Leaflet tra le variabili globali
        layer = leafletLayer({
          url: new URL(PMTILES_URL, window.location.origin).toString(),
          flavor: "light",
          lang: "it",
          maxDataZoom: PMTILES_MAX_DATA_ZOOM,
          maxZoom: MAPPA_MAX_ZOOM,
          attribution: PROTOMAPS_ATTRIBUTION,
        });
        layer.addTo(map);
      })
      .catch(() => {
        if (!annullato) setModo("osm");
      });
    return () => {
      annullato = true;
      if (layer) map.removeLayer(layer);
    };
  }, [modo, map]);

  if (modo === "osm") {
    return <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />;
  }
  return null;
}
