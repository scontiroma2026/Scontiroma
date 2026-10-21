# Variabili d'ambiente di Sconti Roma

Ultimo controllo: 14/10 (prova generale), letto dal codice (`backend/server.py`, `backend/email_service.py`, `backend/paypal_service.py`, `render.yaml`, `frontend`).
**Questo file contiene solo nomi e valori consigliati. Mai valori segreti**: password, chiavi e ID di recupero si scrivono solo su Render → servizio → Environment.

Legenda: 🔒 = segreto (solo su Render, mai in chat, PR o file) · ⚙️ = non segreto · «Senza» = cosa succede se manca.

## 1. Server (Render, servizio `scontiroma-api-xqib`)

### Indirizzi e sicurezza

| Nome | Tipo | Valore consigliato | Senza |
|---|---|---|---|
| `JWT_SECRET` | 🔒 | stringa casuale lunga (Render la genera: `generateValue`) | **il server non parte** |
| `MONGO_URL` | 🔒 | stringa di Atlas (`mongodb+srv://…`) | il server non parte |
| `DB_NAME` | ⚙️ | `scontiroma` | `render.yaml` lo imposta |
| `APP_URL` / `FRONTEND_URL` | ⚙️ | `https://scontiroma.it` | link nelle email e nei QR sbagliati |
| `CORS_ORIGINS` | ⚙️ | `https://scontiroma.it,https://www.scontiroma.it` (spazi e barra finale vengono ignorati) | solo `http://localhost:3000`: il sito vero non riesce a parlare col server |
| `CSRF_ORIGIN_MODE` | ⚙️ | `enforce` (già in `render.yaml`) | `log`: gli attacchi da altri siti vengono solo scritti nel log, non bloccati |
| `WEBAUTHN_RP_ID` | ⚙️ | `scontiroma.it` | Face ID non funziona |
| `WEBAUTHN_ORIGIN` | ⚙️ | `https://scontiroma.it` | Face ID non funziona |
| `WEBAUTHN_RP_NAME` | ⚙️ | `Sconti Roma` (già in `render.yaml`) | `Sconti Roma` |

### Amministratore

| Nome | Tipo | Valore consigliato | Senza |
|---|---|---|---|
| `ADMIN_EMAIL` | ⚙️ | email dell'admin | nessun admin |
| `ADMIN_PASSWORD` | 🔒 | password lunga, unica | nessun admin |
| `ADMIN_MASTER_PASSWORD` | 🔒 | seconda password, diversa dalla prima | schede sensibili dell'admin bloccate |
| `ADMIN_RECOVERY_ID` | 🔒 | ID di recupero della password master | recupero non disponibile |
| `ADMIN_NOTIFY_EMAIL` | ⚙️ | casella che il titolare legge (per ora la Gmail personale; poi `info@`) | avvisi «nuovo negozio», «offerta da approvare» e **riepilogo del lunedì** non partono |

### Email (Resend)

| Nome | Tipo | Valore consigliato | Senza |
|---|---|---|---|
| `RESEND_API_KEY` | 🔒 | chiave Resend con permesso «solo invio» | **nessuna email parte** (nei log appare `[email:mock]`): niente conferma email dei clienti, niente reset password |
| `SENDER_EMAIL` | ⚙️ | indirizzo del dominio verificato | `onboarding@resend.dev`: Resend consegna solo al proprietario dell'account |
| `REPLY_TO_EMAIL` | ⚙️ | `info@` del dominio (impostato il 13/10; la casella deve esistere: lista di lancio punto 3) | le risposte dei clienti vanno al mittente tecnico |
| `EMAIL_ALLOWED_RECIPIENTS` | ⚙️ | **NON impostarla in produzione** | se impostata, le email vanno solo agli indirizzi elencati: nessun cliente riceverebbe nulla |

### Interruttori di lancio (valori per il 19/10: vedi `PROVA_GENERALE.md`)

| Nome | Tipo | Valore oggi | Valore al lancio | Senza |
|---|---|---|---|---|
| `PRELAUNCH_MODE` | ⚙️ | `true` solo se il titolare decide la campagna dal 19/10 | `false` il giorno del lancio | `false` |
| `CLIENT_EMAIL_CONFIRMATION_REQUIRED` | ⚙️ | `true` | `true` | **`true`** (acceso anche se la variabile manca) |
| `SCONTICINI_ENABLED` | ⚙️ | `false` finché il regolamento non è chiuso e il titolare non dice di accendere | `true` solo dopo l'OK | **`false`** (spento: nessun conteggio, nessun dato, pagine nascoste) |
| `SCONTICINI_PREMIO_GIORNI` | ⚙️ | `60` | `60` | `60` |
| `CLIENT_SUBSCRIPTION_REQUIRED` | ⚙️ | `false` (già in `render.yaml`) | `false` | `false` |
| `MERCHANT_PAYMENT_REQUIRED` | ⚙️ | `false` | `false` fino alla conferma esplicita del titolare | `false` |
| `TRIAL_END_DATE` | ⚙️ | **vuota** (nessuna data per ora) | vuota | nessun banner di fine prova |

