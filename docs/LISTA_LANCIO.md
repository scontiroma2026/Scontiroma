# Lista «pronto al lancio» di Sconti Roma (aggiornata il 15/10, sera)

**Regola del titolare (14/10, rettificata il 15/10):** quando chiede «la lista», si risponde con questa lista **numerata** dopo aver controllato lo stato reale delle PR. I punti chiusi (✅) si **cancellano** dalla lista e la lista si **rinumera**; la storia di ciò che è stato fatto resta in `docs/STATO.md`. I punti nuovi si aggiungono, quelli cambiati si rettificano. Questo file è la fonte: va tenuto allineato.

Lancio previsto il **31/10** (data **non** pubblica: al pubblico si dice «stiamo arrivando»). Prima i negozi, poi i clienti. Il giorno del lancio le offerte in attesa si approvano tutte insieme («Approva tutte»). Decisione sul lancio il **27/10**: minimo circa 10 negozi con un'offerta pronta, altrimenti si sposta di una settimana.
Legenda: ✅ fatto · ⏳ in corso · ⬜ da fare. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.
Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

## A. Prima del lancio
1. ⬜ **Consulente:** valida i testi legali (Privacy, Cookie, Termini, Recesso): PR #92, #95, #100, #101, #102, #114, #116, #76, #80, #40 e **#157 (Termini allineati alle decisioni: prova «circa due mesi» con esempio, disdetta, mese non rimborsabile; sostituisce la #83, chiusa)**. Già corretto in app: «€4,99 al mese + IVA», senza «prezzo bloccato» (#142) e l'email di benvenuto ai negozi con la frase di disdetta (#158).
2. ⏳ **Utente:** avvocato a forfait per la parte negozi (soluzione ibrida). La richiesta di preventivo è pronta (`docs/legale/RICHIESTA_PREVENTIVO.md`): compilare i campi e inviarla a 2–3 studi, chiedendo una revisione veloce dei Termini negozi.
3. ⬜ **Utente:** visura camerale (REA, capitale, PEC, civico «5/B»): serve anche al punto 2.
4. ⬜ **Utente, domenica 18/10 (decisione del 14/10):** attivare tutti i piani a pagamento e fare gli upgrade dove serve: Render su Starter (~7 $/mese), Atlas su Flex (con prova di ripristino il giorno dopo), Resend su Pro (20 $/mese: 50.000 email al mese, nessun limite giornaliero). Guidato passo passo da Claude.
5. ⏸️ **In sospeso (decisione del titolare, 14/10):** contratti sul trattamento dei dati (DPA), uno alla volta: 6a Render ⏳ · 6b MongoDB Atlas ⬜ · 6c Resend ✅ (DPA, SOC 2 e sub-fornitori scaricati; chiavi inutilizzate cancellate; resta la 2FA) · 6d Aruba (chiedere a dpo@aruba.com o dal pannello) ⬜ · 6e Google: il Gmail gratuito non ha un DPA ⬜. Documenti salvati solo nella cartella privata «DPA», non nel repository.
6. ⏳ **Utente + Claude:** prova generale sul sito di prova (già aggiornato). **15/10: fatti 13 passi su 19** (tutto l'admin e tutto il commerciante); restano i 6 passi del cliente (iscrizione, email di conferma, accesso, cuore, segnalazione, eliminazione account), che richiedono pre-lancio spento e email attive sul sito di prova (rimandati per scelta del titolare). Durante la prova: pulsanti WhatsApp/Chiama (#163, #165), libreria foto da telefono (#164), «Non rinnovo» che spegne il caricamento del mese dopo (#170), fine prova calcolata nei pagamenti (#171), controllo foto per foto con motivo (#172, #173), statistiche per negozio nell'admin (#174). Claude ha fatto la prova automatica completa (14/10, PR #151): checklist da iPhone e cosa accendere su Render in `docs/operazioni/PROVA_GENERALE.md`. Resta la prova dal telefono.
7. ⏳ **Conferma email dei clienti:** unita e spenta sul sito vero (`CLIENT_EMAIL_CONFIRMATION_REQUIRED=false` su Render). Da provare sul sito di prova (passi 1-2 del cliente del punto 6), poi accendere.
8. ⏸️ **Pre-lancio:** `PRELAUNCH_MODE` su Render non prima della sera del 21/10 e dopo la prova da iPhone. La frase provvisoria sulla lista d'attesa (#153) è ferma per decisione del titolare (14/10); si riprende con «unisci». Registrazione dei clienti già chiusa in pre-lancio (#151).
9. ⏳ **Materiali per i negozi:** video v16 per i commercianti (PR #155, bozza; **v17 fatta e approvata dal titolare il 15/10** (PR #179; foto reali della libreria, guida dopo «Al banco»; uso in `docs/comunicazione/VIDEO_V17_COME_USARLO.md`; non pubblicabile finché i Termini non sono validati e la musica non ha la licenza); base del video dell'8/10, voce femminile scelta, esempi ristorante «Menù di carne» ed enoteca con negozi finti, guida dentro il video); materiali scritti #146 in allineamento ai Termini (disdetta, «circa due mesi dalla prima pubblicazione», mese non rimborsabile); sito pronto. La percentuale nel video è ammessa (decisione del titolare, negozio fittizio): da verificare con il consulente.
10. ⏳ **Contatto con i negozi:** dal 19/10 (con la versione leggera del video v17 nei messaggi), uno alla volta, con il manuale e con modo per dire no, dopo che il consulente ha visto i testi.
11. ⏳ **Campagna social:** piano e copioni uniti (#140); il video v17 per i negozi va pubblicato anche sui social (formato master o quadrato) dopo la validazione dei Termini. Da fare: due gruppi per il 19/10 (ricerca del titolare), musica, video con persone, copertine nuove su WhatsApp e Facebook.
12. ⬜ **27/10:** controllo della soglia di negozi e decisione sul 31/10.
13. ⬜ **Utente:** accessi con verifica a due passaggi, codici di recupero su carta, persona di fiducia.
14. ⏳ **Prove e pratiche:** prova del cambio mese ✅ (test automatici e orari di Roma, #149) · test su un Android vero ⬜ (finora solo emulazione) · marchio «Sconti Roma» ⏳ (scheda di verifica per il consulente: PR #167 in bozza, da vedere; `docs/operazioni/MARCHIO.md`) · codice ATECO ⬜ (`docs/operazioni/CODICE_ATECO.md`) · promemoria in `PROMEMORIA_DA_RIPRENDERE.md`.
15. ⬜ **Logo e nome (decisione del titolare, 15/10):** si tiene l'aspetto attuale del sito e il nome «Sconti Roma»; le tre proposte di stile (PR #168) non sono piaciute e la PR è chiusa. Resta aperta solo la tutela del nome: vedi il punto del marchio (scheda in `docs/operazioni/MARCHIO_SCHEDA_VERIFICA.md`). Il logo attuale va bene per profili social, video e guide.
16. ⬜ **Libreria foto:** il 15/10 tolte 104 foto con volti, marchi o dubbie (#166): restano 318 (Meccanici 11, Padel 13, Calcetto 19). Da sostituire con altre senza volti né marchi, scelte su Unsplash dal titolare (da qui Unsplash non è raggiungibile); non bloccante per il lancio.
17. ⬜ **«Approva tutte» e foto:** il giorno del lancio «Approva tutte» (`LANCIA`) approva anche le foto di tutte le offerte senza controllo foto per foto: prima guardare le foto una per una nelle schede «Offerte in attesa» e «Prossimo Mese».

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)
18. ⬜ Chiavi di prova Stripe e PayPal sul sito di prova e `MERCHANT_PAYMENT_REQUIRED=true` solo lì; prova con soldi finti.
19. ⬜ Conti Stripe e PayPal Business dell'azienda; chiavi vere sul server vero solo il giorno dell'accensione.
20. ⬜ **Commercialista:** IVA al 22%, fattura elettronica (SdI), PEC.
21. ⏳ **Claude:** altre email al commerciante (giorno 30 della prova, promemoria prima del 1°, promemoria mensile 3 giorni prima di ogni addebito, mancato pagamento, ricevuta): pronte e spente, PR #169 in bozza da vedere (interruttore `MERCHANT_TRIAL_EMAILS`; 4 scelte da fare).
22. ⬜ **Consulente:** testi della schermata di pagamento e dei Termini sui pagamenti.
23. ⬜ **Utente:** conferma esplicita prima di accendere i pagamenti; i pagamenti dei clienti restano spenti.
24. ⬜ Gemini («Migliora foto»): spento fino al lancio; poi fatturazione con tetto di 5 €/mese e chiave su Render.

## C. Dopo il lancio, con calma
25. ⬜ **Un abbonamento per commerciante**, anche con più punti vendita (serve gestire più punti vendita in un account; adattare i Termini).
26. ⬜ **Prova gratuita ripetuta** e Partita IVA con più punti vendita (impronta anti-abuso, segnalazioni in admin).
27. ⬜ **Idee:** Coupon Flash (priorità 1), notifiche di prossimità, punti e raccolte a premio.
28. ⬜ Locandine A4 e volantini: passare a Manrope e togliere «quartiere» (PR #139, 4 scelte).
29. ⬜ Emergent: progetto lasciato dormiente, da archiviare o eliminare (dati e `EMERGENT_LLM_KEY`).
30. ⬜ Valutare il repository privato (prima controllare Render e minuti di GitHub Actions); file `roma.pmtiles`; WhatsApp con API ufficiale.
31. ⏸️ **Pulizia dei branch** già uniti o superati (circa 98): rimandata per decisione del titolare (15/10); serve il permesso a cancellare. Le PR superate restano da decidere una alla volta: #103, #81, #100, #101.

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

Altre decisioni del 14/10: prima i negozi, ai clienti niente data fissa («stiamo arrivando»); tono neutro (niente Halloween); nessuna pubblicità a pagamento; prova gratuita ripetuta rimandata; un abbonamento per commerciante a prescindere dai punti vendita; chiave anti-abuso «Partita IVA + indirizzo» da fare dopo la partenza.

## Giorno del lancio
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Tutte le voci di A segnate.
- [ ] `PRELAUNCH_MODE` e avviso di lancio alla lista d'attesa; «Approva tutte» sulle offerte in attesa.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
