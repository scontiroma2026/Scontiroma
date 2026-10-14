# Pacchetto unico per il consulente (punti 1, 2, 3 e 22 della lista)

Preparato il 14/10/2026 dall'ufficio legale interno (Claude). **Pronto entro sabato 17/10.**
**Tutto è [DA VALIDARE]**: non è un parere legale e nessun testo del sito è stato modificato da questo documento. Nessuna email è stata inviata a nessuno.
Repository pubblico: qui non ci sono segreti, email personali, telefoni né dati di persone reali. Dati dell'azienda: solo quelli già nei testi del sito; il resto è `[DA VISURA]`.

**Legenda:** 🔴 rischio alto, da sistemare prima del lancio · 🟠 medio, da valutare col consulente · 🟢 basso, miglioramento o già a posto.
**Come ho verificato:** «codice» = letto nel codice di `main` (14/10) · «PR» = letto nel ramo della PR · «verificato web» = trovato con ricerca web in questa sessione · «da verificare» = non ho potuto controllare (siti esterni spesso bloccati; solo la ricerca web funziona).

---

## 1. In breve (per chi ha 2 minuti)

| # | Cosa | Rischio | Chi |
|---|---|---|---|
| 1 | **11 PR legali aperte (+ #81)**: 6 sono solo documenti, 5 toccano il sito o il server. Ordine di unione e PR da accorpare/chiudere: sezione 3 | 🟠 | Titolare decide, consulente valida |
| 2 | **Lista d'attesa (PRELAUNCH_MODE)**: la Privacy online non la nomina. Frase pronta e controllata sul codice (sezione 4). Va pubblicata **prima** di accendere l'interruttore | 🔴 | Consulente |
| 3 | **Banner cookie**: «Accetta tutti» oggi salva «marketing = sì», ma la Cookie Policy dice che non c'è marketing (PR #95) | 🟠 | Consulente |
| 4 | **Termini e Recesso incoerenti tra loro e col codice** (elenco in sezione 9). Se si unisce #116 da sola, l'art. 6 dei Termini rimanda a un articolo del Recesso che #116 toglie | 🟠 | Titolare |
| 5 | **P2B/DSA**: preavviso minimo 15 giorni per le modifiche ai Termini (da verificare sul testo ufficiale), 30 giorni per la chiusura (verificato web). Strumenti di segnalazione e reclamo già nel codice | 🔴 | Consulente |
| 6 | **Recesso 14 giorni solo per i consumatori**; i negozi (professionisti) non lo hanno (sezione 6) | 🟢 | Consulente |
| 7 | **Schermata di pagamento (punto 22)**: testi proposti in sezione 7 | 🔴 | Consulente |
| 8 | **Registro dei trattamenti e fornitori** allineati al codice (sezione 8): mancavano la lista d'attesa e alcune chiavi del browser | 🟠 | Consulente |
| 9 | **Preventivo**: campi compilati tranne quelli che vengono dalla visura (elenco in `RICHIESTA_PREVENTIVO.md`, sezione F) | 🟠 | Titolare |

---

## 2. PR per PR

Stato dei rami letto il 14/10. «Conflitto» = oggi non si unisce pulita a `main`.

| PR | Cosa cambia | Perché | Norma | Domanda precisa per il consulente | Rischio se sbagliato |
|---|---|---|---|---|---|
| **#92** (bozza) | Solo documenti: 13 bozze (Privacy, Cookie, Termini clienti e negozi, Recesso, P2B, DSA, dati aziendali, DPA, registro, data breach, diritti, messaggi commerciali), indice con 26 domande, `DISDETTA_ESERCIZIO_SCONTO.md` | È il pacchetto base allineato alle decisioni del 10-12/10 | GDPR artt. 13, 28, 30, 33; Reg. 2019/1150; Reg. 2022/2065 | Le 26 domande dell'indice (le principali sono riprese qui sotto) | 🟠 Se mancano, i testi pubblici restano quelli vecchi |
| **#95** | Banner senza categoria «Marketing»; «Accetta tutti» non salva più marketing=sì; registro del consenso cancellato dopo 24 mesi (indice TTL + pulizia all'avvio) | Il banner contraddice la Cookie Policy; i 24 mesi erano dichiarati ma non applicati | Art. 122 Codice privacy; Linee guida Garante cookie 10/6/2021; GDPR art. 5.1.e e 7.1 | Il registro con IP e user agent per 24 mesi è giustificato (art. 7.1)? Meglio IP abbreviato? | 🟠 Consenso mal registrato; sanzioni cookie |
| **#100** | Testo di conferma «Non rinnovo» e nuova email di conferma disdetta: sconto da rispettare fino a fine mese, mese pagato non rimborsato | Allinea l'app alla decisione sulla disdetta | Codice civile artt. 1341-1342 (clausole onerose); Reg. 2019/1150 art. 3 | Il riquadro e l'email bastano come informazione chiara? «Mese non rimborsabile» va nella seconda casella da approvare per iscritto? | 🔴 Il negozio può contestare una regola non chiara |
| **#101** | Solo documento: dove la regola della disdetta c'è già e dove manca, 8 punti per il consulente | Controllo di coerenza | Come #100 | Vedi #92 (la versione aggiornata sta lì) | 🟢 Solo carta |
| **#102** | Eliminazione account del negozio con offerta in corso: programmata per il 1° del mese dopo; ripensamento possibile; lavoro notturno 00:20. **Contiene già #100** | Se il negozio sparisce subito, lo sconto non viene rispettato | GDPR art. 12.3 (risposta entro un mese) e art. 17; Termini | La cancellazione che slitta fino a un mese è compatibile con l'art. 12 GDPR? Il rinvio per un motivo contrattuale è ammesso come «limite» al diritto? | 🟠 Cancellazione tardiva |
| **#114** | Pulizia automatica dei dati: scansioni QR 12 mesi, statistiche di visita 13 mesi, sconti usati e mai usati 24 mesi | Durate dichiarate ma non applicate | GDPR art. 5.1.e (limitazione della conservazione) | Le durate sono adeguate? Vanno scritte nella Privacy? | 🟠 Dati tenuti troppo o cancellati troppo presto |
| **#116** | Termini: «Roma e dintorni», art. 3.1 senza servizi futuri, «Nessun vincolo» riscritto (disdetta dal profilo, sconto fino a fine mese), eliminazione negozio dal 1° del mese dopo; Recesso: tolto l'art. «Servizi a pagamento futuri»; email di benvenuto commercianti | Allinea Termini e email a decisioni e codice | Codice del Consumo artt. 52 ss.; artt. 1341-1342 c.c.; P2B | Togliere dal Recesso il richiamo ai 14 giorni è corretto se oggi non pagano consumatori? Il tetto di responsabilità di 12 mesi vale 0 € in fase gratuita: va bene? | 🟠 Testi incoerenti tra loro (vedi sezione 9) |
| **#83** | Termini art. 3.2: prova «60 giorni», pagamento anticipato il 1°, tolleranza, disdetta a fine mese, «IVA inclusa» | Era la prima proposta del 10/10 | Come #116 | Superata: vedi sezione 3 | 🔴 Dice «60 giorni» e «IVA inclusa», contro le decisioni del 12-14/10 |
| **#76** | Solo documento: lettura dei Termini in produzione (3 rischi alti, 6 medi, 3 bassi, 6 clausole mancanti) | Revisione per il consulente | Artt. 1341-1342 c.c.; Codice del Consumo | Le 6 clausole mancanti (forza maggiore, manleva, ruoli privacy, fatturazione, criteri di approvazione, nullità parziale) vanno aggiunte? | 🟢 Parte già superata (prezzo bloccato tolto da #142) |
| **#80** | Solo documenti: `VERIFICA_CONFORMITA.md` (2 rossi, 14 arancioni, 6 gialli) e `DATI_AZIENDA_E_DPA.md` (dati azienda, tabella fornitori) | Controllo di Privacy, Cookie, Recesso e dati societari | GDPR artt. 13, 28, 30; art. 2250 c.c.; D.Lgs. 70/2003 art. 7 | Il punto rosso P1 (LocationIQ) è ora recepito nella bozza 01 di #92; resta da confermare in produzione | 🟠 Informativa incompleta |
| **#40** | Privacy art. 1 e Termini: sede legale (Via Tasso 5/B, Ariano Irpino) e «Roma e dintorni»; test e2e | Dati del titolare | GDPR art. 13.1.a; art. 2250 c.c.; D.Lgs. 70/2003 art. 7 | Il civico «5/B» e l'assenza della PEC bastano finché non arriva la visura? | 🟠 Identificazione incompleta |
| **#81** | Solo documento (non legale in sé): piano di lancio commercianti con 18 controlli di coerenza con Termini e Recesso | Verifica che il piano non prometta cose che i Termini non dicono | Come Termini | Nessuna domanda diretta; il piano parla ancora di «60 giorni» e «IVA inclusa» (da aggiornare) | 🟢 |

Come ho letto i rami: `git diff origin/main...origin/claude/<ramo>`. Il codice del sito non è stato toccato da me.

---

## 3. Sovrapposizioni, conflitti, PR superate: ordine di unione

### 3.1 Cosa si sovrappone

| Caso | Fatto | Rischio |
|---|---|---|
| **#116 contro #142 (già unita)** | #142 ha già messo «€4,99 al mese + IVA» e tolto «Prezzo bloccato». #116 rifà le stesse modifiche (vedi `Termini.jsx`) → **conflitto** su `Termini.jsx` e sul test e2e `10-testi-legali.spec.js` | 🟠 |
| **#116 contro #40** | Entrambe cambiano la frase dell'art. 1 «Garbatella, San Paolo e Marconi» → «Roma e dintorni» (a capo diversi) → conflitto | 🟠 |
| **#83 contro #116 e #142** | #83 riscrive lo stesso art. 3.2 con «60 giorni» e «IVA inclusa»: **contraddice** le decisioni (circa due mesi; + IVA). Conflitto con `main` | 🔴 |
| **#100 dentro #102** | #102 contiene i commit di #100 (verificato: #100 è antenata di #102). Unendo #102 la #100 diventa vuota | 🟢 |
| **#101 dentro #92** | `DISDETTA_ESERCIZIO_SCONTO.md` esiste in entrambe (in #92 è la versione aggiornata: 128 righe contro 121) | 🟢 |
| **#95, #102, #114** | Tutte e tre aggiungono un test alla stessa riga `pytest` di `.github/workflows/ci.yml` e righe a `docs/STATO.md` → conflitti banali; vanno risolti a mano. Dopo ogni risoluzione rileggere `ci.yml` (una sola chiave `run:` per passo) | 🟢 |
| **#102 con #116** | Il testo «dal 1° del mese dopo» dei Termini (#116) è vero solo se il codice di #102 è in produzione: vanno **unite insieme** (lo dice anche #116) | 🔴 |
| **#76, #80, #81 contro `main`** | #76 e #92 e #101 si uniscono pulite; #80 e #81 hanno conflitti su `LISTA_LANCIO.md` e `STATO.md` | 🟢 |
| **#76 in parte superata** | Punto 1 (prezzo bloccato) risolto da #142; punto 4 (zone) risolto da #40/#116; punto 11 (recesso) toccato da #116 | 🟢 |

### 3.2 Ordine di unione proposto (nessuna unione fatta da me; ognuna aspetta OK del titolare e del consulente)

| Passo | PR | Azione | Quando |
|---|---|---|---|
| 0 | **Questa PR** (pacchetto) | Unire per prima: è solo un indice di documenti | Subito dopo l'OK del titolare |
| 1 | **#92** (+ #76, #80, #81) | Solo documenti: **accorpare** nell'archivio `docs/legale/`. #80 e #81: risolvere i conflitti di `LISTA_LANCIO.md`/`STATO.md`; correggere in #81 «60 giorni» e «IVA inclusa» | Dopo l'invio al consulente |
| 2 | **#40** | Unire (pulita su `main`). Prima: confermare il civico dalla visura | Con i testi legali, dopo l'OK del consulente |
| 3 | **#95** | Ribasare, unire. È indipendente dagli altri testi | Prima di accendere il banner nuovo sul sito vero |
| 4 | **#114** | Ribasare, unire **solo dopo** che il consulente ha confermato le durate (cancella dati davvero) | Dopo l'OK del consulente |
| 5 | **#102** (che porta con sé #100) + **#116** ribasata | Unire **insieme**. #116: togliere le parti già in #142 (IVA, prezzo bloccato, test) e quelle di #40 (art. 1); decidere cosa fare dell'art. 6 dei Termini (sezione 9, riga 1) | Dopo l'OK del consulente |
| 6 | Privacy nuova (lista d'attesa, LocationIQ, P.IVA, segnalazioni, durate) | **PR separata** dalla bozza 01 di #92 | **Prima di accendere `PRELAUNCH_MODE`** (almeno la frase della sezione 4) |
| 7 | Termini negozi nuovi (bozza 04), schermata di pagamento (sezione 7) | PR separata | **Insieme** all'accensione dei pagamenti, non prima |

### 3.3 Quali chiudere o accorpare (le chiude il titolare, non io)

| PR | Proposta | Motivo |
|---|---|---|
| **#83** | **Chiudere** (superata) | Detta «60 giorni» e «IVA inclusa»; contro `main` dopo #142; le parti buone (pagamento anticipato, disdetta) sono già in #116 e nella bozza 04 di #92 |
| **#101** | **Chiudere dopo l'unione di #92** | Contenuto già in #92 (versione aggiornata) |
| **#100** | **Accorpare in #102**, poi chiudere | #102 la contiene; oppure unire #100 prima di #102 per due controlli più piccoli |
| **#76** | **Accorpare** (tenere come allegato) e chiudere | Documento di lavoro, in parte superato |
| **#80** | **Accorpare** in `docs/legale/` (i due file restano utili: tabella fornitori) | Nessun testo del sito dentro |
| **#81** | Tenere come documento, **aggiornare** «60 giorni» → «circa due mesi» e «IVA inclusa» → «+ IVA» | Altrimenti contraddice i Termini |
| **#116** | **Tenere ma ribasare** | Contiene modifiche vere ancora non in `main` |

---

## 4. Lista d'attesa pre-lancio (PRELAUNCH_MODE): frase per la Privacy

**Stato:** interruttore spento di default; unito il 14/10 (#130-#143). La Privacy online **non** nomina la lista d'attesa: il modulo rimanda a `/privacy`. 🔴 Se `PRELAUNCH_MODE` si accende prima, chi si iscrive non ha l'informativa dell'art. 13 GDPR.

### 4.1 Controllo frase-per-frase sul codice reale (`backend/server.py` righe 1421-1575, `email_service.py`, `ListaAttesaForm.jsx`)

| Cosa dice la bozza | Codice | Esito |
|---|---|---|
| Casella non preselezionata, consenso obbligatorio | Form: `consenso` parte `false`; server: 400 se manca | Verificato (codice) |
| Doppio consenso: link per email, 48 ore | `WAITLIST_CONFERMA_ORE = 48`; nel DB solo l'impronta del token (sha256) | Verificato (codice) |
| Si conservano email, data e versione del consenso, stato, provenienza generica | Salvati anche `created_at`, `confirmed_at`, `notice_sent_at`, `unsubscribed_at`, `id` e **fino a 20 orari delle ultime richieste** (`req_log`) | Verificato; la bozza lo dice già nel registro |
| Provenienza da elenco fisso | `instagram`, `facebook`, `volantino`, `passaparola`, `diretto`, `altro` | Verificato (codice) |
| «Non salviamo l'indirizzo IP e non usiamo cookie» | Nel database non c'è IP; il limite per dispositivo usa un'impronta tronca dell'IP **solo in memoria**. Il modulo non usa localStorage né cookie | Verificato (codice). **Ma** i log del server (Render) possono contenere l'IP e **l'indirizzo email** (riga `[email:sent] to=...` in `email_service.py`). Quindi scrivere «nel nostro database non salviamo l'IP» e non «non salviamo IP» |
| Non confermate: cancellate dopo 7 giorni | Lavoro delle 03:40 e all'avvio, sulla data del consenso | Verificato (codice) |
| Disiscrizione col link «Annulla l'iscrizione» in ogni email | Presente in conferma e avviso (`_piede_lista_attesa`); pagina `/lista-attesa/annulla` | Verificato (codice) |
| Conferme e disiscritte: tempo di conservazione | **Nessuna cancellazione automatica**: restano senza scadenza. Nessun comando admin per cancellare una singola email | 🔴 Lacuna: la bozza lo segnala come «DA DECIDERE» |
| Solo due email: conferma e un avviso di lancio | `send_waitlist_confirmation` e `send_waitlist_launch_notice`; la conferma può ripartire se la persona si reiscrive (limiti per indirizzo) | Verificato (codice) |
| Fornitore: Resend (DPA necessario) | Invio via Resend, dominio in regione `eu-west-1` (Irlanda) | Codice e `docs/operazioni/TEST_EMAIL_DOMINIO.md`; DPA **da verificare** |
| Solo maggiorenni | La home dice «per maggiorenni (18+)»; l'avviso lo ripete; **il modulo no** | Verificato; suggerimento: ripeterlo vicino alla casella |
| Il titolare è nominato | Il modulo rimanda alla Privacy, che nomina Euro Linea S.r.l.s. | Verificato |

### 4.2 Frase proposta per la Privacy (da aggiungere come nuova voce in art. 2, nella tabella art. 3 e nella lista art. 6)

> **[PROPOSTA] [DA VALIDARE]** *Lista d'attesa «Avvisami quando parte».* Se lasci la tua email nel modulo della lista d'attesa e spunti la casella, la usiamo solo per mandarti un'email per confermare l'iscrizione e, quando Sconti Roma è online, un solo avviso di lancio. Base giuridica: il tuo consenso (art. 6.1.a GDPR), che confermi toccando il link ricevuto per email e che puoi revocare in ogni momento con il link «Annulla l'iscrizione» presente in ogni email, senza conseguenze. Nel nostro database conserviamo l'indirizzo email, la data e la versione del testo del consenso, lo stato dell'iscrizione (da confermare, confermata, annullata), una provenienza generica scelta da un elenco fisso (per esempio «volantino» o «Instagram») e gli orari delle ultime richieste, solo per evitare invii in raffica. Nel database non salviamo l'indirizzo IP e il modulo non usa cookie. Le iscrizioni non confermate sono cancellate dopo 7 giorni. [DA DECIDERE: le iscrizioni confermate e quelle annullate sono cancellate entro **30 giorni dall'avviso di lancio** (proposta); per chi annulla teniamo solo l'indirizzo come elenco di esclusione fino a quel momento.] Le email partono tramite Resend (fornitore di invio, responsabile del trattamento, server in Irlanda). Il servizio è riservato ai maggiorenni (18+). Per cancellare i tuoi dati subito scrivi a privacy@scontiroma.it.

### 4.3 Domande per il consulente

1. 🟠 Un solo consenso («un'email quando Sconti Roma è online») basta per conferma + avviso di lancio, o serve altro per mandare anche il promemoria sui contenuti?
2. 🟠 Durata dopo l'avviso: va bene 30 giorni? Per chi annulla è lecito tenere l'email come elenco di esclusione, e per quanto?
3. 🟠 Basta una Privacy completa, o serve anche una riga breve sotto il modulo (informativa a strati) con titolare e contatto per revocare?
4. 🟠 I log del server con indirizzo email e IP (durata dei log di Render: **da verificare**) vanno citati?

### 4.4 Cosa deve fare il titolare (e cosa non faccio io)
- Prima di accendere `PRELAUNCH_MODE` su Render: la frase sopra deve essere pubblicata (PR a parte, dopo OK del consulente) oppure il consulente deve dire che basta la riga sotto il modulo.
- Il tetto di Resend gratuito (100 email al giorno) e il codice a 80 al giorno sono nel punto 5 della lista (Pro).

---

## 5. P2B e DSA: preavviso e obblighi

| Tema | Regola | Cosa dice il codice/i testi | Verifica | Rischio |
|---|---|---|---|---|
| **Modifiche ai Termini: preavviso minimo** (P2B art. 3.2) | Almeno 15 giorni | Termini art. 9: 15 giorni; Termini 3.2: 30 giorni solo per il prezzo; bozza 04: 30 giorni per tutto | **Da verificare** sul testo ufficiale: la ricerca web non ha mostrato il testo adottato dell'art. 3.2, solo emendamenti; 15 giorni è il valore che indicano le bozze #92 e #80 | 🔴 |
| **Diritto del negozio di disdire durante il preavviso** (P2B art. 3) | Deve poter chiudere senza costi nel periodo | Bozza 04 art. 10: sì | Da verificare (stesso testo) | 🟠 |
| **Sospensione o limitazione di un'offerta** (art. 4.1) | Motivazione scritta su supporto durevole **prima o al momento** dell'effetto | Rifiuto offerta: motivo obbligatorio ≥10 caratteri (codice, 13/10). Sospensione negozio: bozza 04 art. 7 | **Verificato web** (art. 4: «prima o al momento») | 🟠 |
| **Chiusura dell'account** (art. 4.2) | Motivazione almeno **30 giorni** prima, salvo eccezioni (obblighi di legge, violazioni ripetute o gravi) | Bozza 04 art. 7: 30 giorni salvo urgenza | **Verificato web** | 🟠 |
| **Chiarezza, criteri di ordinamento** (artt. 3 e 5) | Termini chiari; criteri principali dell'ordine delle offerte | Elenco ordinato dalla più recente; nessuna corsia a pagamento (bozza 06, letta dal codice) | Codice; norma da verificare | 🟠 |
| **Reclami e mediatori** (artt. 11-12) | Sistema interno di reclami; almeno due mediatori | Scheda «Reclami» nell'area negozio e `info@` (PR #113, già in `main`); la bozza 06 dice che le **piccole imprese** (meno di 50 addetti e fatturato ≤ 10 milioni) sono esentate da artt. 11-12 | Esenzione: da verificare. Il reclamo resta consigliato | 🟠 |
| **DSA: punto di contatto** (artt. 11-12) e **segnalazione** (art. 16) | Contatto per autorità e utenti; modulo di segnalazione; motivazione delle rimozioni (art. 17) | «Segnala questa offerta» e area admin «Segnalazioni» (codice, #113): conferma in 5 giorni lavorativi, esito motivato, nessun IP, 24 mesi | Obblighi per microimprese: da verificare | 🟠 |

**Proposta di allineamento (da validare):** nei Termini dei negozi 30 giorni di preavviso per prezzo e per ogni modifica sostanziale (bozza 04); nei Termini clienti 15 giorni (oggi art. 9). Così il minimo di 15 giorni è sempre rispettato.

**Domande per il consulente:** (1) Sconti Roma è «servizio di intermediazione online» ai sensi del P2B? (2) 15 giorni è il minimo corretto, e vale anche per i soli negozi? (3) Le esenzioni per le piccole imprese valgono per artt. 11-12 e per il DSA art. 19? (4) Siamo «hosting» o «piattaforma online» per il DSA, e basta `info@` come punto di contatto?

---

## 6. Recesso di 14 giorni: solo consumatori

| Persona | Oggi | Regola | Testo |
|---|---|---|---|
| **Cliente (consumatore)** | Gratis, nessun pagamento (`CLIENT_SUBSCRIPTION_REQUIRED=false`) | Il recesso di 14 giorni (Codice del Consumo artt. 52 ss.) nasce solo quando c'è un contratto a pagamento a distanza. Oggi niente da annullare | Recesso online dice già «nulla da annullare»; sezione 3 sul recesso futuro |
| **Negozio (professionista, con Partita IVA)** | Prova gratuita; pagamenti spenti | Nessun recesso del consumatore; contano disdetta a fine mese e Termini | Recesso art. 2; Termini 3.2 |
| **Negozio senza P.IVA** | Il modulo oggi la richiede; il server accetta anche senza (vecchi account) | Se non è professionista potrebbe essere consumatore | 🟠 Domanda 5 dell'indice #92 |

**Proposta [PROPOSTA] [DA VALIDARE] di testo unico (Recesso e art. 6 dei Termini, stesso testo):**
> *Clienti.* Oggi Sconti Roma è gratuito per i Clienti: non c'è nulla da annullare e puoi eliminare l'account quando vuoi. Se in futuro introdurremo servizi a pagamento per i consumatori, avrai 14 giorni per recedere senza dare motivi, con il modulo che pubblicheremo prima dell'attivazione.
> *Commercianti.* I Commercianti aderiscono come professionisti: non hanno il diritto di recesso dei consumatori. Possono disdire quando vogliono (effetto a fine mese, Termini art. 3.2).

**Cose da tenere d'occhio (da verificare):** il «pulsante di recesso» per i contratti a distanza dei consumatori (Direttiva (UE) 2023/2673, in Italia D.Lgs. 209/2025, art. 54-bis Codice del Consumo, dal 19/06/2026): **verificato web** a livello di notizia, **testo da verificare**. Serve solo se un giorno i consumatori pagano. Per i negozi non serve.

**Domanda per il consulente:** 🟢 va bene tenere nel Recesso la sezione sui servizi futuri (come oggi su `main`) o toglierla (come propone #116)? Se si toglie, l'art. 6 dei Termini non deve più rimandare a quella pagina per i dettagli.

---

## 7. Punto 22: testi della schermata di pagamento (PROPOSTA)

Basati sul componente reale `frontend/src/components/PagamentoNegozio.jsx` (compare solo con `MERCHANT_PAYMENT_REQUIRED` acceso; oggi spento). **Nessun addebito senza conferma esplicita** (regola di CLAUDE.md). I negozi sono professionisti: il Codice del Consumo non si applica, ma la chiarezza serve comunque (artt. 1341-1342 c.c.; D.Lgs. 70/2003 art. 12 sulle informazioni prima dell'ordine online: tra professionisti si può derogare, **da verificare**).

### 7.1 Cosa c'è oggi e cosa manca

| Oggi nel componente | Manca | Rischio |
|---|---|---|
| Elenco: importo + IVA, primo addebito, rinnovo il 1°, disdetta, mese non rimborsabile | Chi addebita (Euro Linea S.r.l.s.), quale importo con IVA, il **collegamento ai Termini e alla Privacy** accanto alla casella | 🟠 |
| Casella «Confermo di aver letto queste condizioni e autorizzo l'addebito automatico mensile» | Le condizioni non sono linkate; non cita le clausole da approvare per iscritto | 🟠 |
| Disdici (conferma con testo corretto) | Email di conferma dell'attivazione; email di ricevuta | 🟠 |

### 7.2 Testi proposti [PROPOSTA] [DA VALIDARE]

| Dove | Testo |
|---|---|
| Titolo | **Attiva il pagamento** |
| Riga «Chi» | **Chi ti addebita:** Euro Linea S.r.l.s. (Sconti Roma), tramite Stripe (carta) o PayPal. |
| Riga «Importo» | **Importo:** 4,99 € al mese + IVA (22%: totale 6,09 €). *(l'aliquota e l'arrotondamento vengono dal commercialista: [DA CONFERMARE])* |
| Riga «Primo addebito» | **Primo addebito:** il [data]. Fino ad allora la prova è gratuita e non ti addebitiamo nulla. |
| Riga «Rinnovo» | **Rinnovo:** automatico ogni 1° del mese, finché non disdici. Puoi pagare dal 1° al 5; dopo il 5 la tua offerta parte dal mese dopo. |
| Riga «Disdetta» | **Disdetta:** quando vuoi, dall'app. Vale dalla fine del mese: fino all'ultimo giorno i clienti possono usare il tuo sconto e devi rispettarlo. |
| Riga «Mese pagato» | **Mese già pagato:** non viene rimborsato. |
| Riga «Prezzo» | **Prezzo:** può cambiare solo con 30 giorni di preavviso via email; in quel periodo puoi disdire senza costi. |
| Casella (testo) | ☐ Ho letto i **Termini per i Commercianti** (in particolare gli articoli 3 e 4) e l'**Informativa privacy**, e autorizzo Euro Linea S.r.l.s. ad addebitare 4,99 € + IVA ogni 1° del mese con il metodo che scelgo, fino a mia disdetta. |
| Seconda casella (art. 1341-1342 c.c.) | ☐ Approvo specificamente le clausole sul mese pagato non rimborsabile, sulla disdetta a fine mese, sull'addebito automatico mensile e sulla responsabilità *(elenco esatto: lo decide il consulente)*. Se la seconda casella è già stata spuntata all'iscrizione, mostrare la data in cui è stata data. |
| Pulsanti | **Continua con la carta** · **Paga con PayPal** (disattivati finché la/le caselle non sono spuntate) |
| Dopo il pagamento (messaggio) | Pagamento attivato. Il primo addebito è il [data]. Ti abbiamo mandato una email di conferma. |
| Email di conferma attivazione | **Oggetto:** Pagamento attivato · **Testo:** «Hai attivato il pagamento mensile di 4,99 € + IVA, con primo addebito il [data] e poi ogni 1° del mese. Puoi disdire quando vuoi dall'app (vale dalla fine del mese; fino all'ultimo giorno devi rispettare lo sconto). Il mese pagato non è rimborsabile. Euro Linea S.r.l.s. [P.IVA, DA VISURA: sede].» |
| Promemoria prima del primo addebito (già deciso: 10 e 3 giorni) | «La tua prova finisce il [data]. Se vuoi continuare, attiva il pagamento dall'app. Non ti addebitiamo nulla senza la tua conferma.» |
| Pagamento non riuscito | «Il pagamento del [mese] non è andato a buon fine. Hai tempo fino al 5 per riprovare; dopo la tua offerta parte dal mese dopo.» |

### 7.3 Domande per il consulente
1. 🔴 Una sola conferma (con riepilogo) basta per l'addebito automatico ricorrente, anche per i professionisti? Serve anche la seconda casella?
2. 🔴 «Mese pagato non rimborsabile» e «disdetta a fine mese» vanno approvati specificamente per iscritto?
3. 🟠 L'IVA esposta nella schermata (4,99 € + 22%) è corretta, e il commercialista deve confermare chi emette la fattura (SdI)? (punto 20 della lista)
4. 🟠 Servono informazioni minime precontrattuali (art. 12 D.Lgs. 70/2003)? Si può derogare tra professionisti?
5. 🟠 Ruolo di Stripe e PayPal: **titolari autonomi** (come dice la bozza 09) o responsabili? **Incoerenza** con la Privacy online: l'art. 4 li elenca tra i «Responsabili», l'art. 2 li chiama «titolari autonomi».

---

## 8. Registro dei trattamenti e fornitori reali (allineati al codice)

La bozza 10 di #92 è il registro. Questo è il controllo di quello che manca o non torna rispetto al codice di `main`.

### 8.1 Fornitori reali

| Fornitore | Cosa fa nel codice | Dove sta (fonte) | Ruolo proposto | DPA / trasferimento | Stato | Nei testi online? |
|---|---|---|---|---|---|---|
| **Render** | Server e sito | Francoforte (`render.yaml`, verificato nel file) | Responsabile (art. 28) | Da scaricare dall'account; strumento extra-UE **da verificare** (società USA) | ⬜ DA FARE (punto 6a lista, in corso) | Sì |
| **MongoDB Atlas** | Database | AWS Francoforte `eu-central-1` (`MIGRAZIONE.md`; **da verificare nel pannello**), oggi piano gratuito, poi Flex | Responsabile | Parte del contratto, da scaricare | ⬜ | Sì («region EU») |
| **Resend** | Tutte le email (account, avvisi, lista d'attesa) | Dominio in `eu-west-1` Irlanda (`TEST_EMAIL_DOMINIO.md`) | Responsabile | Da scaricare; società USA | ⬜ | Sì |
| **Aruba** | Dominio, DNS, posta `info@`, `privacy@`, `partner@` (punto 4 lista: fatto con inoltro) | Italia/UE (**da verificare**) | Responsabile | Condizioni del dominio e della posta da leggere | ⬜ | **No** |
| **Google (Gmail)** | La posta inoltrata arriva a una Gmail gratuita (anche richieste privacy) | USA/UE | Responsabile solo con Workspace; con Gmail gratuito il rischio va deciso dal consulente | Nessun DPA con il gratuito | 🟠 DA DECIDERE | **No** |
| **Google (Gemini)** | «Migliora foto» dei negozi | `GEMINI_API_KEY`: funzione compare solo se la chiave c'è (codice); spenta fino al lancio | Responsabile solo a pagamento | Prima di accendere: piano a pagamento + DPA | ⛔ SPENTA | Sì |
| **Google Maps** | Solo il pulsante «Portami qui» (si apre il link) | Link esterno | Titolare autonomo | — | 🟢 | Sì |
| **LocationIQ** | Indirizzi dei negozi → coordinate (server `eu1`; solo il testo dell'indirizzo, dal nostro server) | USA (**da verificare**); attivo solo con `LOCATIONIQ_API_KEY` (la riga «Indirizzi (LocationIQ)» è verde dal 13/10) | Responsabile | DPA da verificare | ⬜ | **No** (🔴 manca in Privacy art. 4 su `main`) |
| **OpenStreetMap / Nominatim** | Immagini mappa (IP del visitatore) e ripiego per gli indirizzi (dal server) | UK | Titolare autonomo | Adeguatezza UK **da verificare** | 🟢 | Sì |
| **Stripe, PayPal** | Pagamenti dei negozi (spenti) | UE | Titolari autonomi (bozza 09) | All'accensione | ⛔ SPENTI | Sì (ma Privacy dice sia «responsabili» sia «titolari autonomi») |
| **UptimeRobot** | Controlla l'indirizzo del sito | — | Nessun dato degli utenti | — | 🟢 | No (non serve) |

Google Fonts: **non** usato (caratteri ospitati da noi).

### 8.2 Righe del registro da aggiungere o correggere (rispetto a #92, bozza 10)

| # | Trattamento | Dati (collezione) | Base | Conservazione | Nota |
|---|---|---|---|---|---|
| **T18 (nuova)** | **Lista d'attesa pre-lancio** | `waitlist`: email, consenso (data, versione `2026-10-v1`), stato, fonte, date, `req_log` (max 20 orari) | Consenso | Non confermate 7 giorni (automatico); **confermate e annullate: nessun limite oggi** → proposta 30 giorni dall'avviso | 🔴 Manca nel registro e nella Privacy |
| **T19 (nuova)** | **Conferma email dei clienti** | `users`: impronta del token (48 ore), non confermati cancellati dopo 7 giorni | Contratto | 7 giorni se non confermato | Manca nella Privacy |
| **T20 (nuova)** | **Log del server** (Render) | Righe `[email:sent] to=<email>` e simili; indirizzi IP nei log tecnici | Legittimo interesse (sicurezza) | **Da verificare** la durata dei log di Render; la Privacy dice «log di sicurezza 12 mesi» | 🟠 Non c'è nulla che li cancelli dal nostro lato |
| **T21 (nuova)** | **Riepilogo settimanale per l'admin** | Solo conteggi, nessun dato personale | — | — | 🟢 |
| **T22 (nuova)** | **Codice del negozio** sul telefono del dipendente | Chiave `sr_codice_negozio_v1`: attestato firmato, 90 giorni, senza dati personali | Tecnico | 90 giorni | Manca nella Cookie Policy |
| **T7 (correggere)** | Registro del consenso | `consent_logs`: azione, preferenze, IP, user agent | Obbligo | **24 mesi: in `main` NON applicato** (solo in #95) | 🟠 Dichiarato nella Cookie Policy ma non vero finché non si unisce #95 |
| **T4, T8 (correggere)** | Scansioni QR, statistiche | — | — | In `main` **nessuna cancellazione automatica** (solo #114) | 🟠 |
| **T14 (completare)** | Attribuzione | `referral_merchant_id`, `referral_captured_at`, `fonte_iscrizione`, `fonte_iscrizione_at` nel browser (30 giorni); `fonte_iscrizione` anche nell'account | Legittimo interesse | 30 giorni nel browser | La Cookie Policy elenca solo `referral_merchant_id`: mancano `referral_captured_at`, `fonte_iscrizione`, `fonte_iscrizione_at` |

### 8.3 Chiavi del browser non nella Cookie Policy

Nel codice ci sono, ma l'elenco della Cookie Policy online non le cita: `referral_captured_at`, `fonte_iscrizione`, `fonte_iscrizione_at`, `sr_codice_negozio_v1`, `sr_da_fare_non_adesso_v1`, `sr_interesse_zona`. 🟠 Il consulente decide se sono «tecniche» (nessun consenso) e se vanno elencate. `sr_vid` è citato correttamente come «funzionale con consenso».

---

## 9. Incoerenze tra testi legali e codice (da decidere)

Fonte: lettura di `Termini.jsx`, `PrivacyPolicy.jsx`, `CookiePolicy.jsx`, `Recesso.jsx` e codice di `main` (14/10).

| # | Testo online | Realtà / altro testo | Rischio | Proposta |
|---|---|---|---|---|
| 1 | **Termini art. 6** rimanda alla pagina Recesso per i servizi a pagamento ai consumatori | Se si unisce #116 da sola, quell'articolo del Recesso sparisce | 🟠 | Unire come testo unico della sezione 6 |
| 2 | **Termini art. 1**: «Garbatella, San Paolo e Marconi» | Il sito dice «Roma e dintorni» (home, kit, locandine) | 🟠 | #40 + #116 (una sola modifica) |
| 3 | **Termini 3.2**: «Nessun vincolo ... scegliendo "Non rinnovo"» | Decisione: disdetta a fine mese, sconto da rispettare, mese non rimborsabile (#100, #116) | 🔴 | #116 e bozza 04 |
| 4 | **Termini art. 5**: «L'eliminazione rimuove subito il negozio» | Decisione B: dal 1° del mese dopo (#102, non unita) | 🟠 | #102 + #116 insieme |
| 5 | **Termini 3.2**: «Preavviso di 30 giorni prima della fine della fase di lancio» | L'app manda promemoria a 10 e 3 giorni; la prova dura da 49 a 81 giorni | 🟠 | Allineare: «ti scriviamo 10 e 3 giorni prima» |
| 6 | **Termini art. 9**: 15 giorni per le modifiche | 3.2 dice 30 giorni per il prezzo | 🟢 | Un solo numero (sezione 5) |
| 7 | **Privacy art. 4** elenca Stripe e PayPal tra i «Responsabili» | Privacy art. 2 li dice «titolari autonomi»; la bozza 09 «titolari autonomi» | 🟠 | Scegliere un ruolo |
| 8 | **Privacy**: manca **LocationIQ** | Il codice lo usa (server `eu1`) quando c'è la chiave | 🔴 | Bozza 01 di #92 |
| 9 | **Privacy**: manca la **lista d'attesa** | Raccoglie email (codice) | 🔴 | Frase sezione 4 |
| 10 | **Privacy**: manca la **Partita IVA** dei negozi e le **segnalazioni/reclami** (24 mesi, nessun IP) | Il modulo e il server li trattano | 🟠 | Bozza 01 di #92 |
| 11 | **Privacy art. 6**: «Log di sicurezza: 12 mesi» | Nessun codice cancella i log; i log contengono IP ed email dei destinatari | 🟠 | Verificare Render; tenere solo ciò che serve |
| 12 | **Privacy art. 6**: cancellazione «subito» | Backup di Atlas (quando ci saranno) conservano copie | 🟢 | Aggiungere «copie di sicurezza entro … giorni» |
| 13 | **Cookie Policy art. 4**: registro consenso 24 mesi | `main` non lo cancella; contiene IP | 🟠 | #95 |
| 14 | **Cookie Policy** non cita il banner «Marketing»; il banner `main` lo mostra e «Accetta tutti» salva `marketing: true` | Contraddizione viva | 🟠 | #95 |
| 15 | **Cookie Policy**: chiavi mancanti | Sezione 8.3 | 🟠 | Aggiornare la tabella |
| 16 | **Privacy art. 1 / Termini intro**: nessuna sede né PEC | Obblighi art. 2250 c.c. e D.Lgs. 70/2003 | 🟠 | #40 + visura |
| 17 | **Privacy**: «database crittografato at-rest», «TLS» | Non verificabile dal codice | 🟢 | Controllare nel pannello Atlas |
| 18 | **Cookie Policy**: «Google Fonts» non c'è (corretto); **Privacy** nomina «Google LLC (Gemini)» tra i fornitori attuali | Gemini è spento | 🟢 | Aggiungere «oggi spento» |
| 19 | **Recesso art. 1**: richiesta via email evasa in 3 giorni lavorativi | Eliminazione dall'app immediata; email: tempo di legge un mese | 🟢 | Va bene; citare il mese |
| 20 | **Recesso** e **Termini** non dicono nulla di chi è la P.IVA «senza P.IVA» | Il server accetta ancora registrazioni senza P.IVA (vecchi account e test) | 🟠 | Decisione del titolare |

---

## 10. Cosa deve fare il titolare

| # | Azione | Scadenza |
|---|---|---|
| 1 | Dare l'OK a questo pacchetto e decidere cosa chiudere (sezione 3.3) | 17/10 |
| 2 | **Visura camerale** (punto 3 della lista): vedi l'elenco in `RICHIESTA_PREVENTIVO.md`, sezione F | Prima di inviare il preventivo |
| 3 | Decidere: 30 giorni di conservazione per la lista d'attesa dopo l'avviso (sezione 4) | Prima di accendere `PRELAUNCH_MODE` |
| 4 | Scegliere il ruolo di Stripe/PayPal e che fare con Gmail gratuito (sezioni 7.3 e 8.1) | Prima del lancio |
| 5 | Decidere se i negozi **senza Partita IVA** sono ammessi | Prima del lancio |
| 6 | Controllare nei pannelli (io non posso): regione di Atlas, durata dei log di Render, DPA di Render/Atlas/Resend/Aruba | Con i punti 5-6 della lista |
| 7 | Inviare lui il preventivo (2-3 studi, uno alla volta) | Dopo la visura |

**Cosa deve solo validare il consulente:** i testi con `[PROPOSTA]` di questo documento, le 26 domande di #92 e le domande delle sezioni 4-7.

## 11. Cosa non ho potuto verificare

| Cosa | Perché |
|---|---|
| Testo ufficiale P2B art. 3.2 (15 giorni) e art. 11-12 (esenzione piccole imprese) | Ricerca web: ho trovato l'art. 4 (30 giorni, **verificato**), non il testo adottato dell'art. 3.2 |
| Art. 54-bis Codice del Consumo (pulsante di recesso) | Una sola fonte, testo non letto |
| Contratti (DPA) e sede dati di Render, Atlas, Resend, Aruba, LocationIQ | Siti dei fornitori e pannelli non raggiungibili |
| Regione reale del cluster Atlas, durata dei log Render, quale piano Resend è in uso | Servono i pannelli del titolare |
| Se `PRELAUNCH_MODE` e `LOCATIONIQ_API_KEY` sono impostati in produzione | Non leggo il server vero (regola: mai scrivere né toccare la produzione) |
| Dati societari (REA, capitale, PEC, civico, CF, rappresentante) | Serve la visura |
| Prove da iPhone dei testi (banner, schermata di pagamento) | Nessun iPhone in questa sessione |

Tutto il resto dipende da codice di `main` o dei rami PR, letto da me il 14/10/2026.
