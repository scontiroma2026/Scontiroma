# Stato del progetto Sconti Roma

Aggiornato: 07/10/2026 — ultimo commit in `main`: `723f21a`

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
| #36 | QR della locandina verso la pagina del negozio con l'offerta del mese; negozio di provenienza ricordato 30 giorni; testi nuovi della locandina | 07/10 |
| #37 | Pulizia residui Emergent, parte 1: file e vecchi test; bozze dei messaggi per i commercianti | 07/10 |
| #26 | Testi legali aggiornati (Privacy, Termini, Recesso, Cookie): titolare Euro Linea S.r.l.s., niente abbonamento clienti, seconda casella per i commercianti, cookie e dati reali. **Pubblicati su ordine del titolare; il consulente deve ancora validarli** | 07/10 |

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| (questa) | Guida passo passo per l'ambiente di prova su Render (`docs/guide/AMBIENTE_DI_PROVA.md`) | controlli verdi; poi la crea il titolare |
| (questa) | App aperta a tutta Roma e dintorni: zone (quartieri, Ostia, Fiumicino, Castelli Romani), home e FAQ senza «tre quartieri» | controlli verdi |
| (questa) | Locandina: tolte le «pescherie» e frasi riscritte (categorie reali, testo più chiaro) | controlli verdi |
| (questa) | Caratteri ospitati sul nostro sito: niente più richieste a Google Fonts | controlli verdi |
| (questa) | Pulizia residui Emergent, parte 2: pacchetti inutilizzati nel server e nel sito | controlli verdi |
| (questa, `claude/da-fare-scadenza`) | Dashboard commerciante: scadenza reale nella pillola dell'offerta («fino al 31/10») e scheda «Da fare» con collegamenti | controlli verdi |
| (questa) | Tema chiaro «Bianco vivo» su tutta l'app (home, offerte, mappa, cliente, accesso, legali, banner, admin); la locandina stampabile resta com'è | controlli verdi, OK del titolare sull'aspetto |
| (branch `claude/area-commerciante-d`) | Area commerciante nella variante «D · Bianco vivo»: dashboard, offerta, archivio, scansione; fondo chiaro, Fraunces e Manrope, aree toccabili da 44 px, stati vuoto/caricamento/errore; nuovo test `20-area-commerciante` | PR da aprire, controlli verdi, OK del titolare sull'aspetto |
| (branch `claude/pagamenti-commercianti`) | Admin: scheda «Pagamenti», registro manuale dei pagamenti dei commercianti (stato piano, rinnovi a 30 giorni, scaduti, riepilogo del mese, annulla, CSV); nessun addebito, nessuna email | PR da aprire, controlli verdi |
| (branch `claude/foto-confronto-ia`) | Foto: la foto scattata/scelta entra subito nella galleria (prima serviva un tasto «Aggiungi» facile da dimenticare), ridotta a 1600 px in JPEG, messaggi chiari («Foto troppo grande», «Formato non supportato», HEIC), «Nessuna foto» al posto dell'immagine di cibo di default; «Migliora con IA» con confronto Originale/Migliorata e «Ripristina l'originale»; nuovo test `24-foto` | PR da aprire, controlli verdi |

## Decisioni prese
- Pagamenti commercianti (08/10): registro manuale, nessun addebito. L'admin annota i pagamenti incassati (bonifico, PayPal, contanti); nessuna email, nessuna sospensione automatica, il commerciante non vede cambiamenti. Da decidere: sospensione dopo la scadenza, promemoria, fatture.
- App aperta a tutta Roma e dintorni (08/10): iscrizione e filtri su tutte le zone; la ricerca di commercianti in background resta su Garbatella, San Paolo e Marconi. Video e messaggi da aggiornare dopo.
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
- Codice del negozio (opzione C): in pausa (07/10), da riconsiderare; se si fa, «Ricorda su questo telefono» vale al massimo 90 giorni.
- Messaggi ai commercianti (07/10): firmati «Sconti Roma», senza nomi di persone né prima persona singolare; bozze in docs/comunicazione/.
- Area commerciante (07/10): scelta la variante «D · Bianco vivo» (fondo chiaro, testi e pulsanti colorati, due soli caratteri: Fraunces e Manrope). Realizzata nel branch `claude/area-commerciante-d` (PR da aprire).
- Aspetto di tutta l'app (08/10): stessa palette chiara «Bianco vivo» ovunque (fondo bianco, testo #1A1530, accenti fucsia #D81B72, viola #6D4AFF, teal #00798C, verde #127A47), solo Fraunces e Manrope; la locandina stampabile non cambia. Il video promozionale mostra ancora l'app scura: schermate da rifare. Branch `claude/tema-chiaro-app`.
- Testi legali (07/10): titolare Euro Linea S.r.l.s.; i testi sono pubblicati ma il consulente deve ancora validarli (domande in docs/legale/PROPOSTE_TESTI_LEGALI.md). Sede legale e PEC da aggiungere.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.

## Da fare, in ordine
1. Testi legali: validazione del consulente; sede legale e PEC da inserire; "Mario R.": l'indirizzo `/api/qr/verify` è pubblico, da decidere se restringerlo.
2. Mappe Protomaps + LocationIQ. (Codice del negozio: in pausa.)
3. Area commerciante nella variante «D · Bianco vivo»: fatta nel branch, manca la PR e l'OK del titolare dopo averla vista da iPhone.
4. Pulizia Emergent: file e test (#37) e pacchetti (questa PR); resta da valutare `frontend/plugins/health-check`.

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
