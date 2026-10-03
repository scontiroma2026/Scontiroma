#!/usr/bin/env bash
# Aspetta che Render abbia pubblicato il commit appena unito in main, prima dello smoke.
# Uso: aspetta-deploy.sh <sha> <sha-precedente>
# Render ridistribuisce un servizio solo se cambiano i file della sua cartella (rootDir):
# si aspetta quindi il server solo se è cambiato backend/, il sito solo se è cambiato frontend/.
set -euo pipefail
SHA="$1"; PRIMA="${2:-}"
API="${PROD_API_URL:-https://api.scontiroma.it}"
WEB="${PROD_WEB_URL:-https://scontiroma.it}"
MAX_SECONDI="${ATTESA_MAX_SECONDI:-900}"
CORTO="${SHA:0:7}"

cambiati=""
if [ -n "$PRIMA" ] && git cat-file -e "$PRIMA" 2>/dev/null; then
  cambiati="$(git diff --name-only "$PRIMA" "$SHA")"
else
  cambiati="backend/ frontend/"   # storia non disponibile: aspetta entrambi
fi
aspetta_api=false; aspetta_web=false
grep -q '^backend/' <<<"$cambiati" && aspetta_api=true || true
grep -q '^frontend/' <<<"$cambiati" && aspetta_web=true || true
[ "$cambiati" = "backend/ frontend/" ] && aspetta_api=true && aspetta_web=true
echo "Commit $CORTO — aspetto server: $aspetta_api, sito: $aspetta_web"

versione_api() { curl -fsS --max-time 30 "$API/api/" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("version",""))' 2>/dev/null || true; }
versione_web() { curl -fsS --max-time 30 "$WEB/" | grep -o 'name="sr-version" content="[^"]*"' | sed 's/.*content="//; s/"$//' || true; }

inizio=$(date +%s)
while true; do
  ok=true
  if $aspetta_api; then
    v="$(versione_api)"
    if [ "$v" = "dev" ]; then
      echo "::warning::il server non conosce il proprio commit (RENDER_GIT_COMMIT assente): non posso aspettarne il deploy"; aspetta_api=false
    elif [ "$v" != "$CORTO" ]; then ok=false; echo "  server: '$v' (attendo $CORTO)"; fi
  fi
  if $aspetta_web; then
    v="$(versione_web)"
    if [ "$v" = "%REACT_APP_VERSION%" ] || { [ -z "$v" ] && curl -fsS --max-time 30 "$WEB/" | grep -q 'name="sr-version" content=""'; }; then
      echo "::warning::il sito non riporta il proprio commit (REACT_APP_VERSION assente in build): non posso aspettarne il deploy"; aspetta_web=false
    elif [ "${v:0:7}" != "$CORTO" ]; then ok=false; echo "  sito: '${v:0:7}' (attendo $CORTO)"; fi
  fi
  $ok && { echo "Deploy di $CORTO pubblicato: parto con lo smoke."; exit 0; }
  if [ $(( $(date +%s) - inizio )) -ge "$MAX_SECONDI" ]; then
    echo "::error::Render non ha pubblicato il commit $CORTO entro $((MAX_SECONDI/60)) minuti: controlla Events su Render (scontiroma-api / scontiroma-web). Non è un errore dell'app."
    exit 1
  fi
  sleep 20
done
