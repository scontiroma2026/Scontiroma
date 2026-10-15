# Sconti Roma, video per i commercianti: COPIONE v17 (come la v16, con foto reali negli esempi e guida spostata)

Stato: **montato, non pubblicabile** finché i Termini (#116) non sono validati dal consulente (prezzo, prova gratuita e percentuali nel video).
Base: la v16 (`../progetto_v16_commercianti/`). Tutto il resto è uguale: stessa voce femminile finale (84,3 s, intera e nello stesso ordine), stessa musica del video dell'8 ottobre, stessi sottotitoli, stessa grafica. Due modifiche chieste dal titolare:
1. **Foto reali negli esempi.** Le due offerte d'esempio non usano più illustrazioni di fantasia ma foto della libreria del sito (`frontend/public/esempi/<id>.jpg`, 800x450, ripulita da volti e marchi il 15/10):
   - «Menù di carne» (ristorante): `1611171711791-b34fa42e9fc2`, categoria «Ristoranti», bistecca alla griglia con verdure;
   - «Bottiglia di vino rosso» (enoteca): `1506377247377-2a5b3b417ebb`, categoria «Ristoranti», calice di vino rosso davanti a un vigneto.
   Controllate a vista a 800x450: nessun volto riconoscibile, nessun marchio o scritta leggibile (il calice e il piatto sono senza etichette). Le foto compaiono ovunque: elenco sconti, pagina dell'offerta, scheda «Esempio», modulo dell'offerta (anteprima della copertina), dashboard.
2. **La guida va dopo «Al banco».** La scena «Segui la guida per iscriverti» (pagina intera della guida #146, zoom sui passi 1, 2 e 3, solo musica) passa da dopo l'enoteca a subito prima di «Costi». La voce si ferma nella pausa naturale fra «…il codice a quattro cifre del tuo negozio.» e «E quanto costa?» (silenzio della voce 58,58-59,09 s, taglio a 58,83 s) e riprende dopo 13 s.
Audio: voce con 13 s di silenzio inseriti a 58,83 s + musica continua (un pezzo di musica già sentita si ripete durante la guida, con dissolvenze incrociate di 0,3 s), ducking sotto la voce, -16 LUFS, picco -2 dBTP. Provenienza e licenza della musica: da verificare prima di ogni uso pubblico (come per le altre musiche della campagna).
Durata: **98,1 s** (voce 84,3 s + guida 13 s + coda 0,8 s), uguale alla v16.

## Scene e tempi (secondi)
| Scena | Tempo | Cosa si vede |
|---|---|---|
| 1 Titolo | 0,0-5,5 | Foto di strada, «Hai un'attività a Roma?», «Nuovi clienti nel tuo negozio.» |
| 2 Cos'è | 5,5-15,2 | Logo, poi home reale dell'app, scorrimento lento |
| 3 Elenco sconti | 15,2-18,7 | Catalogo reale con l'enoteca e il ristorante d'esempio (foto reali) |
| 4 Modulo e iscrizione | 18,7-31,2 | Ripresa reale: «Menù di carne», 50 → 30, utilizzi, invio (con la foto reale nella copertina); poi iscrizione con Partita IVA |
| 5 Ristorante | 31,2-43,5 | Pagina reale dell'offerta + scheda «Esempio»: Menù di carne, €50 → €30, **−40%**, martedì e giovedì; in chiusura la dashboard del ristorante |
| 5b Enoteca | 43,5-51,5 | Pagina reale dell'offerta (bottiglia di vino rosso) + scheda: €30 → €15, **−50%**, stessi criteri, giacenza; in chiusura la dashboard dell'enoteca |
| 6 Al banco | 51,5-58,8 | QR del cliente, poi codice del negozio a 4 cifre e «Sconto valido»; il telefono esce in dissolvenza negli ultimi 0,5 s |
| Guida | 58,8-71,8 | «Segui la guida per iscriverti»: pagina intera della guida (#146), zoom sui passi 1, 2 e 3 con pause di lettura; solo musica |
| 7 Costi | 71,8-92,2 | «Gratuita nella fase di lancio», circa due mesi di prova, abbonamento mensile semplice 4,99 € + IVA, una volta sola (carta o PayPal), nessuna sorpresa, «La disdetta vale dalla fine del mese… mantieni lo sconto» |
| 9 Chiusura | 92,2-98,1 | Logo, «Scrivici a info@scontiroma.it», «e ti aiutiamo a partire.», 18+ |

## Dati dell'app (finti)
Database di prova in memoria (mai produzione): «Osteria dell'Esempio» (ristorante, Menù di carne 50 → 30 €, martedì e giovedì), «Enoteca dell'Esempio» (Bottiglia di vino rosso 30 → 15 €), più tre negozi d'esempio (le loro immagini restano di fantasia come nella v16). Le immagini delle due offerte vengono dal sito locale (`/esempi/<id>.jpg`, copia della libreria di `main`). Nomi dei quartieri nascosti nelle riprese; nella dashboard è coperta la data di scadenza dell'offerta.

## Regole
Nessun marchio di terzi, «Roma e dintorni», 18+, nessun quartiere, nessuna data di lancio, «gratuita nella fase di lancio», «circa due mesi di prova». **Le percentuali (−40% e −50%) sono una decisione esplicita del titolare solo per questo video.** La disdetta in scritta segue la voce.
