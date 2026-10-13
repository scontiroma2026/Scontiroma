# Sconti Roma v14: differenze rispetto alla v13 e perché

La v14 è un video **muto** (nessuna voce, nessuna musica), rifatto da zero con l'app di `main` del 13/10. Riprese su server locale con database in memoria (`e2e/server_e2e.py`, `MONGO_URL=mongomock://localhost`), dati inventati, nessun accesso alla produzione, nessun segreto.

## Cosa è cambiato nell'app dopo la v13 (da `git log` e `git diff` di `main`)
| Novità nell'app | Dove si vede nel video |
|---|---|
| Home «I negozi che ami, a prezzo scontato… In tutta Roma e dintorni» (#117) | Scena 2 |
| Titoli in Fraunces con forme classiche, senza «wonky» (#115) | Titoli dentro le schermate dell'app; le grafiche del video usano invece Manrope (scelta del titolare del 13/10) |
| Badge «Nuovo su Sconti Roma» (7 giorni) e «Nuova offerta» (48 ore, teal) (#90 e seguenti) | Scena 3 e pagina dell'offerta (scena 5) |
| Partita IVA all'iscrizione dei commercianti, 11 cifre validate (#93) | Scena 4b (nuova) |
| Offerta in revisione: «Attende approvazione dell'amministratore» | Scena 4a |
| Area commerciante rifatta, codice del negozio a 4 cifre e QR personale | Scena 6b e scena 8 (nuova) |
| «Attiva il pagamento» (+ IVA, Carta/PayPal, Disdici), prezzo 4,99 € + IVA, promemoria a 10 e 3 giorni | Solo **a parole e nella scheda dei costi** (scena 7): la schermata vera **non** è ripresa, perché il suo riepilogo è una proposta ancora da far vedere al consulente e compare solo con i pagamenti accesi |
| Riquadro Pre-lancio (Approva tutte) in admin, scheda admin «Clienti» | Non ripresi: sono funzioni interne dell'admin, non per i commercianti |
| «Segnala questa offerta» e reclami dei commercianti (DSA/P2B) | Non ripresi: il pulsante «Segnala questa offerta» è nella pagina dell'offerta ma fuori dall'inquadratura; nessun testo legale nel video |

## Cosa cambia nel video
| Punto | v13 | v14 | Perché |
|---|---|---|---|
| Stile | Sfondi fotografici, telefono 3D, grana, etichette | Fondo chiaro unico, finestra semplice, un solo accento, solo sottotitoli e scheda costi | Decisione del titolare: più pulito |
| Prezzo | «4,99 € al mese, IVA inclusa, prezzo bloccato…» | «Abbonamento mensile semplice: 4,99 € al mese + IVA», nessuna scadenza precisa, nessuno sconto percentuale | Decisione del titolare 13/10 (deroga a «niente prezzi») |
| «Prezzo bloccato», «30 giorni prima», «non paghi nulla senza la tua conferma» | Presenti | Tolti | Decisioni 13/10 |
| Prova | «Durante la fase di lancio, niente» | «Gratuita nella fase di lancio, circa due mesi di prova dalla prima offerta» | Mai «60 giorni» |
| Disdetta | «Poi decidi tu se rinnovarlo» | «La disdetta vale dalla fine del mese: fino a quel giorno mantieni lo sconto» | Decisione 13/10 |
| Zone | Zona scelta e 16 aree visibili nel modulo | Nessun quartiere nominato: i negozi d'esempio sono in zone fuori dalle tre «pilota», il menu della zona non si inquadra e si compila fuori campo | Niente zone pilota nel video |
| Iscrizione | Scena finale, con la zona | Scena 4b, con la Partita IVA, ferma al tocco su «Crea account» (niente pagina Face ID) | Partita IVA nell'app |
| Al banco | QR scansionato | QR scansionato oppure codice a 4 cifre | Codice del negozio |
| QR del negozio | Assente | Scena 8 | Novità dell'app |
| «Funziona così:», «Tutto qui.», «Quello che ci guadagni è visibilità…», «Per iscriverti bastano pochi minuti.» | Presenti | Tolte | Domanda 6 «lascia fuori» |
| Scene sospese | – | Nessuna (il segnaposto del testo del titolare è stato tolto il 13/10) | Decisione del titolare |
| 18+ e firma | Assenti | Riga finale «Per maggiorenni (18+) · Roma e dintorni · Sconti Roma» | `comunicazione-marchio` |
| Durata | 84 s | 76,5 s (voce Fernando) e 84,2 s (voce Enea) | I testi nuovi (prezzo e disdetta) allungano la scena 7 di circa 8 s |
| Voce e musica | Voce ElevenLabs e musica | **Nessuna** (audio silenzioso) | Serve il permesso del titolare per i crediti |

## Come sono state fatte le riprese
- Server di prova con quattro negozi inventati e un cliente (`riprese/seed_v14.py`). Una rotta **solo per le riprese** (`avvia_server_v14.py`, esiste solo nel database in memoria) sposta indietro la data di un negozio e di un'offerta per mostrare i due badge diversi.
- «Migliora foto con IA» spento (come in produzione prima del lancio) e badge di percentuale nascosti (`riprese/ctx.js`).
- Il link del QR del negozio mostra `scontiroma.it` al posto dell'indirizzo locale.
- Il messaggio «Offerta inviata!» dura mezzo secondo nella ripresa rallentata: nel montaggio il fotogramma è tenuto fermo 1,5 s.
- Ogni fotogramma delle scene è stato guardato a occhio nel montaggio (fogli di anteprima).

## Dubbi da sciogliere
1. «Negozi di quartiere» (scena 2) e «nel tuo quartiere» nel testo della home dell'app: sono espressioni generiche, non zone pilota; lasciate. Da togliere?
2. Durata: 76,5 s e 84,2 s, in linea con gli 80 s richiesti.
3. Schermata «Attiva il pagamento» vera nel video? Non inclusa per prudenza (testi in attesa del consulente).

## Aggiornamento 13/10 (mattina): due versioni con voce
| Punto | Prima | Ora |
|---|---|---|
| Voce | Nessuna | Due versioni: Fernando Martínez (76,5 s) ed Enea (84,2 s), tracce generate dal titolare, normalizzate a circa -16 LUFS, nessuna musica |
| Esempio | Trattoria, 40 € → 20 € | Ristorante, 50 € → 30 € |
| Titoli e scheda costi | Fraunces | Manrope (Modello A) |
| Scena del titolare | Segnaposto da 4,5 s | Tolta |
| Tempi | Stima a caratteri | Pause rilevate nell'audio (`allinea.py`), ricalcolate per ogni voce |
| Riprese | Server su porte 8001/3000 | Porte proprie 8011/3010 (le altre erano occupate da un altro lavoro); rifatte tutte le clip |
