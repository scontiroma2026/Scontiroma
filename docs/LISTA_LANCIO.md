# Lista «pronto al lancio» di Sconti Roma (aggiornata il 17/11)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

**Decisione del titolare (31/10):** niente lista d'attesa e niente pre-lancio: l'app resta aperta a tutti (`PRELAUNCH_MODE` spento, come già in produzione; il codice della lista resta spento). Niente data di lancio: si cresce una zona alla volta, prima i negozi. Al 31/10 è iscritto un solo negozio (studio odontoiatrico).
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

Divisione (richiesta del titolare, 24/10): in ogni parte prima **ciò che fa Claude**, poi **ciò che fai tu**, poi **avvocato, notaio e commercialista**. Lista ricostruita il 24/10 confrontando tutte le versioni precedenti, i «Da fare» di `docs/STATO.md`, `docs/operazioni/PROMEMORIA_DA_RIPRENDERE.md` e tutte le PR aperte.

**Decisione del titolare (17/11):** l'avvocato non risponde più: si va avanti da soli. I testi legali li chiude l'agente `legale` con la scelta più prudente (restano [DA VALIDARE]); i dubbi vanno in `docs/legale/LISTA_PER_AVVOCATO.md`. **Lista unica (17/11):** unite la versione stampata del 24/10 (A «Prima del lancio, si decide il 27/10») e quella del 31/10; accanto a ogni compito di Claude c'è chi lo fa (io o un sub-agente).

## A. Adesso: i primi negozi

