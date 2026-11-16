# Lista «pronto al lancio» di Sconti Roma (aggiornata il 15/11)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

**Decisione del titolare (31/10):** niente lista d'attesa e niente pre-lancio: l'app resta aperta a tutti (`PRELAUNCH_MODE` spento, come già in produzione; il codice della lista resta spento). Niente data di lancio: si cresce una zona alla volta, prima i negozi. Al 31/10 è iscritto un solo negozio (studio odontoiatrico).
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

Divisione (richiesta del titolare, 24/10): in ogni parte prima **ciò che fa Claude**, poi **ciò che fai tu**, poi **avvocato, notaio e commercialista**. Lista ricostruita il 24/10 confrontando tutte le versioni precedenti, i «Da fare» di `docs/STATO.md`, `docs/operazioni/PROMEMORIA_DA_RIPRENDERE.md` e tutte le PR aperte.

## A. Adesso: i primi negozi

### Claude
1. ⏳ **Primi negozi in una zona** (problema «uovo e gallina»: prima i negozi, poi sono loro a portare i clienti con locandina e social): dalla lista di 232 attività preparare l'elenco dei prossimi da contattare, vicini tra loro, con il messaggio adatto; obiettivo circa 10 negozi con un'offerta. I messaggi li manda il titolare (mai WhatsApp a suo nome).
2. ⬜ **Offerta dello studio odontoiatrico:** controllarla prima dell'approvazione con le regole sulla pubblicità sanitaria (niente promesse di risultato, niente prezzi civetta); dubbi nella lista per l'avvocato.
3. ⏳ **Social:** dati al 31/10 (Instagram 7 giorni: 71 persone raggiunte, 210 visite al profilo, 4 clic sul sito, 0 condivisioni): contenuti da far girare (reel, «manda questo al tuo bar preferito»), resoconto ogni domenica; sempre con anteprima e «ok» del titolare.
4. ⏳ **TikTok:** prova con Higgsfield (bozze, account gratuito, nessun addebito) appena il titolare collega l'account.
5. ⬜ **Video corto per i negozi** (circa 55 s, copione del 23/10): aspetta l'OK sul copione; voce con crediti ElevenLabs solo con il permesso.
6. ⏳ **Materiali per i negozi da chiudere:** #146, #218, #148: riallinearli ai testi legali e portarli al titolare per l'OK.
7. ⏳ **Bozze grafiche** in attesa di OK: animazioni (#226) e nuova pagina «Per i commercianti».
8. ⬜ **Privacy da iubenda:** aggiungere Cloudflare e AWS e sottolineare i link (testo legale: PR dell'agente `legale`, si unisce solo con il «procedi»).
9. ⬜ **Contratti sui dati:** valutare LocationIQ; preparare il testo per il DPO di Aruba.
10. ⬜ **Riordino delle PR vecchie** (quasi tutte testi legali): proposta di chiusura di quelle superate (#95, #116, #147), decisione sul codice legale (#100, #102, #114), chiusura dei vecchi video e immagini (#119, #120, #121, #143) e dei documenti (#127, #128, #134), sempre con l'OK del titolare.
11. ⏳ **Controlli:** controllo giornaliero e CI verde su `main` (il controllo del server due volte al giorno finisce il 31/10).
12. ⏳ **Offerta con la durata scelta dal negozio** (decisione del titolare, 14/11: non più «un'offerta al mese»): il negozio sceglie quanto dura (da pochi giorni a tre mesi; un omaggio anche senza scadenza), la può prolungare con un tocco e prepara la prossima quando vuole. PR dell'app pronta (#253); i Termini, il Recesso e la Privacy li riallinea l'agente `legale` in una PR a parte. **Le due PR si uniscono insieme, solo con il «procedi» del titolare.** Poi: messaggi ai negozi, volantino e post social da riallineare (niente più «un'offerta al mese»).

### Tu
13. ⬜ **Contattare i negozi**, uno alla volta (telefono, visita, messaggi preparati da Claude), con un modo semplice per dire no.
14. ⬜ **Collegare TikTok** a Higgsfield.
15. ⬜ **Prova da iPhone e da un Android vero** (registrazione, QR, fotocamera); poi accendere la conferma email dei clienti sul sito vero.
16. ⬜ **Email:** Resend Pro (20 $/mese) quando le email superano le 100 al giorno del piano gratuito.
17. ⬜ **Aruba:** condizioni dall'area clienti e lettera al DPO (testo di Claude). **privacy@ su Gmail gratuito:** decidere se spostarla.
18. ⬜ **Profili social:** bio più chiara con il link (solo 4 clic su 210 visite), togliere «quartiere» da bio e copertina Facebook.
19. ⬜ **OK in attesa:** copione del video corto, bozze grafiche (#226 e pagina «Per i commercianti»), materiali #146, #218, #148.
20. ⬜ **Prima di approvare un'offerta:** guardare con Claude le foto e la scheda completa.

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
34. ⏳ Sconticini (#195, fermo per il punto 22). Il 14/11 il titolare ha chiesto di riprenderli: la PR viene riallineata all'app di oggi e resta spenta finché il blocco del punto 22 non viene tolto.
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
