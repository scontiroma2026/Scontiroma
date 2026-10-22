# 12 - Procedura per i diritti degli interessati (artt. 12-22 GDPR)

> **Rischio: 🟢 basso: procedura di 1 mese; 🟠 solo la cancellazione dei negozi con offerta in corso, che slitta fino a un mese.**
> **[PROPOSTA] [DA VALIDARE]** - Documento interno. Risposta **entro 1 mese** dalla richiesta (prorogabile di 2 mesi se complessa, con avviso entro il primo mese).

## 1. Dove arrivano le richieste
- Email: privacy@scontiroma.it (anche info@ e partner@: chi le legge le gira subito).
- Dall'app: profilo > «Esporta i miei dati» (JSON, `GET /api/gdpr/export`) e «Elimina il mio account» (`DELETE /api/gdpr/delete-account`).
- PEC: [DA COMPLETARE].

## 2. Passi
1. **Registra** la richiesta (data, tipo, email). Il giorno di ricezione è il giorno 0.
2. **Verifica l'identità**: la richiesta deve arrivare dall'email dell'account. Se c'è dubbio, chiedi una conferma rispondendo a quell'email. **Non chiedere documenti d'identità** se non indispensabile. Mai dare dati a chi non è verificato.
3. **Esegui** secondo la tabella.
4. **Rispondi** in italiano semplice, gratis (salvo richieste manifestamente infondate o eccessive).
5. **Annota** l'esito nel registro (data risposta, cosa è stato fatto).

## 3. Tabella dei diritti
| Diritto | Cosa fare nell'app | Note |
|---|---|---|
| Accesso (15) / Portabilità (20) | `GET /api/gdpr/export`: profilo, offerte usate, scansioni, consensi, valutazioni, feedback, offerte del commerciante. Password e chiavi biometriche escluse | Il file è in JSON. L'IP del registro cookie è nel file |
| Rettifica (16) | L'utente modifica nome/profilo; per l'email chiedere ad admin | - |
| Cancellazione (17) | `DELETE /api/gdpr/delete-account` cancella `redemptions`, `qr_scans`, `consent_logs`, `reviews`, `app_feedback`, `webauthn_challenges`, `avvisi_preferiti`, offerte del commerciante, ecc.; **anonimizza** i dati contabili. Invia una email di conferma. **Non si può cancellare l'account admin** | Backup di Atlas: i dati restano fino alla scadenza del backup [DA COMPLETARE]. Statistiche con `sr_vid` non collegate all'account: non cancellabili per persona. **Negozi con offerta in corso:** eliminazione programmata dal 1° del mese dopo (abbonamento fermo subito, annullabile), quindi la cancellazione dei dati slitta fino a un mese: da segnalare al consulente (art. 12 GDPR, un mese) [DA VALIDARE] |
| Limitazione (18) | Sospendi l'account da admin mantenendo i dati; annota | Nessun pulsante: gestione manuale |
| Opposizione (21) | Per i trattamenti su legittimo interesse: valuta e rispondi; per i messaggi promozionali: opt-out immediato | - |
| Revoca consenso (7.3) | Cookie: «Gestisci cookie». Avvisi preferiti: «Non avvisarmi più». Promozioni: `POST /api/gdpr/marketing-consent?opt_in=false` | Effetto immediato |
| Non essere sottoposti a decisioni automatizzate (22) | Non applicabile: nessuna decisione automatizzata | - |
| Reclamo al Garante (77) | Indicalo sempre nella risposta | - |

## 3 bis. Strumento admin (PR #113, da validare)
La scheda admin **«Clienti»** permette l'**eliminazione definitiva** di un cliente per le richieste di cancellazione (art. 17), dopo la verifica dell'identità del punto 2. Annota l'esito nel registro. Per segnalazioni e reclami c'è l'area admin **«Segnalazioni»** (conferma in 5 giorni lavorativi, esito motivato).

## 4. Casi particolari
- **Commercianti:** la cancellazione toglie negozio, offerte, archivio, contatori; i dati contabili (e la fattura con la Partita IVA) restano per obbligo di legge, anonimizzati dall'account. Con un'offerta in corso la cancellazione parte dal 1° del mese dopo (verificare di restare nel mese dalla richiesta); senza offerta in corso è immediata. L'export include anche la Partita IVA.
- **Richiesta di un Cliente sul commerciante:** il Commerciante è titolare autonomo dei dati che vede; indicare a chi rivolgersi.
- **Richiesta da un terzo (genitori, avvocati):** rispondere solo con prova della delega.
- **Minorenni scoperti:** chiudere l'account e cancellare i dati.
- **Messaggio ricevuto da altri indirizzi:** non rispondere con dati; chiedere di scrivere dall'email dell'account.

## 5. Modelli di risposta
- *Conferma ricezione (entro 3 giorni lavorativi):* «Abbiamo ricevuto la tua richiesta del [data]. Ti rispondiamo entro un mese. Per sicurezza rispondici da questa email.»
- *Esito:* «Abbiamo [fatto X]. Se non sei soddisfatto puoi fare reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).»
- *Rifiuto motivato:* indica il motivo e il diritto di reclamo.

## 6. Registro delle richieste
| Data | Tipo | Verifica identità | Esito | Data risposta |
|---|---|---|---|---|
