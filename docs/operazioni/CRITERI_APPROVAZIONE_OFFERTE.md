# Criteri per approvare o rifiutare le offerte

> **Legenda rischio:** 🔴 alto, da sistemare prima del lancio · 🟠 medio, da valutare col consulente · 🟢 basso o già a posto.
> **[PROPOSTA] [DA VALIDARE]** Documento interno per l'amministratore. Non è un testo pubblico e non è consulenza legale: i criteri di rifiuto hanno rilievo legale (Reg. UE 2019/1150 sulle motivazioni, Reg. UE 2022/2065 sulle rimozioni, Termini commercianti) e vanno visti dal consulente prima di essere applicati in modo definitivo.
> **Rischio complessivo: 🟠** i criteri sono ragionevoli, ma l'elenco dei prodotti vietati e la scelta su alcol e «Vino & Gastronomia» sono decisioni del titolare e del consulente.
> Ultimo controllo sul codice: 13/10/2026 (`backend/server.py`).

## 1. Come funziona oggi (dal codice, non da quello che "dovrebbe" fare)

| Cosa | Realtà nell'app |
|---|---|
| Ogni offerta nuova o modificata | parte **sempre** in stato «in attesa» (`pending`); nessuna pubblicazione automatica. Il commerciante può modificarla solo se non è già approvata nel mese in corso. |
| Chi approva | solo l'amministratore principale (`require_admin_master`): scheda admin «Offerte in attesa» → Approva / Rifiuta. Claude non ha l'accesso: può preparare una **proposta di decisione** (approvare / rifiutare con quale motivo), la decisione la prende l'amministratore. |
| Cosa vede l'amministratore | titolo, descrizione, prezzo pieno e scontato, foto (fino a 8), condizioni, «pianifica in anticipo», validità, informazioni aggiuntive, massimo utilizzi al mese, negozio (nome, categoria, zona) e, se i pagamenti sono accesi, lo stato del pagamento. |
| Controlli automatici sui contenuti | **solo due**: prezzi maggiori di zero e prezzo scontato **più basso** del pieno. Non c'è nessun filtro su parole, categorie, foto o veridicità. **Ogni altro criterio di questo documento è un controllo umano.** |
| Rifiuto | `POST /admin/discounts/{id}/reject` (e `/admin/next-offers/{id}/reject` per l'offerta del mese prossimo): stato «rifiutata», l'offerta va nell'archivio del commerciante con la nota, e parte un'email «Offerta da rivedere» con il campo **Motivo**. |
| Il motivo è obbligatorio? | **No**: il campo può restare vuoto e l'email parte lo stesso, ma senza spiegazione. 🟠 I Termini e il Reg. 2019/1150 chiedono una motivazione: **regola interna (decisa il 13/10): il motivo si scrive sempre** (sezione 5); renderlo obbligatorio nel codice sarà una PR a parte. |
| Dopo il rifiuto | il commerciante può modificare e reinviare l'offerta (torna «in attesa»). |
| «Approva tutte» | esiste per il giorno del lancio (si scrive LANCIA). 🔴 **Prima di usarlo ogni offerta in attesa va letta con questi criteri**: il pulsante approva anche quelle che non andrebbero approvate. |
| Pagamento | con `MERCHANT_PAYMENT_REQUIRED` acceso, dopo la prova l'approvazione è bloccata (errore 409) se il pagamento del mese non è arrivato; è un blocco di pagamento, **non** un giudizio sul contenuto. Oggi è spento. |
| Segnalazioni dopo la pubblicazione | chiunque può segnalare un'offerta («Segnala questa offerta»); arriva in admin → Segnalazioni. Vedi `RISPOSTE_INFO_E_PARTNER.md`. |

## 2. Regola base

L'approvazione serve a una cosa: evitare che i clienti trovino offerte false, illecite o dannose. **Nel dubbio non si approva subito e non si rifiuta subito**: si chiede un chiarimento al negozio (sezione 6). Si rifiuta solo per un motivo che si può scrivere in una frase concreta.

Tre domande da farsi su ogni offerta:
1. **È vera?** Prezzi, sconto, condizioni sono chiari e il negozio può rispettarli per tutto il mese?
2. **È lecita e adatta?** Prodotto o servizio permesso, foto adatte, rivolta a maggiorenni (18+)?
3. **È coerente con i Termini?** Niente promesse che il negozio non può mantenere, niente dati di altre persone.

## 3. Cosa si APPROVA

Un'offerta si approva se, insieme:
- titolo e descrizione dicono chiaramente cosa si ottiene (cosa, quanto, quando, dove);
- il prezzo pieno è un prezzo che il negozio praticava davvero e il prezzo scontato è quello che il cliente paga con il QR;
- le condizioni (giorni, orari, esclusioni, prenotazione) sono scritte nella scheda e non solo «in negozio»;
- le foto mostrano il prodotto o il locale (proprie del negozio, o della libreria di esempio dell'app);
- il prodotto o servizio è normale per la categoria scelta;
- non contiene claim sanitari, promesse di risultato garantito, riferimenti a marchi altrui usati come richiamo.

Piccoli difetti di forma (refusi, maiuscole, tono troppo urlato, foto un po' scura) **non** sono motivo di rifiuto: si approva. Se serve, si può scrivere al negozio un consiglio senza bloccare l'offerta.

## 4. Cosa si RIFIUTA (con esempi)

Per ogni gruppo: quando rifiutare, esempi, e se è una decisione legale.

### 4.1 Offerta ingannevole o prezzo non vero 🔴
Rifiutare se il prezzo, lo sconto o le condizioni possono indurre in errore.
- Prezzo pieno gonfiato o inventato per far sembrare grande lo sconto (es. «da 80 € a 40 €» per un servizio che il negozio vende da sempre a 45 €).
- Offerta che esiste solo «fino a esaurimento» ma non lo dice, o con limiti nascosti (solo un giorno della settimana, solo alcuni prodotti) non scritti.
- Offerta confusa: più prezzi diversi nel testo, descrizione che non corrisponde al titolo.
- Titolo che promette più di quello che la descrizione dà (es. «Cena per due gratis» e poi si paga il secondo piatto).
- Sconto non reale: il prezzo scontato è uguale o poco diverso dal prezzo normale (il codice blocca solo lo sconto zero o negativo).
- Condizioni che il negozio non può mantenere per tutto il mese (i Termini chiedono di rispettare lo sconto fino all'ultimo giorno).

*Riferimento da validare:* art. 17-bis Codice del Consumo (prezzo di riferimento = il più basso dei 30 giorni precedenti) e pratiche commerciali scorrette; già indicati come `[DA VALIDARE]` nei Termini commercianti, punto 5.3. **Domanda per il consulente:** come verifichiamo il «prezzo più basso dei 30 giorni» in modo pratico? (Proposta: dichiarazione del negozio nella registrazione + controllo a campione.)

### 4.2 Sconto non rispettato in passato 🟠
Se per un negozio ci sono segnalazioni **accolte** di sconto non rispettato (area admin → Segnalazioni, tipo «offerta non rispettata»):
- 1ª volta: non si rifiuta a prescindere; si scrive al negozio e si ricorda l'obbligo dei Termini (rispettare lo sconto fino all'ultimo giorno del mese);
- ripetuta, o con più segnalazioni diverse: si può rifiutare la nuova offerta o sospendere il negozio, **sempre con motivazione scritta** e possibilità di reclamo (sezione 7).

Qui la decisione è anche contrattuale (sospensione): va seguita la procedura di sospensione dei Termini commercianti, art. 7. **[DA VALIDARE]**

### 4.3 Alcol, tabacco, giochi d'azzardo, prodotti per adulti, minori 🔴
Sconti Roma è per **maggiorenni (18+)**, ma i testi pubblici non devono incoraggiare comportamenti a rischio né rivolgersi ai minori.
- **Sempre da rifiutare:** tabacco, sigarette elettroniche e liquidi, giochi d'azzardo e scommesse (slot, lotterie, bingo, scommesse sportive), prodotti e servizi per adulti (erotici, contenuti per soli adulti), qualsiasi offerta rivolta a minori o che li coinvolge come destinatari di alcol o fumo.
- **Alcol:** vedi decisione D1 sotto. Proposta di partenza: si approva il normale menu di un locale (vino con il pranzo, aperitivo); si rifiuta l'offerta il cui **oggetto principale** è l'alcol come tale se spinge al consumo (es. «tutto il vino a metà prezzo, bevi quanto vuoi», «open bar», «shot gratis») o che parla ai minori.
- Esempi da rifiutare: «Sigarette elettroniche -30%», «Scommesse: bonus di benvenuto», «Open bar tutta la sera».
- Esempio da approvare: «Menu pranzo con un calice di vino a scelta» in un ristorante.

*Riferimento da validare:* esistono divieti di pubblicità e di sconti per i prodotti da fumo e limiti alla pubblicità del gioco d'azzardo (D.L. 87/2018). **[DA VALIDARE]** Domanda al consulente: quali di questi divieti toccano una piattaforma intermediaria che pubblica l'offerta di un terzo?

### 4.4 Prodotti o servizi vietati o regolamentati 🔴
Rifiutare (o chiedere l'autorizzazione/prova) quando l'offerta riguarda:
- armi, munizioni, esplosivi, fuochi d'artificio; droghe o sostanze vietate; merce contraffatta o senza titolo (copie di marchi);
- farmaci con ricetta, trattamenti medici o sanitari presentati come cura, servizi che richiedono un'abilitazione che il negozio non mostra;
- animali vivi in vendita, prodotti derivati da specie protette;
- servizi finanziari, prestiti, criptovalute, investimenti;
- biglietti o eventi senza autorizzazione, rivendita di biglietti;
- qualsiasi cosa che il negozio non può vendere con la sua attività dichiarata (una pizzeria che offre «prestiti»).
Per i servizi regolamentati che non sono in questo elenco e il negozio sembra in regola (parrucchiere, estetista, fitness, studio con abilitazione) si approva; si controlla solo che il testo non prometta risultati sanitari (4.7).

*Rischio:* l'elenco è una proposta; il consulente deve dirci cosa aggiungere o togliere. **[DA VALIDARE]**

### 4.5 Foto non adatte o non proprie 🟠
Rifiutare (o chiedere la sostituzione) se le foto:
- sono scaricate da internet, da altri siti o da altri negozi: non sono del negozio (sospetto di violazione di diritti d'autore; i Termini chiedono che il commerciante garantisca di averne i diritti);
- mostrano persone riconoscibili senza che sia chiaro il consenso, o **minori**;
- contengono nudo, violenza, contenuti offensivi, riferimenti a marchi altrui usati come richiamo;
- sono fuorvianti (mostrano un prodotto diverso da quello offerto) o con scritte di prezzi/percentuali diversi da quelli dell'offerta;
- sono illeggibili (troppo piccole o sfocate) al punto da non far capire l'offerta.
Sono **accettate**: foto del locale o dei piatti fatte dal negozio, foto della libreria di esempio dell'app (licenza libera Unsplash, copiata sul nostro sito).
**Verifica pratica:** un controllo a vista basta; per un sospetto forte si fa una ricerca per immagini gratuita. Se il sospetto non è provato: «foto da confermare» (sezione 6), non rifiuto secco.

### 4.6 Offerte che violano i Termini 🟠
Rifiutare se l'offerta:
- è contraria ai Termini commercianti (per es. chiede ai clienti dati personali o l'iscrizione a un'altra raccolta dati, o li obbliga a un acquisto diverso da quello offerto);
- discrimina i clienti Sconti Roma rispetto agli altri (prezzo diverso da quello che vale per tutti senza che sia chiaro lo sconto);
- fa riferimento a pagamenti fuori dall'app o a contatti diretti per «evitare» la piattaforma;
- contiene dati personali di terzi (nomi, telefoni di persone), insulti, discriminazioni, contenuti d'odio;
- fa promesse a nome di Sconti Roma («garantito da Sconti Roma», percentuali o «gratis per sempre» attribuiti a noi);
- è un'offerta di un'altra attività non registrata o a nome di terzi.

### 4.7 Claim sanitari e promesse di risultato 🟠
Rifiutare o far riscrivere se si afferma che un prodotto o trattamento **cura, previene o guarisce** una malattia, fa **dimagrire una quantità garantita**, «elimina» il dolore o altri risultati medici non dimostrabili.
- Da riscrivere: «Cura la cellulite in 3 sedute» → «Trattamento estetico viso e corpo».
- Da riscrivere: «Integratore che previene l'influenza».
- Da approvare: «Massaggio rilassante di 50 minuti», «Seduta di prova in palestra».
*Riferimento da validare:* regole su claim nutrizionali e sulla salute (Reg. CE 1924/2006). **[DA VALIDARE]**

### 4.8 Altri motivi di rifiuto tecnico (non legali)
- Offerta incompleta (titolo o descrizione generici, nessuna condizione, nessuna foto).
- Duplicato di un'altra offerta dello stesso negozio.
- Offerta in una categoria sbagliata (si può correggere e approvare, avvisando il negozio).
- Pagamento non ricevuto (solo con i pagamenti accesi; si risponde con il modello M7).

## 5. Motivazioni standard da scrivere al negozio

Il testo che scrivi nel campo **Motivo** finisce nell'email «Offerta da rivedere» e nell'archivio del negozio. Regole:
- **breve** (2-4 righe), **cortese**, **concreta**: dì cosa non va e cosa può fare per sistemare;
- un solo motivo principale (al massimo due);
- niente toni giudicanti, niente accuse («hai mentito»);
- mai dati di altre persone; mai riferimenti a segnalazioni di clienti con il loro nome;
- firma automatica dell'email: non aggiungere firme personali; non scrivere percentuali o prezzi che non siano quelli dell'offerta.

Modelli da copiare nel campo Motivo (adattare le parentesi):

| Codice | Quando | Testo |
|---|---|---|
| M1 | Prezzi non chiari o non veri | «Il prezzo pieno indicato non corrisponde a quello normalmente applicato dal negozio. Ti chiediamo di indicare il prezzo reale e di reinviare l'offerta: la riguardiamo subito.» |
| M2 | Condizioni mancanti | «Nella scheda mancano le condizioni (giorni, orari, eventuali esclusioni). Aggiungile e reinvia l'offerta: così i clienti sanno cosa aspettarsi.» |
| M3 | Titolo che promette più della descrizione | «Il titolo promette più di quello che la descrizione offre. Allinea i due testi (cosa riceve davvero il cliente) e reinvia.» |
| M4 | Foto non adatta | «La foto non sembra del negozio o non mostra l'offerta. Carica una foto del prodotto o del locale oppure scegli una foto dalla libreria dell'app, poi reinvia.» |
| M5 | Foto con persone riconoscibili / minori | «Nella foto compaiono persone riconoscibili. Sostituiscila con una foto senza persone o con il consenso scritto delle persone ritratte.» |
| M6 | Claim sanitario | «Il testo promette effetti sulla salute che non possiamo pubblicare. Descrivi il trattamento senza promettere cure o risultati e reinvia.» |
| M7 | Pagamento non arrivato (solo a pagamenti accesi) | «Il pagamento del mese non risulta ricevuto nei giorni previsti, quindi non possiamo approvare l'offerta per questo mese. Appena risulta pagato la guardiamo subito.» |
| M8 | Prodotto o servizio non pubblicabile | «Questo tipo di prodotto/servizio non possiamo pubblicarlo su Sconti Roma. Se vuoi proporre un'altra offerta del negozio, la valutiamo volentieri.» |
| M9 | Alcol/adulti/azzardo | «Offerte su (alcol/giochi/prodotti per adulti) non rientrano tra quelle che pubblichiamo. Puoi proporre un'altra offerta del negozio.» |
| M10 | Violazione dei Termini | «L'offerta non è in linea con i Termini per i commercianti (punto: …). Correggila e reinviala; se hai dubbi, scrivici.» |
| M11 | Duplicato / incompleta | «L'offerta è incompleta (manca …). Completala e reinviala: la approviamo appena possibile.» |

Ogni motivazione è un consiglio per sistemare, non un'accusa. Se dopo il rifiuto il negozio protesta, si passa alla procedura di reclamo (sezione 7).

## 6. Casi dubbi: cosa fare

1. **Non decidere di fretta e non rifiutare "per prudenza" senza motivo scritto.** Un rifiuto senza motivo concreto è il rischio più alto in ottica P2B.
2. **Chiedi un chiarimento** con un'email breve (modello nella sezione 6.1) e lascia l'offerta «in attesa». Tempo massimo per rispondere al negozio: **5 giorni lavorativi** (stesso tempo dei reclami).
3. **Se il dubbio resta** (tabacco, alcol, farmaci, minori, armi, diritti d'autore, prezzi): decide il **titolare**; se è un caso nuovo che si ripeterà, si aggiunge una riga a questo elenco.
4. **Se riguarda un reato o un minore** (offerta che sfrutta minori, vendita di merce illegale, minacce): non si risponde al negozio da soli, si avvisa subito il titolare (e il consulente, se serve).
5. **Annota ogni caso dubbio** nel registro (data, tipo, esito, senza dati personali) per costruire la giurisprudenza interna.
6. **Mai approvare per "togliere la pratica"** con un dubbio serio: l'offerta approvata è pubblica e il negozio deve rispettarla per tutto il mese.

### 6.1 Modello di richiesta di chiarimento (non è un rifiuto)
> Ciao, grazie per l'offerta di [nome negozio]. Prima di pubblicarla ci serve un chiarimento: [domanda precisa, per esempio «il prezzo pieno di 40 € è quello che applicate di solito?»]. Appena ci rispondi la guardiamo subito. Sconti Roma

## 7. Dopo il rifiuto: reclamo e riesame

- Il negozio può **modificare e reinviare** (soluzione normale) oppure **reclamare** dalla scheda «Hai un reclamo?» o scrivendo a info@scontiroma.it.
- Conferma del reclamo entro **5 giorni lavorativi**; esito sempre motivato; riesame da una persona. **[DA COMPLETARE: tempo dell'esito, proposta 30 giorni; riesame, proposta 10 giorni lavorativi: vedi doc. 06 P2B]**
- Se il rifiuto era sbagliato: approvare subito e scrivere una breve scusa.
- Se un negozio **continua** a reinviare offerte non conformi senza correggerle, si passa alla sospensione secondo l'art. 7 dei Termini, con motivazione.

## 8. Cosa deve vedere il consulente (prima dell'uso definitivo) 🟠

1. **Elenco dei contenuti vietati** (4.3, 4.4, 4.6): è completo? Va riportato nei Termini (doc. 03 e 04) e nel punto 5 del doc. 07 DSA?
2. **Alcol e tabacco/azzardo:** quali divieti di pubblicità toccano una piattaforma intermediaria? Basta il rifiuto delle offerte il cui oggetto principale è questo prodotto?
3. **Motivazione dei rifiuti** (Reg. 2019/1150, art. 4 e 5; DSA, art. 17): basta il campo «Motivo» via email? Il modello M1-M11 è sufficiente? Serve rendere il campo obbligatorio?
4. **Prezzo di riferimento** (art. 17-bis Codice del Consumo): come facciamo il controllo in pratica?
5. **Foto e diritti d'autore:** la dichiarazione del commerciante basta? Cosa facciamo con una foto che sembra presa da internet?
6. **Sospensione dopo sconto non rispettato:** quante segnalazioni accolte prima di sospendere? Procedura e preavviso (art. 7 Termini commercianti).
7. **Claim sanitari** (4.7): la regola «riscrivi, non rifiutare» è adeguata?

## 9. Decisioni del titolare (13/10, registrate)

Il titolare ha risposto «ok» alle proposte. Cosa resta da validare dal consulente è indicato.

| # | Decisione | Proposta |
|---|---|---|
| D1 ✅ DECISO | **Alcol e la categoria «Vino & Gastronomia»**: la categoria esiste già nell'app. Rifiutiamo solo le offerte con l'alcol come oggetto principale, oppure ogni offerta con alcol? | **Deciso: l'alcol si rifiuta solo se è l'oggetto principale dell'offerta** (4.3). La categoria «Vino & Gastronomia» resta. |
| D2 ✅ DECISO | Rendere **obbligatorio il campo «Motivo»** nel rifiuto (piccola modifica al codice, in un'altra PR)? | **Deciso: il «Motivo» è obbligatorio** (almeno 10 caratteri, come per le segnalazioni). Vale subito come regola per chi approva; la modifica al codice sarà una PR a parte. |
| D3 ✅ DECISO (numero da validare) | Dopo quante segnalazioni accolte di sconto non rispettato si sospende un negozio? | **Deciso: 3 segnalazioni accolte** prima di sospendere un negozio, sempre con motivazione e possibilità di reclamo. **[DA VALIDARE dal consulente]** |
| D4 ✅ DECISO | Il titolare approva **tutto** da solo, o Claude prepara una proposta («approva/rifiuta/chiedi chiarimento + motivo») che il titolare conferma con un tocco? | **Deciso: le approvazioni le decide il titolare, con un giudizio preparato da Claude.** |
| D5 ✅ DECISO | Elenco dei prodotti vietati (4.4): aggiungi o togli voci. | Confermato: elenco corto, aggiornato con i casi reali. |

Nessuna regola di questo documento è stata applicata al codice o al sito: è solo un manuale per chi approva.
