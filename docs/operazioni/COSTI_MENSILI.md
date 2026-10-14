# Costi mensili di Sconti Roma

Ultimo aggiornamento: 14/10/2026. Pensata per iPhone: ogni voce è una scheda.
Regole: nessuna chiave, password o numero di carta qui (repository pubblico). **«DA VERIFICARE»** = non lo posso leggere da qui: è una domanda da chiudere guardando la fattura o la pagina «Billing» del servizio, non una stima. I valori in dollari vanno controllati in valuta nella fattura vera.

> Questa versione **riprende e aggiorna** `COSTI_MENSILI.md` della PR #128 (ancora aperta, bozza) con le scelte del 13–14/10 (Render Starter, Atlas Flex, Resend Pro) e con **quando scatta** ogni costo. Se #128 viene unita dopo, in quel file tenere questa versione.

## 1. Riepilogo e totale

| Voce | Oggi | Dopo il passaggio di lancio | Quando scatta | Fonte |
|---|---|---|---|---|
| Render (server) | 0 $ (piano Free) | **circa 7 $/mese** (Starter) | dal momento in cui si cambia piano (il giorno prima del lancio, vedi runbook) | listino ufficiale dato dal titolare; fattura DA VERIFICARE |
| MongoDB Atlas | 0 $ (Free) | **Flex, tetto 30 $/mese**; importo reale DA VERIFICARE (a consumo, di norma sotto il tetto con pochi negozi) | dal momento del passaggio da Free a Flex | tetto deciso dal titolare; consumo DA VERIFICARE |
| Resend | **0 $ (piano gratuito)**, letto oggi dal conto: 44 email su 3.000 al mese, 1 su 100 oggi | **Pro 20 $/mese** | solo se serve: oltre 100 email al giorno (avviso di lancio alla lista, email ai negozi), o quando si vogliono le email mensili ai clienti | limiti letti in Resend il 14/10; prezzo 20 $ da listino indicato dal titolare |
| ElevenLabs | circa 5 $/mese (piano Starter) | uguale, o in pausa dopo i video | già attivo; rinnovo DA VERIFICARE | PR #128; crediti finiti |
| Dominio `scontiroma.it` (Aruba) | importo annuale DA VERIFICARE | uguale | **21/08/2027** (rinnovo) | PR #128 |
| Google Workspace (opzionale) | 0 € (Gmail gratuito) | DA VERIFICARE (a persona al mese, di solito alcuni euro) | solo se si crea il secondo account con DPA e `info@` come casella vera | non leggibile da qui |
| LocationIQ | 0 € | 0 € | piano gratuito; se non basta il sito ripiega su Nominatim | PR #128 |
| UptimeRobot | 0 € | 0 € | gratuito | PR #128 |
| GitHub | 0 € (repository pubblico) | 0 € oggi; **se il repository diventa privato vedi `REPO_PRIVATO.md`** (da 0 a circa 4 $/mese, oltre se si finiscono i minuti) | solo se si passa a privato | `REPO_PRIVATO.md` |
| Gemini («Migliora foto») | 0 € (spento) | tetto 5 €/mese | dopo il lancio, con budget impostato **prima** di rimettere la chiave | lista di lancio |
| Stripe / PayPal | 0 € (spenti) | commissioni per incasso, nessun canone noto | solo quando si accendono i pagamenti (circa due mesi dopo il lancio); percentuali DA VERIFICARE sulle pagine tariffe ufficiali | lista di lancio |
| Composio | DA VERIFICARE | DA VERIFICARE | non leggibile | PR #128 |

**Totale mensile con il passaggio di lancio (voci note):**
- Render Starter 7 $ + Resend Pro 20 $ + ElevenLabs 5 $ = **32 $/mese**, **più** Atlas Flex (da qualche dollaro fino al tetto di 30 $), **più** il dominio (importo annuale, DA VERIFICARE) e il Workspace se lo si prende (DA VERIFICARE).
- **Massimo teorico mensile**: 7 + 30 + 20 + 5 = **62 $/mese** (più dominio e Workspace).
- **Solo infrastruttura minima** (senza Resend Pro e senza ElevenLabs): 7 $ + Atlas (≤ 30 $) = **fino a 37 $/mese**.
- I prezzi sono in dollari: il cambio in euro è DA VERIFICARE nelle fatture.
- `MIGRAZIONE.md` indica ancora Atlas M10 (circa 57 $/mese) e totale 90–110 €: è **superato** dalla scelta Flex con tetto 30 $ (lista di lancio, voce 4). Da aggiornare in una PR a parte.

