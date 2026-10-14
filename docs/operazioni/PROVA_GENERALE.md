# Prova generale pre-lancio (14/10)

Repository pubblico: qui nessuna password, chiave o dato di persone reali. Gli indirizzi dei test sono tutti `@example.com`.
Variabili e valori consigliati: `docs/operazioni/VARIABILI_AMBIENTE.md`.

## 1. Esito dei test automatici

| Batteria | Esito | Note |
|---|---|---|
| Server (`pytest`, database finto) | **Tutta verde**: 350 passati, 0 rossi (più i 5 del consenso legale, che passano solo col server di prova acceso, come fa la CI) | `test_legal_consent.py` va avviato con il server di prova acceso (come fa la CI): da solo dà 4 rossi finti per «connessione rifiutata» |
| Percorsi completi (Playwright, iPhone 13, 390 px) | **Tutta verde**: 143 passati, 0 rossi, 0 instabili (ripetuti: giro completo su `main` 138/138 e giro finale con la nuova scheda 143/143). Un solo episodio anomalo: nel primo giro il server di prova si è fermato da solo dopo circa 12 minuti e 2 test di `25-bozza-menu` sono diventati rossi per «connessione rifiutata»; non si è ripetuto in due giri completi successivi. Lo segnalo come instabilità dell'ambiente di prova, non del codice | include la nuova scheda `34-prova-generale.spec.js` |

Cosa copre ogni percorso (dove sta il test):

| Percorso | Test |
|---|---|
| Cliente: iscrizione con conferma email accesa (email simulata), accesso, preferiti, segnalazione, eliminazione account | `34-prova-generale` (nuovo) · `32-conferma-email` · `13-preferiti` · `01-account` |
| Commerciante: registrazione, offerta con foto, approvazione, «Non rinnovo» | `34-prova-generale` (nuovo) · `01-account` · `02-offerte` · `24-foto` · `06-scadenza-offerte` |
| Admin: rifiuto con motivo, «Approva tutte» (parola LANCIA), riepilogo, segnalazioni con esito motivato, scheda Clienti | `34-prova-generale` (nuovo) · `08-admin` · `32-riepilogo-settimanale` |
| Lista d'attesa con PRELAUNCH_MODE acceso: iscrizione a doppio consenso, parola AVVISA, tetto 80 al giorno, nessuna data, «Stiamo arrivando», 18+ | `33-lista-attesa` · `34-prova-generale` (nuovo) · `backend/tests/test_lista_attesa.py` (nuovo test del tetto 80) |
| Con PRELAUNCH_MODE spento: home e catalogo di sempre, iscrizione alla lista rifiutata (404) | `33-lista-attesa` · `34-prova-generale` |
| Testi pubblici: niente percentuali, «gratis per sempre», «nessuna commissione», «prezzo bloccato», marchi di terzi, zone pilota | `34-prova-generale` (nuovo), a pre-lancio acceso e spento |
| Intestazioni, CORS, origini e valori predefiniti prudenti | `backend/tests/test_prova_generale.py` (nuovo) · `test_origini_csrf.py` · `34-prova-generale` |

## 2. Bug trovati e corretti in questa prova

1. **Il sito diceva «Garbatella, San Paolo e Marconi»** nella descrizione che compare nelle anteprime (Google, condivisioni) e nell'app installata (`frontend/public/index.html` e `manifest.json`). Ora: «Sconti nei negozi di Roma e dintorni. Gratuita nella fase di lancio.» (test `34-prova-generale`).
2. **Il server non mandava nessuna intestazione di sicurezza** (nosniff, anti-incorniciatura, referrer). Aggiunte su ogni risposta del server e nel sito statico (`render.yaml`). Non cambiano il funzionamento.
3. Il tetto di **80 email al giorno** dell'avviso di lancio era provato solo con numeri piccoli: ora c'è un test con 85 iscritti che verifica che ne partano 80, che 5 restino per il giorno dopo e che la parola sbagliata non faccia partire nulla.

## 3. Cosa non ho toccato (ti serve decidere: vedi la PR)

- Termini, riga 25: nomina ancora «Garbatella, San Paolo e Marconi». È testo legale: la correzione sta già nella PR #116, da far vedere al consulente.
- Le schede delle offerte mostrano la percentuale di sconto («−50%»): la calcola il sito dai prezzi.

