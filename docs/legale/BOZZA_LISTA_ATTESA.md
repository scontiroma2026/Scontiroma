# Lista d'attesa pre-lancio: bozze dei testi (PROPOSTA, DA VALIDARE dal consulente)

Stato: **solo proposta. Privacy, Cookie e Termini del sito NON sono stati modificati.** Il testo del consenso qui sotto è invece già mostrato nel modulo (quando `PRELAUNCH_MODE` è acceso): se il consulente lo cambia, si aggiornano insieme il testo nel sito e la costante `WAITLIST_CONSENT_VERSION` in `backend/server.py` (oggi `2026-10-v1`), così ogni iscrizione conserva la versione del testo che la persona ha visto.

## 1. Testo del consenso (nel modulo, casella NON preselezionata)
> ☐ Voglio ricevere un'email quando Sconti Roma è online
>
> Useremo la tua email solo per questo avviso e puoi annullare quando vuoi. Leggi la **Privacy** (link a `/privacy`).

Prima del modulo, nella home: «Sconti Roma è per maggiorenni (18+)».

## 2. Frase da aggiungere alla Privacy [DA VALIDARE]
> **Lista d'attesa «Avvisami quando parte».** Se lasci la tua email nel modulo della lista d'attesa e spunti la casella, la usiamo solo per mandarti un'email di conferma dell'iscrizione e, quando Sconti Roma è online, un avviso di lancio. Base giuridica: il tuo consenso (art. 6, par. 1, lett. a, GDPR), che confermi toccando il link ricevuto per email (doppio consenso) e che puoi revocare in ogni momento con il link «Annulla l'iscrizione» presente in ogni email, senza conseguenze. Conserviamo l'indirizzo email, la data e la versione del testo del consenso, lo stato dell'iscrizione (da confermare, confermata, disiscritta) e una provenienza generica scelta da un elenco fisso (per esempio «volantino» o «Instagram»). Non salviamo l'indirizzo IP e non usiamo cookie per questa funzione. Le iscrizioni non confermate sono cancellate dopo 7 giorni. [DA DECIDERE: per quanto tempo si conservano le iscrizioni confermate e quelle disiscritte dopo l'avviso di lancio; il codice oggi non le cancella da solo.] Le email partono tramite Resend (fornitore di invio email, responsabile del trattamento: serve il contratto sul trattamento dei dati, DPA). Il servizio è riservato ai maggiorenni (18+).

Punti da far verificare al consulente:
- che il consenso unico per «un'email quando Sconti Roma è online» (conferma + un solo avviso di lancio) sia sufficiente e non serva un secondo consenso per altre comunicazioni;
- la durata di conservazione dopo l'avviso (proposta tecnica: cancellare tutto 30 giorni dopo l'invio, tenendo solo un elenco di esclusione per chi si è disiscritto se serve);
- l'elenco dei responsabili (Resend) e il DPA con Resend;
- se il testo del consenso deve nominare il titolare e un contatto per revocare, oltre al link nell'email.

## 3. Cosa fa e cosa non fa il codice (per il registro dei trattamenti)
- Dati salvati: email, data del consenso, versione del testo, stato, fonte generica (`instagram`, `facebook`, `volantino`, `passaparola`, `diretto`, `altro`), data di conferma, data dell'avviso, e per la protezione dagli abusi gli orari delle ultime richieste di quell'indirizzo (massimo 20, servono a non mandare email in raffica).
- Non salvati: IP, dispositivo, nome, cookie. I limiti per dispositivo usano solo l'impronta (hash troncato) dell'IP, tenuta in memoria e dimenticata al riavvio.
- Token di conferma: valido 48 ore, nel database solo l'impronta (sha256). Link di disiscrizione: firma (HMAC) dell'identificativo, valido in ogni email.
- Iscrizioni non confermate: cancellate dopo 7 giorni (lavoro delle 03:40 e all'avvio).
- Risposta dell'iscrizione sempre identica, sia che l'email sia nuova o già presente.

## 4. Email (stile e mittente delle altre email del sito)
**Conferma** — oggetto «Conferma la tua iscrizione — Sconti Roma»: «hai chiesto di ricevere un'email quando Sconti Roma è online. Per confermare tocca il pulsante qui sotto. Il link è valido per 48 ore.» + «Se non sei stato tu, ignora questa email: senza conferma non ti scriveremo e il tuo indirizzo viene cancellato da solo.» + link «Annulla l'iscrizione».

**Avviso di lancio** — oggetto «Sconti Roma è online»: «ci avevi chiesto di avvisarti: Sconti Roma è online. Da oggi trovi le offerte dei negozi vicino a te, a Roma e dintorni. Scegli un'offerta, mostra il QR al banco e basta. Sconti Roma è per maggiorenni (18+). Grazie per l'attesa.» + link «Annulla l'iscrizione». Nessun prezzo, nessuna percentuale, nessuna data.

## 5. Invio dell'avviso di lancio: limiti di Resend
Il piano gratuito di Resend ha un tetto di **100 email al giorno** (e 3.000 al mese), oltre a un limite di richieste al secondo; la nota in `MIGRAZIONE.md` lo ricorda già. Prima del lancio va controllato il piano in uso e, se le iscrizioni confermate superano il tetto, passare al piano a pagamento o accettare di spalmare l'invio su più giorni. Il codice è prudente: lotti da 20 con pausa di 3 secondi, 0,6 secondi tra un messaggio e l'altro, **tetto giornaliero di 80 avvisi** (`WAITLIST_DAILY_CAP`, `0` = nessun tetto) per lasciare spazio alle email di servizio (conferme, reset della password), si ferma dopo 3 errori di fila, e rilanciando «Invia l'avviso di lancio» riprende da chi manca senza mai scrivere due volte alla stessa persona.
