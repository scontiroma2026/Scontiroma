# Promemoria da riprendere

Cose rimandate di proposito, con data e motivo. Repository pubblico: nessun dato personale.

| Data | Voce | Motivo | Stato |
|---|---|---|---|
| 14/10/2026 | **Periodo di grazia per la prossima offerta non ancora approvata quando finisce quella online.** Oggi, se il commerciante ha preparato la prossima offerta ma l'admin non l'ha approvata prima della data di fine di quella online, la vecchia offerta scade e la nuova resta in attesa: il negozio non ha offerte visibili finché non viene approvata. (Dal 14/11 le offerte non sono più mensili: la data di fine la sceglie il negozio; il negozio può anche prolungare l'offerta online con un tocco, senza approvazione.) | Decisione del titolare (14/10): lasciare in sospeso, non implementare. Valutare dopo i primi cambi di offerta reali. | In sospeso |
| 14/11/2026 | **Durata libera dell'offerta e pagamenti dei negozi.** Con i pagamenti accesi la disdetta ha effetto a fine mese: un'offerta con data di fine successiva smetterebbe di vedersi prima della data scritta ai clienti. Oggi i pagamenti sono spenti e non succede. | Prima di accendere `MERCHANT_PAYMENT_REQUIRED`: decidere la regola (per esempio «Valida fino al» non oltre la fine del mese pagato) e allineare Termini e schermata di pagamento con l'agente `legale`. | Da fare prima dei pagamenti |
| 14/11/2026 | **Avviso ai clienti «il tuo sconto scade domani».** Oggi parte solo il penultimo giorno del mese (i codici valgono nel mese in cui nascono). Con la durata libera un'offerta può finire a metà mese: il codice non usato scade con l'offerta, ma il cliente non riceve un avviso. | Aggiungere l'avviso il giorno prima della data di fine dell'offerta (notifiche push, oggi spente). | Con calma |
| 14/10/2026 | **Marchio «Sconti Roma»**: nome più distintivo o marchio figurativo, ricerche UIBM/EUIPO/domini a mano, eventuale deposito. Vedi `MARCHIO.md`. | Decisione del titolare (14/10): più avanti, nessuna azione ora. | In sospeso |
