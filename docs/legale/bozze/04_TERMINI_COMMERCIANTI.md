# 04 - Termini per i Commercianti (contratto con professionisti, B2B)

> **Rischio: 🔴 alto: prova e primo pagamento, addebito automatico dopo una conferma, disdetta a fine mese, limite di responsabilità, manleva, clausole 1341-1342.**
> **[PROPOSTA] [DA VALIDARE]** - Bozza per il consulente. Non pubblicata. Da leggere insieme al doc. 06 (P2B).
> Decisioni del titolare (10-12/10) già recepite qui: **4,99 € al mese + IVA (IVA esclusa); niente prezzo bloccato; circa due mesi di prova dalla PRIMA pubblicazione; si paga sempre il 1° del mese; addebito automatico mensile dopo UNA SOLA conferma esplicita; disdetta a fine mese con sconto da rispettare fino all'ultimo giorno; mese pagato non rimborsabile; approvazione dell'offerta sempre manuale; Partita IVA obbligatoria.**
> Interruttore tecnico: `CLIENT_SUBSCRIPTION_REQUIRED=false` / `MERCHANT_PAYMENT_REQUIRED` (spento). Stripe e PayPal restano nel codice ma spenti: nessun addebito prima della conferma del commerciante. Non pubblicare questa versione finché promemoria e pagamenti non sono nell'app (regola del lancio).

Fornitore: **Euro Linea S.r.l.s.**, P.IVA 03240220644, sede **[DA COMPLETARE: conferma]**, REA **[DA COMPLETARE]**, PEC **[DA COMPLETARE]**.
Il Commerciante è un **professionista**: le tutele dei consumatori (recesso del Codice del Consumo) non si applicano **[DA VALIDARE, domanda 5]**; si applica il Reg. UE 2019/1150 (doc. 06).

## 1. Oggetto
Sconti Roma pubblica le offerte del Commerciante e permette ai Clienti di usarle con il QR. Sconti Roma è un **intermediario**: non è parte del contratto di vendita tra Commerciante e Cliente.

## 2. Registrazione e approvazione
Il Commerciante fornisce dati veritieri (attività, indirizzo, telefono) e la **Partita IVA** (obbligatoria alla registrazione: 11 cifre, con controllo della cifra di controllo) e dichiara di poter agire per l'attività. **[PROPOSTA; punto aperto: i commercianti già registrati senza P.IVA, vedi indice domanda 5 e 22]** Ogni offerta è **approvata** da Sconti Roma prima della pubblicazione (criteri nel doc. 06). Un account per attività.

