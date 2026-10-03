# Regole di lavoro per Claude su Sconti Roma

- Rispondi sempre in italiano.
- Unioni: le PR le unisce Claude (decisione dell'utente del 03/10), solo quando TUTTI i controlli sono verdi e i test passano; mai unire una PR rossa. Se una PR contiene testi legali o decisioni ancora aperte, aspetta l'OK dell'utente. Non annullare le unioni già fatte. Mai cancellare branch.
- Lavora sempre su un branch con una PR; mai push diretto su `main`.
- Ogni PR ha nella descrizione: **Cosa ho cambiato**, **Test eseguiti**, **Cosa provare da iPhone**, **Cosa devi decidere**. Aggiorna `docs/STATO.md` a ogni step.
- Nessun segreto (password, chiavi, ID di recupero) né dati di persone reali in commit, PR, log o output: il repository è pubblico.
- Non scrivere mai sul database di produzione; i test usano solo database locali.
- Privacy, Cookie, Termini e Recesso: solo modifiche proposte ed evidenziate in PR, da far vedere al consulente prima dell'unione.
- Stripe e PayPal restano nel codice ma spenti (`CLIENT_SUBSCRIPTION_REQUIRED=false`); nessun addebito ai commercianti senza loro conferma esplicita.
