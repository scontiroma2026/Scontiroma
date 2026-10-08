# Stato del progetto Sconti Roma

Aggiornato: 08/10/2026 — ultimo commit in `main`: `10a7457`

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
| #39 | Caratteri ospitati sul nostro sito (niente Google Fonts) | 07/10 |
| #42 | Area commerciante nella variante «Bianco vivo» | 08/10 |
| #43 | Locandina: tolte le «pescherie», frasi riscritte | 08/10 |
| #44 | Dashboard commerciante: scadenza nella pillola dell'offerta e scheda «Da fare» | 08/10 |
| #45 | App aperta a tutta Roma e dintorni (home e FAQ senza «tre quartieri») | 08/10 |
| #46 | Tema chiaro su tutta l'app | 08/10 |
| #47 | Admin: scheda «Pagamenti», registro manuale dei pagamenti dei commercianti (nessun addebito) | 08/10 |
| #48 | Guida per l'ambiente di prova su Render (`docs/guide/AMBIENTE_DI_PROVA.md`) | 08/10 |
| #49 | Zone: solo le 16 aree nel menu; «Da fare»: «Non adesso» per il Face ID | 08/10 |
| #50 | Bozza dell'offerta che non si perde; menu a tendina che si chiudono | 08/10 |
| #51 | Foto: entrano subito, errori chiari, confronto «Originale / Migliorata» con l'IA | 08/10 |
| #52 | Conteggio delle scansioni del QR (link corto `/q/<codice>`) | 08/10 |
| #53 | «Migliora foto con IA»: messaggio chiaro con la quota esaurita | 08/10 |
| #54 | Codice del negozio a 4 cifre al banco: il nome del cliente solo dopo il codice | 08/10 |
| #56 | Sfondi neutri: tolti i fondi rosa e lilla | 08/10 |
| #57 | Codice del negozio: permesso breve di 2 minuti se il QR scade mentre si scrive | 08/10 |

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| #40 | Sede legale del titolare (Via Tasso 5/B, Ariano Irpino) e ambito «Roma e dintorni» nei Termini | OK del titolare e del consulente; manca la PEC (facoltativa) |
| #59 | Admin: vede e rigenera il codice a 4 cifre di ogni negozio (tab «Negozi», solo con master password, mai in liste né log) | OK del titolare per l'unione |
| #41 | Kit per contattare i commercianti: messaggi WhatsApp, Instagram, Facebook, email, telefonata (`docs/commercianti/MESSAGGI.md`) | Il consulente deve vedere le regole d'uso e i testi |
| Video v13 (`claude/video-v13`) | Video per i commercianti con l'app nuova: riprese rifatte (tema chiaro, area «D», 16 zone, codice del negozio), «Roma e dintorni», senza «-50%» e senza «Nessun vincolo». Script e testi in `anteprima/video/progetto_v13`; i video stanno in `export/` (non nel repository) | Rifare in voce tre frasi (vedi `DIFFERENZE_v13.md`); scelta dell'utente su «nessun vincolo» |

