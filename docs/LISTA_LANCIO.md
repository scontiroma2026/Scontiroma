# Lista «pronto al lancio» di Sconti Roma (aggiornata il 17/11)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

**Decisione del titolare (31/10):** niente lista d'attesa e niente pre-lancio: l'app resta aperta a tutti (`PRELAUNCH_MODE` spento, come già in produzione; il codice della lista resta spento). Niente data di lancio: si cresce una zona alla volta, prima i negozi. Al 31/10 è iscritto un solo negozio (studio odontoiatrico).
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

Divisione (richiesta del titolare, 24/10): in ogni parte prima **ciò che fa Claude**, poi **ciò che fai tu**, poi **avvocato, notaio e commercialista**. Lista ricostruita il 24/10 confrontando tutte le versioni precedenti, i «Da fare» di `docs/STATO.md`, `docs/operazioni/PROMEMORIA_DA_RIPRENDERE.md` e tutte le PR aperte.

## A. Adesso: i primi negozi

### Claude
1. ⏳ **Primi negozi in una zona** (problema «uovo e gallina»: prima i negozi, poi sono loro a portare i clienti con locandina e social): **obiettivo del titolare del 14/11: almeno 10 iscritti**. Al 17/11: 0 offerte online, 1 negozio vero iscritto. Pronto l'elenco privato (fuori dal repository) dei primi 20 negozi di Garbatella con canale pubblico e messaggio; ogni giorno 3 negozi, uno alla volta, più le visite di persona. I messaggi li manda il titolare (mai WhatsApp a suo nome; le email mai da Resend). Strategia approvata il 14/11: pagina di invito «La pagina di … è pronta» (punto 1, PR #254), primo reel in regalo al negozio che pubblica la prima offerta (punto 2, annunciato nel carosello del 19/11), «Vota il negozio» (punto 4), risposte rapide di WhatsApp Business (punto 5), messaggi Instagram 10 al giorno (punto 6); «Fondatori» in sospeso.
2. ⬜ **Offerta dello studio odontoiatrico (in attesa di approvazione dal 21/10, è l'unica offerta):** controllarla prima dell'approvazione con le regole sulla pubblicità sanitaria (niente promesse di risultato, niente prezzi civetta); dubbi nella lista per l'avvocato.
3. ⏳ **Social:** dati della settimana 9–15/11 (Instagram: 17 persone raggiunte contro 34 della settimana prima, 0 interazioni, 0 clic sul sito, 103 follower; Facebook: reel del 9/11 a 148 persone, 17 follower). Piano della settimana con anteprima e «ok» del titolare, uscite programmate da Claude, resoconto ogni domenica. Da correggere dopo il punto 12: 11 post vecchi dicono «un'offerta al mese» e 2 reel hanno prezzo e «zero commissioni».
4. ⏳ **TikTok:** account collegato a Higgsfield dal 24/10; i video li prepara Claude senza musica e li pubblica il titolare dall'app, scegliendo la musica.
5. ⬜ **Video corto per i negozi** (circa 55 s, copione del 23/10): aspetta l'OK sul copione; voce con crediti ElevenLabs solo con il permesso.
6. ⏳ **Materiali per i negozi da chiudere:** #146 e #218: riallinearli ai testi legali e portarli al titolare per l'OK (#148 chiusa il 31/10).
7. ⏳ **Bozza grafica** in attesa di OK: animazioni (#226). La nuova pagina «Per i commercianti» è online dall'1/11.
8. ⬜ **Privacy da iubenda:** aggiungere Cloudflare e AWS e sottolineare i link (testo legale: PR dell'agente `legale`, si unisce solo con il «procedi»).
9. ⬜ **Contratti sui dati:** valutare LocationIQ; preparare il testo per il DPO di Aruba.
10. ⬜ **Riordino delle PR vecchie** (quasi tutte testi legali): proposta di chiusura di quelle superate (#95, #116, #147), decisione sul codice legale (#100, #102, #114), chiusura dei documenti (#127, #128, #134) e delle note e bozze legali di ottobre (#40, #80, #81, #92), sempre con l'OK del titolare. Video e immagini vecchi (#119, #120, #121, #143) chiusi il 31/10.
11. ⏳ **Controlli:** controllo giornaliero e CI verde su `main` (il controllo del server due volte al giorno è finito il 31/10).
12. ⏳ **Offerta con la durata scelta dal negozio** (decisione del titolare, 14/11: non più «un'offerta al mese»): il negozio sceglie quanto dura (da pochi giorni a tre mesi; un omaggio anche senza scadenza), la può prolungare con un tocco e prepara la prossima quando vuole. App nella PR #253, testi legali nella PR #255 (agente `legale`): si uniscono **insieme**, solo con il «procedi» del titolare, dopo l'email di preavviso ai negozi già iscritti.

### Tu
13. ⬜ **Contattare i negozi**, uno alla volta (telefono, visita, messaggi preparati da Claude), con un modo semplice per dire no.
14. ⬜ **Prova da iPhone e da un Android vero** (registrazione, QR, fotocamera); poi accendere la conferma email dei clienti sul sito vero.
15. ⬜ **Email:** Resend Pro (20 $/mese) quando le email superano le 100 al giorno del piano gratuito.
16. ⬜ **Aruba:** condizioni dall'area clienti e lettera al DPO (testo di Claude). **privacy@ su Gmail gratuito:** decidere se spostarla.
17. ⬜ **Profili social:** la bio di Instagram dice ancora «negozi di quartiere» e «18+»; la descrizione di Facebook dice «Un'offerta al mese» e «18+». Testi nuovi proposti da Claude; la bio di Instagram si cambia solo dall'app.
18. ⬜ **OK in attesa:** PR #250, #252, #254; #253 con #255 e #244 (testi legali, con il «procedi»); animazioni #226; materiali #146 e #218; copione del video corto.
19. ⬜ **Prima di approvare un'offerta:** guardare con Claude le foto e la scheda completa.
20. ⬜ **Atlas:** passare al piano gratuito, da fare insieme dal PC.

### Avvocato
21. ⬜ **Testi legali:** sono sul sito, chiusi dall'agente `legale` ma **non validati da un avvocato**. Almeno un'ora sui Termini per i negozi; dubbi in `docs/legale/LISTA_PER_AVVOCATO.md`; richiesta di preventivo pronta in `docs/legale/RICHIESTA_PREVENTIVO.md` (la manda il titolare).
22. ⛔ **Blocco (decisione del titolare, 23/10): niente pagamenti e niente Sconticini senza l'OK dell'avvocato** (PR #169 e #195 ferme).

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)

### Claude
23. ⬜ Prova dei pagamenti con soldi finti sul sito di prova (chiavi di prova Stripe e PayPal date dal titolare, `MERCHANT_PAYMENT_REQUIRED=true` solo lì).
24. ⏳ Email ai negozi sui pagamenti (#169, pronte e spente): da unire dopo l'avvocato.
25. ⬜ «Migliora foto» (Gemini): spento fino al lancio; poi tetto di 5 €/mese e chiave su Render.

### Tu
26. ⬜ Conti Stripe e PayPal Business della società; chiavi vere sul server solo il giorno dell'accensione.
27. ⬜ **Dalla visura (23/10):** modifica dell'oggetto sociale dal notaio (piattaforma online) e codice ATECO in più; delega per firmare a nome della società.
28. ⬜ Conferma esplicita prima di accendere i pagamenti (i pagamenti dei clienti restano spenti).

### Avvocato, notaio, commercialista
29. ⬜ **Avvocato:** testi della schermata di pagamento (#181) e Termini sui pagamenti.
30. ⬜ **Commercialista:** IVA al 22%, fattura elettronica (SdI), PEC.
31. ⬜ **Notaio:** oggetto sociale (vedi punto 27).

## C. Dopo il lancio, con calma

### Claude
32. ⬜ Un abbonamento per commerciante anche con più punti vendita (più punti vendita in un account; adattare i Termini).
33. ⬜ Prova gratuita ripetuta e Partita IVA con più punti vendita (impronta anti-abuso, segnalazioni in admin).
34. ⏳ Sconticini (#195, fermo per il punto 22). Il 14/11 il titolare ha chiesto di riprenderli: la PR va riallineata alla durata libera (punto 12) e resta spenta finché il blocco del punto 22 non viene tolto.
35. ⬜ Mappe: chiave LocationIQ su Render e file `roma.pmtiles` (guida `docs/guide/MAPPE.md`).
36. ⬜ Foto del negozio nel profilo o all'iscrizione (da decidere).
37. ⬜ Idee: **offerte a tempo** («Coupon Flash», priorità 1: sconti di poche ore per i momenti vuoti; è il passo 2 dopo la durata libera del punto 12 e chiede una regola per pubblicare senza l'approvazione a mano), notifiche di prossimità; WhatsApp con API ufficiale (Meta Business).
38. ⬜ Valutare il repository privato (Render e minuti di GitHub Actions).
39. ⬜ Libreria foto: sostituire le foto tolte il 15/10 (non bloccante).

### Tu
40. ⬜ Emergent: archiviare o eliminare il progetto dormiente e revocare `EMERGENT_LLM_KEY`.
41. ⏸️ Pulizia dei branch delle PR già unite (dalla pagina «Branches» di GitHub; da qui la cancellazione è bloccata).
42. ⏸️ In sospeso per decisione del titolare (14/10): periodo di grazia per la prossima offerta non approvata in tempo; marchio «Sconti Roma» (nome più distintivo, ricerche, deposito).

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

Altre decisioni del 14/10: prima i negozi, ai clienti niente data fissa («stiamo arrivando»); tono neutro (niente Halloween); nessuna pubblicità a pagamento; prova gratuita ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita; chiave anti-abuso «Partita IVA + indirizzo» da fare dopo la partenza.

## Prima di farci conoscere ai clienti in una zona
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Circa 10 negozi con un'offerta approvata nella zona.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
