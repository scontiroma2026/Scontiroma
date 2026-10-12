# Lista «pronto al lancio» di Sconti Roma

Il sito è già online e funziona; il «lancio ufficiale» è il momento in cui lo presentiamo ai primi
commercianti e ai primi clienti. Questa lista dice cosa deve essere a posto prima.
Segna con `[x]` quando una voce è fatta. Chi: **Utente** = titolare; **Claude**; **Consulente** = legale/privacy;
**Commercialista**.

Repository pubblico: qui mai password, chiavi, ID di recupero né dati di persone reali.

## 1. Legale (bloccante)
- [ ] **Consulente:** validare Termini, Privacy, Cookie e Recesso (domande in `docs/legale/PROPOSTE_TESTI_LEGALI.md`; analisi dei rischi in `docs/legale/REVISIONE_TERMINI.md`, PR #76).
- [ ] **Consulente:** sistemare i 3 punti ad alto rischio dei Termini (mese in corso, rinnovo e disdetta non definiti; limite di responsabilità durante il lancio gratuito).
- [ ] **Consulente:** informativa privacy: l'admin vede il nome per intero dei clienti.
- [ ] **Utente:** dati aziendali nei testi (sede legale, P.IVA, REA, capitale sociale, PEC facoltativa) → PR #40.
- [ ] **Utente:** contratti sul trattamento dei dati (DPA) con Render, MongoDB Atlas, Resend e Google.
- [ ] **Claude:** dopo il consulente, confronto fra versioni e verifica di conformità (GDPR, Codice del Consumo, cookie).

## 2. Affidabilità
- [x] **Utente:** controllo online UptimeRobot su sito e server (10/10; falso allarme nel risveglio di Render, previsto).
- [ ] **Utente:** server Render su piano «Starter» (non si addormenta). Da fare subito prima del lancio.
- [ ] **Utente:** backup automatici dei dati su MongoDB Atlas e prova di ripristino.
- [ ] **Utente:** cambiare la password dell'utente `prova` di Atlas e la relativa stringa su Render.
- [ ] **Utente:** revocare `EMERGENT_LLM_KEY` (vedi `docs/STATO.md`, «Pulizie tecniche»).
- [ ] **Claude:** controllo giornaliero automatico in sola lettura (CI, PR, email Resend).
- [ ] **Utente:** allarme anche sul telefono (app UptimeRobot) e mittente UptimeRobot segnato come sicuro.

## 2-bis. Prova generale
- [ ] **Utente:** provare l'ambiente di prova (registrazione, login, recupero password, offerta, QR) e segnare l'esito.
- [ ] **Utente:** una prova completa sul sito vero con un negozio finto, poi cancellare i dati di prova.

## 3. Comunicazioni
- [ ] **Utente:** nuovo Gmail e inoltro di `info@`, `privacy@`, `partner@` (record MX su Aruba); poi `REPLY_TO_EMAIL` e `ADMIN_NOTIFY_EMAIL` su Render.
- [ ] **Utente:** numero WhatsApp Business, pagine Facebook e Instagram, scheda Google Business.
- [ ] **Claude:** messaggi pronti da incollare per Facebook, Instagram e WhatsApp, dopo il video.

## 4. Contenuti
- [ ] **Utente:** testo del video commercianti da rivedere; poi nuova voce e montaggio (PR #62).
- [ ] **Utente:** file `roma.pmtiles` della mappa (da un computer con rete libera, guida `docs/guide/MAPPE.md`).
- [ ] **Utente:** Gemini («Migliora foto»): deciso il 10/10, spento fino al lancio; dopo il lancio fatturazione con tetto di 5 €/mese e avviso di spesa (da alzare se serve).
- [ ] **Utente:** almeno alcuni negozi con offerte pubblicate nelle tre zone pilota, per non lasciare le schede vuote.

## 5. Pagamenti e fatture (spenti per ora)
Decisioni del titolare (10-12/10): niente prezzo bloccato; **4,99 € al mese + IVA**; la prova parte dalla prima pubblicazione e si paga sempre il 1° del mese (prima offerta entro l'11 → primo pagamento il 1° di due mesi dopo, dal 12 → tre mesi dopo: prova da 49 a 81 giorni, «circa due mesi»); pagamento dal 1° al 5 del mese; approvazione dell'offerta solo con pagamento in regola e **sempre manuale**; addebito automatico con Stripe e PayPal dopo **una sola conferma** del commerciante (carta o PayPal chiesti circa 10 giorni prima della fine prova); disdetta a fine mese con lo sconto da rispettare; mese pagato non rimborsabile.
- [x] **Utente:** decisioni su prova, primo addebito, tolleranza, rinnovo, prezzo e IVA esclusa.
- [x] **Claude:** prova dei negozi e registro dei pagamenti (#88), pannello pre-lancio «Approva tutte» e promemoria a 10 e 3 giorni (#96), Stripe (#97) e PayPal (#98) per i negozi, prezzo + IVA (#105), tutto spento con `MERCHANT_PAYMENT_REQUIRED`.
- [ ] **Claude:** schermata «Attiva il pagamento» (#104 unita), pagamenti automatici nella scheda Pagamenti dell'admin (#107), avviso e email di disdetta (#100), eliminazione account dal 1° del mese dopo (#102): in attesa di controlli, OK dell'utente e consulente.
- [ ] **Utente:** chiavi sandbox di Stripe e PayPal sul sito di prova e `MERCHANT_PAYMENT_REQUIRED=true` solo lì; **prova con soldi finti** insieme a Claude (carta, PayPal, mancato pagamento, disdetta).
- [ ] **Utente:** conti Stripe e PayPal Business dell'azienda; chiavi vere sul server vero solo il giorno dell'accensione.
- [ ] **Commercialista:** conferma IVA al 22%, chi emette la fattura elettronica (SdI), commissioni, PEC.
- [ ] **Consulente:** testi della schermata di pagamento, dei Termini (prova, pagamento, disdetta, «+ IVA») e della Privacy (Stripe e PayPal come fornitori).
- [ ] **Utente:** conferma esplicita prima di accendere i pagamenti veri (`MERCHANT_PAYMENT_REQUIRED` e le chiavi reali); i pagamenti dei clienti restano spenti (`CLIENT_SUBSCRIPTION_REQUIRED=false`).

## 6. Giorno del lancio
- [ ] Controlli verdi su `main`, nessuna PR aperta con testi legali.
- [ ] Tutte le voci sopra segnate, tranne quelle volutamente rimandate (scrivere qui quali e perché).
- [ ] Primo messaggio ai negozi inviato e controllo giornaliero attivo (dopo il lancio due volte al giorno).
