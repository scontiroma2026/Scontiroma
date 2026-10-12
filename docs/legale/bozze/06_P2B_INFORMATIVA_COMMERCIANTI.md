# 06 - Informativa P2B ai Commercianti (Regolamento UE 2019/1150)

> **Rischio: 🔴 alto: applicabilità del Reg. 2019/1150 da chiedere al consulente, preavvisi, motivazioni, reclami su info@.**
> **[PROPOSTA] [DA VALIDARE]** - Bozza. Sconti Roma è un «servizio di intermediazione online» tra imprese (i commercianti) e consumatori (i clienti). Va verificato se rientra nel Regolamento. **[DA VALIDARE, domanda 3]**
> Applicabilità del Regolamento: **domanda aperta al consulente**. Può diventare un articolo dei Termini Commercianti (doc. 04) o una pagina `/commercianti/regole`.

## 1. Termini chiari e accessibili (art. 3)
I Termini sono scritti in italiano semplice, sempre consultabili da `/termini` e nell'area del Commerciante prima e durante il rapporto.

## 2. Modifiche (art. 3.2)
Preavviso di **almeno 15 giorni** su supporto durevole (email) per ogni modifica dei Termini; nei Termini proposti 30 giorni per prezzo e Termini. Il Commerciante può **recedere** in quel periodo; se inizia ad usare il servizio dopo la modifica, la accetta. **[DA VALIDARE]**

## 3. Sospensione, limitazione e chiusura (art. 4)
- **Cosa può accadere:** offerta rifiutata o tolta, negozio sospeso (non visibile), account chiuso.
- **Motivi:** violazione dei Termini; offerta non rispettata (segnalazioni dei Clienti); dati falsi; contenuti illeciti; pagamento non ricevuto (dopo l'avvio dei pagamenti); richiesta dell'autorità.
- **Comunicazione:** motivazione chiara via email **prima o al momento** della sospensione, con i fatti e le ragioni; per la chiusura **30 giorni di preavviso**, salvo urgenza o violazioni gravi.
- **Disdetta non è sospensione:** la disdetta decisa dal Commerciante ha effetto a fine mese e non segue questa procedura; il ritiro anticipato per mancato rispetto dello sconto sì (motivazione, riesame). **[PROPOSTA]**
- **Rifiuto di un'offerta:** l'approvazione è **sempre manuale** del titolare e, dopo la prova, avviene solo se il pagamento è in regola; l'admin scrive il motivo (esiste già il campo «motivo» nell'invio `send_merchant_rejected`).
- **Reclamo e riesame:** il Commerciante risponde alla email o scrive a **info@scontiroma.it** (indirizzo per segnalazioni e reclami deciso dal titolare); riesame entro **[DA COMPLETARE: proposta 10 giorni lavorativi]**; se la sospensione era sbagliata, riattivazione immediata.

## 4. Posizionamento / ordinamento (art. 5)
Fatti dal codice (`/api/discounts`, 12/10/2026):
- Il Cliente vede solo offerte **approvate**, attive, di negozi **non sospesi**.
- L'elenco è ordinato **dalla più recente alla meno recente per data di pubblicazione** della singola offerta.
- Filtri scelti dal Cliente: zona, categoria, ricerca per testo.
- **Nessun posizionamento a pagamento**: pagare (in futuro) non cambia l'ordine. **[DA VALIDARE: da confermare per iscritto come impegno]**
- Nessuna valutazione o dato di vendita influenza l'ordine di questo elenco. [DA VALIDARE: verificare altre schermate, es. mappa o negozi vicini]
Frase proposta: «L'ordine delle offerte dipende solo da quanto è recente la pubblicazione e dai filtri scelti dal Cliente. Non esiste una corsia a pagamento né un vantaggio per chi ci paga di più.»

## 5. Trattamento differenziato (art. 7)
Sconti Roma non offre beni o servizi in concorrenza ai Commercianti e non ha negozi propri. Eventuali trattamenti diversi tra Commercianti dipendono da: zona pilota, data di adesione e periodo di prova (tutti trattati allo stesso modo: circa due mesi di prova dalla prima pubblicazione, poi primo pagamento il 1° del secondo o terzo mese dopo, secondo il giorno di pubblicazione). **[DA VALIDARE]**

## 6. Accesso ai dati (art. 9)
Il Commerciante vede: i propri dati; per ogni scansione nome e iniziale del cognome, ora, offerta, nuovo/ritorno; statistiche aggregate (solo con almeno 3 clienti nel mese). Non vede email né altri dati del Cliente. Sconti Roma tiene: dati di registrazione e uso della piattaforma, non ceduti ad altri Commercianti.

## 7. Condizioni contrattuali: fine rapporto (art. 8), prezzi e commissioni (art. 3)
Nessuna commissione sulle vendite. Un solo prezzo fisso mensile (**4,99 € + IVA**, IVA esclusa) dopo la prova di circa due mesi, **senza prezzo bloccato** (variazioni con preavviso di 30 giorni). Addebito automatico il 1° dopo una sola conferma esplicita. Disdetta a fine mese (lo sconto va rispettato fino all'ultimo giorno), nessuna penale, mese pagato non rimborsabile. Partita IVA obbligatoria alla registrazione. I dati dopo la chiusura: cancellati (vedi Privacy), tranne dati contabili e fatture (10 anni).

## 8. Sistema interno di gestione dei reclami (art. 11)
- Punto di contatto: **info@scontiroma.it**.
- Risposta: conferma entro 5 giorni lavorativi, esito motivato entro **[DA COMPLETARE: proposta 30 giorni]**.
- Registro annuale dei reclami e delle decisioni (anche per aggiornare i Termini). L'obbligo del sistema interno **non si applica alle piccole imprese** (meno di 50 addetti e fatturato ≤ 10 milioni di euro) **[DA VALIDARE: Euro Linea rientra, quindi forse non obbligatorio, ma è consigliato]**.

## 9. Mediazione (art. 12)
Indicare almeno due mediatori. **[DA COMPLETARE: scelta dei mediatori, es. organismi di mediazione civile accreditati; per le piccole imprese l'art. 12 non è obbligatorio, vedi sopra]**.

## 10. Tutela
Restano salvi i diritti del Commerciante dinanzi al giudice. **[DA VALIDARE]**
