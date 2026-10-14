# Volantini e materiali: cosa serve prima e dopo il lancio

**Bozza. Niente è stampato né diffuso.** Regole di tutti i materiali (da `comunicazione-marchio` e `CLIENTI_LOCANDINA_E_POST.md`): firma «Sconti Roma» senza nomi; colori e font dell'app; nessun marchio di terzi; nessuna percentuale o prezzo; «gratuita nella fase di lancio»; «Roma e dintorni»; 18+; QR sempre verso il sito con `?fonte=` (`^[a-z0-9-]{1,40}$`), nero su bianco senza scritte sopra, provato da due telefoni diversi prima di stampare in serie; font con licenza libera.

## 1. Cosa esiste già (da riusare)
| Materiale | Dove | Note |
|---|---|---|
| **Locandina A4/A5 per i negozi aderenti**, 10 stili grafici (PNG 1588×2246) | `docs/comunicazione/locandine/png/` e `locandina.html` (generatore, `render.js`) | Testo: «Qui trovi un'offerta con Sconti Roma», 3 passi, QR personale del negozio (≥ 8×8 cm). Per questa campagna (tono neutro) si usano solo `app-chiara` (base, poco inchiostro) e, se serve un tono più giocoso, `mattoncini`. Gli altri stili stagionali non si usano |
| Testi pronti: locandina A4/A5/versione corta, post per gruppi, didascalie, «Stiamo arrivando» per zona | `docs/comunicazione/CLIENTI_LOCANDINA_E_POST.md` | Riga «Gratuita per i clienti nella fase di lancio» ancora **da far vedere al consulente** |
| Messaggi ai negozi (SMS/WhatsApp, Instagram/Facebook, email, post per gruppi, telefonata) | `docs/comunicazione/MESSAGGI_COMMERCIANTI.md`, `COPIONE_TELEFONATA.md` | Versione di questa campagna in `CONTENUTI_SOCIAL.md` §9 |
| Profili, 12 post, calendario, gruppi, risposte, punti per il consulente | PR #103, ramo `claude/social`, `docs/comunicazione/social/` | Ripresi e adattati al pre-lancio |
| Immagine del post «Ci siamo!» | PR #119, ramo `claude/social-immagini`, `docs/comunicazione/social/immagini/post-c1-ci-siamo.jpg` | Già usata per la prova di pubblicazione; riusabile per il post di lancio (§4) |
| Video per i commercianti v14 (scelta della voce) | PR #120 | Dire se nomina prezzo o prova: in tal caso **[TERMINI: bloccato fino a validazione]** |
| Video per i clienti (muto, serve la voce) | PR #121 | Niente crediti: voce di una persona vera registrata con l'iPhone, solo con l'OK del titolare |
| Guida per i negozi e sito | in lavorazione fino al 18/10 | — |

## 2. Prima del lancio (19/10 – 30/10)
| # | Materiale | Per chi | Da fare | Quantità proposta* | Semaforo | Chi |
|---|---|---|---|---|---|---|
| M1 | **Immagine P1 «Stiamo arrivando»** (1080×1080) | Clienti | Nuova, stile #119 | 1 + 2 varianti per il test | [LISTA] | Claude |
| M2 | **Carosello P3 «Come funziona»** (5 immagini) | Clienti | Nuovo, schermate di prova «esempio» | 5 | [LISTA] | Claude |
| M3 | **Storie S1–S5** (1080×1920) | Clienti | Nuove | ~15 schermate | [LISTA] (S5 dal lancio) | Claude |
| M4 | **Video V1–V6** + file dei sottotitoli. Ordine: V4 solo mani, V1, poi gli altri | Clienti (V2 anche negozi) | Vedi `COPIONI_VIDEO.md` | 6 | vedi copioni | Titolare (riprese), Claude (montaggio) |
| M5 | **Cartolina «Stiamo arrivando»** per clienti, A6 (testo in §3) | Clienti | Nuova, QR verso `?fonte=volantino-clienti` | 50–100 | [LISTA] | Claude (grafica), titolare (stampa) |
| M6 | **Cartolina «Hai un negozio?»**, A6 (testo in §3) | Negozi | Nuova, QR verso `?fonte=volantino-negozi` | 30–50 | Senza prezzo né prova: [OK-TITOLARE]. Con prova/prezzo: [TERMINI] | Claude, titolare |
| M7 | **Adesivo/cartoncino da banco «Stiamo arrivando»** per i negozi aderenti | Clienti nei negozi | Opzionale, A6 con QR lista | 1 per negozio aderente | [LISTA] + [PERMESSO] | Claude, titolare |
| M8 | **Locandine A4 dei negozi aderenti** (già esistenti) | Clienti | **Stampare ora, esporre dal giorno del lancio** | 1–2 per negozio | [DAL LANCIO] | Titolare (stampa e consegna), Claude (generatore) |
| M9 | **Liberatoria e permesso del luogo** (bozze in `COPIONI_VIDEO.md` §9) | Persone riprese, luoghi | Far vedere al consulente prima dell'uso | 5–10 copie | [LIBERATORIA] | Titolare, consulente |
| M10 | **Elenco privato dei «no» e dei permessi gruppi** (fuori dal repository) | Interno | Foglio privato | 1 | — | Titolare |
| M11 | **Tabella dei contatti ai negozi** (esiti ammessi di `COPIONE_TELEFONATA.md`) | Interno | Foglio privato, solo nomi di negozi | 1 | — | Titolare |
| M12 | **Immagine profilo e copertina** (se serve aggiornare) | Tutti | Aggiornare bio e copertina con «Stiamo arrivando» | 2 | [OK-TITOLARE] | Claude |

