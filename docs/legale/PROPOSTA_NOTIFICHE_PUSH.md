# Proposta: notifiche push per commercianti e clienti — righe per Privacy e Cookie [DA VALIDARE]

> Bozza preparata da Claude (non è un parere legale). Da far vedere al consulente prima di accendere
> l'interruttore `PUSH_UTENTI_ENABLED` su Render. Le pagine del sito (`frontend/src/pages/legal/*`) **non** sono
> state toccate: qui ci sono solo le righe proposte, marcate `[PROPOSTA]`.

Legenda rischio: 🔴 alto, da sistemare prima di accendere · 🟠 medio, da valutare col consulente · 🟢 basso.

## Punti di rischio (in cima, come richiesto)

| # | Punto | Rischio | Proposta |
|---|---|---|---|
| 1 | Privacy e Cookie oggi non parlano di notifiche push: accendere l'interruttore prima di aggiornarle sarebbe un trattamento non descritto | 🔴 | Accendere solo dopo l'OK del consulente su queste righe |
| 2 | Le notifiche «offerte» sono comunicazioni promozionali: serve consenso libero, specifico, separato e revocabile (art. 6.1.a e 7 GDPR; art. 130 Codice privacy per analogia con le comunicazioni elettroniche) | 🟠 | Fatto nel codice: casella separata, NON preselezionata, revoca con un tocco, data/ora e versione del testo salvate (`push_consenso.offerte`, più una riga in `consent_logs`). Il consulente conferma che basta |
| 3 | I fornitori dei servizi push (Apple, Google, Mozilla, Microsoft) ricevono l'indirizzo dell'iscrizione e il contenuto cifrato; alcuni sono fuori UE | 🟠 | Il contenuto è cifrato da noi (Web Push, RFC 8291) e non contiene dati personali; li indichiamo come destinatari/terze parti del browser. Il consulente decide se vanno nominati come responsabili o se sono «titolari autonomi» del servizio del browser (proposta: soggetti autonomi, come il browser stesso) |
| 4 | L'iscrizione (indirizzo dell'iscrizione + chiavi del browser) resta salvata finché l'utente non la toglie, il browser non la invalida (404/410) o l'account non viene cancellato: nessuna scadenza automatica | 🟠 | Proposta: aggiungere una cancellazione automatica delle iscrizioni senza invii riusciti da 12 mesi (non fatto in questa PR: decide il titolare) |
| 5 | Le notifiche «servizio» (sconto in scadenza, esito dell'offerta) poggiano sul contratto, ma il permesso del telefono è comunque richiesto: le abbiamo comunque rese facoltative (casella spenta) | 🟢 | Va bene così: più prudente del minimo |
| 6 | Notifica serale al commerciante con il numero di clienti del giorno: solo un numero, mai nomi | 🟢 | Nessuna modifica |
| 7 | Service worker `/sw-push.js`: non è un cookie, ma è «memorizzazione sul dispositivo» (art. 122 Codice privacy). È strettamente necessario a un servizio chiesto dall'utente e si registra solo dopo il suo tocco | 🟢 | Una riga nella Cookie Policy tra gli strumenti tecnici |

## Cosa fa davvero il codice (fotografia)

- **Interruttore**: `PUSH_UTENTI_ENABLED` (predefinito `false`). Spento = gli indirizzi `/api/push/*` rispondono 404, il riquadro non compare, nessun invio.
- **Dati salvati** (MongoDB Atlas, UE):
  - `push_iscrizioni`: indirizzo dell'iscrizione fornito dal browser, due chiavi pubbliche del browser, id utente, ruolo, date. Massimo 10 dispositivi per utente.
  - sull'utente cliente `push_consenso.servizio` e `push_consenso.offerte` = {attivo, data/ora, versione del testo} e le zone scelte; in `consent_logs` una riga per ogni cambio (senza IP).
  - `push_coda`: notifiche promozionali in attesa (id utente, negozio, offerta).
  - `push_inviati`: segni «già inviato» per evitare doppioni; si cancellano da soli dopo 3–60 giorni.
- **Contenuto delle notifiche**: titolo del tipo «Offerta approvata: <titolo offerta>», «Nuova offerta nella tua zona», nome del negozio e titolo dell'offerta. Mai nome, email o altri dati del destinatario o di altri utenti. Nel rifiuto non c'è il motivo.
- **Limiti**: promozionali al massimo 1 al giorno per cliente, mai tra 21:00 e 9:00 (ora di Roma; accodate e inviate dopo).
- **Cancellazione account**: iscrizioni, coda e segni di invio dell'utente si cancellano insieme all'account; resta solo il conteggio anonimo in `cancellazioni_account`.
- **Fornitori**: il server manda la notifica cifrata al servizio push del browser dell'utente: Apple (Safari/iPhone), Google (Chrome/Android), Mozilla (Firefox), Microsoft (Edge).

## [PROPOSTA] Privacy Policy

### Sezione 2 «Dati che raccogliamo» — riga da aggiungere
> **Notifiche sul telefono (facoltative).** Se attivi le notifiche, salviamo l'indirizzo tecnico che il tuo
> browser ci fornisce per recapitarle e le relative chiavi pubbliche (non il numero di telefono). Per i clienti salviamo anche le scelte fatte (avvisi sul servizio, nuove offerte, zone), con
> data, ora e versione del testo accettato. [DA VALIDARE]

### Sezione 3 «Finalità e basi giuridiche» — righe da aggiungere alla tabella
| Finalità | Base giuridica |
|---|---|
| Notifiche di servizio sul telefono ai commercianti (offerta approvata o da correggere, offerta in scadenza, numero di clienti del giorno) e ai clienti (sconto preso e non ancora usato in scadenza) | Esecuzione del contratto (art. 6.1.b GDPR); attivabili e disattivabili in ogni momento dall'app [DA VALIDARE] |
| Notifiche promozionali sul telefono ai clienti (nuova offerta di un negozio seguito o nelle zone scelte; al massimo una al giorno, mai tra le 21 e le 9) | Consenso (art. 6.1.a GDPR), separato e revocabile subito dall'app con «Disattiva tutto» o togliendo la spunta [DA VALIDARE] |

### Sezione 4 «Fornitori esterni» — paragrafo da aggiungere
> **Servizi di notifica dei browser.** Per recapitare le notifiche usiamo il servizio push del browser che hai
> scelto: Apple (Safari su iPhone/Mac), Google (Chrome e Android), Mozilla (Firefox) o Microsoft (Edge). Il
> contenuto della notifica è cifrato e non contiene tuoi dati personali; questi fornitori vedono solo l'indirizzo
> tecnico dell'iscrizione e il momento dell'invio, secondo le loro informative. [DA VALIDARE: ruolo dei fornitori]

### Sezione 5 «Trasferimenti extra-UE» — riga da aggiungere
> I servizi push di Apple, Google, Mozilla e Microsoft possono trattare l'indirizzo tecnico dell'iscrizione anche
> fuori dall'UE (Stati Uniti), con le garanzie da loro adottate (EU-US Data Privacy Framework / clausole
> contrattuali standard). [DA VALIDARE]

