#!/bin/bash
# Prepara le sessioni Claude Code sul web: dipendenze del server e del sito già pronte per test e controlli.
# Solo installazioni locali dei pacchetti già elencati nel progetto: nessun segreto, nessuna scrittura
# sul database di produzione. Imposta TEST_MONGO_URL=mongomock://x (database finto dei test).
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
pip install -q -r backend/requirements.txt pytest mongomock mongomock-motor >/dev/null 2>&1 || true
if [ ! -d frontend/node_modules ]; then
  (cd frontend && npm install --no-audit --no-fund --silent >/dev/null 2>&1) || true
fi
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export TEST_MONGO_URL=mongomock://x' >> "$CLAUDE_ENV_FILE"
fi
exit 0
