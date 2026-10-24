# Lista «pronto al lancio» di Sconti Roma (aggiornata il 24/10)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

Lancio previsto il **31/10** (data **non** pubblica: al pubblico si dice «stiamo arrivando»). Prima i negozi, poi i clienti. Il giorno del lancio le offerte in attesa si approvano tutte insieme («Approva tutte»). Decisione sul lancio il **27/10**: minimo circa 10 negozi con un'offerta pronta, altrimenti si sposta di una settimana.
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

Divisione (richiesta del titolare, 24/10): in ogni parte prima **ciò che fa Claude**, poi **ciò che fai tu**, poi **avvocato, notaio e commercialista**. Lista ricostruita il 24/10 confrontando tutte le versioni precedenti, i «Da fare» di `docs/STATO.md`, `docs/operazioni/PROMEMORIA_DA_RIPRENDERE.md` e tutte le PR aperte.

## A. Prima del lancio (decisione il 27/10, lancio previsto il 31/10)

### Claude
1. ⏳ **Social del fine settimana** (24-25/10, più negozi che clienti): reel negozi sab 10:00 (programmato), storia «3 passi» sab 13:00, storia clienti «lista d'attesa» sab 19:00, reel clienti dom 11:00, post «Hai un negozio?» dom 19:30 (programmato), storia «Ci pensiamo noi» dom 21:00. Sempre con anteprima e «ok» del titolare.
2. ⏳ **TikTok:** prova con Higgsfield (bozze di TikTok, account gratuito, nessun addebito) appena il titolare collega l'account.
3. ⬜ **Video corto per i negozi** (circa 55 s, copione proposto il 23/10): aspetta l'OK sul copione; poi voce (crediti ElevenLabs, chiedere il permesso) e musica con licenza; poi sul sito (pagina «Per i commercianti») e sui social.
4. ⏳ **Materiali per i negozi da chiudere:** #146 (kit, guida, copioni), #218 (risposte pronte alle email), #148 (campagna 19-31/10): riallinearli ai testi legali uniti il 23/10 e portarli al titolare per l'OK.
5. ⬜ **Ricerca dei negozi:** dalla lista di 232 attività (66 con un canale online) preparare l'elenco dei prossimi da contattare con il messaggio adatto; i messaggi li manda il titolare (mai WhatsApp a suo nome).
6. ⏳ **Bozze grafiche** in attesa di OK: animazioni (#226) e nuova pagina «Per i commercianti».
7. ⬜ **Contratti sui dati:** valutare LocationIQ; preparare il testo per il DPO di Aruba.
8. ⏳ **Controlli:** server due volte al giorno fino al 31/10 (8:47 e 20:47), controllo giornaliero, CI verde su `main`.
9. ⬜ **27/10:** conteggio di negozi e offerte e proposta «lancio sì/no» (minimo circa 10 negozi con un'offerta pronta).
10. ⬜ **Riordino delle PR vecchie:** testi legali superati dalle unioni del 23/10 (#40, #80, #92, #95, #116, #147): proposta di chiusura; codice legale ancora da valutare (#100 disdetta, #102 eliminazione negozio, #114 cancellazione automatica dei dati); vecchi video e immagini (#119, #120, #121, #143): chiusura con l'OK del titolare; documenti da decidere (#81, #127, #128, #134).

### Tu
11. ⬜ **Contattare i negozi**, uno alla volta (telefono, visita, messaggi preparati da Claude), con un modo semplice per dire no. Obiettivo: circa 10 negozi con un'offerta entro il 27/10.
12. ⬜ **Collegare TikTok** a Higgsfield (link mandato da Claude).
13. ⬜ **Prova da iPhone** sul sito di prova, poi accensione del pre-lancio (`PRELAUNCH_MODE`) e della conferma email dei clienti sul sito vero.
14. ⬜ **Android vero:** registrazione, QR e fotocamera (il controllo di base è fatto, 18/10).
15. ⬜ **Email:** Resend Pro (20 $/mese) sì o no prima del lancio: il piano gratuito ha 100 email al giorno, poche per l'avviso di lancio alla lista d'attesa.
16. ⬜ **Aruba:** scaricare le condizioni dall'area clienti e scrivere al loro DPO (testo preparato da Claude). **privacy@ su Gmail gratuito:** decidere se spostarla su un servizio con contratto sui dati.
17. ⬜ **Profili social:** togliere «quartiere» dalle bio e dalla copertina Facebook.
18. ⬜ **OK in attesa:** copione del video corto, bozze grafiche (#226 e pagina «Per i commercianti»), materiali #146, #218, #148.
19. ⬜ **Prima di «Approva tutte»:** guardare con Claude le foto e la scheda completa di ogni offerta in attesa.

### Avvocato
20. ⬜ **Testi legali:** sono sul sito, chiusi dall'agente `legale` ma **non validati da un avvocato**. Almeno un'ora sui Termini per i negozi; dubbi in `docs/legale/LISTA_PER_AVVOCATO.md`; richiesta di preventivo pronta in `docs/legale/RICHIESTA_PREVENTIVO.md` (la manda il titolare).
21. ⛔ **Blocco (decisione del titolare, 23/10): niente pagamenti e niente Sconticini senza l'OK dell'avvocato** (PR #169 e #195 ferme).

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)

### Claude
22. ⬜ Prova dei pagamenti con soldi finti sul sito di prova (chiavi di prova Stripe e PayPal date dal titolare, `MERCHANT_PAYMENT_REQUIRED=true` solo lì).
23. ⏳ Email ai negozi sui pagamenti (#169, pronte e spente): da unire dopo l'avvocato.
24. ⬜ «Migliora foto» (Gemini): spento fino al lancio; poi tetto di 5 €/mese e chiave su Render.

### Tu
25. ⬜ Conti Stripe e PayPal Business della società; chiavi vere sul server solo il giorno dell'accensione.
26. ⬜ **Dalla visura (23/10):** modifica dell'oggetto sociale dal notaio (piattaforma online) e codice ATECO in più; delega per firmare a nome della società.
27. ⬜ Conferma esplicita prima di accendere i pagamenti (i pagamenti dei clienti restano spenti).

### Avvocato, notaio, commercialista
28. ⬜ **Avvocato:** testi della schermata di pagamento (#181) e Termini sui pagamenti.
29. ⬜ **Commercialista:** IVA al 22%, fattura elettronica (SdI), PEC.
30. ⬜ **Notaio:** oggetto sociale (vedi punto 26).

## C. Dopo il lancio, con calma

### Claude
31. ⬜ Un abbonamento per commerciante anche con più punti vendita (più punti vendita in un account; adattare i Termini).
32. ⬜ Prova gratuita ripetuta e Partita IVA con più punti vendita (impronta anti-abuso, segnalazioni in admin).
33. ⏳ Sconticini (#195, fermo per il punto 21).
34. ⬜ Mappe: chiave LocationIQ su Render e file `roma.pmtiles` (guida `docs/guide/MAPPE.md`).
35. ⬜ Foto del negozio nel profilo o all'iscrizione (da decidere).
36. ⬜ Idee: Coupon Flash (priorità 1), notifiche di prossimità; WhatsApp con API ufficiale (Meta Business).
37. ⬜ Valutare il repository privato (Render e minuti di GitHub Actions).
38. ⬜ Libreria foto: sostituire le foto tolte il 15/10 (non bloccante).

### Tu
39. ⬜ Emergent: archiviare o eliminare il progetto dormiente e revocare `EMERGENT_LLM_KEY`.
40. ⏸️ Pulizia dei branch delle PR già unite (dalla pagina «Branches» di GitHub; da qui la cancellazione è bloccata).
41. ⏸️ In sospeso per decisione del titolare (14/10): periodo di grazia per l'offerta del mese dopo non approvata in tempo; marchio «Sconti Roma» (nome più distintivo, ricerche, deposito).

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

Altre decisioni del 14/10: prima i negozi, ai clienti niente data fissa («stiamo arrivando»); tono neutro (niente Halloween); nessuna pubblicità a pagamento; prova gratuita ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita; chiave anti-abuso «Partita IVA + indirizzo» da fare dopo la partenza.

## Giorno del lancio
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Tutte le voci di A segnate.
- [ ] `PRELAUNCH_MODE` e avviso di lancio alla lista d'attesa; «Approva tutte» sulle offerte in attesa.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
