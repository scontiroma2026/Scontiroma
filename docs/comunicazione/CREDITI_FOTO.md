# Crediti e controlli delle foto del sito

Le foto della home sono copiate sul nostro sito (cartella `frontend/public/foto/`): il browser dei visitatori non contatta più Unsplash, quindi Unsplash non riceve il loro indirizzo IP. Un test (`e2e/tests/locale/31-foto-home-locali.spec.js`) fallisce se ricompare un'immagine esterna.

## Foto della home

| Uso | File (versioni) | Origine | Autore | Licenza |
|---|---|---|---|---|
| Sfondo in alto (Colosseo all'alba) | `roma-colosseo-640/1280/1920.webp` | Unsplash, foto `1552832230-c0197dd311b5` | **da verificare** (pagina unsplash.com non raggiungibile da qui) | Licenza Unsplash (da verificare sul sito) |
| Riquadro «Roma, quartiere per quartiere» (Piazza San Pietro dall'alto, ritagliata 4:5) | `roma-piazza-480/640.webp` | Unsplash, foto `1531572753322-ad063cecc140` | **da verificare** | Licenza Unsplash (da verificare sul sito) |

Lavorazione: scaricate da images.unsplash.com in alta qualità, ridimensionate (Colosseo 640/1280/1920 px di larghezza, piazza 480x600 e 640x800), convertite in WebP (qualità 68-72), senza metadati. Peso totale delle versioni caricate da un telefono: circa 65 KB (Colosseo 1280) + 106 KB (piazza 640).

Nota: nel codice la seconda foto era commentata «Trevi», ma ritrae Piazza San Pietro dall'alto (verificato guardando l'immagine).

## Controllo dei limiti della Licenza Unsplash

Testo ufficiale su unsplash.com/license e unsplash.com/terms: **da verificare** (sito non raggiungibile dall'ambiente di lavoro, 14/10). Dalla conoscenza generale la licenza permette uso gratuito, anche commerciale, senza attribuzione obbligatoria, ma NON dà diritti su marchi, loghi, persone riconoscibili e opere protette presenti nella foto, e vieta di rivendere le foto così come sono.

Controllo visivo (14/10), sulle foto ingrandite:

| Foto | Volti riconoscibili | Loghi / insegne leggibili | Opere d'arte protette |
|---|---|---|---|
| Colosseo | No | No (solo una targa epigrafica storica e cartelli piccoli illeggibili; un'auto lontana) | No (monumento antico) |
| Piazza San Pietro | No (persone minuscole, viste dall'alto) | No | Statue e colonnato storici, molto antichi |

Esito: nessun elemento che la licenza Unsplash escluda. **Da decidere col consulente**: per i monumenti italiani (Colosseo, Vaticano) la normativa sui beni culturali può richiedere autorizzazione per usi commerciali delle immagini; il Colosseo è un bene statale, San Pietro è in Città del Vaticano. Se il consulente lo ritiene un rischio, alternative: foto scattate da noi, immagini generate, o scorci di quartieri senza monumenti riconoscibili.

## Foto di esempio per le offerte (cartella `esempi/`)

Vedi `frontend/public/esempi/LICENZA.txt` (già copiate sul sito, nome file = identificativo Unsplash). Controllo volti/marchi fatto il 15/10 sulle miniature: tolte 104 foto (40 con volti o marchi, 2 in entrambe le liste, più 64 dubbie, per scelta del titolare). Autori: **da verificare**.

## Altro servizio di terzi rimasto

I riquadri della mappa usano OpenStreetMap (`tile.openstreetmap.org`) solo come ripiego quando manca il file `roma.pmtiles` del sito: regola a parte, vedi `docs/` sulle mappe.
