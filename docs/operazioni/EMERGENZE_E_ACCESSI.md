# Emergenze e accessi

Ultimo aggiornamento: 13/10/2026. Scritta per essere letta da iPhone, con calma **prima** che serva.

**Regola d'oro:** in questa pagina non c'è e non ci deve mai essere nessuna password, chiave, codice di recupero o stringa di collegamento. Il repository è pubblico. I segreti vivono solo nei servizi, nel gestore di password e su carta (vedi sotto). Mai in chat, mai in un messaggio, mai a Claude.

## 1. Gli account: cosa serve a cosa

| Account | A cosa serve | Cosa succede se lo perdi o viene rubato |
|---|---|---|
| **GitHub** | Codice, documenti, controlli automatici | Chi entra può cambiare il codice del sito. Gravissimo. |
| **Render** | Tiene acceso server e sito; contiene le chiavi segrete del server | Chi entra può fermare il sito e leggere le chiavi. Gravissimo. |
| **MongoDB Atlas** | Database con i dati di negozi e clienti | Chi entra legge i dati personali: obbligo di valutare la comunicazione al Garante. Gravissimo. |
| **Aruba** | Dominio `scontiroma.it` e posta | Chi entra può deviare sito ed email. Gravissimo. |
| **Resend** | Invio email del sito | Chi entra può inviare email a nome di Sconti Roma. |
| **Stripe** | Pagamenti con carta dei negozi (spento) | Chi entra può vedere pagamenti o cambiare l'IBAN di incasso. Gravissimo quando acceso. |
| **PayPal** | Pagamenti dei negozi (spento) | Come Stripe. |
| **Meta / Facebook / Instagram** | Pagina e profilo sociali di Sconti Roma | Post falsi, danno di immagine. |
| **Google** (Gmail, Drive, Gemini) | Posta di Sconti Roma, documenti, foto con IA | Chi entra legge la posta: con la posta si reimpostano tutte le altre password. Gravissimo. |
| **ElevenLabs** | Voce dei video | Crediti consumati senza permesso. |
| **LocationIQ** | Suggerimenti di indirizzi | Basso: si ruota la chiave. |
| **Composio** | Collegamenti tra Claude e i servizi | Chi entra potrebbe usare i servizi collegati: revocare i collegamenti. |
| **UptimeRobot** | Avvisi se il sito è giù | Basso. |

**Ordine di importanza:** prima la **posta Google di Sconti Roma** (con quella si recuperano tutti gli altri), poi **Aruba, GitHub, Render, Atlas**, poi Stripe/PayPal, poi il resto.

## 2. Verifica a due passaggi: da attivare

Attivala su ogni account che la offre. Preferire sempre **app di autenticazione o chiave di sicurezza/passkey**; l'SMS solo se non c'è altro (la SIM si può clonare).

