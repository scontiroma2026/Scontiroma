# Protezione dalle registrazioni false in massa

Ultimo aggiornamento: 13/10. Test: `backend/tests/test_protezione_registrazioni.py` (database finto, nessun dato reale).
Per vedere la tabella dei risultati (dalla cartella `backend`): `TEST_MONGO_URL=mongomock://x python3 -m pytest tests/test_protezione_registrazioni.py -o addopts="" -q -p no:cacheprovider -s`

## 1. Cosa esisteva già

| Punto | Protezione presente |
|---|---|
| Registrazione (clienti e commercianti) | Termini/Privacy/Cookie obbligatori (`legal_accepted`, controllato dal server); la casella «ho almeno 18 anni» è obbligatoria sul sito; email già usata rifiutata; password minimo 6 caratteri; commercianti: telefono obbligatorio, Partita IVA con cifra di controllo (se indicata). **Nessun limite sul numero di registrazioni, nessuna verifica dell'email, nessun honeypot né captcha.** |
| Accesso | 5 errori e blocco di 15 minuti per account; stesso limite per email inesistenti (`login_guard`: si salva solo l'impronta dell'email, scade dopo 1 giorno); risposta identica se l'account non esiste. |
| Reset password | Risposta sempre uguale (non rivela chi è iscritto); per account: 1 richiesta al minuto e 5 all'ora; il codice non torna mai nella risposta, solo per email. |
| «Fammi sapere quando arrivate» (`/interesse-zona`) | Solo i nomi delle zone; 10 all'ora per client, contatore in memoria; salva solo un numero per zona. |
| Segnalazioni (`/segnalazioni`) | 5 all'ora per client, contatore in memoria, nessun IP salvato. |
| QR (`/q/...`) | Conteggio scansioni limitato in memoria per negozio e client. |
| Webhook Stripe / PayPal | Firma verificata; senza firma valida: 400. |
| Admin | Password master con blocco dopo errori. |

## 2. Come abbiamo provato (e risultati)

Rischio: 🔴 alto, 🟠 medio, 🟢 basso. «Dopo» = dopo le modifiche di questa PR.

| Abuso simulato | Prima | Dopo | Rischio dopo |
|---|---|---|---|
| Raffica di registrazioni dallo stesso client | non protetto | **protetto**: 10 ogni 10 minuti, poi 429 «Troppe richieste, riprova tra qualche minuto.» | 🟢 |
| Molte email simili (`a+1@`, `a+2@`…) da client diversi | non protetto | non protetto: gli alias sono email valide e manca la verifica dell'email | 🟠 |
| Iscrivere l'email di un'altra persona (le arriva l'email di benvenuto) | non protetto | non protetto (frenato dal limite per client); la risposta «Email già registrata» rivela chi è iscritto, frenata dal limite | 🟠 |
| Stessa Partita IVA su più negozi | passa | parzialmente: formato e cifra di controllo verificati, non unicità né esistenza (più sedi della stessa ditta sono legittime) | 🟠 |
| Registrazione dichiarando 17 anni | parzialmente | parzialmente: la spunta 18+ è obbligatoria ma è solo una dichiarazione | 🟢 |
| «Fammi sapere quando arrivate» a raffica | parzialmente | parzialmente: 10 all'ora per client, ma un bot che falsifica l'intestazione del proxy lo aggira (effetto: numeri gonfiati, nessun dato personale) | 🟢 |
| Segnalazioni a raffica | parzialmente: dietro il proxy di Render il contatore era unico per tutti (5 all'ora in totale: un bot poteva impedire a chiunque di segnalare) | **protetto**: contatore per client; manca un tetto globale | 🟢 |
| Reset password a raffica sullo stesso indirizzo | protetto | protetto | 🟢 |
| Reset password verso molti indirizzi da un client | non protetto (spam e quota Resend) | **protetto**: 15 all'ora per client | 🟢 |
| Tentativi di accesso a raffica | protetto | protetto | 🟢 |

Altri punti notati (non toccati): `/track` (eventi anonimi) e `/gdpr/consent-log` accettano scritture senza limiti e senza accesso (riempimento del database), rischio 🟠. `consent-log` salva l'IP come prova del consenso: da far valutare al consulente insieme al resto.

## 3. Cosa è stato aggiunto

- **Limite registrazioni per client**: `REGISTRAZIONI_MAX_PER_FINESTRA` (predefinito 10) ogni `REGISTRAZIONI_FINESTRA_SEC` (predefinito 600 secondi). Conta anche i tentativi con email già usata. Con `0` il limite è spento.
- **Limite reset password per client**: `RESET_MAX_PER_CLIENT_ORA` (predefinito 15 all'ora; `0` = spento), in aggiunta al limite per account.
- **Segnalazioni**: il contatore usa ora l'indirizzo inoltrato dal proxy (come `/interesse-zona`), non quello del proxy.
- **Privacy**: contatori solo in memoria, con l'impronta dell'indirizzo (non l'indirizzo); si azzerano al riavvio del server; niente nel database né nei log.
- **Test end-to-end**: `e2e/server_e2e.py` li spegne (iscrivono molti account dallo stesso indirizzo); i test del server li spengono in `backend/tests/conftest.py`.
- Nessun testo del sito cambiato: il messaggio arriva dal server e il sito già mostra il dettaglio degli errori.

### Perché le soglie sono larghe
10 registrazioni in 10 minuti da uno stesso client: una famiglia sullo stesso Wi-Fi o un negozio che iscrive i clienti uno dopo l'altro restano sotto (il test ne prova 8). Alcuni operatori mobili fanno condividere lo stesso indirizzo a molte persone: per questo la soglia non è più bassa. Chi viene bloccato aspetta al massimo 10 minuti.

### Limite noto
Il client è riconosciuto dall'intestazione `X-Forwarded-For`, che un bot esperto può falsificare: il limite ferma i bot semplici, non quelli decisi. Contro questi servono verifica dell'email o captcha (decisione del titolare).

## 4. Cosa resta da decidere
1. **Verifica dell'email** (link di conferma) prima di attivare l'account: la difesa più efficace contro account falsi e contro l'uso dell'app per spedire email a terzi. Costo: un passaggio in più per gli utenti.
2. Captcha (servizio esterno, richiederebbe aggiornare la Privacy): non fatto.
3. Limiti su `/track` e `/gdpr/consent-log`.
4. Avviso all'admin per Partita IVA duplicate (senza bloccare).
