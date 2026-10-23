# Video tutorial per i clienti: copione

Durata: **59,3 s**. Formati: verticale 1080x1920 (reel e storie), quadrato 1080x1080 (feed), versione leggera per WhatsApp (720x1280), miniatura PNG.
Audio: solo la voce lunga già registrata (`voce_66s.mp3`, 66,6 s), **non rigenerata**, nessun credito ElevenLabs (né sintesi né trascrizione). Voce montata 58,24 s, portata a **-16 LUFS** (misura sul video: -16,2 LUFS, picco -4,4 dBTP). **Nessuna musica.**

## Tagli della voce (tempi sulla voce originale)
Nessun modello di trascrizione si è potuto scaricare (Hugging Face e gli altri host dei modelli sono bloccati dalla rete di lavoro): i tagli sono stati trovati con il rilevamento dei silenzi di ffmpeg (`render/silenzi.py`), il conteggio delle sillabe tra le pause e l'inviluppo dell'energia (`render/inviluppo.py`). Dissolvenze di 30 ms; tutte e tre le giunzioni cadono nel silenzio (circa -50 dB).

| # | Tolto | Da | A | Come |
|---|---|---|---|---|
| 1 | «Sconti Roma è la piattaforma che raccoglie le migliori offerte dei negozi di Roma.» (frase intera) | 4,41 | 9,41 | Tra due pause nette. Il solo «migliori» non ha pause attorno: tagliarlo avrebbe lasciato un salto, quindi (come previsto) via tutta la frase. |
| 2 | «Seleziona il tuo quartiere» | 25,12 | 26,74 | Da metà pausa dopo «zona.» alla chiusura della «p» di «per» (sei chiusure t-k-t-p-k-p riconosciute in «tuo quartiere per scoprire»). **Da ascoltare**: è l'unico taglio dentro una frase. |
| 3 | «Scarica Sconti Roma,» | 61,08 | 62,81 | Tra due pause nette. |

## Voce montata e sottotitoli
| Da | A | Sottotitolo | Immagine |
|---|---|---|---|
| 0,00 | 1,91 | Cerchi sconti vicino a te? | Apertura: logo e grande scritta; in basso «Seguici su Instagram e Facebook: Sconti Roma» con i glifi |
| 1,91 | 4,41 | Scopri come funziona Sconti Roma! | (apertura) |
| 4,41 | 6,35 | Usarla è semplicissimo. | Home del sito |
| 6,35 | 8,95 | Ecco come iniziare in 3 passaggi… | Elenco dei tre passi |
| 8,95 | 11,54 | 1. Crea l'account. | Passo 1: modulo di registrazione vuoto |
| 11,54 | 17,66 | Registra il tuo profilo con i tuoi dati: nome, email e password. | Modulo compilato con dati di prova |
| 17,66 | 20,12 | 2. Scegli la tua zona. | Passo 2: elenco offerte, evidenziato il filtro «Tutte le zone» (nessun nome di zona) |
| 20,12 | 22,97 | Per scoprire subito le promozioni intorno a te. | Evidenziato «Usa la mia posizione» |
| 22,97 | 26,34 | Ogni negozio propone un'offerta esclusiva al mese. | Scorrimento delle offerte (negozi finti) |
| 26,34 | 29,64 | Grazie ai badge «Nuova offerta» e «Nuovo su Sconti Roma» | Evidenziati i due distintivi |
| 29,64 | 33,80 | non ti perderai mai le ultime novità. | |
| 33,80 | 36,92 | 3. Usa lo sconto in negozio: | Passo 3: pagina dell'offerta |
| 36,92 | 41,40 | all'interno di ogni offerta trovi tutti i dettagli, la validità | Scorrimento ai dettagli e alla validità |
| 41,40 | 45,52 | e i contatti diretti del negozio (telefono e WhatsApp). | Evidenziati «Chiama per prenotare» e «Scrivi su WhatsApp» |
| 45,52 | 50,33 | Quando decidi di acquistare, ti basta toccare «Mostra QR Code»: | Evidenziato «Mostra QR Code» |
| 50,33 | 54,46 | il negoziante lo scansionerà per attivare subito il tuo risparmio. | Finestra «Il tuo codice sconto» (QR di prova **sfocato**) |
| 54,46 | fine | Scegli la tua zona e inizia a esplorare le offerte vicino a casa! | Finale: logo, QR verso `https://scontiroma.it/?fonte=video-tutorial` (verificato), «scontiroma.it», «Gratuita nella fase di lancio», «18+», «Contattaci su WhatsApp: [numero]», «Seguici su Instagram e Facebook: Sconti Roma» con i glifi |

I numeri «1.», «2.», «3.» nei sottotitoli stanno per le brevi parole della voce prima di ogni passo (0,3 s ciascuna): non è stato possibile capire senza ascolto se dice «Uno» o «Primo».
Scritte fisse durante le riprese: «Sconti Roma», «Gratuita nella fase di lancio» e «18+» in alto; numero e nome del passo sopra il telefono.

## Cosa non c'è
Nessun volto, nessun nome di quartiere (zone nascoste, filtro mostrato su «Tutte le zone»), nessuna percentuale né prezzo (nascosti nelle schede e nella pagina dell'offerta), nessun dato di persone reali (negozi «… dell'Esempio», email `@example.com`/`esempio.it`, telefono `06 0000000`).
Glifi di WhatsApp, Instagram e Facebook disegnati semplici (bianchi; la «f» nel blu ufficiale), come per il video di attesa: la skill `comunicazione-marchio` dice ancora «niente loghi di marchi di terzi».
Il numero WhatsApp **non è nel repository** (repository pubblico): si passa al rendering con `CONTATTO_WHATSAPP`.
