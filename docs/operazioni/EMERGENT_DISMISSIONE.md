# Emergent (progetto dormiente): come archiviarlo o eliminarlo in sicurezza

Ultimo aggiornamento: 14/10/2026. **Questa pagina descrive i passi: nessuno è stato eseguito.** Non è stato né messo in pausa né archiviato né cancellato nulla, e nessun messaggio è stato mandato ai progetti.

## 1. Cosa so (e cosa no)
- Sconti Roma è nata su Emergent e è stata poi migrata su Render + MongoDB Atlas (`MIGRAZIONE.md`). Il sito vero oggi gira su Render.
- **Nel codice non c'è nessun uso di Emergent**: nessuna variabile `EMERGENT_LLM_KEY`, nessun servizio Emergent in `render.yaml`, nella CI o nei file di configurazione; restano solo parole nella guida storica `MIGRAZIONE.md`, in `STATO.md` e nella lista di lancio (controllato con una ricerca in tutto il repository il 14/10). La chiave non è su Render né nel repository (la lista di lancio lo conferma: voce «revocare `EMERGENT_LLM_KEY`»).
- Dal conto Emergent collegato risultano **3 progetti** (sola lettura, 14/10): `deal-bundle`, `roman-builder-1`, `wholesale-dist`. **Non so quale di questi era Sconti Roma né se contengano dati di persone**: da guardare dal titolare con calma. Nessuno è stato aperto.
- Non posso leggere da qui piano, crediti, rinnovi, né se il dominio è ancora collegato.

## 2. Rischi da evitare
1. **Chiave attiva dimenticata:** una chiave universale spende crediti del conto ed è un segreto: va revocata, non solo "non usata".
2. **Dati rimasti:** un vecchio database di prova può contenere account o email: se ci sono dati di persone vanno cancellati, non solo "dimenticati".
3. **Cancellare troppo presto:** se qualcosa dipendesse ancora dal progetto vecchio (dominio, immagini, email), il sito si romperebbe.
4. **Cancellare la sola fonte:** il codice è su GitHub, ma le foto o i file caricati nel vecchio progetto potrebbero esistere solo lì.

## 3. Passi in ordine (li fa il titolare dal proprio conto Emergent; Claude può guidare passo passo)

### Fase A: controlli (nessuna modifica)
1. Aprire l'elenco dei progetti e, per ciascuno, annotare **titolo, data, stato** (in esecuzione / in pausa / archiviato). Riconoscere quale era Sconti Roma.
2. In Aruba → Gestione DNS di `scontiroma.it`: verificare che **nessun record punti a Emergent** (il sito vero punta a Render). Se ne vedi uno, non toccarlo: scrivi a Claude cosa vedi.
3. In Render → server `-xqib` → Environment: verificare **a occhio** che non ci sia nessuna variabile di Emergent (nomi con `EMERGENT`). Il repository è già pulito.
4. Nel progetto Emergent vecchio guardare se c'è un database con dati: se sì, anche solo di prova, annotare **quanti** (non copiare i contenuti in chat).
5. Salvare, se servono, **file e foto** caricati solo lì (scaricarli sul telefono o nel Drive privato). Il codice sta già su GitHub.

### Fase B: spegnere i rischi (reversibile)
6. **Rigenerare o eliminare la `EMERGENT_LLM_KEY`** nelle impostazioni di profilo/chiavi del conto Emergent (il nome della voce può cambiare: cerca «Universal Key» o «API keys»). Non incollarla mai in chat, PR o file. Prima di eliminarla, verifica da Render che nessuna variabile ne contenga una copia (punto 3).
7. Controllare **piano, crediti e rinnovo automatico**: spegnere i ricarichi automatici e le sottoscrizioni se non servono più; annotare la data nel calendario.
8. **Mettere in pausa** i progetti in esecuzione (non cancellarli ancora).
9. Dopo il punto 6, **verificare che sito e app funzionino** (apri il sito e fai una scansione di controllo sul sito di prova, non sul vero; controllo giornaliero dell'indomani). Non dovrebbe cambiare nulla.

### Fase C: archiviare, e dopo un periodo cancellare
10. **Archiviare** il progetto vecchio di Sconti Roma (se Emergent lo prevede) e aspettare **30 giorni** con il sito che funziona.
11. Se nel progetto c'erano dati di persone: **eliminare il database o il progetto** (con data nel registro dei trattamenti: la cancellazione di dati deve poter essere dimostrata al consulente).
12. **Eliminare** gli altri progetti `deal-bundle` e `wholesale-dist` solo se sai che non servono: sono di altri lavori, non di Sconti Roma, a quanto pare.
13. Opzionale: **chiudere l'account Emergent** se non serve più, dopo aver esportato fatture e ricevute (conservazione fiscale).
14. Aggiornare `STATO.md` (una riga) e spuntare la voce «revocare `EMERGENT_LLM_KEY`» nella lista di lancio.

## 4. Cosa **non** fare
- Non cancellare prima di aver revocato la chiave e controllato DNS e Render.
- Non scrivere la chiave né il suo inizio in chat, commit, PR o log.
- Non riattivare un progetto Emergent per "provare" qualcosa: crea crediti e dati nuovi.

## 5. Cosa deve decidere il titolare
- Quale dei tre progetti era Sconti Roma, e se tenerne una copia dei file.
- Eliminare subito dopo la revoca, oppure archiviare 30 giorni (consiglio: 30 giorni).
- Se chiudere del tutto l'account Emergent.
