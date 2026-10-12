# 02 - Cookie Policy e testo del banner (art. 122 Codice privacy, Linee guida Garante 10/06/2021)

> **[PROPOSTA] [DA VALIDARE]** - Bozza per il consulente. Non è pubblicata. La pagina `CookiePolicy.jsx` e il banner NON sono stati toccati.
> Allineata al codice del 12/10/2026.

Ultimo aggiornamento: **[DA COMPLETARE]**

## 1. Cosa sono
Cookie e strumenti simili (memoria del browser, `localStorage` e `sessionStorage`) sono piccoli dati salvati sul tuo telefono o computer.

## 2. Strumenti tecnici (necessari: non serve consenso)
| Nome | Dove | Cosa fa | Durata |
|---|---|---|---|
| `access_token` | cookie, `HttpOnly`, `Secure` | Ti tiene collegato dopo l'accesso | 1 giorno |
| `refresh_token` | cookie, `HttpOnly`, `Secure` | Rinnova l'accesso senza chiedere di nuovo la password | 7 giorni |
| `admin_master_token` | cookie, `HttpOnly`, `Secure` (solo amministratore) | Seconda password dell'area amministrazione | 60 minuti |
| `sr_cookie_consent` | memoria del browser | Ricorda la scelta fatta nel banner | 6 mesi, poi il banner torna |
| `last_email`, `last_role` | memoria del browser | Precompila la pagina di accesso con l'ultima email usata (solo sul tuo dispositivo) | Finché non esci o cancelli i dati del browser [DA VALIDARE: durata massima] |
| `sr_codice_negozio_v1` | memoria del browser (solo personale del negozio) | Il telefono del dipendente «ricorda» il codice del negozio: attestato firmato, senza dati personali | Massimo 90 giorni, scelta del dipendente |
| `sr_bozza_v*` | memoria del browser | Bozza dell'offerta non ancora inviata | Finché non la invii o la cancelli |
| `sr_da_fare_non_adesso_v1`, `app_feedback_dismissed_v1`, `pwa_install_dismissed_at`, `sr_interesse_zona` | memoria del browser | Ricordano gli avvisi che hai chiuso o la zona per cui hai già votato | Finché non cancelli i dati del browser |
| `sr_opened` | memoria della sessione | Evita di ripetere una schermata nella stessa visita | Chiusura del browser |

## 3. Strumenti che richiedono attenzione [DA VALIDARE: qualificazione tecnica o no]
| Nome | Cosa fa | Durata | Proposta |
|---|---|---|---|
| `referral_merchant_id`, `referral_captured_at`, `fonte_iscrizione`, `fonte_iscrizione_at` | Ricordano da quale negozio (QR / link) sei arrivato, per attribuire l'iscrizione | 30 giorni | **Opzione A:** trattarli come tecnici, spiegandolo (finalità nostra, non richiesta dall'utente: rischio). **Opzione B (consigliata):** chiedere il consenso «funzionale» oppure salvarli solo fino all'iscrizione |
| `app_feedback_secondi_v1` | Conta il tempo d'uso per sapere quando chiedere le stelle | Finché non cancelli i dati | Come sopra: consenso «funzionale» oppure eliminare |

## 4. Strumenti con il tuo consenso (funzionali / statistiche)
| Nome | Cosa fa | Durata |
|---|---|---|
| `sr_vid` | Codice casuale, non legato all'account, per contare le visite (pagine viste, giorno). Nessuno strumento di terzi | 13 mesi [DA VALIDARE] |

Se rifiuti, `sr_vid` viene cancellato e non conteggiamo la visita.

## 5. Servizi di terze parti
- **Mappa:** Protomaps / OpenStreetMap. Se il nostro file di mappa non è disponibile, il browser scarica le immagini da `tile.openstreetmap.org` (OpenStreetMap Foundation, Regno Unito): vede il tuo IP. Non è subordinato al consenso perché necessario per mostrare la mappa richiesta. [DA VALIDARE]
- **Google Maps:** solo se premi «Portami qui»: esci dalla nostra app.
- **Caratteri (font):** ospitati da noi. Nessuna richiesta a Google Fonts.
- **Stripe / PayPal:** oggi non attivi, non caricano nulla.
- **Nessun cookie di marketing o profilazione. Nessuno strumento di analisi di terzi (Google Analytics, Meta Pixel, ecc.).**

## 6. Il tuo consenso: come lo registriamo e come lo cambi
- Al primo accesso vedi il banner con **tre pulsanti di pari rilievo: «Rifiuta», «Personalizza», «Accetta tutti»**. La X in alto equivale a «Rifiuta». Nessuna casella è già spuntata. Scorrere la pagina non vale consenso.
- Salviamo la prova della tua scelta: scelta, data, indirizzo IP e tipo di browser. Base giuridica: obbligo di dimostrare il consenso (art. 7.1 GDPR). Durata: **[DA VALIDARE: 24 mesi]** (oggi non applicata dal codice) o fino alla cancellazione dell'account.
- Puoi cambiare idea sempre dal link **«Gestisci cookie»** in fondo alla pagina. Il banner torna dopo 6 mesi.

## 7. Come cancellarli dal browser
Impostazioni del browser > Privacy > Cancella dati di navigazione. Cancellando i dati dovrai accedere di nuovo.

## 8. Contatti
privacy@scontiroma.it - Titolare: Euro Linea S.r.l.s. (dati nel doc. 08).

---
# Testo proposto per il banner

**Titolo:** Usiamo solo ciò che serve
**Testo breve:** Usiamo strumenti necessari al funzionamento dell'app. Con il tuo consenso contiamo anche le visite in modo anonimo, per migliorare il servizio. Nessuna pubblicità, nessun tracciamento di terzi. [Cookie Policy] [Privacy]
**Pulsanti (stesso colore, stessa dimensione, stesso peso):** `Rifiuta` · `Personalizza` · `Accetta tutti`
**Finestra «Personalizza»:**
- Necessari: sempre attivi (non disattivabili).
- Statistiche anonime (funzionali): disattivato di default.
- ~~Marketing~~: **da togliere** finché non esiste (oggi il banner la mostra e «Accetta tutti» la mette a `true`, in contrasto con la policy).
- Pulsante «Salva le mie scelte».

### Controlli tecnici da fare a vista da iPhone (checklist per Claude/titolare)
1. «Rifiuta» ha lo stesso aspetto di «Accetta tutti».
2. La X chiude e vale rifiuto.
3. Nessun tasto è già attivo in «Personalizza».
4. Dopo «Rifiuta» non compare `sr_vid` in memoria.
5. «Gestisci cookie» riapre il banner.
