# Sconti Roma v13 – differenze rispetto alla v12

Stessa durata (84 s), stessi tempi delle scene, stessa musica e stessa voce (Fernando Martínez, copione del 03/10). Cambiano le riprese dell'app e alcune frasi sui sottotitoli.

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
| «Decide di farlo al cinquanta per cento il mercoledì e il venerdì,» | «Decide di **scontarlo** il mercoledì e venerdì,» |
| Scheda esempio con il distintivo «−50%» | Distintivo «Offerta» |
| «Nessun vincolo: mantieni lo sconto fino a fine mese,» | «**Mantieni lo sconto** fino a fine mese,» |
| Scheda dei costi: «Nessun vincolo.» e «Disdici quando vuoi.» | «Decidi tu.» e nessuna seconda riga (la frase sul vincolo è una decisione aperta) |

Nelle riprese l'app calcola da sola la percentuale di sconto (distintivi «−50%», «50% di sconto»): nel video quei distintivi sono nascosti (`riprese/ctx.js`). Prezzi, «Risparmi €20.00» e il resto della pagina sono quelli veri.

## Voce e musica: cosa va rifatto
La musica e la voce sono quelle della v9 e non sono state toccate. Con i testi nuovi **tre punti della voce non corrispondono più ai sottotitoli**:

1. **9,8–13,4 s** – la voce dice «Stiamo partendo adesso da Garbatella, San Paolo e Marconi». Da registrare: «Stiamo partendo adesso a Roma e dintorni» (la frase nuova è più corta: i tempi delle scene 2 e 3 restano gli stessi se si lascia una breve pausa, oppure si sposta di poco l'ancora 11,5 s in `render/timeline.json`).
2. **35,8–39,0 s** – la voce dice «Decide di farlo al cinquanta per cento il mercoledì e il venerdì». Da registrare: «Decide di scontarlo il mercoledì e il venerdì».
3. **64,7–67,7 s** – la voce dice «Nessun vincolo: mantieni lo sconto fino a fine mese». Da registrare: «Mantieni lo sconto fino a fine mese».

Le altre frasi (4,99 € al mese, prezzo bloccato, 30 giorni, nessun addebito senza conferma, fase di lancio) non cambiano.

## File
- Riprese: `riprese/` (`avvia_server_v13.py`, `seed_v13.py`, `ctx.js`, `rec_iscrizione_form.js`, `rec_schermate_qr.js`, `sconti.js`, `estrai_fotogrammi.sh`)
- Scena e testi: `render/scene.html` (`FORM_SEG`, `CONF_SEG`, `REG_SEG`), `render/captions.json`
- Montaggio ed esportazione: `render/render_tutto.sh`, `monta.sh` → `export/` (non nel repository)
- Schermate piccole e fotogrammi di anteprima: `schermate/`
