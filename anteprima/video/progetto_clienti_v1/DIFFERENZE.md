# Video clienti v1: cosa è riusato da v14 e dalla bozza esistente

Il video è **muto**, fatto con l'app di `main` del 13/10 su server locale con database in memoria (`e2e/server_e2e.py` con `MONGO_URL=mongomock://localhost`), dati inventati, nessun accesso alla produzione, nessun segreto.

## Riusato dal video commercianti v14 (ramo `claude/video-v14`, PR #120)
| Cosa | Dove |
|---|---|
| Strumento di ripresa a piena risoluzione (screenshot in sequenza con animazioni rallentate) | `riprese/recorder.js` (copia identica) |
| Server di prova con la rotta solo-riprese per i due badge («Nuovo su Sconti Roma», «Nuova offerta») | `riprese/avvia_server.py` (copia, solo i nomi) |
| Contesto iPhone: solo localhost, cookie e avvisi tolti, «Migliora foto con IA» spento, percentuali nascoste | `riprese/ctx.js` (copia, più la neutralizzazione delle etichette delle zone) |
| Clip del QR del cliente e del banco (codice a 4 cifre, «SCONTO VALIDO») | `riprese/rec_clip.js` (stesso metodo, nuove offerte) |
| Montaggio: finestra arrotondata con ombra, sottotitoli con dissolvenza, ritaglio e velocità delle clip, audio silenzioso, anteprima leggera | `montaggio/monta.py` (aggiunta solo l'opzione `vmin` per rallentare una clip fino a 0,85x) |
| Stile: fondo chiaro `#F2F0EB`, un solo accento fucsia, parole chiave in fucsia nei sottotitoli, chiusura con 18+ e «Roma e dintorni» | `montaggio/grafica.js` |
| Stima dei tempi a 15,7 caratteri al secondo | `montaggio/copione.json` |

## Cosa cambia rispetto a v14
| Punto | v14 (commercianti) | Clienti v1 | Perché |
|---|---|---|---|
| Titoli del video | Fraunces | **Manrope** (anche nel logo) | Al titolare non piacciono la «s» e la «f» di Fraunces; scelta definitiva ancora aperta |
| Pubblico e contenuto | Come pubblicare un'offerta, costi 4,99 € + IVA | Come registrarsi, come funziona, vantaggi, «per ora è gratuita» | Richiesta |
| Costi | Scheda con prezzo, prova, disdetta | Scheda con tre voci, **nessun prezzo di abbonamento** | Regole `comunicazione-marchio` |
| Negozi d'esempio | Zone Cassia, Monte Mario, Aurelio, Tiburtino visibili sulle schede | Zona «Altra zona di Roma e dintorni» (valore ammesso dal server): sulle schede non compare **nessun quartiere** | «Mai quartieri o zone pilota» |
| Menu della zona | Non inquadrato | Inquadrato, ma con l'etichetta **neutra «La tua zona»** al posto dei nomi delle 16 aree (solo nelle riprese) | La scelta della zona è centrale per i clienti, ma i nomi delle aree sono quartieri |
| Foto dei negozi | Foto di lavoro non versionate | Foto della libreria di esempio già nel sito (`frontend/public/esempi`, licenza Unsplash, senza marchi) | Le foto di v14 non sono nel repository |
| Foto della home | Foto locali di fantasia | Foto locali di fantasia (una via con tavolini, un mercato): l'app vera usa due foto di Roma da internet, non raggiungibili offline | Riprese senza rete |
| «Informative legali» nella pagina dell'offerta | Fuori inquadratura | Nascosto nelle riprese | Niente testi legali a schermo |

## Cosa è riusato dalla bozza `claude/bozza-video-clienti`
La bozza (`docs/comunicazione/bozze_non_in_pr/CLIENTI_VIDEO_bozza.md`) ha quattro copioni brevi da 18-25 s (tre «zona pilota» e uno generico). Riusato:
- l'impianto del copione generico («Roma e dintorni»): scegli la zona, offerta del mese, QR al banco, cuore dei preferiti, scheda «Stiamo arrivando nella tua zona» con «Fammi sapere quando arrivate» (senza promettere avvisi: il voto è anonimo);
- le regole: 18+ in chiusura, nessuna percentuale, nessun negozio reale, nessun nome di persona, sottotitoli sempre presenti;
- il tono semplice e la formula «gratuita nella fase di lancio».

Lasciato fuori perché non coerente con le regole di oggi:
- i tre video **Garbatella, San Paolo, Marconi**: nessun quartiere né zona pilota nei materiali pubblici;
- «Gratis nella fase di lancio» (scritta così in chiusura): ora «gratuita nella fase di lancio» / «per ora è gratuita»;
- riprese dal vivo, negozi con permesso scritto, mappa e «Usa la mia posizione», «Condividi con un amico»: non servono a un video unico di registrazione e vantaggi; si possono aggiungere in una versione più lunga.

## Cosa NON è nel video (perché l'app non lo fa, o per prudenza)
- **Scelta della zona durante la registrazione dei clienti**: oggi il modulo del cliente non la chiede (nome, cognome, email, password, 18+ e Termini). La zona si sceglie nell'elenco delle offerte (scena 4). Il video segue il percorso vero.
- Mappa e «Usa la mia posizione», «Condividi con un amico», «Aperto ora» (serve che il negozio scriva gli orari), classifica «I più richiesti», stelle: presenti nell'app ma fuori dal copione per stare nei 60-75 secondi.
- Percentuali di sconto: nascoste (l'app le mostra, per esempio «-50%»).
- Casella facoltativa delle comunicazioni promozionali: non spuntata e non commentata.

## Dubbi da sciogliere
1. Etichetta neutra «La tua zona» nel menu: va bene o si preferisce mostrare il nome vero di un'area?
2. Scena 3: dura 10 s, di cui 2 sul Face ID facoltativo (è il percorso vero dopo «Crea account»). Si può togliere la frase «Il Face ID è facoltativo.» e accorciare di circa 2 s.
3. L'app dice ancora «Sconti a Roma» nella pagina dell'elenco e «Roma è tutta tua» in home: sono testi dell'app, non del video.
