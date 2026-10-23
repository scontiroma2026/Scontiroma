#!/bin/bash
# Server di prova per le riprese v17 su porte proprie (API 8011, sito 3010), database in memoria, nessun segreto.
# Uso: PRIV=<cartella privata> VENV=<venv con le dipendenze del backend> BUILD=<cartella build del sito (frontend/build-e2e)> ./avvia_riprese.sh
R="$(cd "$(dirname "$0")" && pwd)"
cd "$BUILD/.." && npx --yes serve -s "$(basename "$BUILD")" -l 3010 --no-clipboard > "$PRIV/web.log" 2>&1 &
cd "$R"
export MONGO_URL=mongomock://localhost E2E_API_PORT=8011 E2E_WEB_URL=http://localhost:3010
"$VENV/bin/python" avvia_server_v17.py > "$PRIV/srv.log" 2>&1 &
for i in $(seq 1 40); do curl -s localhost:8011/api/ >/dev/null && break; sleep 2; done
"$VENV/bin/python" seed_v17.py
wait