### Lista d'attesa e limiti anti-abuso (i valori predefiniti vanno bene: non impostarli)

| Nome | Predefinito | A cosa serve |
|---|---|---|
| `WAITLIST_DAILY_CAP` | `80` | massimo di email «siamo online» al giorno (le altre il giorno dopo); `0` = nessun tetto, **non usarlo** |
| `WAITLIST_LOTTO` | `20` | email per lotto |
| `WAITLIST_PAUSA_MESSAGGIO_SEC` / `WAITLIST_PAUSA_LOTTO_SEC` | `0.6` / `3.0` | pause tra un'email e l'altra, per non far arrabbiare il fornitore |
| `WAITLIST_MAX_PER_CLIENT_10MIN` / `_ORA` | `3` / `5` | iscrizioni alla lista dallo stesso dispositivo |
| `REGISTRAZIONI_MAX_PER_FINESTRA` / `REGISTRAZIONI_FINESTRA_SEC` | `10` / `600` | registrazioni dallo stesso dispositivo (`0` = spento) |
| `RESET_MAX_PER_CLIENT_10MIN` / `_ORA` | `3` / `5` | richieste di reset password dallo stesso dispositivo |
| `CONFERMA_MAX_PER_CLIENT_10MIN` / `_ORA` | `3` / `5` | «Rimanda l'email» di conferma dallo stesso dispositivo |

Su Render questi **non** devono essere a `0`: lo `0` è usato solo nei test.

### Servizi esterni

| Nome | Tipo | Valore consigliato | Senza |
|---|---|---|---|
| `LOCATIONIQ_API_KEY` | 🔒 | chiave del piano gratuito (già impostata, 13/10) | si usa Nominatim, più lento e con limiti |
| `GEMINI_API_KEY` | 🔒 | **vuota fino al lancio** (decisione del titolare); poi chiave con tetto 5 €/mese | «Migliora foto» risponde con un messaggio chiaro (503), la foto resta com'è |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 🔒 | **vuote** finché i pagamenti sono spenti; poi prima solo chiavi `sk_test_` sul sito di prova | pagamenti Stripe non disponibili (voluto) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_ID` | 🔒 | **vuote**; poi solo sandbox | PayPal non disponibile (voluto) |
| `PAYPAL_MODE` | ⚙️ | `sandbox` (già in `render.yaml`) finché i pagamenti sono spenti | `sandbox` |
| `MERCHANT_PRICE_CENTS` | ⚙️ | `499` (4,99 € + IVA; è anche il predefinito) | `499` |
| `MERCHANT_VAT_PERCENT` | ⚙️ | `22` (da confermare col commercialista) | `22` |

### Impostate da Render

`PORT` (Render), `PYTHON_VERSION=3.11.15` (in `render.yaml`), `RENDER_GIT_COMMIT` (Render, usata dal controllo della versione).

## 2. Sito (Render, servizio `scontiroma-web-xqib`, compilato al momento della pubblicazione)

| Nome | Tipo | Valore consigliato | Senza |
|---|---|---|---|
| `REACT_APP_BACKEND_URL` | ⚙️ | `https://api.scontiroma.it` | il sito non trova il server |
| `REACT_APP_MAP_PMTILES_URL` | ⚙️ | indirizzo del file `roma.pmtiles` (guida `docs/guide/MAPPE.md`) | mappa con la soluzione di ripiego |
| `REACT_APP_VERSION` | ⚙️ | `$RENDER_GIT_COMMIT` (nel comando di compilazione) | il controllo della versione non conosce il commit |
| `NODE_VERSION` | ⚙️ | `22` | già in `render.yaml` |

Le variabili del sito si leggono **a compilazione**: cambiarle richiede una nuova pubblicazione del sito.

## 3. Test (mai su Render)

`TEST_MONGO_URL` (solo `mongomock://…` o `localhost`), `E2E_API_URL`, `E2E_WEB_URL`, `E2E_PYTHON`, `E2E_LOG`. I test rifiutano database non locali.

## 4. Controlli fatti il 14/10

- `render.yaml` non contiene valori segreti (test `backend/tests/test_prova_generale.py`).
- Tutte le variabili lette dal codice sono nell'elenco qui sopra (controllato con una ricerca nel codice).
- **Non elencate in `render.yaml`** (si impostano a mano nel pannello di Render): `PRELAUNCH_MODE`, `CLIENT_EMAIL_CONFIRMATION_REQUIRED`, `MERCHANT_PAYMENT_REQUIRED`, `REPLY_TO_EMAIL`, `TRIAL_END_DATE`, `PAYPAL_PLAN_ID`. Non le abbiamo aggiunte al file per non sovrascrivere i valori già messi nel pannello alla prossima sincronizzazione.
- `render.yaml` chiama i servizi `scontiroma-api` / `scontiroma-web`, quelli veri hanno il suffisso `-xqib`: il file è una ricetta di partenza, non lo specchio esatto di ciò che gira. Le nuove intestazioni di sicurezza del sito valgono solo dopo una sincronizzazione del file o inserendole a mano in Render → sito → Headers.
