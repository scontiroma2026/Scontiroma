---
name: pr-checklist
description: Controlla una PR di Sconti Roma prima dell'unione (sezioni, STATO.md, segreti, dati personali, test, controlli verdi, testi legali). Usala prima di unire o aprire una PR.
---
# Checklist PR
Verifica, in ordine:
1. Descrizione con le 4 sezioni: **Cosa ho cambiato**, **Test eseguiti**, **Cosa provare da iPhone**, **Cosa devi decidere**; chiusura con la riga di attribuzione Claude Code.
2. `docs/STATO.md` aggiornato.
3. Nessun segreto (password, chiavi, stringhe di collegamento, ID di recupero) né dati di persone reali nel diff: cerca `mongodb+srv`, `sk_`, `re_`, `Bearer`, email e telefoni reali.
4. Mai scrittura sul DB di produzione: i test usano `TEST_MONGO_URL=mongomock://x`; non chiamare `/api/q/{codice}` per prove.
5. Test nuovi aggiunti anche all'elenco in `.github/workflows/ci.yml`.
6. Se tocca Privacy/Cookie/Termini/Recesso o decisioni aperte: **non unire**, attendi l'OK del titolare.
7. Stripe/PayPal spenti, `CLIENT_SUBSCRIPTION_REQUIRED=false`, `MERCHANT_PAYMENT_REQUIRED` spento.
8. Nuovi dati nel browser/DB? Segnalali alla skill `legale-documenti` (cookie/informativa).
9. Controlli GitHub tutti verdi (Server FastAPI, Sito React, Test end-to-end). Solo allora si unisce; mai rossa. Mai cancellare branch, mai push su `main`.
Esito: elenco OK / DA CORREGGERE, in italiano.
