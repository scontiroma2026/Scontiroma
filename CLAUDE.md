# Regole di lavoro per Claude su Sconti Roma

- Rispondi sempre in italiano.
- Unioni: MAI unire una PR (merge, squash, rebase, auto-merge) senza un messaggio scritto dell'utente che contenga "unisci la #N" con il numero di QUELLA PR. Un OK generico o dato per altre PR non vale. Mai cancellare branch.
- Lavora sempre su un branch con una PR; mai push diretto su `main`.
- Ogni PR ha nella descrizione: **Cosa ho cambiato**, **Test eseguiti**, **Cosa provare da iPhone**, **Cosa devi decidere**. Aggiorna `docs/STATO.md` a ogni step.
- Nessun segreto (password, chiavi, ID di recupero) né dati di persone reali in commit, PR, log o output: il repository è pubblico.
- Non scrivere mai sul database di produzione; i test usano solo database locali.
- Privacy, Cookie, Termini e Recesso: solo modifiche proposte ed evidenziate in PR, da far vedere al consulente prima dell'unione.
- Stripe e PayPal restano nel codice ma spenti (`CLIENT_SUBSCRIPTION_REQUIRED=false`); nessun addebito ai commercianti senza loro conferma esplicita.
