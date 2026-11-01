# Richiesta di preventivo a un legale (bozza per il titolare)

Stato: **bozza da rivedere**, non inviata. La invia il titolare, da `info@scontiroma.it` o dalla sua Gmail, dopo averla letta. Nessun dato personale scritto qui: i campi tra [parentesi quadre] li compila il titolare.
Collegata a `docs/legale/CONFRONTO_SERVIZI_LEGALI.md` (soluzione ibrida decisa il 14/10: testi, banner e registro del consenso restano nostri; un legale a forfait valida la parte negozi).

## A. Email (versione completa)

**Oggetto:** Richiesta di preventivo a forfait: revisione di Termini, Privacy e documenti per un'app italiana di sconti (marketplace)

Buongiorno,

sono [NOME E COGNOME], titolare di [RAGIONE SOCIALE / DITTA], con sede a [CITTÀ]. Stiamo per lanciare **Sconti Roma** (scontiroma.it), un'app web che mette in contatto i cittadini di Roma e dintorni con i negozi locali che offrono sconti. Vi chiedo un **preventivo a forfait** per la revisione dei nostri documenti legali.

**Come funziona il servizio, in breve**
- I **clienti** (maggiorenni) si iscrivono gratuitamente con email e password e usano gli sconti pubblicati dai negozi (un QR, un'offerta al mese per negozio).
- I **negozi** si iscrivono con Partita IVA, pubblicano le offerte (che approviamo noi) e hanno una prova gratuita di 2 mesi (almeno 60 giorni, da 60 a 90 giorni) dalla prima pubblicazione dell'offerta, con primo pagamento sempre il 1° del mese; poi un abbonamento mensile di 4,99 € + IVA, con addebito automatico (carta o PayPal) solo dopo una loro conferma esplicita; disdetta valida dalla fine del mese.
- I pagamenti non sono ancora attivi. Non vendiamo prodotti: facciamo da intermediari tra clienti e negozi.
- Dati trattati: email, nome, offerte usate, statistiche anonime; fornitori: hosting (Render), database (MongoDB Atlas), invio email (Resend), mappe (LocationIQ), futuri pagamenti (Stripe e PayPal). Abbiamo un banner cookie e un registro del consenso nostri.

**Cosa chiedo di rivedere** (abbiamo già preparato le bozze, vorremmo che lavoraste su quelle)
1. Termini d'uso dei **negozi**: prova gratuita e passaggio all'abbonamento, rinnovo e disdetta a fine mese, mese pagato non rimborsabile, sospensione e chiusura dell'account.
2. Termini d'uso dei **clienti** e informazioni di recesso.
3. **Privacy Policy** e **Cookie Policy**, con conservazione dei dati e cancellazione dell'account.
4. **Regolamento P2B** (UE 2019/1150) e **DSA** (UE 2022/2065): se e come ci si applicano e quali moduli servono (segnalazione di contenuti, reclami dei negozi, motivazione delle sospensioni).
5. **Contratti sul trattamento dei dati (DPA)** con i fornitori.

**Le domande a cui vorrei risposta nel preventivo**
1. Prezzo **totale a forfait** (IVA indicata) e cosa è escluso.
2. Tempi di consegna e quanti giri di correzione sono inclusi.
3. La revisione è firmata da voi e ne rispondete professionalmente? Avete assicurazione professionale?
4. Avete esperienza di marketplace, P2B e DSA?
5. Lavorate sulle nostre bozze o riscrivete da zero?
6. Costo degli aggiornamenti futuri (cambi di legge o di servizio).
7. Per i clienti, che non pagano, serve il recesso per consumatori o basta un testo più semplice?
8. Cosa consigliate per il passaggio da prova gratuita ad abbonamento (conferma esplicita, rinnovo, disdetta)?

Allego/vi invio i documenti in PDF: [elenco dal punto C]. Posso fare una breve chiamata di [15–20] minuti se serve.

Grazie e cordiali saluti,
[NOME E COGNOME] · EUROLINEA S.r.l.s. · eurolineasrls@alpec.it · [telefono, se vuoi indicarlo]

## B. Versione breve (modulo di un sito o messaggio)
«Buongiorno, lancio un'app italiana di sconti (marketplace tra clienti e negozi di Roma, abbonamento mensile per i negozi, pagamenti ancora spenti). Vorrei un preventivo a forfait per revisione di Termini (negozi e clienti), Privacy, Cookie, P2B/DSA e DPA, partendo da bozze già pronte. Mi indicate prezzo totale, tempi, giri di correzione, firma e assicurazione professionale? Grazie, [NOME] [CONTATTO].»

## C. Pacchetto da allegare (preparare PDF, nessun dato personale)
- Bozze dei Termini (`frontend/src/pages/legal/Termini.jsx`, proposte in `docs/legale/PROPOSTE_TESTI_LEGALI.md` e nella PR #116), Recesso, Privacy e Cookie.
- Pacchetto legale della PR #92 e i punti da validare (#95, #100, #101, #102, #114, #40, #76, #80, #83).
- Riepilogo delle decisioni del titolare (`docs/LISTA_LANCIO.md`, sezione «Decisioni del titolare»).
- Elenco dei fornitori e dei dati trattati (`docs/` di conformità, PR #80).
Il repository è pubblico: i documenti sono già leggibili, ma al legale va mandato un PDF unico e ordinato.

## D. Come scegliere tra i preventivi
| Voce | Studio 1 | Studio 2 | Studio 3 |
|---|---|---|---|
| Prezzo totale a forfait (IVA) | | | |
| Cosa è escluso | | | |
| Tempi | | | |
| Giri di correzione | | | |
| Firma e assicurazione | | | |
| Esperienza P2B/DSA | | | |
| Costo aggiornamenti | | | |
Conta più della cifra: la firma del legale, i tempi, e che lavori sulle nostre bozze.

## E. Prima di inviare
- [ ] Compilare i campi [tra parentesi] (ragione sociale, sede, contatto): vengono dalla visura camerale.
- [ ] Il prezzo 4,99 € + IVA e «2 mesi di prova (almeno 60 giorni)» sono confermati dal titolare (14/10 il prezzo, 31/10 la prova).
- [ ] Inviare a 2–3 studi, uno alla volta, senza dati di clienti o negozi.
- [ ] Non è un parere legale: serve solo a ottenere i preventivi.
