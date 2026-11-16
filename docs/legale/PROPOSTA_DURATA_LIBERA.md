# Durata dell'offerta scelta dal negozio: testi legali riallineati `[DA VALIDARE]`

Stato: **testi chiusi dall'agente `legale`** (regole del titolare del 18/10, 21/10 e 23/10), **non validati da un avvocato**. Data: 16/11/2026. Ramo `claude/legale-durata-libera`, PR impilata sulla #253 (`claude/offerta-durata-libera`). Si unisce solo con il «procedi» del titolare, **insieme** alla #253. Non è un parere legale. Le norme citate non sono state controllate sui testi ufficiali. Repository pubblico: nessun dato personale, nessun segreto.

Legenda: 🔴 alto, prima di unire o di accendere i pagamenti · 🟠 medio, da valutare con l'avvocato · 🟢 basso.
**Rischio complessivo: 🟠**. I testi ora descrivono il codice della #253. Restano aperti: preavviso ai negozi già iscritti (P2B), massimo di 90 giorni per gli sconti e riuso dello stesso sconto, disdetta dei pagamenti (spenti) con offerte che finiscono dopo la fine del mese.

## 1. Cosa fa il codice (PR #253), in breve
| Regola | Dove nel codice |
|---|---|
| Durata scelta dal negozio: 7, 14, 30, 60, 90 giorni o un giorno di fine; predefinita 30. Sconto al massimo 90 giorni di fila; omaggio fino a 365 giorni o senza scadenza | `DiscountIn._durata_valida`, `DURATA_*` in `backend/server.py` |
| La durata parte dal giorno in cui l'offerta va online (approvazione), date di Roma, ultimo giorno compreso | `_validita`, `_fine_offerta`, `_offerta_finita` |
| Offerta online bloccata fino alla data di fine; l'admin può sbloccarla (torna in revisione, non si vede) | `_offerta_bloccata`, `admin_force_edit` |
| «Prolunga»: stessa offerta, senza nuova approvazione, entro il massimo dal giorno in cui è andata online; avviso all'admin; annulla «Non rinnovo» | `merchant_extend_discount` |
| «Prossima offerta» quando si vuole; dopo l'approvazione parte il giorno dopo la fine di quella in corso (subito se senza scadenza); se non è approvata, il negozio resta senza offerta | `_stato_prossima`, `_cambia_offerta_negozio` |
| Nessun rinnovo da solo; promemoria 7, 3 e 1 giorno prima (solo se l'offerta dura di più); email «offerta terminata» | `_run_next_offer_reminders`, `send_offer_expired` |
| «Non rinnovo»: ferma i promemoria, ritira la prossima offerta; non tocca il pagamento | `merchant_set_no_renew` |
| Codice non usato: vale nel mese in cui nasce e non dopo la fine dell'offerta (fino alle 02:00 del giorno dopo), salvo nuova offerta già online | `_codice_di_mese_scaduto`, `_offerta_del_codice_finita` |
| Offerte approvate prima del cambio: regola del mese | `_fine_offerta` (senza `valid_until`) |
| Pagamenti dei negozi (spenti, non toccati): offerta visibile solo nei mesi pagati; con la disdetta, dal 1° del mese dopo non si vede più | `prova_pagamenti.offer_visible_for_payment_core` |
| Eliminazione dell'account: immediata, con offerta, prossima offerta, archivio e codici dei clienti presso il negozio | `gdpr_delete_account`, `_erase_user_data` |

## 2. Incoerenze trovate
| Testo (prima) | Realtà del codice | Rischio | Proposta (fatta in questa PR) |
|---|---|---|---|
| Termini 3.2 «Prima si paga, poi l'offerta del mese viene approvata e pubblicata» | Le offerte non sono più mensili; con i pagamenti accesi un'offerta si vede solo nei mesi pagati | 🟠 | «l'offerta viene approvata e pubblicata»; un'offerta di più mesi si vede solo nei mesi pagati e la data di fine non si sposta |
| Termini 3.2 «porti avanti solo l'offerta che è in corso a fine mese» | Con la disdetta l'offerta non si vede più dal 1° del mese dopo, anche se la sua data di fine è successiva | 🟠 | Frase del titolare tenuta, con «, fino a fine mese» + frase esplicita sulla data di fine successiva |
| Termini 3.2 «Se non confermi … la tua offerta non viene più pubblicata» | Dal giorno dopo la fine della prova l'offerta non si vede, anche con data di fine successiva | 🟢 | Detto esplicitamente |
| Termini 4: niente su scadenza dell'offerta e dei codici | «Valida fino al …»; codici del mese; codici che scadono con l'offerta | 🟠 | Tre punti nuovi + «valgono anche per gli omaggi» |
| Termini 5 «per l'intero mese di validità», «le offerte sono mensili», «Non modificare l'offerta prima del 1° del mese successivo» | Durata libera; offerta bloccata fino alla data di fine | 🔴 (testo falso) | Obblighi riscritti + riquadro «Durata delle offerte» |
| Termini, riquadro «Modifiche o rimozione»: negozio visibile fino a fine mese, rimosso dal 1° | Cancellazione immediata (la PR #102 con il rinvio non è mai stata unita) | 🔴 (testo falso) | Allineato al codice: eliminazione immediata, consiglio di eliminare dopo la data di fine |
| Termini, «Ordine delle offerte»: «dalla più recente» | Conta la data della prima offerta del negozio (`created_at`): prolungare o cambiare offerta non sposta | 🟠 (P2B, art. 5) | Precisato |
| Recesso: «l'offerta in corso termina l'ultimo giorno del mese» | Termina alla sua data di fine | 🔴 (testo falso) | Riscritto; disdetta del pagamento separata; eliminazione immediata |
| Privacy: avvisi quando un preferito «pubblica l'offerta del mese» | Avviso a ogni nuova offerta, al massimo uno per negozio al mese; la «Prolunga» non avvisa | 🟢 | «pubblica una nuova offerta» |
| Banner dei preferiti (consenso): «l'offerta del mese» | Come sopra | 🟢 | «una nuova offerta»; stessa finalità, il consenso già dato resta valido |
| Email di benvenuto al negozio: «Per non continuare, scegli «Non rinnovo»» | «Non rinnovo» non è più la disdetta | 🟠 | Disdetta (frase dei Termini) e «Non rinnovo» spiegati separati |
| Email di fine prova: «la disdetta ha effetto a fine mese e puoi sempre scegliere «Non rinnovo»» | Come sopra; senza conferma non c'è nulla da disdire | 🟠 | «Se non hai confermato non paghi niente; se hai confermato, disdici dalla scheda «Pagamento»: effetto a fine mese» |
| Messaggi ai negozi: «circa due mesi», «a fine mese» | Termini: «2 mesi (almeno 60 giorni)», «fino a fine mese» | 🟠 | Frase su costi e disdetta uguale ai Termini |

## 3. Vecchio → nuovo (passaggi principali)
| Dove | Prima | Adesso | Rischio |
|---|---|---|---|
| Termini 3.2, Pagamento e pubblicazione | «il pagamento si fa dal 1° al 5 del mese. Prima si paga, poi l'offerta del mese viene approvata e pubblicata: se il pagamento arriva dopo il 5, l'offerta è pubblicata dal mese successivo» | «dopo la prova il pagamento si fa dal 1° al 5 di ogni mese. Prima si paga, poi l'offerta viene approvata e pubblicata. Se il pagamento arriva dopo il 5, vale per il mese successivo: fino ad allora l'offerta non si vede. Questo vale anche per un'offerta che dura più mesi: si vede solo nei mesi pagati e la sua data di fine non si sposta» | 🟠 |
| Termini 3.2, Disdetta | «disdici quando vuoi, porti avanti solo l'offerta che è in corso a fine mese. … fino all'ultimo giorno i Clienti possono usare lo sconto già pubblicato e devi rispettarlo; dal 1° del mese successivo non c'è nessun nuovo addebito» | «disdici quando vuoi, porti avanti solo l'offerta che è in corso, fino a fine mese. … dal 1° del mese successivo l'offerta non si vede più, anche se la data di fine che hai scelto è successiva, e non c'è nessun nuovo addebito. La disdetta del pagamento è una cosa diversa da «Non rinnovo» (art. 5)» | 🟠 |
| Termini 4, nuovo | — | «Fino a quando vale»: durata scelta dal negozio, «Valida fino al …», ultimo giorno compreso, omaggio anche senza scadenza; l'offerta può finire prima (negozio che lascia, offerta sospesa o tolta) | 🟠 |
| Termini 4, nuovo | — | «Codici non usati»: smettono di valere alla fine del mese in cui nascono o, se prima, alla fine dell'offerta, salvo nuova offerta già online; tempo fino alle 02:00 (ora di Roma) del giorno dopo | 🟢 |
| Termini 5 | «Rispettare lo sconto pubblicato per l'intero mese di validità» | «Rispettare l'offerta pubblicata per tutta la sua durata, fino alla data di fine compresa (…), e accettare i codici dei Clienti finché valgono» | 🟢 |
| Termini 5 | «Sapere che le offerte sono mensili e non si rinnovano automaticamente: ogni offerta termina l'ultimo giorno del mese …» | Riquadro «Durata delle offerte»: quanto dura; non si rinnovano da sole; offerta online bloccata; «Prolunga»; «Prossima offerta»; «Non rinnovo»; omaggio senza scadenza; offerte approvate prima | 🟠 |
| Termini 5 | «Non modificare l'offerta prima del 1° del mese successivo» | tolto (sostituito da «Offerta online bloccata») | 🟢 |
| Termini 5, prezzo pieno (`termini-prezzo-30-giorni`) | regola dei 30 giorni prima della pubblicazione | stessa regola + «con «Prolunga» conta la prima pubblicazione; se lo ripresenti come nuova offerta contano i 30 giorni prima della nuova pubblicazione, compresi i giorni in cui era già scontato» | 🟠 |
| Termini 5, nuovo | — | vendite promozionali e saldi; per gli omaggi, manifestazioni a premio: responsabilità del negozio | 🟠 |
| Termini, riquadro «Modifiche o rimozione» | «se hai un'offerta in corso, il negozio resta visibile fino all'ultimo giorno del mese … e viene rimosso … dal 1° del mese successivo» | «L'eliminazione è immediata: il negozio, l'offerta online, l'eventuale prossima offerta e l'archivio spariscono subito … i codici dei Clienti non ancora usati non valgono più … Se vuoi che i Clienti possano usare la tua offerta fino alla sua data di fine, elimina l'account dopo quella data» | 🟠 |
| Recesso 2 | «scegliendo «Non rinnovo» dalla propria area: l'offerta in corso termina l'ultimo giorno del mese e non riparte» | «scegliendo «Non rinnovo» …, l'offerta online termina alla sua data di fine e non riparte. Quando i pagamenti saranno attivi, la disdetta del pagamento si fa a parte e ha effetto a fine mese … Possono anche eliminare l'account: … spariscono subito» | 🟢 |
| Privacy 3 | «… pubblica l'offerta del mese (al massimo uno per negozio al mese)» | «… pubblica una nuova offerta (al massimo uno per negozio al mese)» | 🟢 |
| Date | «Ottobre 2026» (Termini, Privacy, Recesso) | «Novembre 2026»; Cookie Policy invariata | 🟢 |

## 4. Email di preavviso ai negozi già iscritti (P2B) — **testo pronto, NON inviato**
Perché: art. 3 Reg. UE 2019/1150 (preavviso di almeno 15 giorni su supporto durevole, da verificare) e art. 9 dei nostri Termini (ai Commercianti **30 giorni**, con diritto di smettere senza penali). La manda il titolare, solo con il suo OK, **prima dell'unione delle due PR o il giorno stesso**, a tutti i negozi iscritti prima dell'unione. L'agente `legale` non manda nulla.

> **Oggetto:** Sconti Roma: cambiano le regole sulla durata delle offerte (dal [DATA DI ENTRATA IN VIGORE])
>
> Ciao [NOME],
> ti scriviamo per avvisarti di una modifica ai Termini e Condizioni di Sconti Roma per i commercianti. Le nuove regole valgono dal **[DATA DI ENTRATA IN VIGORE]** (30 giorni dopo questa email).
>
> **Cosa cambia**
> 1. Quanto dura l'offerta lo scegli tu: 7, 14, 30, 60 o 90 giorni oppure fino a un giorno preciso (se non scegli, 30 giorni). Uno sconto resta online al massimo 90 giorni di fila; un omaggio fino a 365 giorni o senza scadenza. La durata parte dal giorno in cui l'offerta va online.
> 2. Finché è online, l'offerta non si modifica e non si accorcia fino alla sua data di fine. Puoi prolungarla con un tocco, senza una nuova approvazione.
> 3. La prossima offerta la prepari quando vuoi: dopo la nostra approvazione parte il giorno dopo la fine di quella in corso.
> 4. L'offerta non si rinnova da sola: alla data di fine termina. Ti avvisiamo per email 7, 3 e 1 giorno prima.
> 5. I codici dei clienti non ancora usati non valgono più dopo la fine dell'offerta (c'è tempo fino alle 02:00 del giorno dopo), salvo che sia già online la tua offerta successiva.
> 6. «Non rinnovo» serve solo a non far continuare l'offerta: finisce alla sua data di fine, i promemoria si fermano e l'eventuale prossima offerta viene ritirata. Non è la disdetta del pagamento.
> 7. Se elimini l'account, il negozio e la sua offerta spariscono subito.
>
> **Cosa resta uguale:** nella fase di lancio partecipare è gratuito; prova gratuita di 2 mesi (almeno 60 giorni) dalla prima pubblicazione; dopo, 4,99 € al mese + IVA; nessun addebito senza la tua conferma.
>
> La tua offerta già approvata resta valida, come prima, fino all'ultimo giorno del mese in cui è stata approvata. Se prima del [DATA DI ENTRATA IN VIGORE] pubblichi una nuova offerta, per quell'offerta valgono già le regole nuove.
>
> Se non sei d'accordo, puoi smettere prima del [DATA DI ENTRATA IN VIGORE], senza nessun costo: dalla tua area scegli «Non rinnovo» o elimina l'account, oppure scrivici a partner@scontiroma.it.
>
> Il testo completo è su scontiroma.it/termini (punti 3.2, 4 e 5).
>
> Un saluto,
> Sconti Roma (EUROLINEA S.r.l.s.) – info@scontiroma.it

**Facoltativa, per i clienti** (art. 9 dei Termini: 15 giorni per le modifiche sostanziali; per i clienti la modifica è piccola, vedi la lista per l'avvocato):
> **Oggetto:** Sconti Roma: su ogni offerta ora trovi fino a quando vale
> Ciao [NOME], da oggi ogni negozio sceglie quanto dura la sua offerta e su ogni offerta trovi scritto «Valida fino al …». Un codice QR non ancora usato smette di valere alla fine dell'offerta, se il negozio non ne ha già messa online un'altra, e, come prima, alla fine del mese (c'è sempre tempo fino alle 02:00 del giorno dopo). Usare Sconti Roma resta gratuito. Il testo completo è su scontiroma.it/termini (punto 4). Sconti Roma – info@scontiroma.it

## 5. Dati personali: Privacy, Cookie e registro dei trattamenti
| Campo nuovo (offerte e prossime offerte) | Cosa contiene | Dato personale? | Serve cambiare la Privacy? |
|---|---|---|---|
| `duration_days`, `end_date`, `open_ended` | durata scelta | No (dato dell'offerta) | No |
| `valid_from`, `valid_until` | primo e ultimo giorno online | No | No |
| `no_renew`, `reminders`, `extended_at` | scelta «Non rinnovo», promemoria inviati, data della proroga | Solo in senso largo, se il negozio è una ditta individuale (azioni del titolare dell'account) | No: rientrano nei «dati commerciali» e nei «promemoria di scadenza delle offerte» già scritti; si cancellano con l'account (`_erase_user_data`) e sono nell'esportazione (`/gdpr/export`) |
| `settings.admin_scadenze_ultimo` | data dell'ultimo riepilogo all'admin | No | No |

Conclusione: nessun fornitore nuovo, nessuna finalità nuova, nessun cookie o dato nel browser nuovo (controllato il diff della #253). **Privacy:** cambia solo la riga degli avvisi dei preferiti. **Cookie Policy:** nessuna modifica. **Registro dei trattamenti:** non è nel repository; secondo il codice non servono righe nuove (stesse finalità: gestione delle offerte dei negozi ed email di servizio). Da confermare sul registro tenuto fuori dal repository.

## 6. Versione dei testi
`LEGAL_VERSION` (in `backend/server.py`) passa da `2026-10` a `2026-11`, come dice il commento della costante («unico punto da aggiornare quando cambiano i testi legali») e come fa già la PR #244: chi si iscrive dopo l'unione registra la versione che ha davvero visto. Il codice salva la versione solo all'iscrizione e non chiede una nuova accettazione a chi è già iscritto (non esiste un meccanismo di riaccettazione): per i negozi già iscritti vale l'email di preavviso (punto 4). Se l'unione slitta a dicembre: «Dicembre 2026» nelle date e `2026-12`.

## 7. Fuori da questa PR (segnalati, non toccati)
| Cosa | Dove | Rischio | Proposta |
|---|---|---|---|
| «1 offerta al mese» (riquadro per i commercianti) e FAQ «Ogni negozio ha un'offerta al mese» | `frontend/src/pages/Landing.jsx` | 🟠 informazione non più vera | Da correggere nella #253 |
| «puoi riusare la stessa» quando uno **sconto** arriva a 90 giorni (messaggio di «Prolunga» e promemoria) | `merchant_extend_discount`, `send_next_offer_reminder` | 🟠 contrasta con la regola del prezzo pieno (Termini art. 5) | Limitare il suggerimento agli omaggi; per gli sconti, pausa di almeno 30 giorni a prezzo pieno |
| Riepilogo «Disdetta» e finestra di conferma della disdetta | `frontend/src/components/PagamentoNegozio.jsx` (pagamenti spenti) | 🟠 prima di accendere i pagamenti | Allineare alla frase nuova dei Termini 3.2 |
| Approvazione della prossima offerta con i pagamenti accesi valutata «al 1° del mese prossimo» | `_approvazione_consentita(per_mese_dopo=True)` | 🟠 prima di accendere i pagamenti | Rivedere con la durata libera |
| Codice del mese ancora accettato se, dopo la fine, il negozio ha un'offerta nuova in revisione (`valid_until` torna vuoto) o dopo lo sblocco dell'admin | `_offerta_del_codice_finita`, `qr_redeem` | 🟢 a favore del cliente | Letto nel codice, non provato: valutare un test |
| Promemoria di fine prova inviato anche a chi ha già confermato il pagamento | `_run_trial_reminders` (spento) | 🟢 | Testo reso valido per entrambi i casi |
| Consenso marketing: «offerte esclusive del mese», «Email mensili sui nuovi sconti del tuo quartiere» | `Register.jsx`, `GdprSection.jsx` | 🟢 | Non toccati (riguardano la newsletter mensile, non la durata); «quartiere» da sostituire con «zona» quando si rivede il consenso |
