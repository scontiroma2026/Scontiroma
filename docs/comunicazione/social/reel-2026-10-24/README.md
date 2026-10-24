# Reel di 10 secondi per i negozi (24/10/2026)

- File: `reel_10s_negozi.mp4`, 1080×1920, 30 fps, 10 s, senza voce né musica (traccia audio muta).
- Approvato dal titolare il 24/10 («Sì pubblicalo per le 10»); pubblicazione su Instagram e Facebook alle 10:00 del 24/10.
- Scene: «Hai un negozio a Roma?» → due offerte d'esempio con le foto della libreria del sito e la scritta «Scena di esempio», «Un'offerta al mese. Le regole le fai tu.» → tre passi → «Gratuita nella fase di lancio.», WhatsApp 352 247 3526, «Seguici su Instagram e Facebook: Sconti Roma» con i loghi, scontiroma.it/per-i-commercianti.
- Regole rispettate: niente percentuali, prezzi, quartieri o date; niente «18+» o «maggiorenni» sui social (decisione del titolare del 24/10); loghi di terzi solo per i nostri profili.
- Sorgente: `sorgente/modello.html` (animazione a tempo: molla smorzata in entrata, uscite rapide; i segnaposto `__WA__`, `__IG__`, `__FB__` sono i glifi di `frontend/src/lib/socialGlyphs.js`) e `sorgente/gira.js` (Playwright: 300 fotogrammi, poi ffmpeg).
- Font Manrope (licenza in `frontend/public/fonts/`); foto dalla libreria `frontend/public/esempi/` (licenza Unsplash).