| Account | Verifica a due passaggi | Fatto? |
|---|---|---|
| Google (posta di Sconti Roma) | Passkey o app di autenticazione | [ ] |
| Aruba | Se disponibile, attivarla; altrimenti password lunga e unica | [ ] |
| GitHub | Passkey o app + codici di recupero | [ ] |
| Render | App di autenticazione | [ ] |
| MongoDB Atlas | App di autenticazione | [ ] |
| Stripe | App di autenticazione (obbligatoria all'accensione) | [ ] |
| PayPal | App di autenticazione o passkey | [ ] |
| Meta / Facebook / Instagram | App di autenticazione (non SMS) | [ ] |
| Resend, ElevenLabs, LocationIQ, Composio, UptimeRobot | Dove c'è, attivarla | [ ] |

Dopo ogni attivazione il servizio ti mostra i **codici di recupero**: vanno salvati subito come descritto qui sotto.

## 3. Dove conservare i codici di recupero

- **Su carta**, stampati o scritti a mano, in un **posto chiuso a chiave** a casa (cassetto o cassaforte). Una seconda copia in un altro luogo sicuro (per esempio da una persona di fiducia, in busta chiusa: vedi sezione 5).
- Una pagina per servizio, con: nome del servizio, email dell'account, data in cui i codici sono stati generati. Quando un codice è usato, **sbarrarlo** e generarne di nuovi.
- **Mai** in chat, in email, in una nota non protetta, in una foto lasciata nella galleria, né nel repository.
- Le password vanno nel **gestore di password** (per esempio quello di iPhone, «Password») con la password principale scelta tra le più lunghe e mai riusata.
- Non scattare foto ai codici. Se proprio lo fai, cancellale subito anche dagli «Eliminati di recente».

## 4. Cosa fare in caso di emergenza (runbook)

**Prima mossa sempre uguale:** fermati, respira, non cancellare nulla, non pagare nulla. Annota data e ora, cosa vedi, e cosa hai già toccato. Poi segui la scheda.

### 4.1 Sito o server giù
1. Apri `scontiroma.it` e `api.scontiroma.it/api/` da iPhone con dati mobili (non Wi-Fi di casa). Se risponde, forse è solo il tuo telefono.
2. Guarda l'avviso di UptimeRobot (email o app) per l'ora d'inizio.
3. **Render** → il servizio del server (suffisso `-xqib`) → «Events» e «Logs». Cerca un errore rosso o un «Deploy failed».
4. Se l'ultima modifica ha rotto qualcosa: in Render → «Events» → torna alla versione precedente («Rollback» / «Redeploy» di un deploy riuscito).
5. Se Render è in manutenzione: pagina di stato del fornitore; si aspetta.
6. Se il server risponde ma il sito no (o il contrario): controlla il dominio su Aruba (che non sia scaduto o con DNS cambiati) e, in Render, le regole del sito.
7. Se non si risolve in un'ora: avvisa i negozi con un messaggio breve («Stiamo risolvendo un problema tecnico, scusate») e chiedi aiuto a Claude descrivendo cosa vedi (senza chiavi).

### 4.2 Database perso o danneggiato (backup Atlas)
1. **Non scrivere nulla** sul database finché non è chiaro cosa è successo.
2. Atlas → il cluster → **«Backup»** (o «Backup / Restore»). Controlla che esistano snapshot recenti.
3. Scegli lo snapshot **più recente prima del danno** → «Restore». Per prudenza ripristina **su un cluster nuovo** (non sopra quello danneggiato), verifica i dati, poi sposta il collegamento.
4. Per usare il cluster ripristinato: in Render, nell'ambiente del server, aggiorna la variabile del collegamento al database (la nuova stringa la copi da Atlas, **mai** in chat).
5. Annota quanti dati sono andati persi (dall'ora dello snapshot all'incidente): servono per l'eventuale comunicazione agli interessati e al Garante (sezione 4.7).
6. **Prova di ripristino:** fatta una volta prima del lancio (voce 4 della lista di lancio) e ripetuta ogni sei mesi. Un backup mai provato non è un backup.

### 4.3 Chiave API compromessa (come ruotarla)
Segnali: una chiave comparsa in un posto pubblico (repository, log, chat), un avviso del fornitore, un consumo anomalo.
1. **Revoca subito la chiave** nel servizio che l'ha emessa (la vecchia smette di funzionare).
2. Genera una **chiave nuova** nello stesso servizio.
3. In **Render** → servizio del server → «Environment» → sostituisci il valore della variabile corrispondente (per esempio per le email, per gli indirizzi, per Stripe/PayPal, per Gemini) → salva: il server riparte da solo.
4. Verifica: l'admin → «Stato dei servizi» deve tornare verde; invia un'email di prova.
5. Se la chiave è comparsa nel repository: considerarla bruciata anche dopo averla tolta dal file (resta nello storico). Ruotarla sempre.
6. Per Stripe/PayPal: ruotare anche il segreto del collegamento delle notifiche. Per il database: cambiare la password dell'utente Atlas e aggiornare il collegamento in Render.
7. Annota cosa è stato ruotato e quando (senza scrivere i valori).

### 4.4 Account social compromesso (Meta / Facebook / Instagram)
1. Dal sito ufficiale del servizio, usa «Account violato» / recupero con il codice di recupero o la verifica a due passaggi.
2. Cambia subito la password e **esci da tutti i dispositivi**.
3. Togli i collegamenti e le app che non riconosci.
4. Elimina i post falsi; scrivi un post breve di chiarimento («Il nostro profilo ha subito un accesso non autorizzato, ignorate i messaggi ricevuti»).
5. Controlla l'email di recupero e il numero di telefono: se sono stati cambiati, riportali ai tuoi.
6. Se hanno scritto ai negozi o ai clienti a nome di Sconti Roma, avvisali con un messaggio semplice.

### 4.5 Le email di Sconti Roma non arrivano
1. Prova a inviare un messaggio a un tuo indirizzo personale e a uno di un altro provider (controlla anche **Spam**).
2. **Resend** → «Emails» / «Logs»: vedi se risultano «Delivered», «Bounced» o «Failed».
3. Resend → «Domains»: il dominio deve risultare **«Verified»**. Se non lo è, mancano o sono cambiati i record DNS: controllali in Aruba (non toccare i record della posta in arrivo; i record `send` servono a Resend).
4. Controlla in Resend che la chiave non sia stata revocata e in Render che la variabile dell'email sia presente.
5. Resend → limiti di invio: potresti aver superato il limite del piano.
6. Posta **in arrivo** (`info@`): controlla in Aruba che i due record MX siano al loro posto e l'inoltro attivo.
7. Se il dominio è scaduto: vedi Aruba (rinnovo 21/08/2027).

### 4.6 Pagamenti con addebiti sbagliati
Oggi Stripe e PayPal sono **spenti**: se vedi un addebito, è un'anomalia grave.
1. **Fermati**: in Render imposta lo stato di pagamento a spento (`MERCHANT_PAYMENT_REQUIRED` false) e verifica che gli abbonamenti di Stripe/PayPal non si rinnovino.
2. Stripe e/o PayPal → elenca gli addebiti sbagliati (data, importo, negozio).
3. **Rimborsa subito** dal pannello del servizio gli addebiti non voluti e annulla gli abbonamenti collegati.
4. Scrivi ai negozi interessati con scuse e spiegazione semplice.
5. Annota la causa (prezzo, IVA, rinnovo doppio, prova non rispettata) e fai correggere il codice in una PR prima di riaccendere.
6. Ricorda: nessun addebito senza conferma esplicita del negozio; il primo addebito è sempre un 1°; tolleranza fino al 5.
7. Avvisa il commercialista se ci sono ricevute o fatture da stornare.

### 4.7 Richiesta urgente del Garante (o violazione dei dati)
1. **Non rispondere subito**. Conserva la richiesta e annota data e ora di ricezione e scadenza indicata.
2. Scrivi al **consulente / commercialista** e al titolare del trattamento (tu): senza di loro non si risponde nel merito.
3. Prepara: l'elenco dei dati trattati e dove stanno (registro dei trattamenti, informative, fornitori e contratti), le misure di sicurezza, i fornitori (Render, Atlas, Resend, Google e gli altri).
4. Se c'è stata una **violazione dei dati personali** (accesso non autorizzato, perdita, furto): ha una scadenza di **72 ore** dalla scoperta per la valutazione e l'eventuale notifica al Garante. Il consulente guida l'esito. Intanto: ruotare le chiavi (4.3), isolare l'account compromesso, annotare cosa e quando.
5. Se sono coinvolti i dati di persone: si valuta anche l'avviso agli interessati.
6. I testi (informativa, registro, procedura di violazione) sono nella documentazione legale: `docs/legale/`. Non modificarli da soli: si cambiano come proposta, validata dal consulente.

## 5. La persona di fiducia

Serve **una** persona adulta di cui ti fidi, che possa agire se tu non puoi (ospedale, viaggio, sparizione dell'accesso). **Non scrivere il nome in questo file.**

**Cosa deve sapere (informazioni, non segreti):**
- che cosa è Sconti Roma e che ci sono un sito, un server e un database;
- l'elenco degli account della sezione 1 e quali sono i tre più importanti (posta Google, dominio, server);
- dove trova questa pagina e la busta chiusa;
- chi chiamare: il commercialista e il consulente (i loro recapiti stanno nel gestore di password o nella busta, non qui);
- che per qualsiasi cosa dubbia **non paga e non cancella**: aspetta te o il consulente.

**A quali accessi può avere diritto, e quando:**
- **Solo in caso di emergenza vera**, e per iscritto da te: la busta chiusa si apre quando tu sei irraggiungibile da un tempo concordato (per esempio più di 72 ore) o in caso di tuo impedimento grave.
- **Dentro la busta (su carta):** i codici di recupero dei tre account chiave, l'indicazione di dove trova il gestore di password e come sbloccarlo. La password principale del gestore è un'altra busta, o è nota solo a te.
- **Possibile uso:** mettere il sito in sicurezza (sospendere, non cancellare), tenere pagati i servizi che scadono (dominio, server), avvisare il consulente, fermare i pagamenti.
- **Da non fare mai senza di te:** cancellare dati o servizi, accendere Stripe o PayPal, cambiare i testi legali, inviare messaggi ai negozi.
- Meglio se l'accesso è dato **come utente aggiuntivo** (invito personale, con ruolo limitato) dove il servizio lo permette (GitHub, Render, Atlas), invece di condividere la tua password. In ogni caso mai condividere password in chat.
- Una volta l'anno: ripassare l'elenco con la persona e controllare che la busta sia ancora valida (codici non usati, non scaduti).

## 6. Controlli semestrali (10 minuti)
- [ ] La verifica a due passaggi è attiva sugli account della tabella 2.
- [ ] I codici di recupero su carta sono completi e non sbarrati per errore.
- [ ] L'ultimo backup Atlas esiste e il ripristino di prova è stato fatto negli ultimi sei mesi.
- [ ] Le chiavi che non servono più sono revocate (per esempio quelle di servizi in pausa).
- [ ] La persona di fiducia conosce questa pagina.
- [ ] La scadenza del dominio (21/08/2027) è nel calendario.

## 7. A chi scrivere
Per i negozi e i clienti: `info@scontiroma.it`. Per aiuto tecnico durante un'emergenza: scrivi a Claude descrivendo cosa vedi (senza chiavi, password o numeri di carta).
