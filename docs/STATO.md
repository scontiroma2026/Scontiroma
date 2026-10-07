# Stato del progetto Sconti Roma

Aggiornato: 07/10/2026 — ultimo commit in `main`: `9547257`

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
| #24 | Step 3: statistiche per i commercianti, «Fase di lancio» per l'admin, banner prova (solo con `TRIAL_END_DATE`) | 03/10 |
| #25 | GDPR: cancellazione ed esportazione complete, ricerca indirizzi 1 richiesta/s, attribuzione OpenStreetMap | 03/10 |
| #28 | Messaggio WhatsApp per prenotare senza «abbonamento» | 04/10 |
| #27 | Indirizzo: il civico scritto non si perde, suggerimenti su due righe | 04/10 |
| #29 | «Condividi con un amico» con anteprima del link; titolo del sito senza 2,99 € | 07/10 |
| #30 | Orari del negozio scritti dal commerciante, «Aperto ora» sull'offerta | 07/10 |
| #31 | Negozi preferiti: cuore, vista «Preferiti», avviso via email solo con consenso | 07/10 |
| #32 | Archivio delle offerte con «Riusa» / «Correggi e riusa» | 07/10 |
| #23 | Step 2: email di benvenuto, avvisi all'admin, testi pubblici senza «abbonati» (anche «migliaia di romani» e «abbonati a Roma» tolti) | 07/10 |
| #33 | Home senza «A metà prezzo»; posizione chiesta solo col pulsante su sconti e mappa | 07/10 |
| #34 | Titoli in Fraunces su tutti i telefoni; stelle dopo 3 minuti, mai sulla scansione; «Usa un altro account» affidabile | 07/10 |
| #35 | La scelta sui cookie scade dopo 6 mesi, come scritto nella Cookie Policy | 07/10 |

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| (questa) | QR della locandina verso la pagina del negozio con l'offerta del mese; negozio di provenienza ricordato 30 giorni; testi nuovi della locandina | controlli verdi |
| #26 | Proposte di testi legali per Privacy, Termini, Recesso, Cookie | OK dell'utente e del consulente |

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
- Nuove funzioni approvate il 04/10: negozi preferiti (avviso via email solo con consenso), «Condividi con un amico», orari scritti dal commerciante, archivio delle offerte con «Riusa». Ordine: condividi, orari, preferiti, archivio.
- «Telefoni della cassa» scartato (04/10): la convalida resta veloce per tutti i dipendenti. Scelta l'opzione C (vedi sotto).
- Convalida dello sconto (04/10): **opzione C**, codice del negozio a 4 cifre (uno per negozio, visibile al titolare e all'admin, «Ricorda su questo telefono», «Cambia codice»). In coda dopo orari, preferiti, archivio.
- Mappe (04/10): Protomaps ospitata da noi + LocationIQ per gli indirizzi, senza carta di credito.
- Fase pilota (07/10): nessuna promessa di numeri (utenti, «migliaia») né di sconti del 50% ovunque; la posizione si chiede solo quando il cliente tocca «Usa la mia posizione».
- Commercianti (07/10): 5 macro aree (Mangiare e bere, Bellezza e benessere, Sport e tempo libero, Negozi, Servizi); niente SMS o WhatsApp in serie senza consenso.
- Locandina (07/10): sulla carta solo cose che non cambiano (nome del negozio e QR); l'offerta del mese si vede dalla pagina `/n/<id>` a cui porta il QR. Conteggio delle scansioni (opzione B) in coda.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.

## Da fare, in ordine
1. PR legale/GDPR: codice unito (#25); testi evidenziati di Privacy, Cookie, Termini, Recesso e dichiarazione di età nella #26 per il consulente. Resta: "Mario R." solo al commerciante collegato (`/api/qr/verify` pubblico), in attesa della tua decisione.
2. Codice del negozio per convalidare gli sconti (opzione C), poi mappe Protomaps + LocationIQ.
3. Area commerciante più sobria e professionale, mantenendo il carattere del marchio: prima una bozza da approvare.
4. Pulizia residui Emergent (vecchi test, `memory/PRD.md`, `.gitconfig`, pacchetti inutilizzati): prima il piano.

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
