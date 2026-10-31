# Tutte le domande per il consulente, in un solo file (15/10/2026)

Stato: **per il titolare, da portare al consulente**. Non è un parere legale e non decide nulla: raccoglie in un posto le domande sparse nei documenti di lavoro (pacchetto #147, Termini #157, Privacy #160, marchio #167, email #169) più quelle nate il 15/10. Per ogni gruppo c'è il documento dove trovare i dettagli. Repository pubblico: nessun dato personale, nessun segreto.

Legenda priorità: 🔴 prima del lancio · 🟠 da valutare · 🟢 di conferma. «Testo» = c'è già una frase proposta da validare.

## 1. Termini e prova gratuita (dettagli: #157 e `docs/legale/PROPOSTA_TERMINI_ALLINEATI.md`)
1. 🟠 **Aggiornato il 31/10 (decisione del titolare):** «Prova gratuita di 2 mesi (almeno 60 giorni)»; primo pagamento il primo giorno 1 del mese che cade almeno 60 giorni dopo la prima pubblicazione, prova reale da 60 a 90 giorni; tolta la regola «entro l'11 / dal 12». Domanda: «2 mesi» nel titolo è corretto se la prova a volte dura fino a 90 giorni, e i due esempi con le date bastano a spiegarlo? `[DA VALIDARE]`
2. 🟠 «Disdici quando vuoi», con effetto a fine mese, sconto da rispettare fino a fine mese e mese pagato non rimborsabile (cliente professionista): va bene la formula? La frase è la stessa in Termini, email di benvenuto e guida per i negozi: va bene identica ovunque?
3. 🟠 Preavviso: i Termini dicevano «30 giorni prima della fine della fase di lancio», l'app scriveva 10 e 3 giorni prima. **Deciso dal titolare (21/10, PR #199 e #169):** email al giorno 30 della prova, 7 giorni prima del primo pagamento, 3 giorni prima di ogni addebito; i promemoria a 10 e 3 giorni sono stati tolti dal codice.
4. 🟠 I negozi devono avere la **Partita IVA** (obbligatoria alla registrazione dal 15/10): serve una frase nei Termini e nel Recesso?
5. 🟠 Eliminazione dell'account del negozio: subito o dal 1° del mese dopo (#102)?

## 2. Pagamenti e schermata di pagamento (dettagli: #147 sezione 7; email #169)
6. 🔴 Addebito automatico mensile con una sola conferma iniziale (con riepilogo): basta anche per i professionisti? Serve la seconda casella?
7. 🔴 «Mese pagato non rimborsabile» e «disdetta a fine mese»: vanno approvati specificamente per iscritto?
8. 🟠 IVA 4,99 € + 22%: chi emette la fattura (SdI)? Obblighi informativi minimi (art. 12 D.Lgs. 70/2003)?
9. 🟠 **Stripe e PayPal**: titolari autonomi (scelta del titolare del 15/10) o responsabili del trattamento? La Privacy online li chiama in due modi.
10. 🟠 Email di pagamento (#169, spente): nel testo «un pagamento che arriva dopo il giorno 5 vale per il mese successivo» e «la ricevuta non è un documento fiscale» vanno bene? Basta una sola email di sollecito al mese per il mancato pagamento?
11. 🟠 **Schermata di pagamento del negozio** (testo nuovo, 15/10): «Non viene addebitato niente subito: la prova resta gratuita fino al primo addebito. Il pagamento è solo autorizzato in anticipo.» È chiaro e corretto per Stripe e per PayPal («autorizzato» è il termine giusto)? Promemoria prima di **ogni** addebito mensile (3 giorni prima, scelta del titolare): serve per legge o per le regole dei circuiti di pagamento?
12. 🟢 Recesso di 14 giorni: tenere nel Recesso la sezione sui servizi a pagamento futuri per i consumatori o toglierla (come propone #116)?

## 3. Privacy, Cookie e dati (dettagli: #160, #147 sezioni 4 e 8, #95)
13. 🟠 **Lista d'attesa:** un solo consenso («un'email quando Sconti Roma è online») basta per conferma e avviso di lancio? Serve una riga breve sotto il modulo (informativa a strati)? Il titolare ha scelto **12 mesi** di conservazione per confermate e annullate: va bene? Si può tenere l'email di chi annulla come elenco di esclusione per 12 mesi?
14. 🔴 **LocationIQ** (mappa e indirizzi): ragione sociale, sede, contratto sul trattamento dei dati (DPA) e tempi di conservazione: da verificare e citare nella Privacy.
15. 🟠 **Fornitori e trasferimenti extra-UE:** Resend, Render, MongoDB Atlas: ruoli e frasi proposte nella Privacy (art. 4 e 5). I contratti (DPA) sono in sospeso per scelta del titolare.
16. 🟠 Log del server (con indirizzi email e IP): durata di conservazione e se vanno citati.
17. 🟠 **Cookie:** banner con o senza «Marketing»; registro del consenso a 24 mesi con IP (#95).
18. 🟢 La Privacy cita fornitori di immagini (Unsplash)? Oggi le foto sono ospitate da noi: serve ancora una riga?
19. 🟠 **Statistiche per i negozi:** il negozio vede solo numeri aggregati; i dettagli sui clienti (quanti, nuovi, tornati) solo da almeno 3 clienti diversi nel mese. Basta come tutela? L'admin vede i numeri sempre, senza nomi: serve dirlo nella Privacy?

## 4. Contenuti dei negozi, foto e responsabilità (nuove, 15/10)
20. 🔴 **Foto con volti e marchi:** il negozio garantisce nei Termini di avere i diritti sulle foto. Se carica la foto di una persona senza permesso, la responsabilità è sua? Cosa rischia la piattaforma, dato che ogni offerta passa da una approvazione dell'admin? Conviene la spunta «ho il permesso delle persone nella foto» (il titolare ha scelto di non metterla per ora, 15/10)?
21. 🟠 **Foto scartate:** l'admin può scartare una singola foto con un motivo scritto; il motivo arriva al negozio nell'email di pubblicazione. Il testo dell'email e la prassi vanno bene (art. 4 del regolamento P2B: motivazione scritta)?
22. 🟠 La **libreria di foto** di esempio (da Unsplash, licenza Unsplash) è ora senza volti né marchi riconoscibili: l'uso nell'app basta con quel che dice la licenza? Per il Colosseo e San Pietro nella home: serve un'autorizzazione per i beni culturali?
23. 🟠 **Percentuale di sconto e «prezzo precedente»** (art. 17-bis Codice del Consumo, #147 sezione 13): chi è tenuto, il negozio o anche Sconti Roma? Serve un avviso nel modulo dell'offerta e una frase nei Termini?

## 5. Piattaforma, P2B e DSA (dettagli: #147 sezione 5)
24. 🟠 Sconti Roma è «servizio di intermediazione online» ai sensi del P2B? Il preavviso minimo per le modifiche (15 giorni) è corretto?
25. 🟠 Le esenzioni per le piccole imprese valgono per i reclami (artt. 11-12 P2B) e per il DSA? Siamo «hosting» o «piattaforma online», e basta `info@` come punto di contatto?
26. 🟠 Sospensione o chiusura di un negozio: motivazione scritta e preavviso di 30 giorni salvo urgenza: va bene il testo della bozza?

## 6. Contatto con i negozi (dal 19/10)
27. 🔴 **Primo contatto a freddo** (telefonata, WhatsApp, visita) verso negozi: valgono l'art. 130 del Codice della privacy e le regole del Registro delle opposizioni? Cosa si può scrivere e salvare (nome del negozio, numero) e per quanto? Il «modo per dire no» nei messaggi è sufficiente?
28. 🟠 Messaggi sui social e inserzioni nei gruppi (Facebook): regole dei gruppi e uso del nome «Sconti Roma» nei post.

## 7. Marchio e nome (dettagli: #167 e `docs/operazioni/MARCHIO_SCHEDA_VERIFICA.md`)
29. 🟠 «Sconti Roma» in sola scritta: rischi di rifiuto per descrittività o indicazione geografica? Conviene provarci?
30. 🟠 Marchio misto o figurativo: cosa lo rende abbastanza distintivo e che tutela dà davvero?
31. 🟠 Ricerca di anteriorità (classi 35/42/9): ci sono nomi simili che creano rischio di opposizione? UIBM, EUIPO o entrambi?
32. 🟠 Quali classi e quali servizi indicare? Chi deve essere il titolare (società o persona)?
33. 🟠 Preventivo complessivo e tempi (ricerca, deposito, opposizioni); cosa non si rimborsa in caso di rifiuto?
34. 🟢 Rischio di aspettare: se un terzo deposita prima un segno simile, il preuso locale protegge? Se il nome cambia dopo il lancio, cosa si perde?

## 8. Società e dati aziendali (dettagli: #40)
35. 🟢 Sede legale, PEC e civico nei testi pubblici (art. 2250 c.c., D.Lgs. 70/2003): `[PROPOSTA - DA VALIDARE]` inseriti il 23/10/2026 dalla visura camerale (EUROLINEA S.r.l.s., Via Tasso 5/B, 83031 Ariano Irpino (AV), CF e P.IVA 03240220644, REA AV-313674, capitale 3.000,00 €, PEC eurolineasrls@alpec.it) in Privacy, Termini, Cookie, Recesso e piè di pagina. Da validare la forma.

## Cosa serve da parte del titolare prima dell'incontro
- Visura camerale (punto 3 della lista) e dati dell'azienda.
- Scelte già fatte da riportare: Stripe e PayPal titolari autonomi; 12 mesi per la lista d'attesa; Partita IVA obbligatoria; nessuna spunta foto per ora; «disdici quando vuoi» con effetto a fine mese.
- Decisione sul nome e sul logo (punto 15 della lista), per non pagare un deposito sul nome sbagliato.
