# Lista «pronto al lancio» di Sconti Roma (aggiornata il 12/10)

Il sito è già online e funziona; il «lancio ufficiale» è il momento in cui lo presentiamo ai primi commercianti e ai primi clienti.
Il lancio è **gratuito per circa due mesi**: i pagamenti non servono per partire, servono prima del primo addebito.
Segna con `[x]` quando una voce è fatta. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy; **Commercialista**.

Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

## A. Prima del lancio (8 voci)
1. [ ] **Consulente:** valida i testi legali (Privacy, Cookie, Termini, Recesso) e poi li pubblichiamo. Dentro ci sono: banner cookie senza «Marketing» (#95), LocationIQ e Stripe/PayPal come fornitori nella Privacy, durate di conservazione, cookie di attribuzione ridotti, eliminazione account dal 1° del mese dopo (#102), avviso di disdetta (#100), applicabilità di P2B e DSA (se servono, si costruiscono i moduli di segnalazione e reclamo). Il pacchetto è in #92, #101, #76, #80, #83, #40.
2. [ ] **Utente:** visura camerale: REA, capitale sociale, PEC, conferma del civico «5/B» (#40).
3. [ ] **Utente:** posta funzionante: Gmail nuovo e inoltro di `info@`, `privacy@`, `partner@` (due record MX su Aruba, non toccare `send`); poi `REPLY_TO_EMAIL` e `ADMIN_NOTIFY_EMAIL` su Render.
4. [ ] **Utente:** server e dati: Render su «Starter» (non si addormenta); backup automatici su MongoDB Atlas con prova di ripristino; riga «Indirizzi (LocationIQ)» verde in admin (altrimenti chiave `LOCATIONIQ_API_KEY` su Render).
5. [ ] **Utente:** contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google (Gmail gratuito non ne ha: si cambia quando c'è il secondo account Google).
6. [ ] **Utente:** prova generale sul sito di prova: registrazione, Partita IVA, offerta, approvazione, QR, scansione. Poi eventualmente una prova sul sito vero con un negozio finto, da cancellare.
7. [ ] **Utente:** alcuni negozi con offerte pubblicate a Roma e dintorni (le prime attività da cercare restano Garbatella, San Paolo e Marconi) e primo messaggio ai negozi (uno alla volta, con modo per dire no), dopo che il consulente ha visto i testi.
8. [ ] **Claude:** allineare le bozze legali alle decisioni del 12/10 (prova «circa due mesi», 4,99 € + IVA, pagamento dal 1° al 5, disdetta, eliminazione account) prima che le veda il consulente.

## B. Dopo il lancio, prima del primo addebito (circa due mesi dopo)
- [ ] **Utente:** chiavi sandbox di Stripe e PayPal sul sito di prova e `MERCHANT_PAYMENT_REQUIRED=true` solo lì; **prova con soldi finti** insieme a Claude (carta, PayPal, mancato pagamento, disdetta).
- [ ] **Utente:** conti Stripe e PayPal Business dell'azienda; chiavi vere sul server vero solo il giorno dell'accensione.
- [ ] **Commercialista:** conferma IVA al 22%, chi emette la fattura elettronica (SdI), commissioni, PEC.
- [ ] **Claude:** altre email al commerciante: giorno 30 della prova, promemoria prima del 1°, mancato pagamento, ricevuta; Partita IVA per i negozi già registrati.
- [ ] **Consulente:** testi della schermata di pagamento e dei Termini sui pagamenti.
- [ ] **Utente:** conferma esplicita prima di accendere i pagamenti veri; i pagamenti dei clienti restano spenti (`CLIENT_SUBSCRIPTION_REQUIRED=false`).
- [ ] **Utente:** Gemini («Migliora foto»): spento fino al lancio; poi fatturazione con tetto di 5 €/mese e avviso di spesa, chiave su Render.

## C. Dopo il lancio, con calma
- [ ] **Utente:** profili social e WhatsApp Business (email e numero dedicati, nome e handle `scontiroma`), Google Business, gruppi di quartiere (permesso agli amministratori). Piano in #103.
- [ ] **Claude e utente:** video commercianti (testo dell'utente, poi voce e montaggio; chiedere prima il permesso per i crediti) e video per i clienti.
- [ ] **Utente:** file `roma.pmtiles` della mappa (guida `docs/guide/MAPPE.md`); foto del negozio nel profilo (da decidere).
- [x] **Claude:** correzioni di testo (13/10): «+ IVA» e niente «prezzo bloccato» nel kit (#41) e nel piano (#81); «Roma e dintorni» al posto dei tre quartieri nel kit, nei Termini (#116) e nella home; segnaposto del modulo offerta già corretto. I dati demo stanno solo nei test (`e2e/seed_demo.py`), mai in produzione.
- [ ] **Utente:** revocare `EMERGENT_LLM_KEY`; avvisi di UptimeRobot sull'email di Sconti Roma e sull'app del telefono.

## Fatto
- [x] Controllo online (UptimeRobot) su sito e server (10/10).
- [x] Password dell'utente `prova` di Atlas cambiata (11/10).
- [x] Controllo giornaliero automatico alle 8:00 con GitHub e Resend (12/10).
- [x] Prova dei negozi, pre-lancio «Approva tutte», promemoria a 10 e 3 giorni, Stripe e PayPal per i negozi (spenti), prezzo 4,99 € + IVA, Partita IVA all'iscrizione, avvisi di disdetta.

## Decisioni del titolare (riferimento)
Niente prezzo bloccato; 4,99 € al mese + IVA; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5; approvazione sempre manuale e solo con pagamento in regola; addebito automatico con una sola conferma del commerciante; disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile; Gemini spento fino al lancio; data di lancio D lasciata vuota.

## Giorno del lancio
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali non validati.
- [ ] Tutte le voci di A segnate.
- [ ] Controllo giornaliero attivo (dopo il lancio due volte al giorno).
