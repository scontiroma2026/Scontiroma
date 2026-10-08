# Sconti Roma v13 – differenze rispetto alla v12

Stessa durata (84 s), stessi tempi delle scene, stessa musica e stessa voce (Fernando Martínez, copione del 03/10) con tre frasi rifatte. Cambiano le riprese dell'app e alcune frasi.

## Riprese rifatte con l'app nuova di `main` (08/10)
App locale con database in memoria (`e2e/server_e2e.py`), dati inventati («… dell'Esempio», email `@example.com`), nessun dato reale, nessun segreto, nessun accesso alla produzione.

| Ripresa | Cosa si vede ora |
|---|---|
| `home_full.png` | Home chiara: «Roma è tutta tua.», «Scopri quanto puoi risparmiare nel tuo quartiere.», «Roma e dintorni» |
| `sconti_full.png` | Catalogo chiaro con le quattro offerte d'esempio (zone nuove: Monteverde, Appio, Portuense, Garbatella) |
| `offerta_full.png` | Pagina dell'offerta «Menù di pesce» nel tema chiaro, pulsanti Chiama e WhatsApp |
| `dashboard_full.png` | Dashboard del commerciante (area «D · Bianco vivo», scheda «Da fare») |
| `clip_iscrizione.mp4` | Iscrizione del commerciante: nome referente, email, password, attività, indirizzo, zona (16 gruppi, es. «Garbatella · Ostiense, San Paolo»), le due caselle dei Termini |
| `clip_form_offerta.mp4` | Modulo offerta nell'area commerciante: titolo, prezzi 40 → 20, «1 volta», invio e «Offerta inviata!» |
| `clip_qr_cliente.mp4` | Il QR del cliente con il codice che cambia ogni 20 secondi |
| `clip_qr_conferma.mp4` | Al banco: «Codice valido» → codice del negozio a 4 cifre → «SCONTO VALIDO» (nome breve «Giulia E.») |

Nuovo rispetto alla v12: la conferma passa dal codice del negozio (PR #54), quindi la scena 6 mostra un passaggio in più, accelerato per restare nei 3,3 s della scena.

## Frasi cambiate (sottotitoli e scritte sullo schermo)
| Prima | Ora |
|---|---|
| «Stiamo partendo adesso da / Garbatella, San Paolo e Marconi,» | «Stiamo partendo adesso a / **Roma e dintorni,**» |
| «Decide di farlo al cinquanta per cento il mercoledì e il venerdì,» | «Decide di **scontarlo** / il mercoledì e il venerdì,» |
| Scheda esempio con il distintivo «−50%» | Distintivo «Offerta» |
| «Nessun vincolo: mantieni lo sconto fino a fine mese,» | «**Mantieni lo sconto** fino a fine mese,» |
| Scheda dei costi: «Nessun vincolo.» e «Disdici quando vuoi.» | «Decidi tu.» e nessuna seconda riga (la frase sul vincolo è una decisione aperta) |

Nelle riprese l'app calcola da sola la percentuale di sconto (distintivi «−50%», «50% di sconto»): nel video quei distintivi sono nascosti (`riprese/ctx.js`). Prezzi, «Risparmi €20.00» e il resto della pagina sono quelli veri.

## Voce e musica: voce rifatta in tre punti (08/10)
La musica è quella della v9. La voce è quella della v9 (Fernando Martínez) con **tre frasi sostituite** da quelle nuove scelte dal titolare (ElevenLabs, stessa voce). Durata totale invariata (83,6 s), tutte le altre frasi identiche campione per campione.

| Punto | Prima | Ora | File usato |
|---|---|---|---|
| 9,83–12,21 s | «Stiamo partendo adesso da Garbatella, San Paolo e Marconi,» | «Stiamo partendo adesso a Roma e dintorni,» | `1A.mp3` |
| 35,78–38,21 s | «Decide di farlo al cinquanta per cento il mercoledì e il venerdì,» | «Decide di scontarlo il mercoledì e il venerdì,» | `2B.mp3` |
| 64,73–66,62 s | «Nessun vincolo: mantieni lo sconto fino a fine mese,» | «Mantieni lo sconto fino a fine mese,» | `3B.mp3` |

Come è fatto (`riprese/voce_v13.py`, poi `riprese/mix_v13.py` con lo stesso mix della v9: musica con ducking, -16 LUFS):
- l'inizio di ogni frase nuova coincide con l'inizio del sottotitolo; il resto della finestra della frase vecchia è silenzio (le frasi nuove sono più corte);
- volume dei nuovi pezzi portato a quello delle frasi vicine (differenza sotto 1 dB sul parlato, guadagno applicato da -3,5 a -4,3 dB);
- dissolvenze di 25 ms; i bordi cadono nelle pause tra le frasi, salto massimo tra due campioni sui bordi 0,0005;
- dopo la frase corta resta una pausa un po' più lunga del naturale (circa 1,1 s dopo «dintorni»), riempita dal silenzio e dalla musica;
- sottotitoli riallineati alle parole nuove: «Roma e dintorni,» compare a 11,35 s, «il mercoledì e il venerdì,» a 37,5 s.

I file `1A.mp3`, `2B.mp3`, `3B.mp3` e le tracce `stems/*.wav` non sono nel repository (cartella `stems/` nel progetto locale; `voce.wav` nuova e `mix.wav`).

Le altre frasi (4,99 € al mese, prezzo bloccato, 30 giorni, nessun addebito senza conferma, fase di lancio) non cambiano.

## File
- Riprese: `riprese/` (`avvia_server_v13.py`, `seed_v13.py`, `ctx.js`, `rec_iscrizione_form.js`, `rec_schermate_qr.js`, `sconti.js`, `estrai_fotogrammi.sh`)
- Voce: `riprese/voce_v13.py`, `riprese/mix_v13.py`
- Scena e testi: `render/scene.html` (`FORM_SEG`, `CONF_SEG`, `REG_SEG`), `render/captions.json`
- Montaggio ed esportazione: `render/render_tutto.sh`, `monta.sh` → `export/` (non nel repository)
- Schermate piccole e fotogrammi di anteprima: `schermate/`
