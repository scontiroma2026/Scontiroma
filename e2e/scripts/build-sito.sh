#!/usr/bin/env bash
# Compila il sito per i test E2E in frontend/build-e2e, puntato al server LOCALE.
# Cartella separata da frontend/build: una build di produzione (api.scontiroma.it)
# non può finire per sbaglio nei test, e i test non scrivono mai in produzione.
set -euo pipefail
cd "$(dirname "$0")/../../frontend"
[ -d node_modules ] || yarn install --frozen-lockfile
REACT_APP_BACKEND_URL="${E2E_API_URL:-http://localhost:8001}" BUILD_PATH=build-e2e CI=false \
  GENERATE_SOURCEMAP=false yarn build
