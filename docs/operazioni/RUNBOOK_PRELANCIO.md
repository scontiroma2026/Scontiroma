# Runbook pre-lancio e giorno del lancio (18/10 – 31/10/2026)

Ultimo aggiornamento: 14/10/2026. Scritto per iPhone. **Nessun passo è stato eseguito**: è un piano. Nessun dato personale, password o chiave qui (repository pubblico).

Chi: **Titolare** = tu; **Claude** = prepara, controlla, scrive bozze, **non** pubblica, non contatta nessuno, non scrive sul database vero; **Consulente** = legale/privacy; **Commercialista**.
Riferimenti: `docs/LISTA_LANCIO.md` (le voci numerate), `docs/comunicazione/campagna-prelancio/PIANO_CAMPAGNA.md` (contenuti giorno per giorno), `COSTI_MENSILI.md`, `SICUREZZA_ACCOUNT.md`, `TRIAGE_PR.md`, `EMERGENZE_E_ACCESSI.md` (PR #128).

## 0. Idee fisse (decise)
- **Nessuna data pubblica.** Il 31/10 è una data **interna**. Soglia per partire: circa **10 negozi con almeno un'offerta pronta**. Se non c'è, il lancio scivola alla settimana dopo senza che nessuno se ne accorga.
- Lancio **gratuito per circa due mesi**. Pagamenti dei negozi **spenti** (`MERCHANT_PAYMENT_REQUIRED` spento) e dei clienti **spenti** (`CLIENT_SUBSCRIPTION_REQUIRED=false`). Nessun addebito senza conferma esplicita.
- Mai scrivere sul database vero per «prove»: le prove si fanno sul sito di prova e con database locali.
- Contenuti con prezzo o prova dei negozi: **bloccati** finché il consulente non valida i Termini (#116).

## 1. Giorno per giorno

| Giorno | Cosa | Chi |
|---|---|---|
| **Gio 15 – Sab 17/10** | Claude: consegna triage (`TRIAGE_PR.md`), unione di #145 e #119 a controlli verdi, rinnovo dei branch con conflitti banali. Titolare: decide le voci di §6 e **invia la richiesta di preventivo** al legale (bozza in `docs/legale/RICHIESTA_PREVENTIVO.md`, non ancora inviata). | Claude, Titolare |
| **Dom 18/10** | **Decisione del titolare (14/10): si attivano TUTTI i piani a pagamento**, prima dei dati veri del 19/10. Ordine in §3.2: (1) sicurezza account e carta valida, (2) avvisi di spesa, (3) Atlas → Flex, (4) Render → Starter, (5) Resend → Pro, (6) verifiche. Poi posta (voce 3) e visura (voce 2). **Claude:** controllo di `main` verde, controllo giornaliero delle 8:00, ripete i controlli dopo ogni passaggio (senza scrivere sul database). | Titolare, Claude |
| **Lun 19/10** | **Prova di ripristino Atlas (§3.3)** sul primo backup. Parte il contatto con i negozi: **3 contatti** (uno alla volta, con modo per dire no) tra le 10 e le 12. Richiesta di permesso ai primi 2 gruppi. **Riepilogo settimanale** all'admin alle 8:00. **Titolare** controlla in Atlas che sia comparso il **primo backup** (entro circa 24 ore dal passaggio a Flex di domenica) e fa la **prova di ripristino** (§3.3) lunedì stesso se c'è, altrimenti martedì mattina. Consulente: riceve il pacchetto (preventivo/validazione). | Titolare, Consulente |
| **Mar 20/10** | 3 contatti. Se lunedì non c'era ancora un backup: **prova di ripristino Atlas** (§3.3) oggi, **su un cluster nuovo**, mai sopra quello vero. Riprese V4 «solo mani». Claude: controllo giornaliero, bozze. | Titolare, Claude |
| **Mer 21/10** | 3 contatti. **Prova generale sul sito di prova** (voce 6 della lista): registrazione, Partita IVA, offerta, approvazione, QR, scansione, **iscrizione alla lista d'attesa**. Se va bene e il titolare decide: accendere `PRELAUNCH_MODE=true` sul server vero (§4) per il 22/10. **Claude** prepara le schermate della prova. | Titolare, Claude |
| **Gio 22/10** | **Inizio campagna** (post P1 «Stiamo arrivando» + storia S1, ore 18:30). Il contenuto che manda alla lista d'attesa va pubblicato **solo se** la lista è accesa e provata (semaforo `[LISTA]`); altrimenti si usa la chiamata provvisoria «Seguici qui». Claude: testi e controllo regole; **non pubblica**. | Titolare, Claude |
| **Ven 23/10** | Reel V4 «Dietro le quinte» (solo mani). Claude controlla i numeri della lista d'attesa (conteggio aggregato, senza email). | Titolare |
| **Sab 24/10** | Reel V1 solo se le liberatorie sono firmate; risposte ai commenti. Primo bilancio negozi: quanti iscritti, quanti con offerta pronta. | Titolare, Claude |
| **Dom 25/10** | Carosello P3; primo post nei gruppi solo dove c'è il «sì» scritto. | Titolare |
| **Lun 26/10** | Post P4 «Hai un negozio?» (senza prezzo). **Riepilogo settimanale** alle 8:00 (negozi, offerte in attesa, iscritti). **Il primo lunedì del mese** il controllo costi (`COSTI_MENSILI.md` §4): il primo sarà lunedì 2/11. | Titolare, Claude |
| **Mar 27/10** | Altri contatti ai negozi; **verifica dei testi legali**: dove siamo col consulente? Se non c'è ancora la validazione dei Termini, **i contenuti con prova o prezzo restano fermi**. | Titolare, Consulente |
| **Mer 28/10** | **Conta**: negozi con offerta pronta (obiettivo ~10); iscritti confermati alla lista. Se mancano più di 3 negozi, il lancio scivola. Decisione su Resend Pro (§5) in base agli iscritti. | Titolare, Claude |
| **Gio 29/10** | **Preparazione del lancio** (checklist §2 «giorno prima»). Ultimi ritocchi, nessuna novità tecnica da qui in poi (**congelamento**: solo correzioni urgenti). | Claude, Titolare |
| **Ven 30/10** | **Go / No-go** (criteri in §2). Se Go: fissare la data interna D e ripassare §2. Se No-go: scivola, si annota la causa in `STATO.md`. | Titolare |
| **Sab 31/10** | Data interna del lancio, **solo se** Go. Altrimenti normale lavoro con negozi e social. | Titolare, Claude |

Dal giorno del lancio: controllo giornaliero **due volte al giorno** (oggi una, alle 8:00).

## 2. Runbook del giorno del lancio (D)

### 2.1 Condizioni «Go» (si controllano il giorno prima, venerdì 30/10)
- [ ] Controlli verdi su `main`; smoke di produzione verde.
- [ ] Nessuna PR aperta con testi legali **non validati** che il sito dovrebbe già avere (regola della lista di lancio).
- [ ] Voci 1–6 della lista di lancio chiuse o decise per iscritto (consulente, visura, posta, piani a pagamento, DPA **in sospeso per decisione del titolare**, prova generale).
- [ ] Circa 10 negozi con un'offerta pronta in attesa (scheda admin «Offerte in attesa»).
- [ ] Render in **Starter**, Atlas in **Flex**, **prova di ripristino fatta** (§3).
- [ ] Controllo giornaliero verde per almeno 3 giorni consecutivi.
- [ ] Pagamenti spenti: sul server vero `CLIENT_SUBSCRIPTION_REQUIRED=false` e `MERCHANT_PAYMENT_REQUIRED` spento; Stripe/PayPal senza chiavi vere.
- [ ] Telefono carico, un'ora libera dopo l'avvio, le persone di fiducia avvisate.
- [ ] Un **messaggio di scuse già pronto** per i negozi in caso di problemi (bozza da Claude).

### 2.2 Sequenza (D, mattina; ogni passo lo fa il titolare, Claude guida e controlla)
1. **Controllo iniziale:** sito, `https://api.scontiroma.it/api/`, admin → «Server Health» (database, email, indirizzi): tutto verde. Controllo giornaliero delle 8:00 verde. (Claude)
2. **Backup di sicurezza** in Atlas (snapshot a richiesta, se Flex lo consente, da verificare) e, a scelta, esportazione di sicurezza. (Titolare)
3. **Rilettura delle offerte in attesa** (admin → «Offerte in attesa»): criteri in `CRITERI_APPROVAZIONE_OFFERTE.md` (PR #127, ancora aperta) e regola dell'alcol (si rifiuta solo se è l'oggetto principale). Le offerte non adatte si **rifiutano con motivo** (almeno 10 caratteri, obbligatorio). L'approvazione resta **sempre manuale**. (Titolare, con giudizio preparato da Claude)
4. **«Approva tutte»**: admin → «Offerte in attesa» → «Approva tutte le N offerte» → scrivere **LANCIA**. Serve la password master. Effetti: approva tutte le offerte rimaste in attesa e fa **partire la prova** dei negozi alla prima pubblicazione. Il pulsante conta e salta le offerte di negozi con pagamento non in regola (oggi irrilevante: pagamenti spenti). Non c'è «annulla tutto» (vedi §7).
5. **Spegnere il pre-lancio:** Render → server `-xqib` → Environment → `PRELAUNCH_MODE` = `false` (o rimuoverla) → Save. Il server riparte da solo (di solito 1–3 minuti). La home torna quella normale; le offerte approvate compaiono. (Titolare)
6. **Verifica dall'esterno** (da iPhone con dati mobili, non Wi-Fi): home, elenco offerte, una scheda offerta, registrazione di un cliente di prova **solo sul sito di prova**. Sul sito vero: guardare, non scrivere. (Titolare)
7. **Avviso alla lista d'attesa:** admin → «Lista d'attesa» → conteggio «da avvisare» → «Invia l'avviso di lancio» → scrivere **AVVISA**. Parte in background, a lotti con pause, e si ferma al tetto giornaliero `WAITLIST_DAILY_CAP` (predefinito 80 al giorno, sotto il limite gratuito di Resend di 100). Con più di 80 iscritti: o si lascia spalmato su più giorni, o si passa a Resend Pro e si alza il tetto (§5). Ogni persona riceve **un solo** avviso, anche se si rilancia. Seguire i conteggi «avvisate / restano». (Titolare)
8. **Pubblicazione social** «Siamo online» solo con **OK esplicito** del titolare, contenuto per contenuto (Composio solo dopo l'OK). (Titolare)
9. **Monitoraggio per due ore:** Render → Logs (errori rossi), UptimeRobot, Resend → Logs (consegnate/rimbalzate), admin → Segnalazioni. Claude fa il controllo giornaliero subito dopo e a fine giornata e riassume (senza dati personali).
10. **Annotare** in `STATO.md` ora, esito e numeri (offerte approvate, avvisi inviati). Spuntare le voci della lista.

### 2.3 Effetti sul calendario dei pagamenti (decisioni del titolare)
La prova parte dalla prima pubblicazione e si paga sempre il **1° del mese**. Prima offerta pubblicata **entro l'11** → primo pagamento il 1° di due mesi dopo; **dal 12 in poi** → il 1° di tre mesi dopo. Con lancio D = 31/10 il primo pagamento cadrebbe il **1° gennaio 2027** (da ricontrollare con la regola nel codice prima di dirlo ai negozi). Per i testi pubblici: «circa due mesi di prova», mai «60 giorni».

## 3. Passaggio a Starter / Flex, tempi di attivazione, prova di ripristino

### 3.1 Decisione del titolare (14/10): domenica 18/10 si attivano tutti i piani a pagamento
Render **Starter**, Atlas **Flex** e Resend **Pro** partono **domenica 18/10**, prima che arrivino i dati veri dei primi negozi (19/10): il piano Free di Atlas non ha backup e la prima copia di Flex si forma dopo il passaggio (di norma entro 24 ore, da verificare), così la **prova di ripristino si fa lunedì 19/10**. Ordine pensato per ridurre i rischi: prima il database (dove stanno i dati), poi il server, poi le email. Costi da domenica: vedi `COSTI_MENSILI.md` (totale 32 $/mese più Atlas, tetto 62 $).

### 3.2 Cambio di piano: ordine di domenica 18/10
Ordine dei passaggi (circa 2 ore, pomeriggio, fuori orario): **(1)** carta valida su Render, Atlas e Resend e 2FA attiva; **(2)** avvisi di spesa (Render 10 $, Atlas 15 $); **(3) Atlas → Flex** e verifica; **(4) Render → Starter** e verifica; **(5) Resend → Pro** e verifica; **(6)** controllo finale (sito, `/api/`, admin «Server Health», UptimeRobot). Si passa al punto successivo solo se il precedente è verde.

| Servizio | Dove | Tempo di attivazione | Rischio | Cosa verificare |
|---|---|---|---|---|
| **Render** | Dashboard → servizio del server (`-xqib`) → Settings → Instance Type → **Starter** → conferma | pochi minuti: Render riavvia il servizio | breve interruzione durante il riavvio (decine di secondi, da verificare); farlo di domenica pomeriggio, fuori orario | `https://api.scontiroma.it/api/` risponde; UptimeRobot torna verde; in Logs il promemoria delle 9:30 parte il giorno dopo |
| **MongoDB Atlas** | Cluster → Edit/Upgrade → **Flex** (tetto 30 $/mese) | di norma pochi minuti; connessioni brevemente interrotte (da verificare); l'indirizzo di collegamento di solito resta (da verificare) | **se cambia l'indirizzo del cluster** va aggiornata la variabile `MONGO_URL` su Render (mai in chat) | admin → «Server Health» database verde; i negozi esistenti sono tutti presenti (conteggio); backup attivo |
| **Resend** | Settings → Billing → **Pro** (20 $/mese, attivato domenica 18/10) | di norma immediato (da verificare) | nessuno per il sito | Usage mostra i limiti nuovi |
Prima dei passaggi: avviso di spesa nei servizi (Render 10 $, Atlas 15 $) e carta valida; email di fatturazione = email di Sconti Roma.

### 3.3 Prova di ripristino Atlas (lunedì 19/10; martedì 20/10 se il backup non c'è ancora)
Principio: **mai sopra il database vero**, mai scrivere sulla produzione.
1. Atlas → cluster → Backup: verificare che esista almeno uno snapshot (data/ora annotate).
2. «Restore» dello snapshot verso un **cluster nuovo e temporaneo** (non quello vero) o scarico dello snapshot, se il piano Flex lo consente (da verificare cosa permette Flex).
3. Controllare sul cluster temporaneo i **conteggi** (negozi, offerte, clienti) con la vista dati di Atlas e confrontarli con quelli reali: devono coincidere (a meno di quanto cambiato dopo lo snapshot).
4. **Non** cambiare `MONGO_URL` su Render per la prova.
5. Eliminare il cluster temporaneo (costo e dati personali).
6. Annotare in `STATO.md`: data, durata del ripristino, esito (senza numeri personali). Ripetere ogni sei mesi.
Se la prova **fallisce**: non lanciare finché non si è capito perché (supporto Atlas); il lancio scivola.

## 4. Pre-lancio: accendere la lista d'attesa (mercoledì 21/10)
- `PRELAUNCH_MODE=true` su Render → la home mostra «Stiamo arrivando» e la **lista d'attesa**: email + casella di consenso non preselezionata, conferma per email (link valido 48 ore), iscrizioni non confermate cancellate dopo 7 giorni.
- Prima di accenderla: (a) prova dal sito di prova da iPhone; (b) il testo del consenso e la frase per la Privacy sono ancora **bozze da validare dal consulente** (`docs/legale/BOZZA_LISTA_ATTESA.md`): **il titolare decide** se accendere subito o aspettare il consulente. Finché non è accesa si usa «Seguici qui».
- Per spegnerla: `PRELAUNCH_MODE=false`. L'effetto è solo sulla home e sull'iscrizione: le offerte già approvate non si nascondono da sole (§7).

## 5. Avviso alla lista e limiti di Resend
- **Dal 18/10 Resend è Pro** (decisione del titolare). Il tetto giornaliero dell'avviso resta `WAITLIST_DAILY_CAP` = 80 al giorno (predefinito): con Pro si può alzare su Render (limiti esatti del piano Pro: da verificare in Resend → Usage). Prima del lancio: contare gli iscritti confermati (scheda admin) e scegliere un tetto adatto; con 80 al giorno una lista di 400 persone richiede 5 giorni.
- Prima del 18/10 (piano gratuito): 100 email al giorno, 3.000 al mese (letto il 14/10: 44 usate).
- Il giorno del lancio si inviano anche le email di servizio (benvenuto, esiti offerte): lasciare margine di quota.

## 6. Cosa deve decidere il titolare (per questo piano)
1. ~~Cambio di piano domenica 18/10~~ **già deciso (14/10): domenica 18/10 tutti i piani a pagamento (Render Starter, Atlas Flex, Resend Pro).**
2. Accendere la lista d'attesa il 21/10 **prima** o **dopo** il consulente.
3. Con quale tetto giornaliero (`WAITLIST_DAILY_CAP`) mandare l'avviso, ora che Resend è Pro.
4. Chi è la persona di fiducia (busta con i codici) e quando la avvisa.
5. Confermare i criteri Go/No-go del 30/10 (soglia ~10 negozi).
6. Invio della richiesta di preventivo al legale (entro il 17/10).

## 7. Rollback (se qualcosa va storto)
Prima regola: **fermati, non cancellare nulla, non pagare nulla**; annota ora e cosa vedi.

| Problema | Rollback |
|---|---|
| Il sito/server va giù dopo il cambio di piano o un deploy | Render → Events → **Rollback** all'ultimo deploy riuscito; se è Starter il problema, i deploy restano comunque gli stessi |
| Modifica rotta in `main` | Revert con PR (mai push diretto su `main`, mai cancellare branch); Render ridistribuisce |
| Il database non risponde dopo il passaggio a Flex | Controllare `MONGO_URL`/indirizzo del cluster; se serve, tornare all'indirizzo precedente; ripristino da snapshot su un cluster nuovo (§3.3) e solo dopo cambiare `MONGO_URL` |
| «Approva tutte» ha pubblicato offerte che non dovevano uscire | **Non esiste un «annulla tutto»**. Per ogni offerta: admin → forza modifica (torna «in attesa»), o rifiuto con motivo. Se sono tante: rimettere `PRELAUNCH_MODE=true` (la home torna «Stiamo arrivando») e lavorare le offerte una a una. Per questo si rilegge **prima** di premere LANCIA (passo 3) |
| L'avviso alla lista parte male (testo, errore) | Si ferma da solo dopo 3 errori di fila; si può spegnere il server di invio togliendo la chiave email su Render (`RESEND_API_KEY`) **solo** in emergenza; nessuno riceve due volte lo stesso avviso |
| Troppe email o quota Resend finita | Aspettare il giorno dopo (gratuito) o passare a Pro; `WAITLIST_DAILY_CAP` più basso |
| Attacco di registrazioni false | Limiti già attivi (10 registrazioni ogni 10 minuti per client); se serve: `PRELAUNCH_MODE=true` ferma la home pubblica, i negozi restano raggiungibili; decisioni su verifica email in `PROTEZIONE_REGISTRAZIONI.md` |
| Addebito comparso per errore (Stripe/PayPal) | `MERCHANT_PAYMENT_REQUIRED` spento, rimborso dal pannello del servizio, scuse ai negozi (procedura completa in `EMERGENZE_E_ACCESSI.md`, sezione 4.6) |
| Account compromesso | Revoca, nuova chiave, Render → Environment (4.3 di `EMERGENZE_E_ACCESSI.md`); se ci sono dati personali: 72 ore per la valutazione verso il Garante, guida del consulente |

## 8. Contatti di emergenza (senza dati personali)
Numeri, indirizzi e nomi stanno **nel gestore di password e nella busta della persona di fiducia**, mai qui.
| Chi | Per cosa | Dove trovi il contatto |
|---|---|---|
| Titolare | decisioni, password master | — |
| Persona di fiducia | accesso di emergenza (busta) | gestore di password / busta |
| Consulente legale/privacy | testi legali, Garante, violazione dei dati (72 ore) | gestore di password |
| Commercialista | fatture, IVA, ricevute | gestore di password |
| Assistenza Render | server, piano, fatture | area Support della dashboard; pagina di stato del fornitore |
| Assistenza MongoDB Atlas | database, backup, ripristino | area Support dell'organizzazione; pagina di stato del fornitore |
| Assistenza Resend | consegna email, quote | area Support; pagina di stato del fornitore |
| Assistenza Aruba | dominio, DNS, casella `postmaster` | Area Clienti → Assistenza |
| Assistenza GitHub | accesso/sicurezza del repository | githubstatus (pagina di stato) e Support |
| Claude | aiuto tecnico, bozze, controlli | descrivere cosa vedi **senza** chiavi, password o numeri di carta |
Le pagine di stato dei fornitori (Render, MongoDB, Resend, GitHub) vanno salvate nei Preferiti del telefono prima del 18/10; gli indirizzi esatti sono da verificare perché da qui non sono raggiungibili.

## 9. Dopo il lancio (promemoria)
Primo lunedì del mese: costi. Dopo circa un mese: ricordare ai negozi la fine della prova (email al giorno 30 e 7 giorni prima del primo pagamento, nel codice: partono con `MERCHANT_TRIAL_EMAILS` o con i pagamenti accesi; i vecchi promemoria a 10 e 3 giorni sono stati tolti). Circa due mesi: prova con soldi finti insieme a Claude e conferma esplicita prima di accendere i pagamenti veri (parte B della lista di lancio).
