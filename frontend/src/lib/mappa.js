// Mappe con tile vettoriali Protomaps (file PMTiles di Roma ospitato da noi).
// Finché il file non c'è (o il server non supporta le richieste a intervalli) la mappa
// ripiega sui tile pubblici di OpenStreetMap: vedi MappaBase.jsx.
import { OSM_ATTRIBUTION } from "@/lib/osm";

// Percorso del file; si cambia con la variabile REACT_APP_MAP_PMTILES_URL (anche un indirizzo assoluto).
export const PMTILES_URL = process.env.REACT_APP_MAP_PMTILES_URL || "/mappe/roma.pmtiles";

// Il file contiene i tile fino a zoom 15; oltre, Protomaps ingrandisce quelli dello zoom 15.
export const PMTILES_MAX_DATA_ZOOM = 15;
export const MAPPA_MAX_ZOOM = 19;

// Licenza ODbL: «© OpenStreetMap contributors» sempre visibile; Protomaps citata (dati e stile).
export const PROTOMAPS_ATTRIBUTION =
  `${OSM_ATTRIBUTION} &middot; <a href="https://protomaps.com" target="_blank" rel="noopener noreferrer">Protomaps</a>`;

let _verifica = null;

/**
 * true solo se all'indirizzo c'è davvero un file PMTiles leggibile a intervalli.
 * Con un sito a pagina singola un file mancante risponde index.html con 200: per questo si
 * controllano la risposta 206 (richiesta a intervalli) e i primi byte («PMTiles»).
 * Il risultato è ricordato per tutta la sessione (una sola richiesta).
 */
export function pmtilesDisponibile(url = PMTILES_URL) {
  if (_verifica) return _verifica;
  _verifica = (async () => {
    try {
      const r = await fetch(url, { headers: { Range: "bytes=0-6" } });
      if (r.status !== 206) {
        if (r.body && r.body.cancel) r.body.cancel().catch(() => {});
        return false;
      }
      const byte = new Uint8Array(await r.arrayBuffer());
      return new TextDecoder().decode(byte.slice(0, 7)) === "PMTiles";
    } catch (e) {
      return false;
    }
  })();
  return _verifica;
}