### Claude
1. ⏳ **Primi negozi in una zona** (prima i negozi, poi sono loro a portare i clienti con locandina e social): **obiettivo del titolare del 14/11: almeno 10 iscritti**. Al 17/11: 0 offerte online, 1 negozio vero iscritto. Pronto l'elenco privato (fuori dal repository) dei primi 20 negozi di Garbatella con canale pubblico e messaggio; poi gli altri dalla lista di 232 attività. I messaggi li manda il titolare (mai WhatsApp a suo nome; le email mai da Resend). → Claude
2. ⏳ **Strategia del 14/11:** pagina di invito «La pagina di … è pronta» (PR #254); primo reel in regalo al negozio che pubblica la prima offerta (annunciato nel carosello del 19/11); «Vota il negozio» (parte con il reel «Diccelo tu» del 17/11); 10 messaggi Instagram al giorno; risposte rapide di WhatsApp Business; «Fondatori» in sospeso. → Claude + agente `agency-sales-outbound-strategist` (risposte rapide)
3. ⏳ **Registri della privacy** (i «libri» per i dati): pronti il 18/11 in bozza (agente `legale`), fuori dal repository: registro dei trattamenti (art. 30, obbligatorio per noi), procedura e registro delle violazioni, procedura e registro delle richieste, valutazione d'impatto (oggi non serve). Il titolare li salva in una cartella privata del Drive e fa le 8 verifiche brevi (prima: regione del server su Render, il nome tecnico contiene «us-west1» ma la Privacy dice Francoforte). → agente `legale`
4. ⏳ **Contratti sui dati:** LocationIQ resta spenta (società in India, clausole per il trasferimento non trovate; l'app usa già Nominatim); lettera al DPO di Aruba pronta, la manda il titolare dalla PEC dopo aver controllato l'indirizzo. Da spostare: privacy@ e gli avvisi all'admin oggi finiscono in una Gmail gratuita senza contratto sui dati. → agente `legale`
5. ⏳ **Testi legali allineati al codice** in una sola PR: comprende la #244 (Privacy senza lista d'attesa), Cloudflare e AWS nella Privacy, link sottolineati, frasi che non corrispondono al sito; dalle PR legali vecchie solo ciò che serve. Si unisce solo con il «procedi» del titolare. → agente `legale`
6. ⬜ **Offerta dello studio odontoiatrico (in attesa di approvazione dal 21/10, è l'unica offerta):** controllo con le regole sulla pubblicità sanitaria (niente promesse di risultato, niente prezzi civetta), appena il titolare manda la schermata dell'offerta. → agente `legale`
7. ⏳ **Offerta con la durata scelta dal negozio** (decisione del titolare, 14/11: non più «un'offerta al mese»): app nella PR #253, testi legali nella PR #255; si uniscono **insieme**, solo con il «procedi» del titolare, dopo l'email di preavviso ai negozi già iscritti. → Claude
8. ⏳ **Social:** piano della settimana con anteprima e «ok» del titolare, uscite programmate, resoconto ogni domenica (dati 9–15/11: Instagram 17 persone raggiunte contro 34, 0 interazioni, 0 clic sul sito, 103 follower; Facebook 17 follower). Subito: didascalie corrette dei 2 reel con prezzo e «zero commissioni». Dopo il punto 7: gli 11 post con «un'offerta al mese». → Claude + agente `agency-marketing-content-creator`
9. ⏳ **TikTok:** account collegato a Higgsfield dal 24/10; i video li prepara Claude senza musica e li pubblica il titolare dall'app, scegliendo la musica. → Claude
10. ⬜ **Video corto per i negozi** (circa 55 s, copione del 23/10): aspetta l'OK sul copione; voce con crediti ElevenLabs solo con il permesso. → Claude
11. ⏳ **Materiali per i negozi da chiudere:** #146 e #218, da allineare ai testi legali (#148 chiusa il 31/10). → agente `legale`, dopo il punto 7
12. ⏳ **Bozza grafica** in attesa di OK: animazioni (#226). La nuova pagina «Per i commercianti» è online dall'1/11. → Claude
13. ⏳ **Riordino delle PR vecchie:** proposta pronta il 18/11 (agente `general-purpose`, sola lettura). Da chiudere con l'OK del titolare: #40, #80, #81, #92, #100, #116, #134, #147; #102 se l'eliminazione dell'account resta immediata. Da aggiornare: #95 (banner cookie senza «Marketing», non è superata: entra nella PR dei testi legali del punto 5), #114 (cancellazioni automatiche, aspetta la scelta delle durate), #127 e #128 (solo criteri di approvazione e piano emergenze), #146 con #218 (dopo il punto 7), #195. Da tenere: #169, #226, #244. Video e immagini vecchi chiusi il 31/10. → agente `general-purpose`
14. ⏳ **Controlli:** controllo giornaliero e CI verde su `main`. Il 17/11 GitHub è passato a Ubuntu 26.04 e i test end-to-end non partivano: macchine fissate a Ubuntu 24.04 (PR #256). → Claude
15. ⬜ **Con circa 10 negozi con un'offerta nella stessa zona:** contare negozi e offerte e proporre al titolare se farci conoscere ai clienti in quella zona (prende il posto del «27/10: lanciare o no»). → Claude

### Tu
16. ⬜ **Contattare i negozi**, uno alla volta (telefono, visita, messaggi preparati da Claude), con un modo semplice per dire no.
17. ⬜ **Prova da iPhone e da un Android vero** (registrazione, QR, fotocamera); poi accendere la conferma email dei clienti sul sito vero.
18. ⬜ **Email:** Resend Pro (20 $/mese) solo quando le email superano le 100 al giorno del piano gratuito.
19. ⬜ **Aruba:** condizioni dall'area clienti e lettera al DPO (testo di Claude). **privacy@ su Gmail gratuito:** decidere se spostarla.
20. ⬜ **Profili social:** la bio di Instagram dice ancora «negozi di quartiere» e «18+»; la descrizione di Facebook dice «Un'offerta al mese» e «18+». Testi nuovi proposti da Claude; la bio di Instagram si cambia solo dall'app.
21. ⬜ **OK in attesa:** PR #250, #252, #254; #253 con #255 e #244 (testi legali, con il «procedi»); animazioni #226; materiali #146 e #218; copione del video corto.
22. ⬜ **Prima di approvare un'offerta:** guardare con Claude le foto e la scheda completa.
23. ⬜ **Atlas:** passare al piano gratuito, da fare insieme dal PC.

### Avvocato
24. ⏸️ **Non risponde (17/11):** si va avanti da soli; i testi legali li chiude l'agente `legale` con la scelta più prudente. Richiesta di preventivo pronta in `docs/legale/RICHIESTA_PREVENTIVO.md`, se un giorno servirà.
25. ⛔ **Blocco (decisione del titolare, 23/10): niente pagamenti e niente Sconticini senza l'OK dell'avvocato** (PR #169 e #195 ferme). Il 17/11 Claude ha chiesto al titolare se toglierlo.

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)

### Claude
26. ⬜ Prova dei pagamenti con soldi finti sul sito di prova (chiavi di prova Stripe e PayPal date dal titolare, `MERCHANT_PAYMENT_REQUIRED=true` solo lì).
27. ⏳ Email ai negozi sui pagamenti (#169, pronte e spente): ferme per il punto 25.
28. ⬜ «Migliora foto» (Gemini): spento fino al lancio; poi tetto di 5 €/mese e chiave su Render.

### Tu
29. ⬜ Conti Stripe e PayPal Business della società; chiavi vere sul server solo il giorno dell'accensione.
30. ⬜ Conferma esplicita prima di accendere i pagamenti (i pagamenti dei clienti restano spenti).

### Agente legale, commercialista, notaio
31. ⬜ **Agente `legale`** (al posto dell'avvocato): testi della schermata di pagamento (#181) e Termini sui pagamenti.
32. ⬜ **Commercialista:** IVA al 22%, fattura elettronica (SdI), PEC.
33. ⬜ **Notaio** (va il titolare): modifica dell'oggetto sociale (piattaforma online), codice ATECO in più, delega per firmare a nome della società (dalla visura del 23/10).

## C. Dopo il lancio, con calma

### Claude
34. ⬜ Un abbonamento per commerciante anche con più punti vendita (più punti vendita in un account; adattare i Termini).
35. ⬜ Prova gratuita ripetuta e Partita IVA con più punti vendita (impronta anti-abuso, segnalazioni in admin).
36. ⏸️ Sconticini (#195): fermi per il punto 25. Il 14/11 il titolare ha chiesto di riprenderli: la PR va riallineata alla durata libera (punto 7) e resta spenta finché il blocco non viene tolto.
37. ⬜ Mappe: chiave LocationIQ su Render e file `roma.pmtiles` (guida `docs/guide/MAPPE.md`).
38. ⬜ Foto del negozio nel profilo o all'iscrizione (da decidere).
39. ⏳ Idee: **offerte a tempo** («Coupon Flash», priorità 1: sconti di poche ore per i momenti vuoti; passo 2 dopo la durata libera del punto 7; proposta in preparazione), notifiche di prossimità; WhatsApp con API ufficiale (Meta Business). → agente `agency-product-manager` (proposta)
40. ⏸️ Repository privato: valutato il 18/11 (agente `general-purpose`): **più avanti**. Oggi i controlli usano circa 2.550 minuti al mese contro i 2.000 gratuiti dei repository privati (piano Pro circa 4 $ al mese). Prima alleggerire i controlli (un push nuovo annulla il vecchio, niente test end-to-end sulle PR di sola documentazione).

### Tu
41. ⬜ Emergent: archiviare o eliminare il progetto dormiente e revocare `EMERGENT_LLM_KEY`.
42. ⏸️ Pulizia dei branch delle PR già unite (dalla pagina «Branches» di GitHub; da qui la cancellazione è bloccata).
43. ⏸️ In sospeso per decisione del titolare (14/10): periodo di grazia per la prossima offerta non approvata in tempo; marchio «Sconti Roma» (nome più distintivo, ricerche, deposito).

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e dura almeno 60 giorni: il primo pagamento è il primo 1° del mese che cade almeno 60 giorni dopo (decisione del 31/10; prima era «entro l'11 / dal 12», prova da 49 a 81 giorni); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

Altre decisioni del 14/10: prima i negozi, ai clienti niente data fissa («stiamo arrivando»); tono neutro (niente Halloween); nessuna pubblicità a pagamento; prova gratuita ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita; chiave anti-abuso «Partita IVA + indirizzo» da fare dopo la partenza.

## Prima di farci conoscere ai clienti in una zona
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Circa 10 negozi con un'offerta approvata nella zona.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
