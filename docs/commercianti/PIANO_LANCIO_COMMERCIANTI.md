# Piano di lancio lato commercianti (bozza del 10/10/2026)

Piano descritto dal titolare, con il controllo di coerenza con Termini, Recesso e app.
**Solo documento di lavoro**: nessun testo del sito è stato modificato e nessun pagamento è acceso
(`CLIENT_SUBSCRIPTION_REQUIRED=false`, Stripe e PayPal spenti). Le parti legali vanno al consulente.
Repository pubblico: nessun dato di persone reali, nessun segreto.

## 0. Decisioni del titolare (aggiornate il 10/10)

- **Inizio della prova:** i 60 giorni partono dal **primo giorno di pubblicazione** dell'offerta del negozio (non dall'iscrizione e non da una data uguale per tutti). Il **giorno 61** parte il primo pagamento, che copre i **30 giorni** successivi.
- **IVA (inclusa o esclusa):** si decide dopo, a lavori finiti.
- **Testo «60 giorni»:** va bene la formula «60 giorni dall'inizio della partecipazione», adattata a «dalla prima pubblicazione della tua offerta».
- **Promemoria prima della fine della prova:** a **10 giorni** e a **3 giorni** (consiglio nella sezione 3-bis).
- **Mese già pagato:** una volta pagato, **non rimborsabile**.
- **Prezzo bloccato:** da chiarire; il titolare ne parla prima con il commercialista.
- **Aperto:** il pagamento ogni 30 giorni dal giorno 61 non coincide con le offerte «a mese di calendario» dei Termini: vedi sezione 3-bis.

## 1. Il piano come l'ho capito

1. **Campagna sui contatti che abbiamo**: messaggi (SMS, WhatsApp, Facebook, Instagram) con il video. Gli altri negozi li contatta il titolare di persona.
2. **Fase di raccolta**: fino a una data **D** (da decidere) i negozi possono iscriversi e preparare la loro offerta.
3. **Dal giorno D** parte la **prova gratuita di 60 giorni per tutti** i negozi già iscritti.
4. **Chi si iscrive dopo D** ha i suoi 60 giorni dal giorno dell'iscrizione.
5. **Dopo i 60 giorni** si paga **4,99 € al mese** (IVA inclusa o esclusa: da decidere).
6. **Pagamento il 1° di ogni mese**, **prima** della pubblicazione: se il pagamento non c'è, l'offerta non viene pubblicata né rinnovata; se l'offerta è già caricata, parte il mese successivo.
7. Lato clienti: come pubblicizzare l'app si decide dopo.

In pratica: prova di ciascun negozio = 60 giorni a partire da **la data più tarda tra D e la sua iscrizione**.

## 2. Controllo di coerenza con Termini, Recesso e app

Legenda: ✅ coerente · ⚠️ da cambiare (testo o app) · ❓ da decidere