\*Le quantità sono suggerimenti di partenza, non dati: dipendono da cosa il titolare riesce a distribuire e dal budget di stampa (da decidere).

**Attenzione a M8:** le locandine esistenti dicono «Guarda l'offerta del mese». Se esposte prima del lancio, il cliente inquadra il QR e non trova l'offerta (pubblicità ingannevole e delusione). Quindi: si stampano e si consegnano al negozio quando serve, ma **si espongono solo dal giorno in cui l'offerta è visibile nell'app**. Se il lancio slitta, i negozi tengono la locandina nel cassetto.

**Tono neutro (decisione del titolare, 14/10):** nessun tema stagionale. Se il lancio slitta di una settimana non cambia nulla nei materiali.

## 3. Testi delle due cartoline (nuove)
### M5 – Cartolina clienti (A6 verticale)
- **Titolo:** Stiamo arrivando
- **Sottotitolo:** Le offerte dei negozi vicino a te, in un'app.
- **3 punti:** 1) Scegli la tua zona. 2) Guarda l'offerta del mese. 3) Mostra il QR al banco.
- **Invito:** «Inquadra il QR e lascia la tua email: ti avvisiamo noi quando parte.»
- **QR:** almeno 3×3 cm su fondo bianco, margine ampio.
- **Piè di pagina:** «Sconti Roma · Roma e dintorni · Gratuita nella fase di lancio · Solo per maggiorenni (18+)»
- **Versione senza lista (CTA B):** invito «Cercaci su Instagram e Facebook come Sconti Roma.»
- **[da far vedere al consulente]** la riga «Gratuita nella fase di lancio» (come per la locandina A4) e l'uso dell'email.

### M6 – Cartolina negozi (A6 verticale)
- **Titolo:** Hai un negozio?
- **Testo:** Pubblica la tua offerta del mese su Sconti Roma. I clienti vicino a te la trovano nell'app e mostrano un QR alla cassa: tu lo inquadri col telefono.
- **Seconda riga:** La registrazione è gratuita nella fase di lancio. L'offerta resta in attesa e parte con il lancio.
- **Contatto:** info@scontiroma.it (indirizzo pubblico dell'attività) e QR verso il sito.
- **Piè di pagina:** «Se non ti interessa, nessun problema. Sconti Roma · Roma e dintorni»
- **Con prova/prezzo [TERMINI: bloccato fino a validazione]:** aggiungere «periodo di prova di circa due mesi» **solo dopo** la validazione.

## 4. Dopo il lancio (da 31/10 in poi)
| # | Materiale | Per chi | Quando | Note |
|---|---|---|---|---|
| D1 | **Post di lancio e storie S5** | Clienti | giorno del lancio | Riuso dell'immagine #119 o nuova senza data |
| D2 | **Locandina del negozio esposta** (M8) | Clienti | dal lancio | QR personale del negozio |
| D3 | **Adesivo da vetrina «Qui trovi un'offerta con Sconti Roma»** (versione corta della locandina) | Passanti | dal lancio | Un'opzione economica per chi non vuole la locandina grande |
| D4 | **Cartolina clienti aggiornata** («Ci siamo! Scegli la zona e guarda le offerte», sempre senza prezzi) | Clienti | dopo il lancio | Sostituisce M5 (che dice «Stiamo arrivando»): buttare le vecchie |
| D5 | **Immagine «Nuove offerte del mese»** (1° del mese) | Clienti | ogni 1° | Solo con offerte reali, visibili, con permesso del negozio |
| D6 | **Post «Il negozio del mese»** (solo con permesso scritto) | Clienti | quando c'è un permesso | Senza percentuali; testo dell'offerta uguale a quello approvato |
| D7 | **Video V3 e V2** | Clienti e negozi | dal lancio / dopo validazione | Vedi copioni |
| D8 | **Cartolina negozi aggiornata** | Negozi | dopo la validazione dei Termini | Aggiunge prova e condizioni solo dopo OK del consulente |
| D9 | **Rapporto di fine settimana** | Titolare | ogni domenica | Visite per `?fonte=`, lista, negozi, commenti da seguire. Solo numeri aggregati |

## 5. Distribuzione dei materiali stampati
- **Cartoline e volantini**: a mano, uno alla volta, nei negozi che accettano e dove c'è il permesso; **mai** sui parabrezza, nelle cassette della posta senza permesso, né affissi dove è vietato. Verificare le regole comunali su affissione e distribuzione (se serve un'autorizzazione, la richiede il titolare).
- **Locandine**: solo nei negozi aderenti che le hanno chieste.
- **Nessun materiale** con foto o nome di persone senza liberatoria e nessun nome di negozio senza permesso.
- **Tracciamento**: ogni tipo di materiale ha il suo `?fonte=` nel QR (`volantino-clienti`, `volantino-negozi`, `locandina-negozio`); nessun dato personale.

## 6. Cosa serve da te
1. Dire quali materiali stampare e quanti (budget).
2. (Deciso) tono neutro, solo `app-chiara` e `mattoncini`.
3. Approvare i testi delle due cartoline (M5, M6).
4. Far vedere al consulente: cartolina clienti, riga «Gratuita nella fase di lancio», liberatoria.
