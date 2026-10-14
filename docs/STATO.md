# Stato del progetto Sconti Roma

Aggiornato: 14/10/2026 — ultimo commit in `main`: `fe9f1d6` (unione della #64)

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
| nuova | Conferma dell'email dei clienti (non dei commercianti): email con link «Conferma il tuo account» (48 ore, monouso, nel DB solo l'impronta), niente accesso finché non conferma, «Rimanda l'email» (3 ogni 10 minuti e 5 all'ora per dispositivo, solo in memoria), pagina `/conferma-email`, clienti già iscritti confermati con migrazione all'avvio, non confermati cancellati dopo 7 giorni (03:30 e all'avvio, via `_erase_user_data`). Interruttore `CLIENT_EMAIL_CONFIRMATION_REQUIRED` (predefinito acceso; spento in e2e e nei test). Ramo `claude/conferma-email-clienti` | Controllo da iPhone; decisioni nella PR (Privacy, Resend attivo prima di unire) |
| nuova | Pre-lancio con lista d'attesa (14/10): interruttore `PRELAUNCH_MODE` (**predefinito spento**: unendo la PR il sito non cambia; lo accende il titolare su Render). Acceso: la home dice «Stiamo arrivando a Roma e dintorni» (niente data) con il modulo «Avvisami quando parte» e anche il catalogo vuoto mostra l'invito; negozi e area commerciante restano attivi. Lista: `POST /api/prelaunch/waitlist` (email + consenso esplicito + campo trappola + fonte da lista chiusa), doppio consenso con link a 48 ore (nel DB solo l'impronta), pagine `/lista-attesa/conferma` e `/lista-attesa/annulla`, limiti per dispositivo come #131 (solo in memoria), non confermati cancellati dopo 7 giorni (03:40 e all'avvio), nessun IP né cookie. Admin: scheda «Lista d'attesa» con conteggi per fonte, CSV delle sole confermate e «Invia l'avviso di lancio» (parola AVVISA, lotti con pausa, tetto giornaliero 80, idempotente). Bozze legali in `docs/legale/BOZZA_LISTA_ATTESA.md` (Privacy non modificata). Ramo `claude/prelancio-lista-attesa` | Controllo da iPhone; consulente sulla frase per la Privacy; decisioni nella PR (clienti in prelancio, conservazione, limite Resend) |
| nuova | Materiale per i clienti, solo testo: locandina e post (`docs/comunicazione/CLIENTI_LOCANDINA_E_POST.md`); i copioni video sono rimandati. Ramo `claude/materiale-clienti` | Il consulente deve vedere le righe marcate «da far vedere al consulente» |

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