## 3. Prezzo, prova e pagamenti
1. **Prova gratuita di circa due mesi**, che parte dalla **prima pubblicazione** dell'offerta (cioè dalla sua approvazione). Dura da 49 a 81 giorni a seconda del giorno di approvazione, perché si paga sempre il 1° del mese (punto 5). La data esatta di fine prova è comunicata via email e nell'area del Commerciante; **promemoria via email 10 giorni e 3 giorni prima della fine della prova**.
2. **Dopo la prova: 4,99 € al mese + IVA.** L'importo è **IVA esclusa**: l'IVA (aliquota 22%) è aggiunta all'importo ed è addebitata tramite Stripe o PayPal **[DA VALIDARE: aliquota e fattura da confermare col commercialista; vedi domanda 11]**.
3. **Nessun prezzo bloccato.** Sconti Roma può cambiare il prezzo per il futuro con **preavviso di 30 giorni** via email; in quel periodo il Commerciante può disdire senza costi. Il prezzo non cambia nel mese già pagato.
4. **Quando si paga:** sempre il **1° di ogni mese**. Il pagamento si può fare **dal 1° al 5** del mese (tolleranza di 5 giorni **[PROPOSTA: numero modificabile dal titolare]**): in quel caso l'offerta del mese è visibile subito. **Dopo il 5** l'offerta vale dal mese successivo.
5. **Primo pagamento:** se la prima offerta è pubblicata **entro l'11** del mese, il primo pagamento è il **1° di due mesi dopo**; se è pubblicata **dal 12 in poi**, il primo pagamento è il **1° di tre mesi dopo**. Esempio: offerta approvata l'11 gennaio, primo pagamento il 1° marzo (49 giorni); approvata il 12 gennaio, primo pagamento il 1° aprile. **[DA VALIDARE: regola unica; chiude il punto rosso 4]**
6. **Conferma e addebito automatico.** Il Commerciante vede un **riepilogo** con importo (IVA esclusa e IVA), rinnovo mensile automatico, come si disdice e il fatto che il mese pagato non è rimborsabile, e dà **UNA SOLA conferma esplicita**. **Nessun addebito prima della conferma.** Dopo la conferma l'addebito è **automatico, ogni mese il 1°**, con carta (Stripe) o PayPal, fino alla disdetta. Se non confermi, non paghi nulla e l'offerta non viene più pubblicata dopo la prova. **[DA VALIDARE: forma della conferma e informazioni da dare prima dell'addebito ricorrente]**
7. **Approvazione sempre manuale.** Dopo la prova l'offerta è approvata dal titolare **solo se il pagamento è in regola**. Non c'è nessuna pubblicazione automatica: pagare non dà diritto alla pubblicazione, che resta soggetta ad approvazione (doc. 06).
8. **Come si paga:** Stripe o PayPal **[spenti oggi]**. Non conserviamo i dati della carta. Fattura/ricevuta: **[DA DECIDERE: modalità e tempi, domanda 11]**.
9. **Mese non rimborsabile:** l'importo del mese già pagato non è rimborsabile.

## 4. Disdetta
Si disdice con **«Non rinnovo»** (app) o scrivendo a partner@scontiroma.it, **in qualsiasi momento**. La disdetta ha effetto **a fine mese**: fino all'ultimo giorno del mese l'offerta resta pubblicata e **il Commerciante deve rispettare lo sconto**; dal 1° del mese dopo l'offerta e il pagamento cessano. Nessuna penale, nessun rimborso pro rata: il mese pagato non è rimborsabile. **La disdetta si può annullare fino alla fine del mese.** Il Commerciante riceve una **email di conferma** della disdetta (con la data di fine e l'obbligo di onorare lo sconto). Il mese cambia alle 00:00 (ora di Roma). **[DA VALIDARE: orario; testi di riquadro ed email nel documento `DISDETTA_ESERCIZIO_SCONTO.md`]**