## 4. Controllo rapido da iPhone (10 minuti)

Usa **il sito di prova**, non quello vero. Account di prova con email tue inventate (`nome+prova1@…`). Dopo, cancella gli account di prova (admin → Clienti / Negozi).

### Cliente

| # | Passo | Esito atteso |
|---|---|---|
| 1 | Apri il sito → «Registrati» → nome, cognome, email, password → spunta Termini e 18+ → invia | Messaggio «Ti abbiamo mandato un'email: tocca il link per confermare il tuo account». Nessun accesso. |
| 2 | Apri l'email (anche in Spam) → tocca il link | Pagina «Iscrizione completata!» |
| 3 | Accedi con email e password | Entri; la pagina «Sicurezza» propone Face ID (puoi saltare) |
| 4 | Apri uno sconto → tocca il cuore | Cuore pieno; in «Preferiti» compare il negozio |
| 5 | In fondo allo sconto: «Segnala questa offerta» → scrivi 10+ caratteri → Invia | Messaggio «Ricevuta. Ti confermiamo entro il …» |
| 6 | Area cliente → «Elimina il mio account» → conferma | Torni alla home; riprovando ad accedere: credenziali errate. Arriva l'email «Account cancellato». |

### Commerciante

| # | Passo | Esito atteso |
|---|---|---|
| 1 | «Per i commercianti» → registrati con Partita IVA di prova valida (`12345678903`) e le due spunte | Entri subito (nessuna conferma email) |
| 2 | «Nuova offerta»: titolo, descrizione, prezzo pieno e scontato, una foto dal rullino | La foto compare nella galleria; dopo l'invio: «In attesa di approvazione» |
| 3 | Admin approva (vedi sotto) → ricarica l'area commerciante | Offerta approvata; il cliente la vede |
| 4 | Il riquadro arancione compare negli ultimi 7 giorni del mese (sul sito di prova: admin → «Prossimo Mese» → apri la finestra a mano). Tocca «Non rinnovo» → conferma → «Annulla» | Prima «non rinnovo» registrato, poi di nuovo «scade a fine mese» |
| 5 | «I tuoi clienti» | Con pochi dati: messaggio «dati insufficienti», nessuna cifra inventata |

### Admin

| # | Passo | Esito atteso |
|---|---|---|
| 1 | Accedi come admin → inserisci la password master | Si apre la «Cabina di regia» |
| 2 | Scheda «Offerte in attesa» → «Rifiuta» su un'offerta | Il motivo è obbligatorio (almeno 10 caratteri): il pulsante resta spento finché non lo scrivi |
| 3 | «Approva tutte» → scrivi una parola sbagliata | Errore «Scrivi LANCIA per confermare», nulla cambia |
| 4 | «Approva tutte» → scrivi `LANCIA` | «Approvate N offerte»; compaiono nel catalogo |
| 5 | Scheda «Riepilogo» | Numeri della settimana con frecce ↑↓, nessuno scroll laterale |
| 6 | Scheda «Segnalazioni» → «Accolta» con motivazione | Stato «accolta»; con motivazione corta: rifiutato |
| 7 | Scheda «Clienti» → cerca → «Elimina» | Il cliente sparisce e non può più accedere |
| 8 | Scheda «Lista d'attesa» (solo con pre-lancio acceso) | Conteggi per fonte; «Invia l'avviso di lancio» chiede la parola `AVVISA` |

## 5. Cosa va acceso su Render prima del 19/10

Si cambia da Render → servizio `scontiroma-api-xqib` → Environment. Ogni modifica riavvia il server (1-2 minuti). **Non incollare mai i valori segreti in chat.**

