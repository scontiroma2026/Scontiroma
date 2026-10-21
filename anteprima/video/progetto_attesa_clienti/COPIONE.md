# Video di attesa per i clienti: copione

Durata: **15,5 s** (correzione del titolare del 21/10: tolta la frase «Niente da scaricare per ora:» tagliando la voce esistente tra 6,58 e 8,04 s, al centro di due pause, con dissolvenze di 30 ms; voce montata 14,97 s, nessuna rigenerazione, nessun credito ElevenLabs). Formati: verticale 1080x1920 (reel e storie), quadrato 1080x1080 (feed), versione leggera per WhatsApp (720x1280), miniatura PNG.
Audio: solo la voce registrata dal titolare (ElevenLabs, già approvata, non rigenerata), portata a **-16 LUFS** (misura sul video: -16,2 LUFS, picco -4,5 dBTP). **Nessuna musica**: quella dei video v16/v17 ha la licenza ancora «da verificare».

## Voce (testo esatto) e sottotitoli
I tempi sono sulla voce montata. I tagli dei sottotitoli sono sulle pause trovate con il rilevamento dei silenzi di ffmpeg (`render/silenzi.py`, soglia -30 dB, 0,07 s); nessuna trascrizione a pagamento.

| Da | A | Sottotitolo |
|---|---|---|
| 0,00 | 1,87 | Stai cercando sconti vicino a te? |
| 1,87 | 3,35 | Sta arrivando Sconti Roma: |
| 3,35 | 6,58 | l'app che raccoglie le offerte dei negozi di Roma e dintorni. |
| 6,58 | 9,29 | Lasci la tua email e ti avvisiamo noi appena si parte. |
| 9,29 | 11,22 | È gratuita nella fase di lancio, |
| 11,22 | 13,04 | ed è per chi ha almeno diciotto anni. |
| 13,04 | fine | Sconti Roma, stiamo arrivando. |

## Scene
| Scena | Tempo | Immagine |
|---|---|---|
| Gancio | 0-1,9 s | Fondo sfumato fucsia-viola del sito, logo, grande scritta «Stai cercando sconti vicino a te?»; in basso, piccolo, «Seguici su Instagram e Facebook: Sconti Roma» con i glifi |
| Home | 1,9-3,4 s | Telefono con la home del sito (ripresa reale, sito locale) |
| Offerte | 3,4-6,6 s | Elenco delle offerte, scorrimento lento: quattro negozi **finti** («… dell'Esempio»), foto della libreria del sito; prezzi, percentuali e zone **nascosti** |
| Lista d'attesa | 6,6-9,3 s | Home in pre-lancio (acceso solo sul server locale): «Avvisami quando parte», email di prova `tu@esempio.it` e consenso, poi «Quasi fatto!» |
| Finale | 9,3-15,5 s | Logo, «Sconti Roma · stiamo arrivando.», QR verso `https://scontiroma.it/?fonte=video-attesa` (verificato: si legge), «scontiroma.it», etichette «Gratuita nella fase di lancio» e «18+» che si accendono con la voce, poi «Contattaci su WhatsApp: [numero]» e «Seguici su Instagram e Facebook: Sconti Roma» con i glifi |

Scritte fisse: «Sconti Roma» e «18+» in alto per tutto il video. Carattere Manrope (sito, licenza OFL), colori del sito (#D81B72, #6D4AFF, #00798C).

## Cosa non c'è
Nessun volto, nessun nome di quartiere o «zona pilota», nessuna percentuale né prezzo, nessun dato di persone reali (account e negozi finti, email `@example.com`/`esempio.it`).
**Unica eccezione voluta dal titolare (21/10):** i glifi di WhatsApp, Instagram e Facebook nel finale (Instagram e Facebook anche in apertura) (disegnati semplici, bianchi; la «f» nel blu ufficiale). La skill `comunicazione-marchio` dice «niente loghi di marchi di terzi»: va aggiornata se la regola nuova vale per tutti i video.
Il numero WhatsApp **non è nel repository** (repository pubblico): si passa al rendering con `CONTATTO_WHATSAPP`.
