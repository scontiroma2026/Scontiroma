#!/bin/bash
# Sito e server di prova per le riprese del tutorial, su porte proprie (API 8013, sito 3013), database in memoria, nessun segreto.
# Il sito si compila prima con:  E2E_API_URL=http://localhost:8013 bash e2e/scripts/build-sito.sh   (cartella frontend/build-e2e)
# Uso: OUT=<cartella privata> VENV=<venv con le dipendenze del backend> BUILD=<frontend/build-e2e> ./avvia_riprese.sh
R="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
cd "$BUILD/.." && npx --yes serve -s "$(basename "$BUILD")" -l 3013 --no-clipboard > "$OUT/web.log" 2>&1 &
cd "$R"
export MONGO_URL=mongomock://localhost E2E_API_PORT=8013 E2E_WEB_URL=http://localhost:3013
"$VENV/bin/python" avvia_server.py > "$OUT/srv.log" 2>&1 &
for i in $(seq 1 40); do curl -s localhost:8013/api/ >/dev/null && break; sleep 2; done
"$VENV/bin/python" seed_tutorial.py
echo "pronto: sito http://localhost:3013, API http://localhost:8013"
