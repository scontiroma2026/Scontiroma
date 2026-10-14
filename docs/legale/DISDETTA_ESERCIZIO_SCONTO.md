# Disdetta del commerciante e sconto da onorare fino a fine mese

> **[PROPOSTA] [DA VALIDARE]** dal consulente. Nessuna pagina del sito è stata toccata. Non è un parere legale: sono bozze e punti di controllo.
> Regola decisa dal titolare: con «Non rinnovo» (o disdetta dell'abbonamento) l'offerta **resta pubblica** e lo sconto **va onorato** fino all'ultimo giorno del mese. La disdetta ha effetto a fine mese. Il mese pagato **non è rimborsabile**. Dal 1° del mese dopo l'offerta decade.

## 1. Dove la regola c'è già e dove manca

| Documento | Cosa dice oggi | Stato |
|---|---|---|
| Termini.jsx art. 3 (elenco condizioni commercianti) | «Nessun vincolo: puoi smettere quando vuoi, anche scegliendo «Non rinnovo»». | Manca: non dice che l'effetto è a fine mese né che lo sconto va onorato. |
| Termini.jsx art. 3 | «Prezzo bloccato» per chi aderisce al lancio. | **Incoerente** con la regola del titolare (niente prezzo bloccato, bozza 04 art. 3.3). Fuori tema, ma da segnalare. |
| Termini.jsx art. 4 (clienti) | «Non garantisce la disponibilità dello sconto presso il singolo esercente». | **Tensione**: il cliente può leggerla come «il negozio può non onorarlo». Va coordinata con l'obbligo del commerciante. |
| Termini.jsx art. 5, primo punto | «Rispettare lo sconto pubblicato per l'intero mese di validità». | Regola base presente, ma senza il legame con la disdetta. |
| Termini.jsx art. 5, punto «Non modificare l'offerta prima del 1° del mese successivo» | Presente. | OK. |
| Termini.jsx art. 5, riquadro «Modifiche o rimozione del negozio» | «Eliminare l'account: rimuove **subito** il negozio dalla piattaforma e dalla mappa». E: «Le offerte già mostrate ai Clienti nel mese in corso possono essere completate solo se il negozio non viene rimosso». | **Incoerente / rosso**: l'eliminazione immediata fa sparire un'offerta che il cliente poteva ancora usare. La frase finale è ambigua e sembra dire il contrario della regola. |
| Termini.jsx art. 5 | «Non rinnovo» citato come alternativa al caricare l'offerta del mese dopo. | Manca l'effetto a fine mese e l'obbligo di onorare. |
| Recesso.jsx art. 2 | «Non rinnovo: l'offerta in corso termina l'ultimo giorno del mese e non riparte». | **Regola presente** (frase più chiara oggi). Manca: «e va rispettata fino a quel giorno», «mese pagato non rimborsabile». |
| Bozza 04 (Termini commercianti) art. 4 | «La disdetta ha effetto a fine mese: fino all'ultimo giorno l'offerta resta pubblicata e lo sconto va rispettato; dal 1° del mese dopo l'offerta e il pagamento cessano. Nessuna penale, nessun rimborso pro rata.» | **Regola completa**. È il testo di riferimento. |
| Bozza 04 art. 3.8 | «Mese non rimborsabile». | Presente. |
| Bozza 04 art. 5.1 | «Rispettare lo sconto per tutto il mese». | Presente. |
| Bozza 04 art. 8 | Eliminazione account: «il negozio sparisce subito». | **Stessa incoerenza** del sito: contrasta con art. 4. |
| Bozza 04 art. 12 | Clausole da approvare specificamente: responsabilità, modifiche, foro, manleva, sospensione. | **Mancano** non rimborsabilità e effetto a fine mese. |
| Bozza 05 (Recesso) art. 2 | «Non rinnovo con effetto a fine mese; mese pagato non rimborsabile». | Presente per i commercianti. Non cita l'obbligo di onorare. |
| Bozza 03 (Termini clienti) art. 4 | «Non garantiamo la disponibilità dello sconto presso il singolo negozio» (punto 29 della bozza). | Stessa tensione dei Termini attuali. |
| Bozza 06 (P2B) art. 3 | Motivi di sospensione: «offerta non rispettata (segnalazioni dei Clienti)», motivazione via email, riesame. | OK come base per le conseguenze del mancato rispetto. |
| Codice (`server.py`) | «Non rinnovo» ritira solo l'offerta del mese **dopo**; l'offerta in corso resta. La disdetta abbonamento mette `no_renew_month` al mese dopo. | Coerente con la regola. **Non esiste** oggi una email di conferma disdetta (`send_subscription_cancelled` è un'altra email, per un abbonamento clienti scaduto: non va riusata). |

## 2. Testi proposti

### (a) Riquadro di conferma nel momento della disdetta (max 3 frasi) [PROPOSTA] [DA VALIDARE]

> **Stai per disdire.** La disdetta vale dalla fine di questo mese: fino al **{ultimo giorno del mese}** la tua offerta resta pubblicata e devi **rispettare lo sconto** a tutti i clienti che lo presentano. Il mese già pagato **non viene rimborsato**; dal **1° {mese dopo}** l'offerta non è più visibile.

Pulsanti: **«Conferma disdetta»** / **«Annulla»**. Sotto, in piccolo: «Puoi ripensarci e annullare la disdetta fino all'ultimo giorno del mese.» (vero oggi: il codice permette di annullare fino a fine mese).
Nota tecnica per il coordinatore: la data va calcolata (ora di Roma), non scritta a mano. Il riquadro deve comparire **prima** della conferma, non dopo.
Variante prova gratuita (nessun pagamento): sostituire la frase sul rimborso con «Non hai pagato nulla.» [DA VALIDARE]

### (b) Email di conferma disdetta [PROPOSTA] [DA VALIDARE]

**Oggetto:** Disdetta ricevuta: la tua offerta resta valida fino al {ultimo giorno del mese}

> Ciao {nome},
> abbiamo registrato la disdetta di **{nome negozio}**.
>
> **Cosa succede**
> - Fino al **{ultimo giorno del mese}** la tua offerta resta pubblicata su Sconti Roma.
> - Fino a quel giorno devi **rispettare lo sconto** a ogni cliente che lo presenta con il QR (schermata verde). Dal 1° {mese dopo} l'offerta non è più visibile.
> - Il mese già pagato non viene rimborsato. Non ti addebiteremo altro.
>
> Hai cambiato idea? Puoi annullare la disdetta dalla tua area fino al {ultimo giorno del mese}.
> Domande: partner@scontiroma.it
>
> Sconti Roma è un servizio di {Euro Linea S.r.l.s.} [DA COMPLETARE: dati azienda dal titolare]

Va inviata su supporto durevole (email) a ogni disdetta, anche quando la disdetta arriva da partner@scontiroma.it. Mettere in copia l'archivio con data e ora (serve come prova). [DA VALIDARE]

### (c) Integrazione ai Termini e al Recesso [PROPOSTA] [DA VALIDARE]

**Termini, art. 3 (condizioni commercianti), punto «Nessun vincolo»**

- Vecchio: «Nessun vincolo: puoi smettere quando vuoi, anche scegliendo «Non rinnovo» per l'offerta del mese.»
- Nuovo: «**Nessun vincolo**: puoi disdire quando vuoi con «Non rinnovo». La disdetta ha effetto **alla fine del mese in corso**: fino all'ultimo giorno l'offerta resta pubblicata e lo sconto va rispettato (art. 5). Il mese già pagato non è rimborsabile; non ci sono penali.»

**Termini, art. 5, nuovo punto dopo «Rispettare lo sconto pubblicato per l'intero mese di validità»**

- Nuovo: «Rispettare lo sconto **anche dopo la disdetta** («Non rinnovo» o disdetta dell'abbonamento), fino all'ultimo giorno del mese in cui la disdetta ha effetto. Dal 1° del mese successivo l'offerta decade. Se il Commerciante non rispetta lo sconto, Sconti Roma può sospendere o chiudere l'account con motivazione (art. 7 dei Termini commercianti) e il Commerciante risponde dei danni verso il Cliente e verso Sconti Roma.»

**Termini, art. 5, riquadro «Modifiche o rimozione del negozio»** (sostituisce la frase ambigua)

- Vecchio: «…eliminare l'account: l'eliminazione rimuove subito il negozio dalla piattaforma e dalla mappa… Le offerte già mostrate ai Clienti nel mese in corso possono essere completate solo se il negozio non viene rimosso.»
- Nuovo: «Se scegli «Non rinnovo» o disdici, l'offerta resta visibile e va rispettata fino a fine mese. Se **elimini l'account**, il negozio viene rimosso dalla piattaforma **ma resti tenuto a rispettare** gli sconti già pubblicati ai Clienti fino alla fine del mese.» **[DA VALIDARE: serve scelta, vedi punto rosso 2]**

**Termini, art. 4 (clienti), ultimo punto**

- Vecchio: «Sconti Roma non garantisce la disponibilità dello sconto presso il singolo esercente: le condizioni di erogazione dipendono dal Commerciante.»
- Nuovo: «Lo sconto è offerto dal Commerciante, non da Sconti Roma. Il Commerciante si è impegnato a rispettarlo fino alla fine del mese di validità, anche se ha disdetto. Se non viene rispettato, segnalacelo a info@scontiroma.it: valuteremo i provvedimenti verso il negozio.»

**Recesso, art. 2 (Commercianti)** - aggiungere in fondo

- Vecchio: «…l'offerta in corso termina l'ultimo giorno del mese e non riparte.»
- Nuovo: «…l'offerta in corso resta pubblicata e **lo sconto va rispettato fino all'ultimo giorno del mese**, poi non riparte. Il mese già pagato non è rimborsabile.»

**Bozza 04 (Termini commercianti)**

- Art. 4: aggiungere «Se elimini l'account, resti tenuto a rispettare lo sconto fino a fine mese (art. 8).» e modificare art. 8 di conseguenza.
- Art. 12: aggiungere all'elenco delle clausole da approvare specificamente **art. 3.8 (mese non rimborsabile)** e **art. 4 (effetto a fine mese, nessun rimborso pro rata)**. [DA VALIDARE]

## 3. Controllo del rischio legale [DA VALIDARE]

| Tema | Rischio | Perché | Cosa propongo |
|---|---|---|---|
| Clienti con lo sconto in mano o ancora usabile fino a fine mese (pratiche commerciali scorrette, artt. 20-23 Cod. Consumo) | **Alto** | Se l'offerta è visibile e il negozio rifiuta lo sconto, è un'offerta pubblicizzata e non rispettata: possibile pratica ingannevole (art. 21) soprattutto per chi si è spostato apposta. Sconti Roma è l'intermediario che pubblica. | Obbligo scritto di onorare fino a fine mese (Termini art. 5); testo cliente chiaro (art. 4); canale di segnalazione. Se un negozio dice di non voler onorare, **ritirare l'offerta subito** e avvisare, invece di lasciarla visibile. |
| Disponibilità dello sconto «non garantita» (art. 4 clienti) | **Medio** | Una clausola che toglie ogni garanzia è debole davanti a un consumatore e contrasta con l'obbligo del commerciante. Per i consumatori le clausole vessatorie sono nulle (artt. 33-36 Cod. Consumo). | Riscrittura proposta sopra: Sconti Roma non garantisce la scorta/merce, ma l'impegno del negozio è dichiarato. |
| Obbligo del commerciante di onorare | **Medio** | Il rapporto di sconto è tra negozio e cliente. Senza un obbligo scritto verso Sconti Roma, la piattaforma non ha leva. | Art. 5 Termini + art. 5.1 bozza 04. Il commerciante accetta all'iscrizione. |
| Se non lo onora | **Medio** | Serve una procedura prevedibile (Reg. UE 2019/1150 art. 4). | Segnalazione cliente > verifica > sospensione o chiusura con **motivazione scritta via email** > reclamo e riesame (bozza 06 art. 3). Manleva: il commerciante tiene indenne Sconti Roma da pretese dei clienti (bozza 04 art. 6, da estendere agli «sconti non rispettati»). [DA VALIDARE: il consulente verifica che la manleva sia valida] |
| Coerenza con P2B (Reg. UE 2019/1150) | **Basso-medio** | La disdetta è decisa dal commerciante, quindi non è una sospensione. Ma se Sconti Roma ritira l'offerta **prima** di fine mese (per mancato rispetto) serve motivazione e preavviso/urgenza. Il preavviso di 30 giorni per chiudere l'account non vale per la disdetta del commerciante. | Nella bozza 06 specificare: «la disdetta del commerciante non è una sospensione; il ritiro anticipato per mancato rispetto dello sconto segue l'art. 4 (motivazione, riesame)». |
| Artt. 1341-1342 c.c. | **Medio** | Clausole che limitano la responsabilità, fissano la non rimborsabilità o l'effetto a fine mese (condizioni generali di contratto) vanno approvate **specificamente per iscritto** se inserite in modulo predisposto da una parte. Vale tra professionisti. | Aggiungere art. 3.8 e art. 4 alla seconda casella (bozza 04 art. 12). Il server già registra `legal_specific_accepted`. Il consulente conferma l'elenco. |
| Non rimborsabilità del mese pagato | **Basso** (professionisti), **Medio** se sbagliamo il tipo di cliente | Con professionisti il recesso del consumatore non si applica. Se un piccolo commerciante fosse considerato consumatore (ditta senza partita IVA?) la clausola può essere nulla. | Verificare in iscrizione che sia un'attività con P.IVA. Se manca, bloccare i pagamenti per quel caso. [DA VALIDARE, domanda 5 dell'indice] |
| Eliminazione account = sparizione immediata | **Alto** | Contrasta con la regola e con la tutela dei clienti. | Punto rosso 2. |
| Email di conferma | **Basso** | Serve prova che il commerciante ha letto l'avviso. | Riquadro prima della conferma + email su supporto durevole. |

## 4. Punti da far vedere al consulente

| N. | Punto | Chi decide |
|---|---|---|
| 1 | Testo del riquadro di conferma, email e integrazioni (sezione 2). | Consulente valida, titolare approva |
| 2 | **Eliminazione account durante il mese**: proposta A «resti tenuto a onorare fino a fine mese» (negozio rimosso dalla mappa ma sconti già in mano ai clienti ancora validi); proposta B «l'eliminazione è possibile solo dopo il 1° del mese, oppure ritira l'offerta con avviso ai clienti». Serve una scelta e allineare il codice. | Titolare + consulente |
| 3 | Art. 4 dei Termini clienti: sostituire «non garantisce la disponibilità» con la formula proposta. | Consulente |
| 4 | Aggiunta di non rimborsabilità (3.8) e effetto a fine mese (art. 4) alla seconda casella 1341-1342. | Consulente |
| 5 | Manleva per «sconto non onorato»: formulazione e validità. | Consulente |
| 6 | Procedura se un negozio dichiara di non voler onorare: ritiro anticipato dell'offerta, avviso ai clienti e motivazione (P2B art. 4). | Titolare + consulente |
| 7 | Incoerenza «Prezzo bloccato» (Termini.jsx art. 3) contro la regola «niente prezzo bloccato» (bozza 04): già nota, va chiusa con il resto. | Titolare |
| 8 | Il commerciante senza P.IVA conta come consumatore? Se sì, la non rimborsabilità e il recesso vanno rivisti. | Consulente |
| 9 | Orario del cambio mese (00:00 ora di Roma): confermare. | Consulente |

## 5. Cosa serve nel codice (non fatto qui, solo per il coordinatore)

- Riquadro (a) prima della conferma in `RenewalBanner.jsx` e nel flusso «disdici» (`/merchant/pagamento/disdici`), con data calcolata.
- Email (b) nuova, inviata da `merchant_set_no_renew` e da `merchant_pagamento_disdici`. Oggi non esiste.
- Verificare che l'offerta in corso resti visibile e il QR funzioni fino alle 23:59 dell'ultimo giorno (il codice oggi ritira solo l'offerta del mese dopo).
- Verificare che «Elimina account» non tolga lo sconto prima della decisione del punto rosso 2.
