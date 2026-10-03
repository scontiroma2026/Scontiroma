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

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| (questa) | Regole di lavoro (`CLAUDE.md`, blocco unioni), questo file, smoke che aspetta il deploy | unione dell'utente |

## Decisioni prese
- Fase di lancio di circa 2 mesi: app gratuita per clienti e commercianti. Mai scrivere "gratis per sempre" né "nessuna commissione".
- Dopo la prova: commercianti 4,99 €/mese IVA inclusa, prezzo bloccato per i fondatori, preavviso di 30 giorni, nessun addebito senza conferma. Oggi nessun addebito (manca la P.IVA).
- Stripe e PayPal restano nel codice, spenti.
- Offerte: **niente rinnovo automatico**. Se il commerciante non carica l'offerta del mese dopo, il 1° del mese la sua offerta scade e va in archivio.
- Al commerciante, alla scansione: nome di battesimo e iniziale del cognome, ora, offerta, cliente nuovo / di ritorno. Nella lista "Ultimi codici" nessun nome.
- I dati dei clienti si conservano finché l'account è attivo; proposte commerciali future solo con consenso marketing.
- Unioni: solo con "unisci la #N" scritto dall'utente.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.

## Da fare, in ordine
1. Avvisi di scadenza delle offerte: banner e tre email al commerciante, pulsante "Non rinnovo", riepilogo all'admin il 28, avviso di offerta scaduta il 1°. **Entro il 25/10.**
2. PR legale/GDPR: correzioni di codice (statistiche solo con consenso, banner cookie, cancellazione ed esportazione complete, dichiarazione di età, "Mario R." solo al commerciante collegato) e testi evidenziati di Privacy, Cookie, Termini e Recesso per il consulente.
3. Archivio delle offerte con "Ripristina" (rifiutate, modificate, eliminate).
4. Step 2 – testi pubblici senza 2,99 €, email di benvenuto, avviso all'admin per ogni nuovo commerciante. **Solo dopo "parti con lo step 2".**
5. Step 3 – statistiche per i commercianti, richieste in attesa nel pannello admin, banner della prova (solo con `TRIAL_END_DATE` impostata).
6. Pulizia residui Emergent (vecchi test, `memory/PRD.md`, `.gitconfig`, pacchetti inutilizzati): prima il piano.

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
