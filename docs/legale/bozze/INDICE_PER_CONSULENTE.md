# Indice per il consulente - pacchetto documenti legali di Sconti Roma

> **[PROPOSTA] [DA VALIDARE]** - Tutte le bozze sono state scritte da Claude (ufficio legale interno) leggendo il codice del 12/10/2026 e aggiornate con le decisioni del titolare del 10-12/10. **Non sono pareri legali** e **non sono pubblicate**: nessuna pagina del sito è stata modificata. Il consulente deve solo **validare e dare l'OK** (o correggere).
> Repository pubblico: nessun segreto né dato di persone reali. I dati aziendali mancanti sono `[DA COMPLETARE]` (serve la visura).
> Titolare: Euro Linea S.r.l.s., P.IVA 03240220644.

**Legenda:** 🔴 = rischio alto / punto rosso da sistemare prima del lancio · 🟠 = medio / da valutare col consulente · 🟢 = basso / miglioramento o già a posto.

## 1. Documenti

| N. | Documento | File | Stato | Rischio | Cosa deve solo validare il consulente |
|---|---|---|---|---|---|
| 01 | Privacy Policy | `01_PRIVACY_POLICY.md` | Bozza aggiornata | 🔴 | Basi giuridiche, destinatari (Render, MongoDB Atlas, Resend, LocationIQ, Stripe, PayPal, Google, Aruba, Gmail), Partita IVA, durate, trasferimenti, nessun DPO |
| 02 | Cookie Policy e banner | `02_COOKIE_POLICY_E_BANNER.md` | Bozza aggiornata | 🟠 | Cookie di attribuzione ridotti (scelta A), banner senza «Marketing», consenso conservato 24 mesi |
| 03 | Termini Clienti | `03_TERMINI_CLIENTI.md` | Bozza aggiornata | 🟠 | Intermediario, «gratuita nella fase di lancio», «Roma e dintorni», sconto da rispettare, foro del consumatore |
| 04 | Termini Commercianti | `04_TERMINI_COMMERCIANTI.md` | Bozza aggiornata | 🔴 | Prova, primo pagamento, addebito automatico dopo una conferma, disdetta a fine mese, eliminazione account, responsabilità, manleva, clausole 1341-1342 |
| 05 | Recesso | `05_RECESSO.md` | Bozza aggiornata | 🟢 | Nessun recesso finché non ci sono pagamenti dei consumatori; professionisti esclusi |
| 06 | P2B (Reg. 2019/1150) | `06_P2B_INFORMATIVA_COMMERCIANTI.md` | Bozza aggiornata | 🔴 | Applicabilità, preavviso, motivazioni, ranking, reclami su info@, mediatori |
| 07 | DSA (Reg. 2022/2065) | `07_DSA_SEGNALAZIONI.md` | Bozza aggiornata | 🟠 | Applicabilità, qualificazione, info@ come punto di contatto |
| 08 | Dati aziendali | `08_DATI_AZIENDALI.md` | Bozza + dati mancanti | 🟠 | Elenco dati dell'art. 2250 c.c. e blocco del piè di pagina |
| 09 | Fornitori / DPA | `09_DPA_FORNITORI.md` | Bozza aggiornata | 🟠 | Ruoli, trasferimenti, Gmail gratuito poi Workspace, Stripe/PayPal |
| 10 | Registro trattamenti | `10_REGISTRO_TRATTAMENTI.md` | Bozza aggiornata | 🟠 | Righe nuove (Partita IVA, pagamenti, attribuzione, IA), DPIA non necessaria |
| 11 | Data breach | `11_DATA_BREACH.md` | Bozza | 🟢 | Procedura 72 ore |
| 12 | Diritti degli interessati | `12_DIRITTI_INTERESSATI.md` | Bozza aggiornata | 🟢 | Procedura 1 mese; cancellazione dei negozi con offerta in corso (🟠) |
| 13 | Messaggi commerciali | `13_MESSAGGI_COMMERCIALI.md` | Bozza aggiornata | 🟠 | Consensi, soft spam, primo contatto ai negozi, regole social |
| - | Accessibilità | nota in `08_DATI_AZIENDALI.md` | Nota | 🟢 | Dichiarazione AgID non dovuta: confermare |
| - | Disdetta e sconto da onorare | `docs/legale/DISDETTA_ESERCIZIO_SCONTO.md` | Documento di lavoro (branch `claude/legale-disdetta`) | 🔴 | Testi del riquadro e dell'email, clausole 1341-1342 |

