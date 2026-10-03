# Stato del progetto Sconti Roma

Aggiornato: 03/10/2026 — ultimo commit in `main`: `3b765d3`

> Repository pubblico: qui mai password, chiavi, ID di recupero, email o nomi di persone reali.
> Solo nomi di variabili ed esiti delle verifiche.

## In produzione (unito in `main`)
| PR | Cosa | Data |
|---|---|---|
| #1–#7 | Migrazione da Emergent a Render + Atlas, zone pilota, QR, dashboard, Termini obbligatori | 29–30/09 |
| #8 | Test end-to-end, smoke di produzione, correzioni Face ID | 02/10 |
| #9 | Email: marchio "Sconti Roma" e prezzo "2,99 €" | 01/10 |
| #11 | "Sicurezza" dall'account (cambio PIN, Face ID su nuovo telefono), nessun campo riservato nelle risposte | 02/10 |
| #10 | Step 1 – fase di lancio: app gratuita per i clienti (`CLIENT_SUBSCRIPTION_REQUIRED=false`), residui Emergent rimossi, CSRF `enforce`, al commerciante solo "Mario R." | 02/10 |
| #12 | Blocco PIN dopo 5 tentativi anche senza PIN o account, riquadro chiaro nel login | 02/10 |
| #13 | Regole di lavoro (`CLAUDE.md`), questo file, smoke che aspetta il deploy | 03/10 |
| #14 | Avvisi di scadenza delle offerte, «Non rinnovo», riepilogo admin, mese all'ora di Roma | 03/10 |
| #15 | Home e locandina senza 2,99 €, domande frequenti riscritte, niente offerte in home | 03/10 |
| #16 | Solo le zone Garbatella, San Paolo, Marconi | 03/10 |
| #17 | Accesso: account in evidenza e «Cambia account» | 03/10 |
| #18 | PIN tolto ovunque: email e password (blocco 15 minuti dopo 5 errori) o Face ID facoltativo | 03/10 |
| #19 | Pagina offerta: pulsanti Chiama (blu) e WhatsApp (verde) uguali, tolto il «Consiglio furbo» | 03/10 |
| #20 | «1 sconto trovato» al singolare | 03/10 |
| #21 | Prezzo scontato < pieno, statistiche solo con consenso, modulo offerta che non si svuota | 03/10 |
| #22 | Pannello admin chiaro, stato vero dell'offerta, «Sospendi» funzionante | 03/10 |

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| #24 | Step 3: statistiche per i commercianti, «Fase di lancio» per l'admin, banner prova con TRIAL_END_DATE | controlli verdi |

## Decisioni prese
- Fase di lancio di circa 2 mesi: app gratuita per clienti e commercianti. Mai scrivere "gratis per sempre" né "nessuna commissione".
- Dopo la prova: commercianti 4,99 €/mese IVA inclusa, prezzo bloccato per i fondatori, preavviso di 30 giorni, nessun addebito senza conferma. Oggi nessun addebito (manca la P.IVA).
- Stripe e PayPal restano nel codice, spenti.
- Offerte: **niente rinnovo automatico**. Se il commerciante non carica l'offerta del mese dopo, il 1° del mese la sua offerta scade e va in archivio.
- Al commerciante, alla scansione: nome di battesimo e iniziale del cognome, ora, offerta, cliente nuovo / di ritorno. Nella lista "Ultimi codici" nessun nome.
- I dati dei clienti si conservano finché l'account è attivo; proposte commerciali future solo con consenso marketing.
- Unioni: le fa Claude quando tutti i controlli sono verdi (decisione dell'utente del 03/10).
- Avvisi di scadenza: date (25, 29, 31 e riepilogo admin il 28) e testi delle email approvati il 03/10.
- Render resta sul piano gratuito fino al lancio.
- Prezzo commercianti nelle domande frequenti (4,99 € al mese IVA inclusa dopo la fase di lancio): confermato.
- Video commercianti: niente abbonamento clienti; costi = gratis nella fase di lancio, poi 4,99 €/mese IVA inclusa, prezzo bloccato, avviso 30 giorni, nessun addebito senza conferma; «Nessun vincolo». Voce nuova (Fernando Martínez) sul copione del 03/10: bozza v9.
- Accesso: niente PIN (03/10). Email e password, blocco di 15 minuti dopo 5 errori, «Password dimenticata?»; Face ID facoltativo.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.

## Da fare, in ordine
1. PR legale/GDPR: correzioni di codice (statistiche solo con consenso, banner cookie, cancellazione ed esportazione complete, dichiarazione di età, "Mario R." solo al commerciante collegato) e testi evidenziati di Privacy, Cookie, Termini e Recesso per il consulente.
2. Archivio delle offerte con "Ripristina" (rifiutate, modificate, eliminate).
3. Step 2 – testi pubblici senza 2,99 €, email di benvenuto, avviso all'admin per ogni nuovo commerciante. **Solo dopo "parti con lo step 2".**
4. Step 3 – statistiche per i commercianti, richieste in attesa nel pannello admin, banner della prova (solo con `TRIAL_END_DATE` impostata).
5. Pulizia residui Emergent (vecchi test, `memory/PRD.md`, `.gitconfig`, pacchetti inutilizzati): prima il piano.

## Domande aperte
- Per l'utente:
  - frase "nessun vincolo" nel video (A o B);
  - clausola 5-bis dei Termini;
  - lentezza del server (correzione nel codice o piano Render a pagamento);
  - cancellazione dei branch già uniti.
- Per il consulente / commercialista:
  - identità del titolare del trattamento e P.IVA;
  - contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google;
  - Gemini su piano a pagamento;
  - testi legali.
