# Proposta: servizio «Ci pensiamo noi» — righe per i Termini (e una per la Privacy) [DA VALIDARE]

> Bozza preparata da Claude (non è un parere legale). Le pagine del sito (`frontend/src/pages/legal/*`)
> **non** sono state toccate: qui ci sono solo le righe proposte, marcate `[PROPOSTA]`. Da far vedere al
> consulente (o all'agente `legale`, decisione del titolare del 18/10) prima di usare il servizio con negozi veri.

Legenda rischio: 🔴 alto, da sistemare prima di usarlo · 🟠 medio, da valutare · 🟢 basso.

## Punti di rischio (in cima)

| # | Punto | Rischio | Proposta |
|---|---|---|---|
| 1 | I Termini oggi dicono che l'offerta la inserisce il commerciante: un'offerta inserita da noi senza una regola scritta lascia dubbi su chi risponde dei contenuti (prezzi, foto, condizioni) | 🔴 | Aggiungere la riga dei Termini qui sotto prima di usare il servizio con negozi veri |
| 2 | La responsabilità passa al commerciante solo con la sua conferma: se l'offerta venisse pubblicata senza conferma, la responsabilità resterebbe nostra | 🟠 | Fatto nel codice: senza conferma l'offerta non si vede, non si può approvare (né una per una né con «Approva tutte») e la prova non parte. La conferma è un tocco su «Confermo» dopo aver letto riepilogo e frase di responsabilità |
| 3 | Prova della conferma: il link dell'email è senza password. Chi ha accesso alla casella email del negozio può confermare | 🟠 | Link monouso, 7 giorni, legato a una sola offerta; dopo la conferma l'offerta passa comunque dal nostro controllo. Il consulente valuta se basta (proposta: sì, come per il recupero della password) |
| 4 | Conservazione della prova: salviamo data/ora, versione del testo accettato e canale (link email / area commercianti / modifica). **Nessun IP** né dati del dispositivo (scelta del titolare) | 🟠 | Prova più debole senza IP, ma proporzionata. Oggi la prova si cancella con l'account del commerciante (insieme alle offerte): il consulente decide se tenerla più a lungo dopo la cancellazione (es. 2 anni per difesa in giudizio, art. 17.3.e GDPR) — **decisione aperta** |
| 5 | Foto scelte da noi dalla libreria (licenza Unsplash) o mandate dal commerciante: per quelle mandate da lui vale quanto già scritto nei Termini sulle foto | 🟢 | Nella riga dei Termini: «i materiali che ci mandi devono essere tuoi o usabili» |
| 6 | Il servizio è gratuito: nessuna promessa di risultati, nessun costo nascosto | 🟢 | Scritto «gratuito», senza promesse, anche nella pagina «Per i commercianti» |
| 7 | Copia dei testi del commerciante: WhatsApp/email che ci manda per farci inserire l'offerta restano nelle nostre caselle | 🟢 | Una riga in Privacy (sotto) |

## Cosa fa davvero il codice (fotografia)

- **Chi crea**: solo l'admin (password master), dalla scheda del negozio: «Ci pensiamo noi: crea offerta». Stessi campi del modulo del commerciante (titolo, descrizione, prezzi, foto anche dalla libreria, giorni/orari, utilizzi al mese, condizioni).
- **Stato** `awaiting_merchant` («in attesa di conferma del negozio»): non si vede ai clienti (elenco, mappa, pagina del negozio, pagina dell'offerta), non conta come pubblicazione, la prova non parte.
- **Email al commerciante**: riepilogo completo, foto (quelle della libreria; quelle caricate dal telefono si vedono nella pagina di conferma), la frase «Confermando dichiari che i dati dell'offerta sono corretti e te ne assumi la responsabilità, come se l'avessi inserita tu.», pulsanti «Confermo» e «Voglio modificarla».
- **Link «Confermo»**: monouso, valido 7 giorni, nessun login; apre una pagina con il riepilogo e la conferma parte solo toccando «Confermo». Nel database c'è solo l'impronta (hash) del link.
- **«Voglio modificarla»**: porta al login e al modulo; salvando, l'offerta va in revisione come inviata dal commerciante e il link dell'email smette di valere.
- **Alla conferma**: l'offerta passa «in revisione» → approvazione dell'admin (in pre-lancio resta in attesa fino ad «Approva tutte»). Si salvano data/ora, versione del testo (`ci-pensiamo-noi-2026-10-22`) e canale, in `conferme_offerta`. L'admin riceve email e notifica push «Il negozio X ha confermato l'offerta».
- **Esportazione dati** (art. 20): le conferme sono incluse. **Cancellazione account**: conferme e link si cancellano con l'account.

## [PROPOSTA] Termini e condizioni — sezione per i commercianti

### Nuovo paragrafo «Inserimento dell'offerta da parte di Sconti Roma («Ci pensiamo noi»)»
> Su tua richiesta (per esempio via WhatsApp o email), possiamo inserire noi la tua offerta. Il servizio è
> **gratuito**. L'offerta inserita da noi non è visibile ai clienti finché non la confermi: ti mandiamo un'email
> con il riepilogo e un link valido 7 giorni, utilizzabile una sola volta. **Confermando dichiari che i dati
> dell'offerta sono corretti e te ne assumi la responsabilità, come se l'avessi inserita tu**; da quel momento
> valgono tutte le regole dei presenti Termini sulle offerte (contenuti, prezzi, rispetto dello sconto, foto).
> Puoi anche modificarla dalla tua area commercianti prima di inviarla. Dopo la conferma l'offerta passa
> comunque dal nostro controllo prima della pubblicazione. I materiali che ci mandi (testi, foto) devono essere
> tuoi o comunque utilizzabili. Conserviamo la prova della conferma (data, ora e versione del testo accettato)
> per tutta la durata del tuo account [ed eventualmente fino a … dopo la sua chiusura — DA DECIDERE]. [DA VALIDARE]

### Paragrafo sulla prova gratuita — precisazione
> L'inserimento da parte nostra non avvia la prova gratuita: la prova parte, come sempre, dalla prima
> pubblicazione dell'offerta dopo la tua conferma e la nostra approvazione. [DA VALIDARE]

## [PROPOSTA] Privacy Policy — informativa per i commercianti

### Riga da aggiungere ai dati trattati
> **Inserimento dell'offerta da parte nostra («Ci pensiamo noi»).** Se ci chiedi di inserire la tua offerta,
> usiamo i dati e i materiali che ci mandi solo per prepararla. Della tua conferma salviamo data, ora e versione
> del testo accettato (non l'indirizzo IP), per dimostrare che l'offerta è stata approvata da te. Base giuridica:
> esecuzione del contratto e legittimo interesse a provare la conferma. [DA VALIDARE]