## 5. Obblighi del Commerciante
1. **Rispettare lo sconto per tutto il mese** di validità, **anche dopo la disdetta**, fino all'ultimo giorno del mese; non modificare l'offerta prima del 1° del mese dopo.
2. Le **offerte** sono mensili e **non si rinnovano da sole** (diverso dall'addebito automatico del punto 3.6): per continuare, caricare l'offerta del mese successivo (approvazione manuale) o scegliere «Non rinnovo».
3. Informazioni veritiere su prodotto, prezzo, zona. **Prezzi veritieri**: se mostra un prezzo pieno e uno scontato, il prezzo di riferimento deve rispettare le regole sugli annunci di riduzione di prezzo (art. 17-bis Codice del Consumo, il più basso dei 30 giorni precedenti). [DA VALIDARE, Omnibus]
4. Scontrino/fattura secondo la legge.
5. Non discriminare i Clienti Sconti Roma.
6. **Uso dei dati dei Clienti: solo per verificare e applicare lo sconto**, nessun marketing, nessuna copia, nessuna comunicazione a terzi. Il Commerciante è titolare autonomo del trattamento dei dati che vede. [DA VALIDARE]
7. **Codice del negozio**: custodirlo, darlo solo al personale autorizzato, cambiarlo quando una persona smette; è responsabile dell'uso da parte del suo personale.
8. Rispettare la schermata di scansione: sconto solo a schermata verde.
9. Rispondere ai reclami dei Clienti sull'offerta.

## 6. Foto e testi
Restano del Commerciante. Concede a Sconti Roma una **licenza non esclusiva, gratuita, per la durata dell'adesione** (anche per il miglioramento tecnico con IA se acceso in futuro, previa informazione) per mostrarli nella piattaforma. Alla revoca/chiusura li togliamo dalla piattaforma entro **[DA COMPLETARE: giorni]**; le copie già condivise dai Clienti (per es. link di condivisione, anteprime sui social) non sono sotto il nostro controllo. Garantisce di averne i diritti e **ci tiene indenne da pretese di terzi** (manleva) per foto, testi e offerte non rispettate. **[DA VALIDARE: manleva]**

## 7. Sospensione e chiusura
Possiamo sospendere o chiudere l'account o un'offerta (anche solo in parte) per: violazione dei Termini, offerta non rispettata, contenuti illeciti, dati falsi, pagamento non ricevuto, ordine di un'autorità. **Comunichiamo la decisione con motivazione su supporto durevole (email), al più tardi al momento della sospensione**; preavviso di **30 giorni** per la chiusura, salvo urgenza, violazioni gravi, obblighi di legge. Il Commerciante può reclamare (doc. 06). **[DA VALIDARE: Reg. 2019/1150 art. 4]**

## 8. Eliminazione dell'account
- **Con un'offerta in corso:** l'eliminazione è **programmata dal 1° del mese successivo**. Fino all'ultimo giorno del mese l'offerta resta pubblicata e lo sconto va rispettato; **l'abbonamento si ferma subito** (nessun nuovo addebito); la richiesta si può **annullare** fino a fine mese. I dati collegati sono cancellati dopo l'eliminazione.
- **Senza offerta in corso:** l'eliminazione è **immediata** e i dati collegati sono cancellati.
- **[PUNTO PER IL CONSULENTE]** La cancellazione dei dati dei negozi con offerta in corso slitta fino a un mese: compatibile con l'art. 12 GDPR (risposta entro un mese)? **[DA VALIDARE]**
Per sospensioni temporanee: partner@scontiroma.it, risposta entro 5 giorni lavorativi.

## 9. Responsabilità
Il servizio è fornito «così com'è». Nei limiti di legge la responsabilità di Sconti Roma verso il Commerciante è limitata a **[DA DECIDERE: importo pagato negli ultimi 12 mesi, con un minimo fisso di € ___ ]** (oggi, in prova, il limite sarebbe zero), salvi dolo e colpa grave. **Clausola da approvare specificamente per iscritto (artt. 1341-1342 c.c.) con la seconda casella.** [DA VALIDARE]

## 10. Modifiche ai Termini
Preavviso di **30 giorni** via email (per uniformarsi al prezzo e al Reg. 2019/1150, che richiede almeno 15 giorni); in quel periodo il Commerciante può **recedere** senza costi. **[DA VALIDARE: allineare i due preavvisi]**

## 11. Legge e foro
Legge italiana, foro di Roma (professionisti). **[DA VALIDARE: sede a Ariano Irpino]** Mediazione e reclami: vedi doc. 06.

## 12. Clausole da approvare specificamente (seconda casella all'iscrizione)
Responsabilità (art. 9), modifiche (art. 10), foro (art. 11), manleva (art. 6), sospensione e chiusura (art. 7), **mese non rimborsabile (art. 3.9)**, **disdetta con effetto a fine mese e nessun rimborso pro rata (art. 4)**, **addebito automatico mensile (art. 3.6)** [DA VALIDARE: elenco]. Il server registra data e conferma (`legal_specific_accepted`).

## 13. Altre clausole
Forza maggiore; nullità parziale; comunicazioni via email valide; cessione del contratto solo con consenso scritto.