Chiusa senza unire: #55 (palette calda corallo e miele), perché non è piaciuta.

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
- Locandina (07/10): sulla carta solo cose che non cambiano (nome del negozio e QR); l'offerta del mese si vede dalla pagina `/n/<id>` a cui porta il QR. Conteggio delle scansioni (opzione B): fatto (#52) (08/10).
- Codice del negozio (opzione C): approvato dal titolare l'08/10 e realizzato (#54; permesso breve di 2 minuti: #57); «Ricorda su questo telefono» vale al massimo 90 giorni.
- Messaggi ai commercianti (07/10): firmati «Sconti Roma», senza nomi di persone né prima persona singolare; bozze in docs/comunicazione/.
- Area commerciante (07/10): scelta la variante «D · Bianco vivo» (fondo chiaro, testi e pulsanti colorati, due soli caratteri: Fraunces e Manrope). Realizzata (#42).
- Aspetto di tutta l'app (08/10): stessa palette chiara «Bianco vivo» ovunque (fondo bianco, testo #1A1530, accenti fucsia #D81B72, viola #6D4AFF, teal #00798C, verde #127A47), solo Fraunces e Manrope; la locandina stampabile non cambia. Il video promozionale mostra ancora l'app scura: schermate da rifare. Branch `claude/tema-chiaro-app`.
- Testi legali (07/10): titolare Euro Linea S.r.l.s.; i testi sono pubblicati ma il consulente deve ancora validarli (domande in docs/legale/PROPOSTE_TESTI_LEGALI.md). Sede legale e PEC da aggiungere.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.
- Aspetto (08/10): palette chiara senza sfondi rosa né lilla (#56); restano gli accenti (fucsia, viola, teal). La palette calda è stata scartata (#55). Tre proposte di nuovo aspetto sul modello Groupon (Menta e corallo, Terracotta e sabbia, Cielo e sole) in attesa di scelta: caratteri più morbidi, ospitati da noi.
- Zone (08/10): il menu mostra solo 16 aree con titolo descrittivo (es. «Aurelio · Boccea, Primavalle, Casalotti») più «Fuori Roma»; il filtro riconosce anche i commercianti registrati con un quartiere.
- «Migliora foto con IA» (08/10): confronto «Originale / Migliorata», si sceglie quale tenere. Serve fatturazione sulla chiave Gemini (limite di spesa), altrimenti messaggio «ha raggiunto il limite».
- Codice del negozio (08/10): blocco di 15 minuti dopo 5 errori; permesso breve di 2 minuti approvato; l'admin lo vede e lo rigenera dal tab «Negozi» (#59, in attesa di OK).

## Da fare, in ordine
1. **Posta:** creare il Gmail nuovo, inoltro di `info@`, `privacy@`, `partner@` verso il Gmail (record MX su Aruba); poi `REPLY_TO_EMAIL` e `ADMIN_NOTIFY_EMAIL` su Render e prova di ricezione.
2. **Ambiente di prova su Render** (guida in `docs/guide/AMBIENTE_DI_PROVA.md`): servizi e database di prova, poi ramo `prova`.
3. **Testi legali:** validazione del consulente (domande in `docs/legale/PROPOSTE_TESTI_LEGALI.md`); sede legale in #40; PEC facoltativa; frasi proposte su nome visibile dopo il codice e sul contatore delle scansioni.
4. **Nuovo aspetto** in stile Groupon: scelta fra le tre proposte e realizzazione (caratteri ospitati da noi).
5. **Gemini:** collegare la fatturazione con limite di spesa, oppure tenere spento il miglioramento foto.
6. **Mappe** Protomaps + LocationIQ: serve la chiave LocationIQ (solo su Render) e il file di Roma da ospitare.
7. **Commercianti:** lista di 232 attività (66 con almeno un canale online): chiamate e visite sui tre quartieri; conferma di 4 email trovate su Facebook; copione di telefonata; messaggi da rifare con «Roma e dintorni» e l'app chiara, senza «-50%». Video: bozza v13 pronta (riprese nuove, sottotitoli aggiornati); da rifare in voce tre frasi (tre quartieri, «cinquanta per cento», «Nessun vincolo»).
8. **Pagamenti commercianti:** decisioni sospese (sospensione automatica, promemoria, fatture, primo pagamento in prova, prezzo bloccato) e `TRIAL_END_DATE`.
9. Pulizie: file di Archivo Black non più usati; `frontend/plugins/health-check` da valutare; righe vecchie; revoca di `EMERGENT_LLM_KEY` (non urgente); locandine già stampate con il QR vecchio da ristampare se esistono.
10. Foto del negozio nel profilo o passo foto all'iscrizione (da decidere); pagina «Per i commercianti» con il video.

## Domande aperte
- Per l'utente:
  - quale delle tre proposte di aspetto (1, 2 o 3);
  - #59: va bene che l'admin veda il codice del negozio (con «Rigenera»)?
  - la libreria di 100 immagini di esempio resta così?
  - frase «nessun vincolo» nel video; clausola 5-bis dei Termini;
  - mesi di prova e `TRIAL_END_DATE`;
  - Render: tenere sospese le copie `scontiroma-api` e `scontiroma-web` (poi eliminarle?).
- Per il consulente / commercialista:
  - P.IVA e dati dell'azienda (REA, capitale sociale) nei testi del sito;
  - contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google;
  - Gemini su piano a pagamento;
  - testi legali, regole d'uso dei messaggi ai commercianti, contatore aggregato delle scansioni.
