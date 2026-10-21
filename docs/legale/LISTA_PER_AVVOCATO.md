# Lista per l'avvocato: tutto ciò che non è stato chiuso con certezza

Regola del titolare (21/10): ciò di cui Claude e l'agente `legale` non sono sicuri **si chiude con la scelta più prudente e si scrive qui**, per farlo vedere a un avvocato (consigliata un'ora, soprattutto sui Termini per i negozi). Testi «chiusi dall'agente, non validati da un avvocato». Repository pubblico: nessun dato personale, nessun segreto. Le norme citate non sono state controllate sui testi ufficiali.

Legenda: 🔴 prima di accendere i pagamenti o il pre-lancio · 🟠 da valutare · 🟢 di conferma. «Punto» = numero in `DOMANDE_PER_IL_CONSULENTE.md`.

## Decisioni del titolare già prese (non vanno rimesse in discussione)
- Calendario email ai negozi (punto 3, 21/10): giorno 30 della prova, 7 giorni prima del primo pagamento, 3 giorni prima di ogni addebito; niente promemoria a 10 e 3 giorni (PR #199).
- IVA al 22% (punto 8, 21/10): confermata dal titolare. Resta da decidere chi emette la fattura.
- Stripe e PayPal titolari autonomi (15/10); lista d'attesa 12 mesi; Partita IVA obbligatoria; nessuna spunta foto per ora.

## Dati mancanti (segnaposto nei testi)
| Dato | Dove serve | Segnaposto |
|---|---|---|
| Chi emette la fattura elettronica e codice SdI/PEC da raccogliere | Termini 3.2 (punto 8) | `[DA COMPLETARE: emittente fattura]` |
| Visura camerale: REA, capitale, PEC, civico | Fondo del sito (punto 35) | `[DA COMPLETARE: REA / capitale / PEC]` |
| LocationIQ: ragione sociale, sede, DPA, conservazione | Privacy (punto 14) | `[DA COMPLETARE: LocationIQ]` |
| DPA Render, Atlas, Aruba; regione di Atlas; durata log di Render | Privacy (punti 15, 16) | `[DA COMPLETARE]` |

## Da far vedere all'avvocato (gruppi 1 e 2: Termini, prova e pagamenti)
| Punto | Rischio | Cosa abbiamo scelto | Cosa chiedere |
|---|---|---|---|
| 1 | 🟠 | «Circa due mesi» con regola «entro l'11 / dal 12» e esempio (#157) | Bastano regola ed esempio, con prova reale da 49 a 81 giorni? |
| 2 | 🟠 | Una sola frase: disdetta quando vuoi, effetto a fine mese, sconto da rispettare, mese pagato non rimborsabile; tolto «Nessun vincolo» | La formula è corretta verso un professionista? Va bene identica in Termini, email e guida? |
| 3 | 🟠 | Calendario di #169 (PR #199); 30 giorni solo per variazioni di prezzo | Il preavviso minimo per cambiare i Termini (P2B, 15 giorni da verificare) è rispettato? |
| 5 | 🟠 | Cancellazione dell'account negozio dal 1° del mese dopo se c'è un'offerta in corso (#102) | Il rinvio fino a un mese è compatibile con GDPR art. 12.3 e 17.3? |
| 6 | 🔴 | Una conferma con riepilogo + link ai Termini e alla Privacy + nome della società + registro di data, ora e versione dei testi | Basta una sola conferma per un professionista (D.Lgs. 70/2003 art. 12)? |
| 7 | 🔴 | Seconda casella (artt. 1341-1342 c.c.) anche alla schermata di pagamento, con rinnovo automatico, disdetta e mese non rimborsabile | L'elenco delle clausole da approvare per iscritto è completo? Numerazione degli articoli da fissare dopo la riscrittura dei Termini. |
| 8 | 🟠 | IVA 22% (decisa); emittente della fattura: segnaposto | Obblighi informativi minimi e fatturazione elettronica (SdI) |
| 9 | 🟠 | Stripe e PayPal titolari autonomi anche per l'antifrode; tolti dall'elenco dei responsabili | Il ruolo non cambia per le attività accessorie? |
| 10 | 🟠 | Frasi «dopo il giorno 5 vale per il mese successivo» e «la ricevuta non è un documento fiscale»; una sola email di sollecito al mese | Le frasi sono corrette? Frase «fino a fine mese più il mese successivo» da correggere (vera solo se la prima pubblicazione è entro l'11) |
| 11 | 🟠 | Testo prudente: «Autorizzi ora l'addebito automatico: il primo importo sarà addebitato solo il [data]» (evita «preautorizzato») | Tempi minimi di avviso nelle regole di Stripe e PayPal per le prove gratuite; il promemoria prima di ogni addebito serve per legge? |
| 12 | 🟢 | Tenuta la sezione sui servizi a pagamento futuri nel Recesso | Conferma |

## Altri gruppi
Gruppi 3–8 (punti 13–35): da aggiungere man mano che si chiudono con il titolare.

## Sconticini (PR #195, spenti)
- 🔴 Operazione a premio (D.P.R. 430/2001): il programma rientra? Chi è il promotore, serve cauzione/comunicazione? Finché non risponde, `SCONTICINI_ENABLED=false`.
- 🔴 Responsabilità del premio se il negozio non lo consegna.
- 🟠 Nome «Sconticini» (UIBM/EUIPO non verificati); dati nuovi (saldi, premi, eventi); nome mostrato al negozio («Mario R.»).
