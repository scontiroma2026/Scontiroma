# 09 - Fornitori: nomina a responsabili (art. 28 GDPR) e trasferimenti extra-UE

> **Rischio: 🟠 medio: Gmail gratuito per privacy@ senza DPA finché non c'è il secondo account Google; strumenti di trasferimento da verificare.**
> **[PROPOSTA] [DA VALIDARE]** - Elenco di lavoro. I dettagli dei contratti (nome del documento, dove si accetta, data) vanno **verificati sul sito/pannello di ciascun fornitore**: qui non sono inventati. Nessuna chiave o credenziale in questo file.

## 1. Tabella dei fornitori
| Fornitore | Ruolo | Dati che riceve | Sede dati | Cosa fare | Stato |
|---|---|---|---|---|---|
| Render | Responsabile (hosting server e sito) | Tutti i dati in transito, log tecnici | UE (Francoforte, `render.yaml`) | Accettare/scaricare il DPA dal proprio account e salvarlo; annotare la durata dei log | [DA COMPLETARE] |
| MongoDB Atlas | Responsabile (database) | Tutti i dati dell'app | [DA COMPLETARE: regione del cluster] | Scaricare il DPA (di norma parte del contratto); annotare backup e durata | [DA COMPLETARE] |
| Resend | Responsabile (email) | Email, nome, testo del messaggio | UE per l'invio, società USA | DPA e strumento di trasferimento; verificare il dominio mittente | [DA COMPLETARE] |
| LocationIQ | Responsabile (indirizzi dei negozi) | Testo degli indirizzi | USA (server `eu1`) | **Mancante nell'informativa attuale (punto rosso).** DPA e strumento | [DA COMPLETARE] |
| OpenStreetMap Foundation (tile e Nominatim) | Titolare autonomo | IP del visitatore (tile); indirizzo dal server (Nominatim) | UK | Già in Privacy | OK |
| Protomaps | Nessun dato (file di mappa ospitato da noi) | - | - | Verificare che il file sia presente | [DA VALIDARE] |
| Aruba | Responsabile (dominio, DNS, posta) | Posta `info@`, `privacy@`, `partner@` | UE | Verificare condizioni del dominio e della posta | [DA COMPLETARE] |
| Gmail (inoltro posta) | La posta (anche `privacy@`) arriva a un account Google | Richieste degli utenti, anche privacy | USA/UE | **Decisione del titolare:** resta Gmail gratuito (senza DPA) **finché non c'è il secondo account Google**, poi Google Workspace con DPA. Il consulente valuta il rischio nel frattempo | **[DA VALIDARE: consulente]** |
| Google (Gemini) | Funzione **spenta oggi; da accendere solo dopo il lancio** | Foto delle offerte, se acceso | USA/UE | Non accendere senza piano a pagamento con termini sul trattamento dei dati, DPA e aggiornamento dell'informativa | SPENTA |
| Stripe | Titolare autonomo (pagamenti con carta, addebito mensile automatico il 1°) [DA VALIDARE: ruolo] | Dati di pagamento, Partita IVA, email | UE | Pagamenti **spenti**; riverificare all'accensione (contratto, IVA addebitata) | SPENTO |
| PayPal | Titolare autonomo (pagamenti PayPal) [DA VALIDARE: ruolo] | Dati di pagamento, email | UE | Come sopra | SPENTO |
| UptimeRobot | Non riceve dati degli utenti | Indirizzi del sito, email di chi ha l'account | - | Usare l'email di Sconti Roma | OK |

## 2. Trasferimenti extra-UE: scheda per fornitore
Per ciascuno annotare lo **strumento** (decisione di adeguatezza / certificazione EU-US Data Privacy Framework / Clausole Contrattuali Standard) e la **data di verifica**.
| Fornitore | Strumento | Data verifica |
|---|---|---|
| Render | [DA COMPLETARE] | [DA COMPLETARE] |
| MongoDB | [DA COMPLETARE] | [DA COMPLETARE] |
| Resend | [DA COMPLETARE] | [DA COMPLETARE] |
| LocationIQ | [DA COMPLETARE] | [DA COMPLETARE] |
| Gmail / Google (gratuito; poi Workspace) | [DA COMPLETARE] | [DA COMPLETARE] |
| Stripe, PayPal (spenti) | [DA COMPLETARE all'accensione] | [DA COMPLETARE] |
| OpenStreetMap Foundation (UK) | Decisione di adeguatezza UK [DA VALIDARE: validità] | [DA COMPLETARE] |
Valutazione d'impatto del trasferimento (TIA): per i fornitori USA non certificati. **[DA VALIDARE]**

## 3. Testo-tipo della nomina a responsabile (se il fornitore non ha già un DPA) [PROPOSTA]
«Il Titolare (Euro Linea S.r.l.s.) nomina il Fornitore responsabile del trattamento ai sensi dell'art. 28 GDPR per [servizio]. Il Fornitore: tratta i dati solo su istruzioni documentate; garantisce la riservatezza delle persone autorizzate; adotta misure di sicurezza adeguate (art. 32); non ricorre a sub-responsabili senza autorizzazione; assiste il Titolare per le richieste degli interessati e per le violazioni dei dati (avviso senza ritardo e comunque entro [DA COMPLETARE: es. 24-48 ore]); alla fine del servizio cancella o restituisce i dati; consente verifiche. Durata: quella del servizio. Dati e finalità: come da registro dei trattamenti.»

## 4. Persone autorizzate (art. 29)
| Ruolo | Accesso | Dati visibili | Istruzioni |
|---|---|---|---|
| Titolare / amministratore | Area `/admin` (password + seconda password) | Nome, cognome, email, iscrizioni, scansioni non valide, valutazioni | Non copiare dati fuori dall'app, non condividerli, accedere solo da dispositivi propri, uscire dopo l'uso |
| Altre persone | [DA COMPLETARE: nessuna oggi] | - | Incarico scritto prima di dare qualsiasi accesso |

## 5. Commercianti e Clienti: ruolo
I dati del Commerciante (anche la **Partita IVA**, obbligatoria) li trattiamo noi come titolari. Il Commerciante è **titolare autonomo** dei dati che vede alla scansione (nome e iniziale del cognome) per verificare lo sconto; non c'è DPA con lui, ma obbligo contrattuale di uso limitato (Termini). **[DA VALIDARE: titolari autonomi o contitolari (art. 26)?]**
