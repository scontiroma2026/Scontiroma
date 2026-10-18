# Lista «pronto al lancio» di Sconti Roma (aggiornata il 18/10)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

Lancio previsto il **31/10** (data **non** pubblica: al pubblico si dice «stiamo arrivando»). Prima i negozi, poi i clienti. Il giorno del lancio le offerte in attesa si approvano tutte insieme («Approva tutte»). Decisione sul lancio il **27/10**: minimo circa 10 negozi con un'offerta pronta, altrimenti si sposta di una settimana.
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

## A. Prima del lancio
1. ⏳ **Testi legali (decisione del titolare, 18/10):** niente consulente; li chiude l'agente `legale` dopo il reset (mer 21/10, 04:10, ripartenza programmata) fino a unire o chiudere tutte le PR legali. Testi «chiusi dall'agente, non validati da un avvocato»; consigliata comunque un'ora di avvocato solo sui Termini per i negozi. Prima di cominciare l'agente valuta anche il plugin open source di Anthropic «privacy-legal» (suite claude-for-legal, licenza Apache 2.0: DPA, valutazioni d'impatto, richieste degli interessati) leggendolo per intero e copiandone solo ciò che serve, senza segreti, con strumenti limitati e in italiano (richiesta del titolare 18/10). Elenco: Privacy, informativa negozi, Cookie, Termini, Recesso, DPA, registro, data breach, P2B/DSA, dati societari, Omnibus, foto e marchio. Domande in `docs/legale/DOMANDE_PER_IL_CONSULENTE.md`.
2. ⬜ **Utente:** visura camerale (REA, capitale, PEC, civico «5/B»): serve anche al punto 2.
3. ⬜ **Utente, domenica 18/10 (decisione del 14/10):** attivare tutti i piani a pagamento e fare gli upgrade dove serve: Render su Starter (~7 $/mese), Atlas su Flex (con prova di ripristino il giorno dopo), Resend su Pro (20 $/mese: 50.000 email al mese, nessun limite giornaliero). Guidato passo passo da Claude.
4. ⏳ **Contratti sul trattamento dei dati (DPA):** Resend ✅ · Render ✅ letto (automatico con i Termini, server a Francoforte, scheda in `docs/legale/DPA_RENDER_SCHEDA.md`) · MongoDB Atlas ✅ letto (automatico, cluster AWS Francoforte, `docs/legale/DPA_ATLAS_SCHEDA.md`) · LocationIQ ⬜ da valutare. Restano Privacy e registro dei trattamenti (agente legale).
5. ⏳ **Conferma email dei clienti:** provata sul sito di prova (6 passi su 6). Da accendere sul sito vero insieme al pre-lancio, non prima (oggi non ci sono offerte da vedere).
6. ⏸️ **Pre-lancio:** `PRELAUNCH_MODE` su Render non prima della sera del 21/10 e dopo la prova da iPhone. La frase provvisoria sulla lista d'attesa (#153) è ferma per decisione del titolare (14/10); si riprende con «unisci». Registrazione dei clienti già chiusa in pre-lancio (#151).
7. ⏳ **Materiali per i negozi:** video v16 per i commercianti (PR #155, bozza, superata dalla v17: da chiudere con l'OK del titolare; **v17 fatta e approvata dal titolare il 15/10** (PR #179 in bozza, da unire; foto reali della libreria, guida dopo «Al banco»; uso in `docs/comunicazione/VIDEO_V17_COME_USARLO.md`; non pubblicabile finché i Termini non sono validati e la musica non ha la licenza); base del video dell'8/10, voce femminile scelta, esempi ristorante «Menù di carne» ed enoteca con negozi finti, guida dentro il video); materiali scritti #146 in allineamento ai Termini (disdetta, «circa due mesi dalla prima pubblicazione», mese non rimborsabile); sito pronto. La percentuale nel video è ammessa (decisione del titolare, negozio fittizio): da verificare con il consulente.
8. ⏳ **Campagna social:** piano e copioni uniti (#140); il video v17 per i negozi va pubblicato anche sui social (formato master o quadrato) dopo la validazione dei Termini. Da fare: due gruppi per il 19/10 (ricerca del titolare), musica, video con persone, copertine nuove su WhatsApp e Facebook.
9. ⬜ **27/10:** controllo della soglia di negozi e decisione sul 31/10.
10. ⏳ **Prove e pratiche:** prova del cambio mese ✅ (test automatici e orari di Roma, #149) · controllo di base su un Android vero ✅ 18/10 (restano registrazione, QR e fotocamera) · marchio «Sconti Roma» ⏳ (scheda di verifica unita il 15/10 (#167): resta da portarla al consulente con le sue domande; `docs/operazioni/MARCHIO.md`) · codice ATECO ⬜ (`docs/operazioni/CODICE_ATECO.md`) · promemoria in `PROMEMORIA_DA_RIPRENDERE.md`.
11. ⬜ **Libreria foto:** il 15/10 tolte 104 foto con volti, marchi o dubbie (#166): restano 318 (Meccanici 11, Padel 13, Calcetto 19). Da sostituire con altre senza volti né marchi, scelte su Unsplash dal titolare (da qui Unsplash non è raggiungibile); non bloccante per il lancio.
12. ⬜ **«Approva tutte» e foto:** il giorno del lancio «Approva tutte» (`LANCIA`) approva anche le foto di tutte le offerte senza controllo foto per foto: prima guardare le foto una per una nelle schede «Offerte in attesa» e «Prossimo Mese».

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)
13. ⬜ Chiavi di prova Stripe e PayPal sul sito di prova e `MERCHANT_PAYMENT_REQUIRED=true` solo lì; prova con soldi finti.
14. ⬜ Conti Stripe e PayPal Business dell'azienda; chiavi vere sul server vero solo il giorno dell'accensione.
15. ⬜ **Commercialista:** IVA al 22%, fattura elettronica (SdI), PEC.
16. ⏳ **Claude:** altre email al commerciante (giorno 30 della prova, promemoria prima del 1°, mancato pagamento, ricevuta): cinque email pronte e spente (giorno 30 della prova, promemoria 7 giorni prima del primo pagamento, promemoria 3 giorni prima di ogni addebito mensile, mancato pagamento, ricevuta), PR #169 in bozza da guardare e unire (interruttore `MERCHANT_TRIAL_EMAILS`); scelte del titolare fatte il 15/10: nuove email al posto dei promemoria a 10 e 3 giorni; 7 giorni prima del primo pagamento; 3 giorni prima di ogni addebito. Restano da validare col consulente le frasi «dopo il giorno 5 vale per il mese dopo» e «non è un documento fiscale».
17. ⬜ **Consulente:** testi della schermata di pagamento (nuova frase «Non viene addebitato niente subito…», #181) e dei Termini sui pagamenti.
18. ⬜ **Utente:** conferma esplicita prima di accendere i pagamenti; i pagamenti dei clienti restano spenti.
19. ⬜ Gemini («Migliora foto»): spento fino al lancio; poi fatturazione con tetto di 5 €/mese e chiave su Render.

## C. Dopo il lancio, con calma
20. ⬜ **Un abbonamento per commerciante**, anche con più punti vendita (serve gestire più punti vendita in un account; adattare i Termini).
21. ⬜ **Prova gratuita ripetuta** e Partita IVA con più punti vendita (impronta anti-abuso, segnalazioni in admin).
22. ⏳ **Sconticini (decisione 18/10):** crediti per negozio, 1 per sconto scansionato; premio e soglia scelti dal negozio, QR dedicato al premio; email al cliente e al negozio; tracciato in admin. Parte dopo il reset (mer 21/10) con regolamento dell'agente legale.
23. ⏳ **«Ci pensiamo noi» (decisione 18/10):** offerte inserite da noi per i negozi con poco tempo, gratis, con conferma del negozio; si costruisce mercoledì.
24. ⏳ **Correzioni dalla revisione esterna:** togliere `token` dalla risposta admin (P1), ripulire i prezzi vecchi da 2,99 € dei clienti (P3), allarmi sulle email non inviate; mercoledì.
25. ⬜ **Profili social:** togliere «quartiere» dalle bio e dalla copertina Facebook; loghi «Seguici» nel video (`@sconti.roma`, pagina Facebook «Sconti Roma»).
26. ⬜ **Idee:** Coupon Flash (priorità 1), notifiche di prossimità; WhatsApp con API ufficiale (Meta Business, dopo il lancio).
27. ⬜ Emergent: progetto lasciato dormiente, da archiviare o eliminare (dati e `EMERGENT_LLM_KEY`).
28. ⬜ Valutare il repository privato (prima controllare Render e minuti di GitHub Actions); file `roma.pmtiles`; WhatsApp con API ufficiale.
29. ⏸️ **Pulizia dei branch** già uniti o superati (circa 98): rimandata per decisione del titolare (15/10); serve il permesso a cancellare. Le PR superate restano da decidere una alla volta: #103, #81, #100, #101.

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

Altre decisioni del 14/10: prima i negozi, ai clienti niente data fissa («stiamo arrivando»); tono neutro (niente Halloween); nessuna pubblicità a pagamento; prova gratuita ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita; chiave anti-abuso «Partita IVA + indirizzo» da fare dopo la partenza.

## Giorno del lancio
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Tutte le voci di A segnate.
- [ ] `PRELAUNCH_MODE` e avviso di lancio alla lista d'attesa; «Approva tutte» sulle offerte in attesa.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