| # | Tema | Testo/app oggi | Esito | Cosa serve |
|---|---|---|---|---|
| 1 | Durata della prova | Termini 3.2: «gratuita per circa 2 mesi; la data di fine è comunicata a tutti» | ⚠️ | Dire «60 giorni dall'inizio della partecipazione», non una data uguale per tutti |
| 2 | Data di fine prova | L'app ha **una sola data globale** (`TRIAL_END_DATE`, solo banner) | ⚠️ | Servono la data di fine prova **di ogni negozio** (nuovo campo) |
| 3 | Offerte caricate prima di D | Dopo l'approvazione l'offerta è subito visibile | ⚠️ | Servono la «data di pubblicazione» dell'offerta (visibile dal giorno D) |
| 4 | Preavviso | Termini: «30 giorni prima della fine della fase di lancio» | ⚠️ | Diventa «30 giorni prima della fine della **tua** prova» (email automatica al giorno 30 di 60) |
| 5 | Prezzo bloccato | Termini: «per chi aderisce nella fase di lancio, finché resta iscritto senza interruzioni» | ❓ | Chi sono i «primi»? Chi entra dopo D ha il prezzo bloccato? Per quanto? (già segnalato come rischio alto nella revisione dei Termini) |
| 6 | IVA | Termini, domande frequenti e video: «4,99 € IVA inclusa» (deciso il 08/10) | ❓ | Se si passa a «+ IVA» (6,09 € con IVA al 22 %) vanno cambiati Termini, FAQ, video e messaggi |
| 7 | Primo addebito | Termini: «nessun addebito senza la tua conferma» | ✅ | Va bene se il negozio inserisce il metodo di pagamento e **conferma** prima della fine della prova |
| 8 | Prova che finisce a metà mese, addebito il 1° | Non definito | ❓ | Vedi sezione 3 (consiglio: prova allineata al 1° del mese) |
| 9 | «Prima pagamento, poi pubblicazione» | Termini 3.2: «se non confermi, non paghi e l'offerta non viene più pubblicata» | ✅ | Coerente. Va scritto per l'offerta di ogni mese |
| 10 | Offerta caricata ma pagamento in ritardo | Non definito | ❓ | Se paga il 15, l'offerta parte subito o dal mese dopo? (sezione 3) |
| 11 | Disdetta | Termini 3.2: «nessun vincolo, puoi smettere quando vuoi»; Recesso art. 2: «Non rinnovo»: l'offerta termina l'ultimo giorno del mese | ⚠️ | Con l'addebito automatico del 1° la disdetta deve **fermare l'addebito prima del 1°**: serve una data limite (es. entro il 25) o l'addebito si annulla subito |
| 12 | Mese già pagato | Non definito (clausola 5-bis) | ❓ | «Nessun rimborso del mese in corso» va scritto chiaramente, e la frase «nessun vincolo» va ammorbidita |
| 13 | Rinnovo automatico del pagamento | Termini 5: «le offerte non si rinnovano automaticamente» | ⚠️ | Offerta mensile e pagamento ricorrente sono due cose: chiarirlo (consenso all'addebito ricorrente alla conferma) |
| 14 | Blocco per mancato pagamento | Il codice ha 7 giorni di tolleranza (`grace`) solo per l'abbonamento dei clienti | ⚠️ | Per i negozi serve una regola nuova (nessuna tolleranza, oppure pochi giorni) e va scritta nei Termini |
| 15 | Fatture | Termini: il negozio emette scontrino/fattura ai suoi clienti | ❓ | Ogni 4,99 € mensile richiede **fattura elettronica da Euro Linea al negozio** (SdI): serve il commercialista |
| 16 | Recesso del consumatore | Pagina Recesso: i commercianti sono professionisti, il recesso del consumatore non si applica | ✅ | Nessuna modifica per i negozi; i consumatori non pagano |
| 17 | Preavviso modifiche ai negozi | Termini: avviso per le variazioni di prezzo | ⚠️ | Regolamento P2B: **15 giorni** per ogni modifica dei Termini, e motivazioni se si sospende un negozio (vedi `docs/legale/VERIFICA_CONFORMITA.md`, N1) |
| 18 | Messaggi a negozi (SMS, WhatsApp) | PR #41: modelli e regole d'uso | ❓ | Per i contatti promozionali serve un modo semplice per dire no e va verificato dal consulente (regole più severe se il negozio è una ditta individuale) |

## 3. Proposta per le parti da decidere

**A. Allineare la prova al 1° del mese.** I pagamenti sono il 1° e le offerte durano fino a fine mese. Se la prova di 60 giorni finisce il 17, le strade sono due: calcolare un addebito parziale oppure far continuare la prova fino al 1° successivo. **Consiglio la seconda**: «60 giorni, più i giorni fino a fine mese; primo addebito il 1° del mese dopo». È più semplice, non serve un conto proporzionale, e ai negozi si offre qualcosa in più (da 60 a 90 giorni gratis, a seconda del giorno). Va scritto nei Termini e nel messaggio ai negozi.

**B. Data D.** Consiglio un **1° del mese**, con tempo per consulente e commercialista (almeno 3-4 settimane). Il 1° novembre è molto vicino; il **1° dicembre** mi sembra realistico. Il ritmo mensile delle offerte parte così ordinato.

**C. Offerte caricate prima di D.** Approvate subito, **visibili ai clienti dal giorno D**.

**D. Pagamento in ritardo.** Per semplicità e correttezza: se il pagamento arriva dopo il 1°, l'offerta parte **dal mese successivo** (come hai indicato). In alternativa, appena pagato. Va una sola scelta, scritta nei Termini.

**E. Disdetta.** «Non rinnovo» valido **fino al giorno X del mese** (es. il 25) per non essere addebitati il 1°; dopo, il mese si paga e l'offerta resta fino a fine mese. Nessun rimborso del mese già pagato.

**F. Prezzo bloccato.** Sostituire «finché restano iscritti» con una durata chiara (es. 12 mesi) e decidere se vale per tutti i negozi che aderiscono in lancio o solo per i primi.

**G. IVA.** Decidere prima del video e dei messaggi: ogni materiale cita il prezzo.

## 3-bis. Conseguenze delle nuove decisioni

**Prova dalla prima pubblicazione.** È la scelta più equa: il tempo non corre se l'offerta non è ancora approvata. Richiede il campo «primo giorno di pubblicazione» per ogni negozio; la fine prova è quel giorno + 60 giorni, il primo pagamento il giorno 61. Sostituisce la «data D» comune: chi si iscrive prima può preparare l'offerta e il suo orologio parte solo alla pubblicazione.

**Promemoria a 10 e 3 giorni: consiglio di tenerli, con questo contenuto.**
1. **Il primo giorno di pubblicazione:** email con la data esatta di fine prova e l'importo.
2. **10 giorni prima:** «aggiungi il metodo di pagamento e conferma, altrimenti dal giorno 61 l'offerta non verrà pubblicata»: dà il tempo di sistemare carta o PayPal.
3. **3 giorni prima:** ultimo avviso con lo stesso messaggio e come disdire.
4. **Il giorno del pagamento:** conferma con ricevuta.
Il preavviso di 30 giorni previsto nei Termini diventa quindi 10 giorni: va riscritto per coerenza (e va riletto dal consulente).

**Conflitto da sciogliere: 30 giorni di pagamento contro mese di calendario.** I Termini dicono che «ogni offerta termina l'ultimo giorno del mese» e che l'offerta non si modifica «prima del 1° del mese successivo»; anche i clienti usano lo sconto «una volta al mese» di calendario. Se il negozio paga ogni 30 giorni dal giorno 61, i periodi non coincidono. Due strade:
- **A. Pagamento a calendario (consiglio):** il primo pagamento arriva alla prima fine mese utile dopo la prova; l'offerta vale per il mese di calendario. Nessuna modifica alle regole dei clienti e delle offerte.
- **B. Pagamento a cicli di 30 giorni dalla pubblicazione:** l'offerta vale per il ciclo. Si adatta al piano, ma vanno cambiati i Termini (offerte e modifiche), il conteggio dei clienti «una volta al mese», le statistiche e la scheda «Prossimo mese».

**Cosa non cambia:** nessun addebito senza conferma; offerta non pubblicata se non c'è il pagamento; mese pagato non rimborsabile.

## 4. Cosa andrebbe sviluppato nell'app (non adesso, i pagamenti restano spenti)

1. Data di fine prova **per negozio** e calcolo (D o iscrizione + 60 giorni, più allineamento al 1°).
2. **Data di pubblicazione** dell'offerta (visibile dal giorno D).
3. Pagamento mensile del negozio: addebito il 1°, metodo di pagamento confermato dal negozio, **blocco della pubblicazione** se manca il pagamento.
4. Email automatiche: giorno 30 della prova, avvisi prima della fine, promemoria prima del 1°, conferma di pagamento, avviso di mancato pagamento.
5. Area admin: elenco dei negozi con stato (in prova, pagante, sospeso) e scadenze.
6. Fatturazione elettronica (dopo risposta del commercialista).

Ogni passaggio va in una PR a parte, con test e senza addebiti finché il titolare non conferma.

## 5. Cosa serve da te

1. Data **D**.
2. IVA **inclusa o esclusa**.
3. Sì o no all'allineamento al 1° (consiglio sì).
4. Pagamento in ritardo: offerta dal mese dopo, oppure appena pagato.
5. Limite per la disdetta e rimborsi.
6. Prezzo bloccato: per chi e per quanto.

Dopo le tue scelte preparo le modifiche ai testi **come proposta evidenziata** per il consulente (non pubblicate) e, se vuoi, la PR per i dati per negozio.