| Cosa | Valore | Perché | Rischio se lo dimentichi o sbagli |
|---|---|---|---|
| `PRELAUNCH_MODE` | `true` | La home dice «Stiamo arrivando a Roma e dintorni» (senza data) con la lista d'attesa a doppio consenso, 18+. I negozi si registrano e caricano offerte come sempre. | Spenta: i post della campagna portano a una home «normale» e nessuna email viene raccolta. Accesa per errore il giorno del lancio: i clienti vedono «stiamo arrivando». |
| `CLIENT_EMAIL_CONFIRMATION_REQUIRED` | `true` (già il predefinito) | I clienti entrano solo dopo aver toccato il link. | Se `false`: chiunque si iscrive con l'email di un altro. |
| `RESEND_API_KEY` + `SENDER_EMAIL` (dominio verificato) | già impostate | Senza non parte nessuna email: **nessun cliente può confermare l'account**, nessuno conferma la lista d'attesa. | Alto: facile da non notare (il sito dice «ti abbiamo mandato un'email» comunque). Fai la prova con una tua email vera prima del 19/10. |
| `REPLY_TO_EMAIL` | `info@` del dominio, **solo con la casella già funzionante** (lista di lancio punto 3) | Le risposte dei clienti arrivano a te. | Casella inesistente: le risposte si perdono. |
| `ADMIN_NOTIFY_EMAIL` | la tua Gmail | Avvisi di nuovi negozi/offerte e riepilogo del lunedì (il primo: lunedì 19/10 alle 8:00, se il server è sveglio). | Non arriva nulla. |
| `CSRF_ORIGIN_MODE` | `enforce` | Blocca richieste da altri siti. | `log`: solo scritto nei log. |
| `CORS_ORIGINS` | `https://scontiroma.it,https://www.scontiroma.it` | Il sito parla col server. | Sito vuoto/errori. |
| `EMAIL_ALLOWED_RECIPIENTS` | **non impostarla** | Serve solo ai test. | Se c'è, i clienti non ricevono email. |
| `CLIENT_SUBSCRIPTION_REQUIRED`, `MERCHANT_PAYMENT_REQUIRED` | `false` | Nessun pagamento (Stripe e PayPal spenti). | `true` per errore: schermate di pagamento ai negozi. |
| `GEMINI_API_KEY`, Stripe, PayPal | vuote | Spenti fino a decisione tua. | Costi non voluti. |
| `WAITLIST_*`, `*_MAX_PER_CLIENT_*`, `REGISTRAZIONI_*` | **non impostarle** (predefiniti) | Tetti anti-abuso e tetto 80 email al giorno. | Messe a `0` per sbaglio: protezioni spente. |
| Piano Render del server | `Starter` | Sul piano gratuito il server si addormenta dopo ~15 minuti: il primo che apre il link di conferma aspetta fino a un minuto e può credere che non funzioni; lavori pianificati (riepilogo del lunedì, promemoria) saltano. | Vedi «Cosa devi decidere» nella PR. |
| Piano Atlas | `Flex` con backup | Prima che arrivino i primi dati veri. | Il piano gratuito non ha backup. |

### Ordine consigliato

1. Aggiorna le variabili (tabella sopra) e attendi il riavvio.
2. Apri `https://api.scontiroma.it/api/` (deve rispondere) e il sito dal telefono.
3. Iscrivi **una tua email vera** alla lista d'attesa: deve arrivare l'email di conferma; tocca il link.
4. Admin → «Lista d'attesa»: vedi 1 confermata. Non premere «Invia l'avviso di lancio» (serve solo il giorno del lancio).
5. Non approvare offerte finché non è il giorno del lancio: un'offerta approvata è visibile a chi apre `/discounts`, anche con il pre-lancio acceso.

### Il giorno del lancio (non prima)

1. `PRELAUNCH_MODE` → `false`.
2. Admin → «Offerte in attesa» → «Approva tutte» → `LANCIA`.
3. Admin → «Lista d'attesa» → «Invia l'avviso di lancio» → `AVVISA`. Partono al massimo **80 email al giorno** a lotti: se gli iscritti confermati sono di più, ripremi `AVVISA` il giorno dopo (non riparte da solo). Nessuno riceve due volte l'avviso.

## 6. Limiti della prova

- I test girano su un server e un database finti; le email, Stripe, PayPal, Gemini e gli indirizzi (LocationIQ) sono simulati: la consegna vera delle email, Face ID su iPhone e i colori reali vanno visti dal telefono (sezione 4).
- Nessun dato di produzione è stato letto o scritto. Il controllo dei record DNS della posta non si può fare da qui (`TEST_EMAIL_DOMINIO.md`).