Documenti già esistenti collegati: `PROPOSTE_TESTI_LEGALI.md`, `REVISIONE_TERMINI.md` (PR #76), `VERIFICA_CONFORMITA.md` e `DATI_AZIENDA_E_DPA.md` (PR verifica-conformita), PR #40 (sede e zone), PR #41, PR #83 (Termini senza prezzo bloccato), PR #95 (banner senza «Marketing»). Non toccate.

## 2. Decisioni del titolare già prese (10-12/10): recepite nelle bozze

| N. | Decisione | Dove |
|---|---|---|
| 1 | 4,99 € al mese + IVA (IVA esclusa, 22% da confermare col commercialista, addebitata da Stripe/PayPal). Mai «IVA inclusa» | 04, 06, 13 |
| 2 | Niente prezzo bloccato | 04, 06, 13 |
| 3 | Prova dalla prima pubblicazione; si paga il 1°: prima offerta entro l'11 = primo pagamento il 1° di due mesi dopo; dal 12 = il 1° di tre mesi dopo. «Circa due mesi» (49-81 giorni), mai «60 giorni». Promemoria a 10 e 3 giorni | 04, 06, 13 |
| 4 | Addebito automatico mensile il 1° (carta Stripe o PayPal) dopo UNA conferma esplicita con riepilogo; pagamento dal 1° al 5; approvazione sempre manuale e solo se il pagamento è in regola | 04, 05, 06 |
| 5 | Disdetta a fine mese; sconto da rispettare fino all'ultimo giorno; mese non rimborsabile; annullabile fino a fine mese; email di conferma | 04, 05, 03 |
| 6 | Eliminazione account di un negozio con offerta in corso dal 1° del mese dopo; senza offerta, immediata | 01, 04, 05, 10, 12 |
| 7 | Partita IVA obbligatoria alla registrazione dei commercianti | 01, 04, 06, 09, 10, 12 |
| 8 | Cookie: tolto «Marketing» (PR #95); attribuzione da ridurre (scelta A); consenso 24 mesi | 01, 02, 10 |
| 9 | info@ per segnalazioni (DSA) e reclami (P2B) | 03, 06, 07, 08 |
| 10 | privacy@ su Gmail gratuito finché non c'è il secondo account Google, poi Workspace (DPA). Data di lancio vuota | 01, 08, 09 |
| 11 | «Gratuita nella fase di lancio», «Roma e dintorni», 18+ | 01, 03, 05, 13 |
| 12 | Fornitori: Render, MongoDB Atlas, Resend, LocationIQ, Stripe, PayPal, Google (Gemini solo dopo il lancio, oggi spento) | 01, 09, 10, 11 |

## 3. Punti rossi e arancioni

### Chiusi o chiusi sul testo (ancora da validare)
1. 🟢 **LocationIQ nella Privacy**: aggiunto nella bozza 01 (resta da confermare che la chiave è su Render).
2. 🟢 **Categoria «Marketing» nel banner**: tolta (PR #95); bozza 02 allineata.
3. 🟢 **Regola unica sul primo pagamento** (ex punto rosso 4): bozza 04, art. 3.5 (entro l'11 / dal 12).
4. 🟢 **Posta privacy@ su Gmail**: decisione presa (Gmail gratuito, poi Workspace); resta il rischio nel frattempo, vedi domanda 16.
5. 🟢 **Indirizzo per segnalazioni e reclami**: info@.

### Ancora aperti
1. 🔴 **Durate dichiarate ma non applicate dal codice**: registro del consenso (24 mesi), scansioni non valide, statistiche di visita, offerte usate non si cancellano da sole. Lavoro tecnico + conferma delle durate.
2. 🔴 **Cookie di attribuzione** (`referral_merchant_id`, `fonte_iscrizione`): scelta A decisa (solo fino all'iscrizione), **non ancora realizzata**. Resta anche `app_feedback_secondi_v1` (tempo d'uso).
3. 🔴 **P2B e DSA**: preavviso, motivazioni, ranking, reclami e segnalazioni non sono nei Termini né nell'app (non c'è modulo di segnalazione); applicabilità da chiedere al consulente.
4. 🔴 **Pagamenti e disdetta non ancora nell'app**: conferma unica con riepilogo, promemoria 10 e 3 giorni, riquadro e email di disdetta. I Termini Commercianti non vanno pubblicati prima.
5. 🔴 **Partita IVA**: i commercianti **già registrati senza P.IVA** sono un punto aperto (come raccoglierla; non fatturabili e non addebitabili senza).
6. 🔴 **Dati aziendali mancanti**: REA, capitale sociale, PEC, conferma civico (art. 2250 c.c.).
7. 🟠 **Cancellazione dati che slitta fino a un mese** per i negozi con offerta in corso (art. 12 GDPR): domanda 22.
8. 🟠 **Gmail gratuito per privacy@**: nessun DPA fino al secondo account Google.
9. 🟠 **File di mappa `roma.pmtiles` assente dal repository**: la mappa ripiega su OpenStreetMap (riceve l'IP). Da verificare in produzione.
10. 🟠 **Contraddizione pubblica**: i Termini attuali del sito dicono ancora «IVA inclusa», «Prezzo bloccato», tre quartieri, eliminazione «subito» (elenco nella relazione del coordinatore).

## 4. Domande aperte per il consulente (numerate)
1. 🟠 Titolare: confermare dati identificativi (sede, REA, capitale, PEC) e il blocco del piè di pagina (doc. 08).
2. 🟠 Cookie di attribuzione ridotti ai soli dati necessari all'iscrizione (scelta A): bastano come tecnici? E `app_feedback_secondi_v1`? (doc. 02, art. 3)
3. 🔴 P2B: Sconti Roma rientra nel Reg. 2019/1150? Il sistema interno di reclami (info@) è obbligatorio o solo consigliato? Servono mediatori? (doc. 06)
4. 🔴 DSA: siamo hosting o piattaforma online? Quali obblighi? Basta info@ come punto di contatto per segnalazioni e per le autorità? (doc. 07)
5. 🟠 Commercianti: confermare che non hanno il recesso del consumatore (doc. 04-05); un commerciante senza P.IVA è consumatore?
6. 🟠 Versione dei testi: serve nuova accettazione esplicita di Termini/Privacy dagli iscritti, o basta l'avviso email con 15 giorni (art. 10 Termini clienti)? Un unico `LEGAL_VERSION`?
7. 🟠 Prezzo: senza prezzo bloccato basta il preavviso di 30 giorni con diritto di disdetta? (doc. 04, art. 3.3)
8. 🟠 Prova e primo pagamento: la regola «entro l'11 / dal 12» e l'espressione «circa due mesi (49-81 giorni)» sono chiare e valide? Tolleranza di 5 giorni come regola contrattuale?
9. 🟠 Personale del commerciante: basta la frase «il commerciante, o il suo personale a cui comunica il codice, vede nome e iniziale»? Titolare autonomo o contitolare?
10. 🟠 Messaggi ai negozi: primo contatto via WhatsApp/email consentito? Consenso B2B e Registro delle Opposizioni?
11. 🟠 Fatturazione ai commercianti: fattura elettronica, **IVA 22% aggiunta ai 4,99 €** (non inclusa), tempi, ricevuta; chi emette fattura quando incassano Stripe/PayPal?
12. 🔴 Limite di responsabilità verso i commercianti: minimo fisso? Approvazione specifica 1341-1342 così com'è scritta?
13. 🟠 Manleva del commerciante e licenza sulle foto (copie condivise): clausola doc. 04, art. 6.
14. 🟠 Foro: Roma per professionisti con sede ad Ariano Irpino: accettabile?
15. 🟢 ODR: confermare l'abrogazione e la formula ADR (doc. 03, art. 11).
16. 🟠 Trasferimenti: strumento per Render, MongoDB Atlas, Resend, LocationIQ, Stripe, PayPal, Google; e rischio accettabile di Gmail gratuito per privacy@ fino al passaggio a Workspace.
17. 🟠 Durate: log di sicurezza e scansioni (12 mesi?), prova consenso (24 mesi, deciso), statistiche (13 mesi?), backup di Atlas, log Render.
18. 🟢 Geolocalizzazione solo sul telefono: basta il «consenso», nessun invio al server?
19. 🟢 DPIA non necessaria? DPO non obbligatorio?
20. 🟢 Accessibilità: dichiarazione non dovuta?
21. 🟠 Recensioni dei negozi: se pubbliche, tutele (DSA, Omnibus art. 45-bis).
22. 🟠 **Nuova.** Eliminazione dell'account di un negozio con offerta in corso, programmata dal 1° del mese dopo: la cancellazione dei dati slitta fino a un mese. È compatibile con l'art. 12 GDPR (un mese)? Il testo va bene?
23. 🔴 **Nuova.** Addebito automatico mensile dopo UNA sola conferma esplicita: la forma (riepilogo con importo, rinnovo, disdetta, non rimborsabilità) è sufficiente, anche per i professionisti? Il mese pagato non rimborsabile e la disdetta a fine mese vanno nella seconda casella 1341-1342?
24. 🔴 **Nuova.** Partita IVA obbligatoria: come trattare i commercianti già registrati senza P.IVA (blocco dei pagamenti? raccolta successiva?). Il registro e la Privacy sono corretti?
25. 🟠 **Nuova.** Sconto da rispettare fino a fine mese anche dopo la disdetta: la manleva e la riscrittura dell'art. 4 dei Termini clienti («offerto dal Commerciante, che si è impegnato a rispettarlo») sono valide? Procedura se un negozio rifiuta (ritiro anticipato con motivazione, P2B).
26. 🟠 **Nuova.** Gemini (IA sulle foto) previsto solo dopo il lancio: quali passi (DPA, informativa, DPIA) prima di accenderlo?

## 5. Decisioni ancora aperte per il titolare (non per il consulente)
- 🔴 **A.** Fornire visura: REA, capitale, PEC, conferma civico; nome di chi risponde alle richieste.
- 🟠 **D.** Limite di responsabilità: minimo fisso in euro?
- 🔴 **E.** Realizzare la riduzione dei cookie di attribuzione (scelta A, lavoro tecnico).
- 🟠 **G.** Cancellazioni automatiche dei registri (lavoro tecnico) e durate.
- 🟠 **I.** Mediatori per P2B.
- 🔴 **M.** Come gestire i commercianti già registrati senza P.IVA.
- 🟠 **N.** Tempo massimo di risposta ai reclami (proposta: conferma in 5 giorni lavorativi, esito in 30).
- 🟠 **L.** Quando pubblicare: dopo OK del consulente, e non finché promemoria, conferma di pagamento e disdetta non sono nell'app.

Già decise e tolte da questo elenco: B (primo pagamento), C (tolleranza 5 giorni), F (privacy@ su Gmail poi Workspace), H (info@), data di lancio vuota.

## 6. Dopo il «sì» del consulente
1. Il titolare scrive in chat «OK consulente».
2. Claude prepara una PR separata che porta i testi nelle pagine del sito (Privacy, Cookie, Termini, Recesso), cambia `LEGAL_VERSION`, aggiorna footer e banner.
3. Unione solo con OK del titolare (CLAUDE.md).
