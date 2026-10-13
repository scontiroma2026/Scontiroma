# Costi mensili di Sconti Roma

Ultimo aggiornamento: 13/10/2026. Pagina pensata per iPhone: ogni voce è una scheda. Dove il costo non è noto c'è scritto **DA VERIFICARE**: non è una stima, è una domanda da chiudere guardando la fattura o la pagina «Billing» del servizio.

Regole: nessuna chiave, password o numero di carta in questo file (il repository è pubblico). I valori in dollari vanno controllati in valuta nella fattura reale: il cambio cambia ogni mese.

## Le voci

### Render (server e sito)
- **A cosa serve:** tiene acceso il server (API) e il sito. Con il piano Starter il server non si addormenta e i promemoria automatici delle 9:30/9:45/10:00 partono sempre.
- **Piano attuale:** Starter per il server (il sito statico è gratuito).
- **Costo atteso:** circa 7 $ al mese per il server. Altri servizi sospesi o vecchi (copie `scontiroma-api` e `scontiroma-web` senza suffisso `-xqib`): da eliminare, quindi 0 $ quando eliminati. Eventuale ambiente di prova: **DA VERIFICARE**.
- **Tetto di spesa consigliato:** 15 $ al mese (due servizi Starter, o uno più il disco).
- **Dove si vede la fattura:** Render, Dashboard → Account Settings → Billing.
- **Rinnovo:** addebito mensile, DA VERIFICARE il giorno.
- **Avviso da impostare:** in Billing, avviso di spesa a 10 $; email di fatturazione = email di Sconti Roma.

