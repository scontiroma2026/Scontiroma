# Stato del progetto Sconti Roma

Aggiornato: 08/10/2026 — ultimo commit in `main`: `fe9f1d6` (unione della #64)

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
| #59 | Admin: vede e rigenera il codice a 4 cifre di ogni negozio (tab «Negozi», solo con master password, mai in liste né log); OK del titolare 08/10 | 08/10 |
| #61 | Libreria foto di esempio da 100 a 422, **copiate sul nostro sito** (`frontend/public/esempi`, circa 26 MB, licenza Unsplash in `LICENZA.txt`), miniature 400×225 nel catalogo «Esempi»; gli sconti già salvati con indirizzi Unsplash continuano a funzionare | 08/10 |
| #65 | Pulizie tecniche: tolti Archivo Black e il plugin `health-check`, STATO riordinato | 08/10 |
| #67 | Mappe Protomaps (ripiego OpenStreetMap finché manca `roma.pmtiles`) e indirizzi con LocationIQ (se c'è `LOCATIONIQ_API_KEY`); guida `docs/guide/MAPPE.md` | 08/10 |
| #66 | Pagina «Per i commercianti» (`/per-i-commercianti`) e copione della telefonata (`docs/comunicazione/COPIONE_TELEFONATA.md`) | 08/10 |
| #68 | Admin: nome e cognome completi dei clienti nel Registro Frodi e in Feedback App (solo admin con master password; commercianti vedono «Nome C.») | 08/10 |
| #69 | Zona senza offerte: scheda «Stiamo arrivando nella tua zona» con «Vedi le offerte nelle altre zone» e «Fammi sapere quando arrivate» (contatore anonimo per zona nella collezione `interesse_zona`, un voto per zona e per browser, limite di 10 richieste/ora per IP, nessun dato personale); tabella «Interesse per zona» nel tab «Fase di lancio» dell'admin. Ramo `claude/stiamo-arrivando` | 09/10 |
| #70 | Admin, «Stato dei servizi»: nuova riga «Indirizzi (LocationIQ)» (giallo senza chiave, verde se risponde, rosso se rifiutata) | 09/10 |

## PR aperte
| PR | Cosa | Aspetta |
|---|---|---|
| #40 | Sede legale del titolare (Via Tasso 5/B, Ariano Irpino) e ambito «Roma e dintorni» nei Termini | OK del titolare e del consulente; manca la PEC (facoltativa) |
| #41 | Kit per contattare i commercianti: messaggi WhatsApp, Instagram, Facebook, email, telefonata (`docs/commercianti/MESSAGGI.md`) | Il consulente deve vedere le regole d'uso e i testi |
| #71 | Server Health: con chiave Resend «solo invio» la riga Email non è più rossa («HTTP 401») ma verde con la nota «chiave solo invio»; chiave non valida resta rossa «chiave rifiutata». Ramo `claude/health-resend-solo-invio` | Controllo da iPhone; nessun testo legale |
| #73 | Ambiente di prova: variabile facoltativa `EMAIL_ALLOWED_RECIPIENTS` (indirizzi o `@dominio`): se impostata le email partono solo verso quelli, gli altri sono scartati con riga `[email:bloccata-prova]` (solo dominio). Non impostata = produzione invariata. Guida: sezione «Email nell'ambiente di prova». Ramo `claude/email-prova-allowlist` | 09/10 (in attesa di unione) |

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
- Unioni: le fa Claude quando tutti i controlli sono verdi e i test passano; testi legali o decisioni aperte aspettano l'OK dell'utente (decisione del 03/10).
- Avvisi di scadenza: date (25, 29, 31 e riepilogo admin il 28) e testi delle email approvati il 03/10.
- Render resta sul piano gratuito fino al lancio.
- Prezzo commercianti nelle domande frequenti (4,99 € al mese IVA inclusa dopo la fase di lancio): confermato.
- Video commercianti: niente abbonamento clienti; costi = gratis nella fase di lancio, poi 4,99 €/mese IVA inclusa, prezzo bloccato, avviso 30 giorni, nessun addebito senza conferma; «Nessun vincolo». Voce nuova (Fernando Martínez) sul copione del 03/10: bozza v9.
- Accesso: niente PIN (03/10). Email e password, blocco di 15 minuti dopo 5 errori, «Password dimenticata?»; Face ID facoltativo.
- Nuove funzioni approvate il 04/10: negozi preferiti (avviso via email solo con consenso), «Condividi con un amico», orari scritti dal commerciante, archivio delle offerte con «Riusa». Ordine: condividi, orari, preferiti, archivio.
- «Telefoni della cassa» scartato (04/10): la convalida resta veloce per tutti i dipendenti. Scelta l'opzione C (vedi sotto).
- Convalida dello sconto (04/10): **opzione C**, codice del negozio a 4 cifre (uno per negozio, visibile al titolare e all'admin, «Ricorda su questo telefono», «Cambia codice»). In coda dopo orari, preferiti, archivio.
- Mappe (04/10): Protomaps ospitata da noi + LocationIQ per gli indirizzi, senza carta di credito. Realizzato (08/10): `protomaps-leaflet` sopra Leaflet (pin e popup invariati), codice di Protomaps caricato solo all'apertura di una mappa; attribuzione «© OpenStreetMap contributors · Protomaps»; LocationIQ attivo solo con `LOCATIONIQ_API_KEY`, altrimenti Nominatim, e Nominatim anche come ripiego se LocationIQ rifiuta o è al limite.
- Fase pilota (07/10): nessuna promessa di numeri (utenti, «migliaia») né di sconti del 50% ovunque; la posizione si chiede solo quando il cliente tocca «Usa la mia posizione».
- Commercianti (07/10): 5 macro aree (Mangiare e bere, Bellezza e benessere, Sport e tempo libero, Negozi, Servizi); niente SMS o WhatsApp in serie senza consenso.
- Locandina (07/10): sulla carta solo cose che non cambiano (nome del negozio e QR); l'offerta del mese si vede dalla pagina `/n/<id>` a cui porta il QR. Conteggio delle scansioni (opzione B): fatto (#52) (08/10).
- Codice del negozio (opzione C): approvato dal titolare l'08/10 e realizzato (#54; permesso breve di 2 minuti: #57); «Ricorda su questo telefono» vale al massimo 90 giorni; blocco di 15 minuti dopo 5 errori; l'admin lo vede e lo rigenera dal tab «Negozi» (#59).
- Messaggi ai commercianti (07/10): firmati «Sconti Roma», senza nomi di persone né prima persona singolare; bozze in docs/comunicazione/.
- Area commerciante (07/10): scelta la variante «D · Bianco vivo» (fondo chiaro, testi e pulsanti colorati, due soli caratteri: Fraunces e Manrope). Realizzata (#42).
- Aspetto di tutta l'app (08/10): stessa palette chiara «Bianco vivo» ovunque (fondo bianco, testo #1A1530, accenti fucsia #D81B72, viola #6D4AFF, teal #00798C, verde #127A47), solo Fraunces e Manrope; la locandina stampabile non cambia. Il video promozionale mostra ancora l'app scura: schermate da rifare (app realizzata in #46).
- Testi legali (07/10): titolare Euro Linea S.r.l.s.; i testi sono pubblicati ma il consulente deve ancora validarli (domande in docs/legale/PROPOSTE_TESTI_LEGALI.md). Sede legale e PEC da aggiungere.
- Variabili verificate dall'utente su Render: `ADMIN_PASSWORD` ≥ 12 caratteri, `ADMIN_EMAIL` impostata.
- Aspetto (08/10): palette chiara senza sfondi rosa né lilla (#56); palette calda scartata (#55). Tre proposte sul modello Groupon (Menta e corallo, Terracotta e sabbia, Cielo e sole) in attesa di scelta: caratteri più morbidi, ospitati da noi.
- Zone (08/10): il menu mostra solo 16 aree con titolo descrittivo (es. «Aurelio · Boccea, Primavalle, Casalotti») più «Fuori Roma»; il filtro riconosce anche i commercianti registrati con un quartiere.
- «Migliora foto con IA» (08/10): confronto «Originale / Migliorata», si sceglie quale tenere. Serve fatturazione sulla chiave Gemini (limite di spesa), altrimenti messaggio «ha raggiunto il limite».
- Libreria di esempio (08/10): decisione del titolare: bastano 422 foto in 10 categorie, **copiate sul nostro sito** (non più collegate a Unsplash). Sono in `frontend/public/esempi/` (800×450) e `esempi/mini/` (400×225), nome = identificativo Unsplash, JPEG ricompressi, circa 26 MB in tutto; licenza Unsplash (uso libero) in `esempi/LICENZA.txt`. Il server manda percorsi relativi (`/esempi/<id>.jpg`); alla scelta il sito li rende assoluti col proprio indirizzo (se un giorno cambia il dominio, le offerte già salvate con quel dominio vanno aggiornate). Gli sconti già salvati con indirizzi Unsplash restano com'erano e continuano a funzionare.

- Admin e nomi dei clienti (08/10): l'admin vede il nome per intero (campo unico `name`, non esiste un cognome separato) in Registro Frodi, Feedback App, Log completo, Referral QR, Abbonati, Feedback e classifica clienti; commercianti e pubblico solo «Nome C.». Nessun nome nei log del server. Da citare nell'informativa privacy (consulente).
- Aspetto (09/10): si tiene l'aspetto attuale dell'app (tema chiaro fucsia-viola). Le bozze in stile Groupon, «gioco» e neon restano archiviate come idee; niente da realizzare per ora.

## Da fare, in ordine
1. **Posta:** creare il Gmail nuovo, inoltro di `info@`, `privacy@`, `partner@` verso il Gmail (record MX su Aruba); poi `REPLY_TO_EMAIL` e `ADMIN_NOTIFY_EMAIL` su Render e prova di ricezione.
2. **Ambiente di prova su Render** (guida in `docs/guide/AMBIENTE_DI_PROVA.md`): **in pausa (08/10)**. Fatto: ramo `prova` (copia di `main` dell'08/10), utente Atlas `prova` con solo `readWrite@scontiroma_prova` (tolto `readWriteAnyDatabase`), servizio `scontiroma-prova-api` creato con avvio corretto; ultimo ostacolo: password in `MONGO_URL` (errore «bad auth»). Da fare alla ripresa: sistemare la password, controllare `/api/`, creare il sito di prova (Passo 3), allineare `prova` a `main`.
3. **Testi legali:** validazione del consulente (domande in `docs/legale/PROPOSTE_TESTI_LEGALI.md`); sede legale in #40; PEC facoltativa; frasi proposte su nome visibile dopo il codice e sul contatore delle scansioni.
4. **Gemini (decisione 10/10):** «Migliora foto» resta **spento fino al lancio**; dopo il lancio si collega la fatturazione con tetto di **5 € al mese** e avviso di spesa, da alzare se serve.
5. **Mappe** Protomaps + LocationIQ: codice pronto (ramo `claude/mappe-protomaps`). Mancano: la chiave LocationIQ (solo su Render, guida `docs/guide/MAPPE.md`) e il file `roma.pmtiles` (`bash scripts/estrai_mappa_roma.sh` da una rete che raggiunga `build.protomaps.com`; se supera 90 MB non entra in GitHub: vedi la guida).
6. **Commercianti:** lista di 232 attività (66 con almeno un canale online): chiamate e visite sui tre quartieri; conferma di 4 email trovate su Facebook; copione di telefonata; video e messaggi da rifare con «Roma e dintorni» e l'app chiara, senza «-50%».
7. **Pagamenti commercianti:** decisioni sospese (sospensione automatica, promemoria, fatture, primo pagamento in prova, prezzo bloccato) e `TRIAL_END_DATE`.
8. Pulizie: fatte in #65 (Archivo Black, `health-check`, righe vecchie). Restano: **revoca di `EMERGENT_LLM_KEY`** (vedi «Pulizie tecniche», non urgente) e locandine già stampate con il QR vecchio da ristampare se esistono.
9. **Controllo online** (UptimeRobot, gratuito): **fatto il 10/10** (controlli su sito e server, avvisi alla email personale: da spostare su quella di Sconti Roma quando c'è; falso allarme normale nel risveglio di Render). Guida in `docs/guide/CONTROLLO_ONLINE.md`. Prima del lancio, server Render a «Starter». Lista completa di cosa manca al lancio ufficiale: `docs/LISTA_LANCIO.md`.
10. Foto del negozio nel profilo o passo foto all'iscrizione (da decidere); pagina «Per i commercianti» con il video.

## Pulizie tecniche (#65, 08/10)
- Tolti i file del carattere Archivo Black (due `.woff2`, licenza, regole in `fonts.css`): nessun CSS o JS li usava. Restano solo Fraunces e Manrope; il test e2e 19 controlla solo quelli.
- Tolto `frontend/plugins/health-check` e il suo aggancio in `craco.config.js`: si attivava solo con `ENABLE_HEALTH_CHECK=true`, variabile mai impostata né in CI né su Render; residuo della piattaforma Emergent. L'endpoint di salute di Render è `/api/` (`render.yaml`), non quello del plugin.
- Riferimenti a Emergent rimasti: solo `MIGRAZIONE.md` (guida storica della migrazione) e questo file. Nessun codice, configurazione o CI usa `EMERGENT_LLM_KEY` né servizi Emergent: non c'è codice morto da togliere.
- File pesanti in git: nessun build né screenshot tracciato; le foto in `frontend/public/esempi` (circa 26 MB) sono volute (#61). Storia non riscritta.
- **Come revocare `EMERGENT_LLM_KEY` (lo fa l'utente):** accedere al proprio account Emergent, aprire le impostazioni del progetto o del profilo (sezione chiavi), eliminare o rigenerare la chiave e verificare che il progetto vecchio sia archiviato. Poi controllare che sito e app funzionino ancora (non dovrebbe cambiare nulla). La chiave non è su Render né nel repository; non incollarla mai in chat, PR o file.

## Domande aperte
- Per l'utente:
  - frase «nessun vincolo» nel video; clausola 5-bis dei Termini;
  - **Pagamenti commercianti, tema messo da parte (08/10):** da approfondire insieme più avanti: come funziona il lancio gratis (30 o 60 giorni), quando scatta il primo pagamento, da quando e a che ora (mezzanotte) parte il rinnovo automatico, e se i Termini devono prevedere il vincolo/impossibilità di disdire per il mese in corso (scarico di responsabilità). Qui rientra anche la domanda sui mesi di prova e `TRIAL_END_DATE`: nessuna data da impostare per ora.
  - Render: tenere sospese le copie `scontiroma-api` e `scontiroma-web` (poi eliminarle?).
- Per il consulente / commercialista:
  - P.IVA e dati dell'azienda (REA, capitale sociale) nei testi del sito;
  - **Fatturazione ai negozi (per il commercialista):** chi emette le fatture elettroniche (SdI) per i 4,99 €/mese e con quale programma (Stripe e PayPal danno solo ricevute, non la fattura fiscale); come si registrano le commissioni; IVA; eventuali fatture ai privati. Da chiarire prima del primo addebito;
  - contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google;
  - Gemini su piano a pagamento;
  - testi legali, regole d'uso dei messaggi ai commercianti, contatore aggregato delle scansioni.
