# Sicurezza degli account: checklist fornitore per fornitore

Ultimo aggiornamento: 14/10/2026. Scritta per iPhone. Si usa insieme alla **scheda fornitore** (`docs/operazioni/SCHEDA_FORNITORE.md`, PR #145: dieci controlli uguali per ogni fornitore). Qui si approfondiscono i controlli **3 (chiavi e accessi)**, **8 (backup)**, **9 (avvisi)** e **10 (chiusura)**.

**Regole:** niente password, chiavi, codici di recupero o ID di recupero in questo file, in chat o in PR (repository pubblico). Qui si scrivono solo date ed esiti. Nessun accesso, nessun cambio di impostazioni è stato fatto da Claude per scrivere questa pagina.

**DPA dei fornitori (controllo 5 della scheda): IN SOSPESO per decisione del titolare.** Non si fanno ora; restano nella voce 5 della lista di lancio.

## 1. Le regole uguali per tutti (si fanno una volta per account)
1. **Verifica a due passaggi (2FA):** app di autenticazione o passkey. SMS solo se non c'è altro.
2. **Codici di recupero su carta:** stampati o scritti a mano, una pagina per servizio (servizio, email dell'account, data), in un posto chiuso a chiave; seconda copia in busta chiusa dalla persona di fiducia. Un codice usato si sbarra e se ne generano di nuovi. Mai foto, mai chat, mai email.
3. **Password nel gestore** (quello di iPhone, «Password») con password principale lunga e mai riusata. Una password diversa per ogni servizio.
4. **Persona di fiducia:** una sola persona adulta, nome **non** scritto nel repository. Dettagli (cosa sa, cosa può fare, quando si apre la busta) nella sezione 5 di `EMERGENZE_E_ACCESSI.md` (PR #128, ancora aperta). Meglio un invito personale con ruolo limitato (GitHub, Render, Atlas) invece di condividere password.
5. **App autorizzate:** una volta per servizio, rivedere «App/Applicazioni autorizzate» e togliere ciò che non si riconosce o non si usa più.
6. **Chiavi:** cancellare quelle mai usate; **ruotare** quelle passate da posti non sicuri.

Ordine di importanza: **posta Google di Sconti Roma → Aruba → GitHub → Render → Atlas** (chi entra nella posta reimposta tutto il resto), poi Resend, Stripe/PayPal, Meta, il resto.

## 2. Fornitore per fornitore

Colonne: **2FA** (stato noto) · **Recupero/persona di fiducia** · **Chiavi da ruotare o cancellare** · **App autorizzate/altri accessi** · **Nota**.
Lo stato noto viene dal registro della scheda fornitore e da `STATO.md`; dove non c'è scritto «da verificare» perché da qui non posso entrare.

### Google (posta, Drive, Gemini)
- **2FA:** da verificare; passkey consigliata. **Recupero:** codici su carta + numero/email di recupero che siano **tuoi** (non quelli di Sconti Roma).
- **Chiavi:** `GEMINI_API_KEY` è stata **tolta da Render** (spenta fino al lancio): quando si riaccende, prima budget a 5 €/mese con avvisi, poi chiave nuova (non riusare la vecchia).
- **App autorizzate:** Google Account → Sicurezza → «App di terze parti con accesso all'account»: togliere quelle non riconosciute (anche vecchi collegamenti a strumenti di assistenti).
- **Nota:** il Gmail gratuito non ha DPA (vedi sopra: in sospeso). Il secondo account Google non si riesce a creare: per ora l'inoltro va alla Gmail personale, quindi **proteggere la Gmail personale come se fosse quella di Sconti Roma**.

### Aruba (dominio e posta in arrivo)
- **2FA:** da verificare se Aruba la offre per l'Area Clienti; se non c'è, password lunga e unica + email di contatto sotto controllo.
- **Recupero:** dati intestatario del dominio; la password della casella `postmaster` è bloccata (assistenza Aruba). **Persona di fiducia:** la scadenza del dominio (21/08/2027) è il rischio più grave; deve sapere dove sta.
- **Chiavi:** nessuna API. **Altri accessi:** controllare che l'email di contatto del dominio sia quella di Sconti Roma e che il rinnovo automatico abbia una carta valida. Non toccare i record `send` (Resend) né gli MX.

### GitHub (codice, controlli, PR)
- **2FA:** da verificare; passkey o app + codici di recupero.
- **Chiavi/token:** Settings → Developer settings → Personal access tokens: cancellare i vecchi; Settings → Applications → «Authorized OAuth Apps» e «Installed GitHub Apps»: rivedere (Render, strumenti degli assistenti). Il repository è **pubblico**: ogni segreto finito in un commit è bruciato anche dopo averlo tolto (si ruota sempre).
- **Altri accessi:** Settings del repository → Collaborators: devono esserci solo persone note. Deploy keys e Actions secrets: elencare e togliere quelli inutili.
- **Nota:** se il repository diventa privato, vedi `REPO_PRIVATO.md`.

### Render (server e sito)
- **2FA:** da verificare (app di autenticazione).
- **Chiavi:** sono nelle variabili d'ambiente del servizio (`MONGO_URL`, `RESEND_API_KEY`, password admin, `ADMIN_RECOVERY_ID`, `LOCATIONIQ_API_KEY`, Stripe/PayPal quando ci saranno). Ruotare subito se una è mai passata in chat o in un log. `JWT_SECRET` cambiato = tutti gli utenti disconnessi (fare solo se necessario, fuori orario).
- **App autorizzate:** Account Settings → collegamento GitHub: deve avere accesso solo al repository di Sconti Roma.
- **Altri accessi:** membri del team e chiavi API di Render. Eliminare le copie vecchie `scontiroma-api`/`scontiroma-web` (decisione del 10/10).

### MongoDB Atlas (database)
- **2FA:** da verificare (app di autenticazione).
- **Chiavi:** la password dell'utente `prova` è stata cambiata l'11/10. Ogni utente del database ha una sua password: elencarli (Database Access) e cancellare quelli non usati. Se cambia la password dell'utente del server, aggiornare `MONGO_URL` in Render (mai in chat).
- **Altri accessi:** «Network Access» (indirizzi consentiti): oggi aperto a tutti per il piano Starter di Render (non ha IP fisso); la protezione è la password lunga. Revisione di «Organization → Access Manager» e delle API key di Atlas.
- **Backup (controllo 8):** vedi runbook: Flex, poi prova di ripristino prima del lancio.

### Resend (email)
- **2FA:** **manca** (registro 14/10): attivarla.
- **Chiavi:** il registro del 14/10 dice «chiavi pulite». Tenere una sola chiave per il server; se ne servono altre, con permessi minimi. **App autorizzate:** ok (14/10); riguardare «OAuth grants» dopo ogni collegamento di assistenti.
- **Altro:** controllo del mittente e del dominio in `TEST_EMAIL_DOMINIO.md`.

### Stripe e PayPal (spenti)
- **Prima di accendere:** account Business intestati all'azienda; 2FA con app obbligatoria; IBAN controllato; chiavi **vere** solo il giorno dell'accensione, chiavi di prova (sandbox) solo sul sito di prova.
- **Dopo:** ruotare il segreto del collegamento delle notifiche (webhook) se si sospetta un'esposizione; elenco app autorizzate; ricevute ≠ fatture (commercialista).

### Meta (Facebook e Instagram `sconti.roma`)
- **2FA:** app di autenticazione (non SMS). **Recupero:** codici su carta; persona di fiducia come amministratore secondario della Pagina (ruolo limitato).
- **App autorizzate:** Impostazioni → «App e siti web»: togliere ciò che non si riconosce, incluso il collegamento per pubblicare tramite Composio (dopo il lancio, rivedere se serve ancora).

### ElevenLabs, LocationIQ, UptimeRobot, Composio
- **ElevenLabs:** 2FA dove c'è; chiave API: solo se usata, altrimenti cancellarla; crediti non si spendono senza permesso.
- **LocationIQ:** una chiave (`LOCATIONIQ_API_KEY`); limitarla al dominio se il pannello lo permette; ruotare se esposta.
- **UptimeRobot:** account con email di Sconti Roma; avvisi su email e app.
- **Composio:** rivedere i collegamenti attivi (Meta, GitHub, ecc.) e revocare quelli non necessari; chi entra qui può usare i servizi collegati.

### Emergent (progetto dormiente)
Vedi `EMERGENT_DISMISSIONE.md`: revocare `EMERGENT_LLM_KEY`, controllare che nessun servizio Sconti Roma la usi (il codice non la usa), archiviare/eliminare i progetti.

## 3. Elenco compatto delle chiavi
| Chiave (nome) | Dove sta | Quando ruotarla |
|---|---|---|
| `MONGO_URL` (password utente Atlas) | Render | se mai passata in chat/log; ogni sei mesi |
| `RESEND_API_KEY` | Render | se esposta; dopo il passaggio a Pro, una chiave nuova con permessi minimi |
| `ADMIN_PASSWORD`, `ADMIN_MASTER_PASSWORD`, `ADMIN_RECOVERY_ID` | Render + gestore password + carta | se mai condivise; ogni anno |
| `JWT_SECRET` | Render | solo se esposto (disconnette tutti) |
| `LOCATIONIQ_API_KEY` | Render | se esposta |
| `GEMINI_API_KEY` | **assente** (spenta) | prima di riaccenderla: chiave nuova + budget |
| Stripe / PayPal | non impostate | il giorno dell'accensione, chiavi nuove; ruotare il segreto dei webhook se serve |
| `EMERGENT_LLM_KEY` | non su Render né nel repository | **revocare** (voce della lista di lancio) |

## 4. Ordine suggerito (domenica 18/10, 30 minuti per fornitore al massimo)
1. Google + Gmail personale (2FA, recupero, app autorizzate).
2. Aruba (2FA o password nuova, contatto del dominio).
3. GitHub (2FA, token, app).
4. Render, Atlas (2FA, utenti, accessi di rete).
5. Resend (2FA mancante).
6. Meta, poi tutto il resto.
7. Carta: una busta con i codici di recupero dei primi tre.
Dopo ogni fornitore: segnare data ed esito nel **Registro** della scheda fornitore (senza segreti).
