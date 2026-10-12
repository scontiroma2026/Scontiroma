#!/usr/bin/env bash
# Estrae da una build pubblica di Protomaps il file di Roma e dintorni (PMTiles) e lo mette in
# frontend/public/mappe/roma.pmtiles, da dove il sito lo serve.
#
# Serve una rete che raggiunga build.protomaps.com (e, se manca la CLI, github.com).
# Si lancia dal proprio computer:   bash scripts/estrai_mappa_roma.sh
#
# Si può cambiare con variabili d'ambiente:
#   BBOX      lon_min,lat_min,lon_max,lat_max   (predefinito: Roma e dintorni, 11.9,41.4,13.1,42.2)
#   MAXZOOM   zoom massimo dei tile              (predefinito: 15)
#   SORGENTE  indirizzo di una build .pmtiles    (predefinito: l'ultima build giornaliera di build.protomaps.com)
#   USCITA    file di destinazione               (predefinito: frontend/public/mappe/roma.pmtiles)
#   PMTILES   percorso della CLI pmtiles         (predefinito: quella nel PATH, o scaricata in .strumenti/)
#   PMTILES_VERSIONE  versione della CLI da scaricare (predefinito: 1.30.1)
#
# Guida passo passo: docs/guide/MAPPE.md
set -euo pipefail

RADICE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BBOX="${BBOX:-11.9,41.4,13.1,42.2}"
MAXZOOM="${MAXZOOM:-15}"
USCITA="${USCITA:-$RADICE/frontend/public/mappe/roma.pmtiles}"
PMTILES_VERSIONE="${PMTILES_VERSIONE:-1.30.1}"
LIMITE_MB_GIT=90   # GitHub rifiuta i file sopra i 100 MB

# 1) La CLI pmtiles
CLI="${PMTILES:-}"
if [ -z "$CLI" ] && command -v pmtiles >/dev/null 2>&1; then CLI="$(command -v pmtiles)"; fi
if [ -z "$CLI" ]; then
  CLI="$RADICE/.strumenti/pmtiles"
  if [ ! -x "$CLI" ]; then
    case "$(uname -s)-$(uname -m)" in
      Linux-x86_64)  PIATTAFORMA="Linux_x86_64" ;;
      Linux-aarch64) PIATTAFORMA="Linux_arm64" ;;
      Darwin-arm64)  PIATTAFORMA="Darwin_arm64" ;;
      Darwin-x86_64) PIATTAFORMA="Darwin_x86_64" ;;
      *) echo "Sistema non riconosciuto: installa la CLI da https://github.com/protomaps/go-pmtiles/releases e rilancia con PMTILES=/percorso/pmtiles" >&2; exit 1 ;;
    esac
    echo "Scarico la CLI pmtiles $PMTILES_VERSIONE ($PIATTAFORMA)..."
    mkdir -p "$RADICE/.strumenti"
    TMP="$(mktemp -d)"
    BASE="https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VERSIONE}/go-pmtiles_${PMTILES_VERSIONE}_${PIATTAFORMA}"
    if curl -fL --retry 3 -o "$TMP/pmtiles.tar.gz" "$BASE.tar.gz"; then
      tar -xzf "$TMP/pmtiles.tar.gz" -C "$TMP" pmtiles
    else  # alcune piattaforme (macOS) hanno il pacchetto .zip
      curl -fL --retry 3 -o "$TMP/pmtiles.zip" "$BASE.zip"
      unzip -o -q "$TMP/pmtiles.zip" pmtiles -d "$TMP"
    fi
    mv "$TMP/pmtiles" "$CLI"
    chmod +x "$CLI"
    rm -rf "$TMP"
  fi
fi
echo "CLI: $("$CLI" version 2>&1 | head -1)"

# 2) La build di partenza: la più recente tra quelle degli ultimi 10 giorni
SORGENTE="${SORGENTE:-}"
if [ -z "$SORGENTE" ]; then
  for GIORNI_FA in 1 2 3 4 5 6 7 8 9 10; do
    DATA="$(date -u -d "-$GIORNI_FA day" +%Y%m%d 2>/dev/null || date -u -v-"${GIORNI_FA}"d +%Y%m%d)"
    URL="https://build.protomaps.com/${DATA}.pmtiles"
    if curl -fsI --max-time 20 "$URL" >/dev/null 2>&1; then SORGENTE="$URL"; break; fi
  done
  [ -n "$SORGENTE" ] || { echo "Nessuna build trovata su build.protomaps.com: controlla la rete (o passa SORGENTE=...)." >&2; exit 1; }
fi
echo "Sorgente: $SORGENTE"
echo "Area (lon_min,lat_min,lon_max,lat_max): $BBOX  -  zoom fino a $MAXZOOM"

# 3) Estrazione (scarica solo i tile dell'area richiesta, non tutto il pianeta)
mkdir -p "$(dirname "$USCITA")"
rm -f "$USCITA.tmp"
"$CLI" extract "$SORGENTE" "$USCITA.tmp" --bbox="$BBOX" --maxzoom="$MAXZOOM"
mv "$USCITA.tmp" "$USCITA"

# 4) Controlli: intestazione valida e dimensione
"$CLI" show "$USCITA" | head -20
BYTE="$(wc -c < "$USCITA" | tr -d ' ')"
MB=$(( (BYTE + 1048575) / 1048576 ))
echo
echo "Fatto: $USCITA  ($MB MB)"
if [ "$MB" -gt "$LIMITE_MB_GIT" ]; then
  echo "ATTENZIONE: il file supera $LIMITE_MB_GIT MB e GitHub non lo accetta nel repository." >&2
  echo "  Opzioni: abbassare MAXZOOM (es. MAXZOOM=14), restringere BBOX, oppure ospitarlo altrove" >&2
  echo "  e impostare REACT_APP_MAP_PMTILES_URL (vedi docs/guide/MAPPE.md)." >&2
fi
