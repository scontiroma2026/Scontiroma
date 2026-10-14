#!/usr/bin/env bash
# Rifà il video V4 «solo mani» da zero: sito compilato in locale, server con database finto in memoria (mongomock),
# riprese dell'app con il dito animato, scene illustrate, montaggio e controlli. Nessun database vero, nessun servizio a pagamento.
# Uso (dalla radice del repository):  bash anteprima/video/progetto_v4_mani/rifai.sh [cartella_uscita_mp4]
# Prerequisiti: node (con playwright globale in /opt/node22/lib/node_modules), python3 con fastapi/uvicorn/mongomock-motor/httpx/Pillow, ffmpeg.
# Se frontend/node_modules manca, collegalo a un'altra copia del repository che abbia protomaps-leaflet (ln -s <altra>/frontend/node_modules frontend/node_modules).
set -euo pipefail
RADICE="$(cd "$(dirname "$0")/../../.." && pwd)"
P="$RADICE/anteprima/video/progetto_v4_mani"
USCITA="${1:-$P/montaggio/export}"
API_PORT=8021; WEB_PORT=3020          # porte proprie: 8001/3000 possono essere occupate

# 1) sito compilato in locale, puntato al server locale
E2E_API_URL="http://localhost:$API_PORT" bash "$RADICE/e2e/scripts/build-sito.sh"
# 2) foto di esempio per la home (offline) dalla libreria del sito
mkdir -p "$P/riprese/foto"
cp "$RADICE/frontend/public/esempi/1444459094717-a39f1e3e0903.jpg" "$P/riprese/foto/via.jpg"
cp "$RADICE/frontend/public/esempi/1481931098730-318b6f776db0.jpg" "$P/riprese/foto/roma_card.jpg"
# 3) server finto (database in memoria) e sito statico
( cd "$RADICE" && MONGO_URL=mongomock://localhost E2E_API_PORT=$API_PORT E2E_WEB_URL="http://localhost:$WEB_PORT" python3 "$P/riprese/avvia_server.py" > /tmp/v4_api.log 2>&1 ) &
PID_API=$!
( cd "$RADICE" && node /opt/node22/lib/node_modules/serve/build/main.js -s frontend/build-e2e -l $WEB_PORT > /tmp/v4_web.log 2>&1 ) &
PID_WEB=$!
trap 'kill $PID_API $PID_WEB 2>/dev/null || true; pkill -P $PID_API 2>/dev/null || true; pkill -P $PID_WEB 2>/dev/null || true' EXIT
for i in $(seq 1 40); do curl -sf "http://localhost:$API_PORT/api/config/public" >/dev/null && break; sleep 1; done
# 4) dati inventati, riprese (il controllo automatico fallisce se compare un prezzo, una percentuale, una zona o «quartiere»)
python3 "$P/riprese/seed.py"
( cd "$P/riprese" && node rec_clip.js tutte )
# 5) grafiche, scene illustrate, montaggio, controlli
( cd "$P/montaggio" && node grafica.js && python3 monta.py && bash controlli.sh export "$USCITA/fogli" )
echo "Fatto: MP4 in $P/montaggio/export (fogli di controllo in $USCITA/fogli)"