- Novità del 10/10: UptimeRobot attivo su sito e server (il falso «Down» era dovuto a HEAD: #78); `/api/config/public` espone `ai_enhance_enabled` e «Migliora foto» si nasconde senza `GEMINI_API_KEY` (#79; chiave tolta su Render, da rimettere dopo il lancio con tetto 5 €/mese); rete dell'ambiente Claude aperta per `scontiroma.it` e `api.scontiroma.it`; lista completa di cosa manca al lancio in `docs/LISTA_LANCIO.md` (#77). Il controllo giornaliero automatico (7:54, solo lettura) è **in pausa fino al reset del limite settimanale** (riattivarlo dopo).

## Da fare, in ordine
1. **Posta:** creare il Gmail nuovo, inoltro di `info@`, `privacy@`, `partner@` verso il Gmail (record MX su Aruba); poi `REPLY_TO_EMAIL` e `ADMIN_NOTIFY_EMAIL` su Render e prova di ricezione.
2. **Ambiente di prova su Render: FATTO (09/10).** Server `scontiroma-prova-api` e sito `scontiroma-prova-web` (ramo `prova`, aggiornato a `main`) funzionano; il sito inoltra `/api/*` al server con regola «Rewrite» di Render (destinazione `https://…onrender.com/api/*`, con l'asterisco, non `:splat`), così i cookie restano sullo stesso indirizzo e Safari non li blocca. Entrato con un account di prova. Da fare: prove sul telefono (lista in STATO/PR), cambiare la password dell'utente Atlas `prova` perché è comparsa nei log, email di prova con chiave Resend dedicata e `EMAIL_ALLOWED_RECIPIENTS` (facoltativa), `ADMIN_RECOVERY_ID` di prova impostato.
3. **Testi legali:** validazione del consulente (domande in `docs/legale/PROPOSTE_TESTI_LEGALI.md`); sede legale in #40; PEC facoltativa; frasi proposte su nome visibile dopo il codice e sul contatore delle scansioni.
4. **Gemini (decisione 10/10):** «Migliora foto» resta **spento fino al lancio**; dopo il lancio si collega la fatturazione con tetto di **5 € al mese** e avviso di spesa, da alzare se serve.
5. **Mappe** Protomaps + LocationIQ: codice pronto (ramo `claude/mappe-protomaps`). Mancano: la chiave LocationIQ (solo su Render, guida `docs/guide/MAPPE.md`) e il file `roma.pmtiles` (`bash scripts/estrai_mappa_roma.sh` da una rete che raggiunga `build.protomaps.com`; se supera 90 MB non entra in GitHub: vedi la guida).
6. **Commercianti:** lista di 232 attività (66 con almeno un canale online): chiamate e visite sui tre quartieri; conferma di 4 email trovate su Facebook; copione di telefonata; video e messaggi da rifare con «Roma e dintorni» e l'app chiara, senza «-50%».
7. **Pagamenti commercianti:** decisioni sospese (sospensione automatica, promemoria, fatture, primo pagamento in prova, prezzo bloccato) e `TRIAL_END_DATE`.
8. Pulizie: fatte in #65 (Archivo Black, `health-check`, righe vecchie). Restano: **revoca di `EMERGENT_LLM_KEY`** (vedi «Pulizie tecniche», non urgente) e locandine già stampate con il QR vecchio da ristampare se esistono.
9. **Controllo online** (UptimeRobot, gratuito): **fatto il 10/10** (controlli su sito e server, avvisi alla email personale: da spostare su quella di Sconti Roma quando c'è; falso allarme normale nel risveglio di Render). Guida in `docs/guide/CONTROLLO_ONLINE.md`. Prima del lancio, server Render a «Starter». Lista completa di cosa manca al lancio ufficiale: `docs/LISTA_LANCIO.md`.
10. Foto del negozio nel profilo o passo foto all'iscrizione (da decidere); pagina «Per i commercianti» con il video.

- Conferma dell'email dei clienti (13/10, decisione del titolare): solo i clienti, non i commercianti (hanno Partita IVA e approvazione manuale). Accedono solo dopo aver toccato il link; chi era già iscritto è confermato. Account non confermati cancellati dopo 7 giorni. Chi reimposta la password con il link ricevuto per email risulta confermato. Con `CLIENT_EMAIL_CONFIRMATION_REQUIRED=false` si torna a entrare subito. Nessun accesso con Google o altri provider nel codice: solo email e password e Face ID.

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
  - Render: copie vecchie `scontiroma-api` e `scontiroma-web` (sospese): **decisione 10/10: non servono, da eliminare** (le fa l'utente da Render; i servizi veri sono quelli con suffisso `-xqib`).
- Per il consulente / commercialista:
  - P.IVA e dati dell'azienda (REA, capitale sociale) nei testi del sito;
  - **Fatturazione ai negozi (per il commercialista):** chi emette le fatture elettroniche (SdI) per i 4,99 €/mese e con quale programma (Stripe e PayPal danno solo ricevute, non la fattura fiscale); come si registrano le commissioni; IVA; eventuali fatture ai privati. Da chiarire prima del primo addebito;
  - contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google;
  - Gemini su piano a pagamento;
  - testi legali, regole d'uso dei messaggi ai commercianti, contatore aggregato delle scansioni.

- 12/10: la registrazione dei commercianti chiede la **Partita IVA** (11 cifre, cifra di controllo verificata). Il server accetta anche registrazioni senza (vecchi account e test), il modulo del sito la richiede. Privacy e Termini da aggiornare con questo dato (proposta al consulente).

- 12/10: **pre-lancio** (da provare): scheda «Offerte in attesa» con il pulsante «Approva tutte» (chiede di scrivere LANCIA); promemoria di fine prova ai negozi a 10 e a 3 giorni (lavoro giornaliero alle 9:45, parte solo con `MERCHANT_PAYMENT_REQUIRED` acceso, una volta per negozio). Ramo `claude/prelancio-promemoria`.

- 12/10 (decisione del titolare): **prova a limite 11**: la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese: prima offerta pubblicata entro l'11 → primo pagamento il 1° di due mesi dopo; dal 12 in poi → il 1° di tre mesi dopo. Prova da 49 a 81 giorni (media 66): nei testi pubblici scrivere «circa due mesi di prova», non «60 giorni». Tolleranza 5 giorni (si paga dal 1° al 5 incluso). Approvazione dell'offerta consentita solo se il pagamento è arrivato in tempo (interruttore acceso). Nessuna pubblicazione automatica. Da aggiornare: Termini (#83), piano (#81), video e messaggi.

- 12/10: **pagamento dei negozi con Stripe** (tappa 1, spento): `/api/merchant/pagamento` (stato), `/stripe/checkout` (prova fino al primo 1° di addebito, poi 4,99 €/mese; importo da `MERCHANT_PRICE_CENTS`), `/disdici`; il webhook Stripe scrive i pagamenti nel registro e salta le fatture a zero. Funziona solo con `MERCHANT_PAYMENT_REQUIRED` acceso. Mancano: schermata del commerciante, PayPal, prova sul sito di prova. Ramo `claude/pagamento-negozi-stripe`.

- 12/10: **pagamento dei negozi con PayPal** (tappa 2, spento): piano mensile 4,99 € (`/api/merchant/pagamento/paypal/config`), attivazione verificata (piano giusto e abbonamento intestato al negozio: `/paypal/activate`), webhook che scrive i pagamenti nel registro, disdetta. Primo addebito sempre un 1°. Solo con `MERCHANT_PAYMENT_REQUIRED` acceso. Mancano: schermata del commerciante e prova sul sito di prova. Ramo `claude/pagamento-negozi-paypal`.
- 12/10: **schermata «Attiva il pagamento»** dell'area commerciante (tappa 3): compare solo con `MERCHANT_PAYMENT_REQUIRED` acceso; riepilogo (importo, primo addebito, rinnovo il 1°, disdetta a fine mese con sconto da rispettare, mese pagato non rimborsabile), conferma esplicita, pagamento con carta (Stripe) o PayPal, pulsante «Disdici». Testi del riepilogo = proposta per il consulente. Ramo `claude/pagamento-negozi-schermata`.

- 12/10 (decisione del titolare): **prezzo ai commercianti = 4,99 € al mese + IVA** (IVA esclusa; aliquota 22% da confermare col commercialista, variabile `MERCHANT_VAT_PERCENT`). Stripe aggiunge l'IVA con un'aliquota esclusa, il piano PayPal ha l'IVA esclusa; il registro salva l'importo realmente pagato. Aggiornati FAQ, banner della prova, email di benvenuto e documenti non legali. **Da allineare (testi legali, solo come proposta):** Termini attuali (art. 3, «IVA inclusa») e bozze del pacchetto legale (#92). Il **video** resta per ultimo.

- 12/10 (autorizzato dal titolare, scelta A): **avvio automatico delle sessioni web**: `.claude/hooks/avvio-sessione.sh` installa le dipendenze del server e del sito e imposta il database finto dei test. Registrato in `.claude/settings.json`. Si toglie cancellando le righe `hooks`. Ramo `claude/hook-avvio`.
- 12/10: **controllo giornaliero** riattivato (routine «Scontiroma», ogni giorno alle 8:00, sola lettura, repository e Resend collegati). Password Atlas `prova` già cambiata (11/10). `docs/LISTA_LANCIO.md` riscritta in tre parti: prima del lancio (8 voci), dopo il lancio prima del primo addebito, dopo il lancio con calma.
- 12/10: i **pagamenti automatici** (Stripe/PayPal) compaiono ora anche nella scheda «Pagamenti» dell'admin (data, periodo coperto, ultimo pagamento, prossimo rinnovo) oltre a decidere la visibilità delle offerte. Il modulo «Registra pagamento» resta per bonifici o contanti. Ramo `claude/registro-automatico`.

- 13/10: **segnalazioni e reclami** (punto rosso DSA/P2B): pulsante «Segnala questa offerta» (anche senza account) e scheda «Hai un reclamo?» per i commercianti; arrivano nell'area admin → Segnalazioni (conferma entro 5 giorni lavorativi, esito sempre motivato e mandato per email se c'è l'indirizzo; conservate 24 mesi; nessun IP salvato; al massimo 5 all'ora). Aggiunta anche la scheda admin «Clienti» con eliminazione definitiva (richieste di cancellazione e pulizie). Ramo `claude/segnalazioni-reclami`.
- 13/10 — Lista di lancio e indice documenti aggiornati dopo le correzioni di prezzo e zone (#41, #81, #116).
- 13/10 — Home: nuove frasi (hero «I negozi che ami, a prezzo scontato», passo 3 «Tutto qui»).
- 13/10 — Titoli del sito in Manrope (scelta del titolare, modello A): classe font-serif, titoli h1-h4 e test di carattere aggiornati; le locandine stampabili restano in Fraunces.
- 13/10 — Lista di lancio aggiornata (posta su Aruba, Atlas Flex e Render Starter prima del lancio, video v14 e clienti, social fatti).
- 13/10 — Eliminando un negozio ora spariscono anche gli sconti usati e le scansioni QR presso di lui (prima restavano e falsavano le statistiche dell'admin); all'avvio il server ripulisce quelli già orfani (test_dati_orfani.py).
- 13/10 — **Protezione dalle registrazioni false** (ramo `claude/protezione-registrazioni`): mappa e prove in `docs/operazioni/PROTEZIONE_REGISTRAZIONI.md`; aggiunti limite registrazioni per client (10 ogni 10 minuti) e reset password per client (3 ogni 10 minuti e 5 all'ora, decisione del titolare), contatori solo in memoria, senza IP salvati; spenti nei test e2e; segnalazioni ora contate per client anche dietro il proxy. Da decidere: verifica dell'email.
- 13/10 — Test email del dominio (sola lettura): Resend verificato (DKIM, SPF e MX di `send` ok, tracciamento spento, 0 spam, 29/31 consegnate); DNS pubblico della radice (MX, SPF, DMARC) non leggibile dall'ambiente, da controllare dal titolare; da decidere DMARC e nome del mittente (`REPLY_TO_EMAIL` impostato il 13/10; il testo «abbonamento 2,99 €» è stato corretto in #129). Rapporto: `docs/operazioni/TEST_EMAIL_DOMINIO.md`.
- 13/10 — Email abbonamento clienti (oggi spento): tolto il prezzo «2,99 €» dai testi e «quartiere» → «Roma e dintorni» (test email dominio, PR #126).
- 13/10 — Nuova skill «lavoro-con-sub-agenti»: delega con lo stesso modello e worktree isolata; quando un sub-agente finisce interrompiamo il lavoro in corso, vediamo il risultato, decidiamo e poi riprendiamo (decisione del titolare).
- 13/10 — Rifiuto di un'offerta: il motivo è obbligatorio (almeno 10 caratteri), controllato dal server (errore 422 in italiano) e dal pannello admin con finestra dedicata e pulsante spento finché non è valido; vale per offerta corrente e del mese prossimo (test_motivo_rifiuto.py, e2e 08-admin).
- 13/10 — **Riepilogo settimanale** per l'admin: ogni lunedì alle 8:00 (Roma) email a `ADMIN_NOTIFY_EMAIL` con numeri della settimana appena conclusa e confronto con quella prima (↑↓), iscrizioni per fonte, QR dei negozi, offerte in attesa, negozi senza offerta, segnalazioni, zone che aspettano, pagamenti (solo con interruttore acceso) e al massimo 3 «cose da guardare». Una sola email a settimana anche dopo un riavvio. Stessi dati in `GET /api/admin/riepilogo-settimanale` e nella scheda admin «Riepilogo». Solo conteggi, nessun dato personale. Ramo `claude/riepilogo-settimanale`.
- 14/10 — Lista di lancio: aggiunte le idee per dopo il lancio (Coupon Flash, notifiche di prossimità, punti) con le note di valutazione.
- 14/10 — Rapporto test email: aggiornati i punti già risolti (testo 2,99 € e `REPLY_TO_EMAIL`) e tolti i due indirizzi di prova con nome dal rapporto (repository pubblico).
- 14/10 — Ricerca comparativa su come far validare i testi legali (generatori e consulenza online): `docs/legale/CONFRONTO_SERVIZI_LEGALI.md`. Raccomandazione ibrida; prezzi da riconfermare sui siti (pagine non raggiungibili dall ambiente). Nessun testo legale toccato. Ramo `claude/confronto-servizi-legali`.
- 14/10 — Pulizia dell'app vera: il titolare ha cancellato tutti i clienti di prova; segnata come fatta nella lista di lancio.
- 14/10 — Bozza della richiesta di preventivo a un legale (email, versione breve, pacchetto da allegare, tabella di confronto): `docs/legale/RICHIESTA_PREVENTIVO.md`. Non inviata; la invia il titolare.
- 14/10 — Pacchetto della campagna pre-lancio (19/10–31/10): piano giorno per giorno, contenuti social, 6 copioni video, elenco materiali e controllo regole in `docs/comunicazione/campagna-prelancio/`. Nessun contenuto pubblicato, nessun credito speso, nessuno contattato; i contenuti con prova o prezzo dei negozi sono bloccati fino alla validazione dei Termini (#116). Ramo `claude/campagna-prelancio`.
- 14/10 — Campagna pre-lancio, aggiornamento: pubblicità a pagamento esclusa, tono neutro (niente Halloween), V4 «dietro le quinte» solo mani con musica e scritte (primo video), opzioni di musica con licenza da verificare, ricerca gruppi in `GRUPPI_DA_CONTATTARE.md` (Facebook/Instagram non raggiungibili dall'ambiente: nessun gruppo verificato, solo categorie e scheda di controllo). Ramo `claude/campagna-prelancio`.
- 14/10 — Termini (correzione richiesta dal titolare): «€4,99 al mese + IVA» al posto di «IVA inclusa» e tolto «Prezzo bloccato». Resta aperta la PR #116 con le altre correzioni proposte (da validare col consulente).
- 14/10 — Unite le PR #130–#143 della giornata (riepilogo settimanale, lista d'attesa pre-lancio con interruttore spento, Termini 4,99 € + IVA, campagna social pre-lancio). Decisioni registrate nella lista di lancio: prova ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita.
- 14/10 — **Punto 17** (ramo `claude/punto-17`): prova del cambio mese con orologio finto (`test_cambio_mese.py`, 38 test): corretti il fuso dei lavori pianificati (giravano in UTC, passaggio del mese 1-2 ore dopo mezzanotte), conteggi mensili all'ora di Roma, passaggio mese e promemoria senza doppi invii; ricerche in `docs/operazioni/MARCHIO.md`, `CODICE_ATECO.md`, `TEST_ANDROID.md` (emulazione, non telefono vero). Nessun deposito, nessun testo legale toccato.
- 14/10 — Punto 17, risposte del titolare: il QR creato a fine mese vale solo fino alle 02:00 (ora di Roma) del 1° giorno del mese dopo, l'uso conta per il mese di creazione (test_cambio_mese.py); rifiniture Android (aree toccabili 44 px, testi 12 px, test e2e 34) in emulazione; periodo di grazia e marchio rimandati in `docs/operazioni/PROMEMORIA_DA_RIPRENDERE.md`.
- 14/10 — **Prova generale pre-lancio** (punti 7, 9, 10 della lista; ramo `claude/prova-generale`): batteria completa su `main` (server e percorsi), nuova scheda e2e `34-prova-generale` (cliente con conferma email accesa, commerciante, admin con «Approva tutte», testi pubblici a pre-lancio acceso e spento, tetto 80 e parola AVVISA, intestazioni e CORS), nuovo `test_prova_generale.py` e test del tetto 80 nella lista d'attesa. Corretti: descrizione del sito e dell'app che nominava Garbatella, San Paolo e Marconi (`index.html`, `manifest.json`); aggiunte intestazioni di sicurezza (server e `render.yaml` del sito). Nuovi documenti: `docs/operazioni/PROVA_GENERALE.md` (checklist da iPhone, cosa accendere su Render, rischi) e `docs/operazioni/VARIABILI_AMBIENTE.md` (solo nomi e valori consigliati). Decisioni aperte nella PR. Nessun testo legale toccato.
- 14/10 — Prova generale, seguito (decisioni del titolare): con `PRELAUNCH_MODE` acceso la registrazione dei CLIENTI è chiusa (server 403 + sito con «Stiamo arrivando» e lista d'attesa; negozi e admin invariati); l'avviso di lancio, dopo `AVVISA`, riprende da solo ogni giorno alle 10:00 (Roma) col tetto `WAITLIST_DAILY_CAP`, con prenotazione atomica per giorno e per persona; nei log degli invii email gli indirizzi sono mascherati (iniziale e dominio). Percentuali «−NN%» e menu zone lasciati com'erano; offerte approvate visibili in pre-lancio: lasciato così (nel runbook: non approvare prima del lancio).
- 14/10 — Lista di lancio riscritta in formato numerato (punti 1–34): d'ora in poi è la lista che si dà al titolare ogni volta che la chiede, aggiornata a ogni passo (regola anche in CLAUDE.md). Aggiunto il punto 6 con i DPA fornitore per fornitore.
- 14/10 — Resend chiuso (6c): DPA, SOC 2 e sub-fornitori scaricati dal titolare; cancellate 5 chiavi API inutilizzate (resta solo quella del sito); email di benvenuto consegnata con la chiave attiva; app autorizzate controllate (solo il collegamento Claude). Resta la 2FA. Aggiunto `docs/operazioni/SCHEDA_FORNITORE.md` (lista di controllo unica per ogni fornitore).
- 14/10 — DPA: il titolare mette in sospeso tutti i fornitori tranne Resend (fatto). Il sub-agente non ha potuto scaricare documenti (rete bloccata); schede e bozza per Aruba restano nella cartella privata, fuori dal repository. Servono davvero solo Render, Atlas, Resend, Aruba e la scelta su Google; UptimeRobot, Composio, ElevenLabs e GitHub non trattano dati dei clienti.
