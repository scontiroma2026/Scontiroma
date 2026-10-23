# Termini: proposta di allineamento con le decisioni sui negozi `[DA VALIDARE]`

Stato: **bozza per il consulente, non unire** (testo legale). Data: 15/10/2026. Ramo `claude/termini-allineati`.
Legenda rischio: 🔴 alto, da sistemare prima del lancio · 🟠 medio, da valutare col consulente · 🟢 basso.
**Rischio complessivo: 🟠** (la prova dura da 49 a 81 giorni ma si chiama «circa due mesi»: va spiegata bene; per questo c'è l'esempio con le date).

## 1. Cosa dice ora il testo (proposta `[PROPOSTA]`)
Art. 3.2 «Per i Commercianti», in ordine:
1. **Prova gratuita di circa due mesi**: parte dalla prima pubblicazione dell'offerta (non dall'iscrizione), prosegue fino a fine mese, primo pagamento sempre il 1° del mese. Prima pubblicazione **entro l'11** = prova fino all'ultimo giorno del mese dopo, si paga dal 1° del mese ancora successivo. **Dal 12 in poi** = prova fino all'ultimo giorno del secondo mese dopo.
2. **Esempio** (date che tornano):

| Caso | Iscrizione | Prima pubblicazione | Prova gratuita fino al | Giorni di prova | Primo pagamento |
|---|---|---|---|---|---|
| A (entro l'11) | 3 novembre 2026 | **10 novembre 2026** | **31 dicembre 2026** | 52 | **1° gennaio 2027**, poi ogni 1° |
| B (dal 12) | 3 novembre 2026 | 12 novembre 2026 | 31 gennaio 2027 | 81 | 1° febbraio 2027 |

3. **Dopo la prova**: 4,99 € al mese + IVA (nessuna percentuale scritta). Variazioni di prezzo con 30 giorni di preavviso. Promemoria email a 10 e a 3 giorni dalla fine della prova.
4. **Nessun addebito senza la tua conferma**: riepilogo letto, conferma espressa, scelta carta o PayPal. Finché i pagamenti non sono attivati (Stripe e PayPal spenti) non si addebita nulla.
5. **Pagamento e pubblicazione**: si paga dal 1° al 5 del mese; prima il pagamento, poi approvazione e pubblicazione; dopo il 5 l'offerta va al mese successivo.
6. **Disdetta**: «disdici quando vuoi, porti avanti solo l'offerta che è in corso a fine mese»; effetto a fine mese; fino all'ultimo giorno i Clienti usano lo sconto e va rispettato; dal 1° nessun nuovo addebito.
7. **Mese pagato non rimborsabile.**
8. Pagamento con Stripe o PayPal, nessun dato di carta salvato (invariato).
Art. 1: «Roma e dintorni» (al posto dei tre quartieri). Riquadro «Modifiche o rimozione del negozio»: eliminazione allineata alla #102/#116. Resta l'art. 2 con 18 anni.
Parole tolte: «Nessun vincolo», «puoi smettere quando vuoi», «Prezzo bloccato», «circa 2 mesi», i tre quartieri.

## 2. Vecchio → nuovo (da far vedere al consulente)
| Punto | Testo su `main` | Testo proposto | Rischio |
|---|---|---|---|
| Art. 1 zona | «dei quartieri Garbatella, San Paolo e Marconi a Roma» | «di Roma e dintorni» (uguale a #116) | 🟢 |
| 3.2 prova | «gratuita per circa 2 mesi. La data di fine viene comunicata via email e nell'area del Commerciante» | prova di circa due mesi dalla prima pubblicazione + regola «entro l'11 / dal 12» + esempio con date | 🟠 |
| 3.2 prezzo | «€4,99 al mese + IVA» e «Preavviso di 30 giorni prima della fine della fase di lancio e di qualsiasi variazione di prezzo» | «€4,99 al mese + IVA»; 30 giorni solo per le variazioni di prezzo; promemoria a 10 e 3 giorni per la fine prova | 🟠 vedi decisione 4 |
| 3.2 conferma | «Nessun addebito senza la tua conferma» | stesso concetto, più completo (riepilogo, conferma espressa, carta o PayPal, nulla finché i pagamenti sono spenti) | 🟢 |
| 3.2 pagamento | non c'era | dal 1° al 5; prima il pagamento, poi la pubblicazione | 🟠 vedi decisione 5 |
| 3.2 disdetta | «Nessun vincolo: puoi smettere quando vuoi, anche scegliendo «Non rinnovo»» | frase del titolare, effetto a fine mese, sconto da rispettare | 🟠 il consulente deve vedere «disdici quando vuoi» |
| 3.2 rimborso | non c'era | «Mese pagato non rimborsabile» | 🟠 rimborsabilità verso professionisti: da confermare |
| Riquadro art. 5 | «l'eliminazione rimuove subito il negozio» | offerta in corso visibile fino a fine mese, rimozione dal 1° (uguale a #116) | 🟢 |

## 3. Come si incastra con la PR #116 (`claude/termini-correzioni`)
Il merge di #116 su `main` **dà conflitto** (in `Termini.jsx` e nel test e2e), perché `main` ha già «€4,99 + IVA» e senza «Prezzo bloccato» (#142). Ho quindi lavorato da `main`.
| Parte di #116 | In questa PR |
|---|---|
| Art. 1 «Roma e dintorni» | ripresa identica |
| Riquadro eliminazione negozio | ripresa identica |
| 3.1 Clienti (tolta la frase sui servizi futuri) | **non toccata**: resta di #116 |
| 3.2 «Nessun vincolo» con sconto valido fino a fine mese | **sostituita** dalla disdetta decisa (niente «Nessun vincolo») |
| Recesso (tolto l'articolo sui servizi futuri) | non toccato: resta di #116 |
| Email di benvenuto (`email_service.py`, riga «Nessun vincolo») | non toccata (solo testi legali qui) |
Se si unisce prima questa PR, #116 va riallineata (3.2 e test); se si unisce prima #116, qui cambia solo 3.2.

## 4. Numeri e frasi che non tornano (NON ho scelto)
| # | Cosa | Dove | Valori in conflitto |
|---|---|---|---|
| 1 | Durata della prova | skill `lancio-commercianti` e PR #83 / piano #81 · STATO e codice (`prova_pagamenti.py`) · richiesta del titolare | «60 giorni, dal 61° giorno si paga» · «da 49 a 81 giorni, regola entro l'11/dal 12» · «50 giorni ecc.». Nel testo ho usato la regola del codice e del 12/10; nessun documento contiene «50 giorni» |
| 2 | Esempio di iscrizione | materiali #146 | **Non c'è** un esempio con date (né «10 novembre»): quello nei Termini l'ho calcolato io con la regola del codice. In #146 l'unico «esempio» è il video («cinquanta → trenta euro», non è sulla prova) |
| 3 | Frase di disdetta | #146 (kit, guida, copioni) · richiesta del titolare | «porti avanti solo l'offerta **in corso fino a** fine mese» · «porti avanti solo l'offerta **che è in corso a** fine mese». Nei Termini ho usato la seconda |
| 4 | Preavviso | Termini su `main` · codice e decisione | «30 giorni prima della fine della fase di lancio» · «promemoria a 10 e 3 giorni» (solo con pagamenti accesi). Ho tenuto i 30 giorni solo per i cambi di prezzo |
| 5 | Tolleranza di pagamento | skill («proposta 5 giorni, modificabile») · STATO e codice (5 giorni) | «proposta» · «decisa». Scritto «dal 1° al 5»: confermare |
| 6 | Primo pagamento con lancio 31/10 | RUNBOOK_PRELANCIO §2.3 · codice | «1° gennaio 2027» · una prima offerta il 31/10 dà **1° dicembre 2026** (1° gennaio solo dal 1/11 all'11/11) |
| 7 | «Nessun vincolo» | email di benvenuto (`email_service.py`) e #116 · decisione e #146 | usato · vietato |
| 8 | «Prima offerta» o «prima pubblicazione» | kit e copioni #146 · Termini e codice | «dalla prima offerta» · «dalla prima pubblicazione» (la prova parte quando l'offerta è approvata) |

## 5. Proposte per i materiali #146 (branch `claude/materiali-negozi`, **non toccato**)
Nessuna contraddizione grave con i Termini. Da allineare, se il titolare è d'accordo:
1. Frase di disdetta (kit, guida, copioni, scheda, piano): stessa parola per parola dei Termini (decisione 3).
2. «circa due mesi di prova dalla prima offerta» → «dalla prima pubblicazione dell'offerta» (kit B1, C, D, E; guida già giusta).
3. Aggiungere nella guida, sotto «E dopo?», le date: «il primo pagamento è sempre un 1° del mese» e «mese pagato non rimborsabile» (oggi mancano).
4. Kit punto 6 e piano: i materiali con «prova» si usano dopo la validazione di #116 **e di questa PR**.

## 6. Domande per il consulente `[DA VALIDARE]`
1. 🟠 «Circa due mesi» con prova reale da 49 a 81 giorni: basta con la regola e l'esempio scritti nel 3.2?
2. 🟠 «Disdici quando vuoi» con effetto a fine mese e mese pagato non rimborsabile (cliente professionista): ok?
3. 🟠 Addebito automatico mensile con una sola conferma iniziale: la formula «conferma espressa» dopo il riepilogo è sufficiente?
4. 🟢 Ruolo di Stripe/PayPal (solo pagamento, nessun dato di carta nostro).
Chi decide: il titolare le voci della tabella 4; il consulente valida solo il testo.