### Sezione 6 «Periodo di conservazione» — riga da aggiungere
> Iscrizioni alle notifiche: finché non le disattivi, finché il browser non le invalida o fino alla cancellazione
> dell'account. Scelte sulle notifiche (consensi): per tutta la durata dell'account, come prova del consenso.
> Notifiche promozionali in coda: al massimo fino all'invio del giorno dopo. [DA VALIDARE; vedi rischio 4]

### Sezione 7 «I tuoi diritti» — frase da aggiungere
> Puoi revocare in ogni momento il consenso alle notifiche promozionali dall'area «Il tuo account → Notifiche»,
> senza conseguenze sul resto del servizio. [DA VALIDARE]

## [PROPOSTA] Cookie Policy

### Sezione 2 «Cookie che utilizziamo» — riga da aggiungere tra gli strumenti tecnici
| Nome | Tipo | Finalità | Durata |
|---|---|---|---|
| `sw-push.js` (service worker) e iscrizione push del browser | Tecnico, memorizzazione sul dispositivo | Ricevere le notifiche che hai chiesto; si installa solo quando tocchi «Attiva notifiche» o spunti una casella del riquadro «Notifiche» | Finché non disattivi le notifiche o non cancelli i dati del sito dal browser |

Nota per il consulente: è uno strumento strettamente necessario a un servizio richiesto espressamente
dall'utente (art. 122 c.1 Codice privacy), quindi non richiede il banner; il consenso alle notifiche
promozionali è raccolto a parte, nell'app. [DA VALIDARE]

## Domande per il consulente
1. 🟠 Le righe sopra bastano o serve un'informativa breve dentro il riquadro «Notifiche» (oltre al link alla Privacy)?
2. 🟠 Ruolo di Apple/Google/Mozilla/Microsoft: soggetti autonomi o responsabili? (proposta: autonomi)
3. 🟠 Conservazione delle iscrizioni: va bene «fino a revoca/cancellazione» o serve una scadenza (es. 12 mesi senza invii)?
4. 🟢 Va bene trattare come «servizio» (contratto) l'avviso «Il tuo sconto scade domani»?