## 2. Quando scatta ogni costo (in ordine di data)
| Quando | Cosa parte | Chi |
|---|---|---|
| Già oggi | ElevenLabs (circa 5 $) | già attivo |
| Il giorno prima del lancio | Render Starter (7 $) e Atlas Flex (fino a 30 $) | titolare |
| Quando serve l'avviso alla lista (giorno del lancio o prima) | Resend Pro (20 $), **solo se** gli iscritti confermati superano il tetto dell'invio (oggi `WAITLIST_DAILY_CAP` = 80 al giorno, sotto il limite gratuito di 100 al giorno) | titolare, dopo un conteggio |
| Dopo il lancio, con calma | Gemini (tetto 5 €), eventuale Workspace | titolare |
| Circa due mesi dopo il lancio | Stripe/PayPal (commissioni), solo dopo conferma esplicita e solo quando incassano | titolare + commercialista |
| 21/08/2027 | Rinnovo del dominio | titolare |

Nota Resend: l'avviso di lancio si manda a lotti e si ferma al tetto giornaliero; con 80 al giorno una lista di 400 persone richiede 5 giorni. Se si vuole un solo giorno serve Resend Pro **e** alzare `WAITLIST_DAILY_CAP` su Render. Decisione del titolare prima del lancio: contare gli iscritti confermati (scheda admin «Lista d'attesa») e scegliere.

## 3. Le schede

### Render (server e sito)
- **A cosa serve:** server (API) e sito. Starter = sempre acceso, i promemoria delle 9:30/9:45/10:00 non saltano.
- **Costo:** circa 7 $/mese per il server; il sito statico è gratuito. Servizi vecchi sospesi (`scontiroma-api`, `scontiroma-web` senza suffisso `-xqib`): decisione del 10/10, **da eliminare** (li elimina il titolare).
- **Tetto consigliato:** 15 $/mese. **Fattura:** Dashboard → Account Settings → Billing. **Rinnovo:** giorno DA VERIFICARE.
- **Avviso:** in Billing avviso di spesa a 10 $; email di fatturazione = email di Sconti Roma.

### MongoDB Atlas (database)
- **A cosa serve:** tutti i dati, compresi quelli personali: da proteggere più di tutto.
- **Costo:** Flex con tetto 30 $/mese. Importo reale DA VERIFICARE (Atlas → Organization → Billing → Invoices).
- **Backup:** il Free non ha backup; con Flex ci sono copie automatiche (frequenza e giorni conservati DA VERIFICARE nella console). Per questo il passaggio si fa **almeno un giorno prima** del lancio e poi si prova il ripristino (vedi `RUNBOOK_PRELANCIO.md`).
- **Avviso:** in Billing avviso di spesa a 15 $.

### Resend (email)
- **Oggi:** gratuito. Limiti letti il 14/10: 100 email/giorno, 3.000/mese; contatti 1.000; dominio 1 su 3. Usate questo mese: 44.
- **Pro 20 $/mese:** passaggio da Resend → Settings → Billing, DA VERIFICARE se vale subito e se si può tornare al gratuito a fine mese.
- **Avviso:** guardare «Usage» il primo lunedì del mese.

### ElevenLabs
- Voce dei video, non serve al funzionamento. Circa 5 $/mese; i crediti non si usano senza permesso del titolare (regola di progetto). Rinnovo DA VERIFICARE: mettere un promemoria due giorni prima per decidere se tenerlo.

### Aruba (dominio e posta)
- Se scade, sito ed email si fermano. Importo annuale DA VERIFICARE (Area Clienti → Fatture). Rinnovo **21/08/2027**: promemoria il 21/07/2027 e il 07/08/2027; rinnovo automatico con carta valida.

### Google Workspace (opzionale)
- Serve solo se si vuole una casella vera di `info@` con DPA firmabile (il Gmail gratuito non ne ha). Costo a persona al mese: DA VERIFICARE sul sito Google. Il secondo account Google oggi non si riesce a creare.

### Gemini, Stripe, PayPal, LocationIQ, UptimeRobot, Composio, GitHub
Come nella tabella del §1.

## 4. Controllo mensile in 5 minuti (primo lunedì del mese)
1. Posta: cerca «fattura/invoice/receipt» del mese: devono esserci Render, Atlas, Resend (se Pro) ed ElevenLabs. Se ne manca una controlla la carta.
2. Render → Billing: più di 15 $? Spegni ciò che non serve.
3. Atlas → Billing e «Backups»: l'ultimo backup è di ieri o di oggi.
4. Resend e LocationIQ: «Usage» lontano dai limiti.
5. Calendario: rinnovi dei prossimi 30 giorni.
6. Sostituisci ogni «DA VERIFICARE» con la cifra vera. Se una cifra supera il tetto, non pagare «a occhi chiusi»: scrivi a Claude cosa vedi (senza chiavi né numeri di carta).

## 5. Cosa deve decidere il titolare
- Contare gli iscritti in lista d'attesa e scegliere: Resend Pro oppure invio spalmato su più giorni.
- Chiudere i «DA VERIFICARE» con le fatture vere (Atlas, Aruba, Resend, ElevenLabs, Composio, giorni di rinnovo).
- Tenere o no ElevenLabs dopo i video.
- Se prendere Workspace (e quando).
