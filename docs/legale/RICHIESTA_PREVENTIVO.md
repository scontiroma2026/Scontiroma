# Richiesta di preventivo a un legale (bozza per il titolare)

Stato: **bozza da rivedere**, non inviata (campi compilati il 14/10 tranne quelli `[DA VISURA]`, vedi sezione F). La invia il titolare, da `info@scontiroma.it` o dalla sua Gmail, dopo averla letta. Nessun dato personale scritto qui: i campi tra [parentesi quadre] li compila il titolare.
Collegata a `docs/legale/CONFRONTO_SERVIZI_LEGALI.md` (soluzione ibrida decisa il 14/10: testi, banner e registro del consenso restano nostri; un legale a forfait valida la parte negozi).

## A. Email (versione completa)

**Oggetto:** Richiesta di preventivo a forfait: revisione di Termini, Privacy e documenti per un'app italiana di sconti (marketplace)

Buongiorno,

sono [DA VISURA: nome e cognome del legale rappresentante], legale rappresentante di Euro Linea S.r.l.s. (P.IVA 03240220644), con sede legale ad Ariano Irpino (AV) [DA VISURA: conferma sede e civico]. Stiamo per lanciare **Sconti Roma** (scontiroma.it), un'app web che mette in contatto i cittadini di Roma e dintorni con i negozi locali che offrono sconti. Vi chiedo un **preventivo a forfait** per la revisione dei nostri documenti legali.

**Come funziona il servizio, in breve**
- I **clienti** (maggiorenni) si iscrivono gratuitamente con email e password e usano gli sconti pubblicati dai negozi (un QR, un'offerta al mese per negozio).
- I **negozi** si iscrivono con Partita IVA, pubblicano le offerte (che approviamo noi) e hanno una prova gratuita di circa due mesi dalla prima offerta; poi un abbonamento mensile di 4,99 € + IVA, con addebito automatico (carta o PayPal) solo dopo una loro conferma esplicita; disdetta valida dalla fine del mese.
- I pagamenti non sono ancora attivi. Non vendiamo prodotti: facciamo da intermediari tra clienti e negozi.
- Dati trattati: email, nome, offerte usate, Partita IVA dei negozi, statistiche anonime, segnalazioni e reclami, e una lista d'attesa pre-lancio (solo email, con doppio consenso; oggi spenta). Fornitori: hosting (Render, Francoforte), database (MongoDB Atlas), invio email (Resend, Irlanda), dominio e posta (Aruba), posta inoltrata a un account Google, indirizzi dei negozi (LocationIQ), mappe (OpenStreetMap), futuri pagamenti (Stripe e PayPal, oggi spenti) e una funzione di miglioramento foto con Google Gemini (oggi spenta). Abbiamo un banner cookie e un registro del consenso nostri.

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

Allego/vi invio i documenti in PDF: Termini d'uso (clienti e negozi), Privacy Policy, Cookie Policy, pagina Recesso, bozze del pacchetto legale (13 bozze e indice con 26 domande), documento «Pacchetto per il consulente» con le domande numerate, elenco fornitori e registro dei trattamenti, riepilogo delle decisioni (vedi elenco al punto C). Posso fare una breve chiamata di 20 minuti se serve.

Grazie e cordiali saluti,
[DA VISURA: nome e cognome] · Euro Linea S.r.l.s. · P.IVA 03240220644 · PEC [DA VISURA] · [telefono, solo se vuoi indicarlo]

## B. Versione breve (modulo di un sito o messaggio)
«Buongiorno, per Euro Linea S.r.l.s. lancio un'app italiana di sconti (marketplace tra clienti e negozi di Roma, abbonamento mensile per i negozi, pagamenti ancora spenti). Vorrei un preventivo a forfait per revisione di Termini (negozi e clienti), Privacy, Cookie, P2B/DSA e DPA, partendo da bozze già pronte. Mi indicate prezzo totale, tempi, giri di correzione, firma e assicurazione professionale? Grazie, [DA VISURA: nome] [contatto: info@scontiroma.it o PEC DA VISURA].»

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
- [ ] Compilare i campi `[DA VISURA]` (nome del legale rappresentante, conferma sede e civico, PEC): vedi sezione F. Ragione sociale e P.IVA sono già compilate (sono già pubbliche nei testi del sito).
- [ ] Il prezzo 4,99 € + IVA e «circa due mesi di prova» sono confermati dal titolare (14/10).
- [ ] Inviare a 2–3 studi, uno alla volta, senza dati di clienti o negozi.
- [ ] Non è un parere legale: serve solo a ottenere i preventivi.

## F. Cosa estrarre dalla visura (aggiunto il 14/10)
Stato dei campi: **compilati** con dati già pubblici nei testi del sito (ragione sociale, P.IVA, servizio, fornitori, documenti da allegare, durata della chiamata); **segnaposto `[DA VISURA]`** per quelli sotto. Nessun dato personale, email o telefono personali scritti qui: repository pubblico.

| Dato da estrarre | Dove va | Perché |
|---|---|---|
| Nome e cognome del **legale rappresentante** (firma della richiesta) | Email, versione breve, firma | Chi scrive per l'azienda. Metterlo nel PDF mandato al legale, **non** nel repository pubblico se il titolare non vuole renderlo pubblico |
| **Sede legale** e **civico** (conferma «5/B», oggi scritto «5/B 5/B» nella prima bozza) | Email, Privacy art. 1, Termini intro (PR #40), piè di pagina | Art. 2250 c.c., D.Lgs. 70/2003 art. 7 |
| **PEC** | Firma, Privacy, Termini, Recesso | Contatto ufficiale |
| **Numero REA** e Camera di Commercio | Piè di pagina, Termini | Art. 2250 c.c. |
| **Capitale sociale** (versato, «i.v.») | Piè di pagina, Termini | Art. 2250 c.c. |
| **Codice fiscale** della società (di solito come la P.IVA) | Registro, fatture | Identificazione |
| **Socio unico** / eventuale liquidazione | Piè di pagina (se applicabile) | Art. 2250 c.c. |
| **Codice ATECO** (punto 17 della lista) | Commercialista, fatture | Attività |
| Oggetto sociale (conferma che copre piattaforme online e servizi digitali) | Verifica col consulente | Coerenza con l'attività |
| Dimensione (addetti, fatturato) se noti | Domanda P2B/DSA sulle esenzioni per piccole imprese | Art. 11-12 P2B e DSA art. 19, **da verificare** |

Blocco proposto per il piè di pagina, da compilare dopo la visura: *Euro Linea S.r.l.s. · Sede legale: [DA VISURA] · P.IVA 03240220644 · REA: [DA VISURA] · Capitale sociale € [DA VISURA] i.v. · PEC: [DA VISURA]*.