### MongoDB Atlas (database)
- **A cosa serve:** contiene tutti i dati (negozi, offerte, clienti, scansioni, registro pagamenti). Contiene dati personali: va protetto più di tutto.
- **Piano attuale:** Flex (tetto 30 $ al mese, non si supera).
- **Costo atteso:** DA VERIFICARE (il Flex costa in base all'uso, con il tetto sopra). Con pochi negozi atteso molto sotto il tetto.
- **Tetto di spesa consigliato:** 30 $ al mese (è il tetto del piano; non salire senza decidere).
- **Dove si vede la fattura:** Atlas → Organization → Billing → Invoices.
- **Rinnovo:** fatturazione mensile, DA VERIFICARE il giorno.
- **Avviso da impostare:** in Billing, avviso di spesa a 15 $; controllare che i backup automatici siano attivi (vedi «Emergenze e accessi»).

### ElevenLabs (voce e video)
- **A cosa serve:** voce fuori campo dei video per i negozi. Non serve al funzionamento dell'app.
- **Piano attuale:** piano da circa 5 $ al mese.
- **Costo atteso:** circa 5 $ al mese; **dopo i video si può mettere in pausa o cancellare**.
- **Tetto di spesa consigliato:** 5 $ al mese. Regola di progetto: i crediti non si usano senza permesso del titolare.
- **Dove si vede la fattura:** ElevenLabs → Profilo → Subscription / Billing.
- **Rinnovo:** DA VERIFICARE (giorno del mese dell'acquisto).
- **Avviso da impostare:** promemoria sul calendario due giorni prima del rinnovo, per decidere se tenerlo.

### Aruba (dominio scontiroma.it e posta)
- **A cosa serve:** il nome del sito e dell'email (`info@`, ecc.). Se scade, sito ed email smettono di funzionare.
- **Piano attuale:** dominio (e record DNS; la posta in arrivo si inoltra a Gmail).
- **Costo atteso:** DA VERIFICARE (l'importo del rinnovo annuale è sulla fattura Aruba).
- **Tetto di spesa consigliato:** nessun tetto: è un costo annuale fisso. Controllare che sia l'importo atteso.
- **Dove si vede la fattura:** Area Clienti Aruba → Fatture / Ordini.
- **Rinnovo:** **21/08/2027**.
- **Avviso da impostare:** promemoria sul calendario il 21/07/2027 e il 07/08/2027; rinnovo automatico attivo con carta valida; email di contatto del dominio = email di Sconti Roma.

### Resend (invio email)
- **A cosa serve:** email del sito (benvenuto, promemoria, reset password, avvisi).
- **Piano attuale:** DA VERIFICARE (probabile piano gratuito).
- **Costo atteso:** DA VERIFICARE; se gratuito, 0 € finché si restano nei limiti di invii.
- **Tetto di spesa consigliato:** 0 € finché possibile; passare a pagamento solo dopo decisione.
- **Dove si vede la fattura:** Resend → Settings → Billing / Usage.
- **Rinnovo:** DA VERIFICARE.
- **Avviso da impostare:** controllare l'uso («Usage») ogni mese; se si avvicina al limite, decidere prima di restare senza invii.

### LocationIQ (indirizzi)
- **A cosa serve:** suggerisce gli indirizzi mentre si scrive (registrazione, orari, mappe).
- **Piano attuale:** gratuito, senza carta di credito.
- **Costo atteso:** 0 €.
- **Tetto di spesa consigliato:** 0 €. Se il limite gratuito non basta, il sito ripiega su Nominatim.
- **Dove si vede la fattura:** nessuna fattura (gratuito). Uso: my.locationiq.com → Dashboard.
- **Rinnovo:** nessuno.
- **Avviso da impostare:** nessuno; guardare ogni tanto la riga «Indirizzi (LocationIQ)» nell'admin.

### Composio (collegamento tra assistenti e servizi)
- **A cosa serve:** collega Claude ad alcuni servizi per il lavoro di gestione (non è parte del sito per i clienti).
- **Piano attuale:** DA VERIFICARE.
- **Costo atteso:** DA VERIFICARE.
- **Tetto di spesa consigliato:** 0 € se gratuito; altrimenti decidere dopo aver visto il piano.
- **Dove si vede la fattura:** DA VERIFICARE (pagina Billing dell'account Composio).
- **Rinnovo:** DA VERIFICARE.
- **Avviso da impostare:** promemoria il giorno del primo addebito, se esiste.

### GitHub (codice)
- **A cosa serve:** custodisce il codice e le pagine di documentazione. Repository pubblico.
- **Piano attuale:** DA VERIFICARE (probabile gratuito).
- **Costo atteso:** DA VERIFICARE; 0 € se gratuito.
- **Tetto di spesa consigliato:** 0 €. Le «Actions» (controlli automatici) hanno minuti inclusi: se si esauriscono, fermarsi e decidere.
- **Dove si vede la fattura:** GitHub → Settings → Billing and plans.
- **Rinnovo:** DA VERIFICARE.
- **Avviso da impostare:** in Billing, limite di spesa a 0 € (così non parte nulla a pagamento senza avviso).

### Gemini (Google, «Migliora foto»)
- **A cosa serve:** migliora le foto delle offerte. Oggi è spento (chiave tolta da Render); si riaccende dopo il lancio.
- **Piano attuale:** a pagamento a consumo, spento.
- **Costo atteso:** 0 € finché spento; dopo la riaccensione, DA VERIFICARE (dipende da quante foto).
- **Tetto di spesa consigliato:** **5 € al mese**.
- **Dove si vede la fattura:** Google AI Studio / Google Cloud → Billing.
- **Rinnovo:** a consumo, addebito mensile.
- **Avviso da impostare:** in Google Cloud, budget da 5 € con avvisi al 50 % e al 100 % (interno alla console). Va impostato **prima** di rimettere la chiave su Render.

### Stripe e PayPal (pagamenti dei negozi)
- **A cosa servono:** incasso dei 4,99 € al mese + IVA dei negozi, dopo la prova. Nel codice ma **spenti**; nessun addebito ai negozi senza loro conferma esplicita.
- **Piano attuale:** nessun canone fisso noto; si paga una commissione per ogni incasso.
- **Costo atteso:** 0 € finché spenti. **Commissioni solo dopo l'accensione**, percentuale e quota fissa: DA VERIFICARE sulla pagina tariffe ufficiale di ciascun servizio al momento dell'accensione.
- **Tetto di spesa consigliato:** nessun tetto (le commissioni crescono con gli incassi): controllare ogni mese che il totale sia coerente con i pagamenti ricevuti.
- **Dove si vede la fattura:** Stripe → Fatturazione / Rapporti; PayPal → Attività → Rapporti → Commissioni.
- **Rinnovo:** nessuno (a consumo).
- **Avviso da impostare:** a pagamenti accesi, riscontro mensile con il registro «Pagamenti» dell'admin. Le ricevute di Stripe e PayPal non sono fatture fiscali: la fatturazione ai negozi va chiarita col commercialista.

### UptimeRobot (controllo online)
- **A cosa serve:** avvisa se sito o server sono giù.
- **Piano attuale:** gratuito.
- **Costo atteso:** 0 €.
- **Tetto di spesa consigliato:** 0 €.
- **Dove si vede la fattura:** nessuna.
- **Rinnovo:** nessuno.
- **Avviso da impostare:** avvisi sull'email di Sconti Roma e sull'app del telefono.

## Riepilogo (da aggiornare a ogni verifica)
| Voce | Costo atteso | Tetto | Stato |
|---|---|---|---|
| Render Starter | circa 7 $/mese | 15 $ | verificare in fattura |
| MongoDB Atlas Flex | DA VERIFICARE | 30 $ | verificare in fattura |
| ElevenLabs | circa 5 $/mese | 5 $ | decidere se tenerlo dopo i video |
| Aruba dominio | DA VERIFICARE (annuale) | fisso | rinnovo 21/08/2027 |
| Resend | DA VERIFICARE | 0 € se gratuito | verificare piano |
| LocationIQ | 0 € | 0 € | gratuito |
| Composio | DA VERIFICARE | da decidere | verificare piano |
| GitHub | DA VERIFICARE | 0 € | verificare piano |
| Gemini | 0 € (spento) | 5 €/mese | budget da impostare prima di accendere |
| Stripe / PayPal | 0 € (spenti), poi commissioni | nessuno | dopo l'accensione |
| UptimeRobot | 0 € | 0 € | gratuito |

Totale fisso atteso oggi (solo voci note, senza le DA VERIFICARE): circa 12 $ al mese tra Render ed ElevenLabs, più Atlas e dominio.

## Come controllarli ogni mese in 5 minuti

Fallo il **primo lunedì del mese**, da iPhone, con la posta di Sconti Roma aperta.

1. **Posta (1 minuto):** cerca nella casella le email «fattura», «invoice», «receipt», «payment» del mese. Devono esserci Render, Atlas e (se attivo) ElevenLabs. Se ne manca una, controlla che la carta sia valida.
2. **Render (1 minuto):** Billing → importo del mese. Più di 15 $? Guarda quali servizi sono accesi e sospendi quelli che non servono.
3. **Atlas (1 minuto):** Billing → importo del mese e «Backups»: l'ultimo backup deve essere di ieri o di oggi.
4. **Resend e LocationIQ (1 minuto):** apri «Usage» e controlla che non siano vicini al limite gratuito.
5. **Calendario (1 minuto):** guarda i rinnovi dei prossimi 30 giorni (dominio 21/08/2027, ElevenLabs). Se uno è vicino, decidi ora se tenerlo.
6. Aggiorna la tabella «Riepilogo» qui sopra (sostituendo ogni «DA VERIFICARE» con la cifra vera appena la vedi).

Se una cifra è più alta del tetto: non pagare «a occhi chiusi». Scrivi a Claude cosa hai visto (senza incollare chiavi o numeri di carta) e si decide cosa spegnere.

## Cose da decidere
- Chiudere i «DA VERIFICARE» (Resend, Composio, GitHub, Atlas, Aruba, giorni di rinnovo).
- Eliminare da Render le copie vecchie senza suffisso `-xqib`.
- Quando riaccendere Gemini e con quale budget.
