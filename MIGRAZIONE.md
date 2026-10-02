# Migrazione da Emergent a Render + MongoDB Atlas

Guida passo passo per staccare Sconti Roma da Emergent.
L'app è in demo e non ha utenti veri: **non si copia nessun dato**, il nuovo database parte vuoto.

Alla fine avrai:

| Cosa | Dove | Indirizzo |
|---|---|---|
| Sito | Render (sito statico, gratuito) | `https://scontiroma.it` |
| Server | Render (Web Service: **Free** in demo, **Starter** al lancio) | `https://api.scontiroma.it` |
| Database | MongoDB Atlas (piano gratuito M0) | — |
| Dominio | Aruba (resta dov'è) | — |

> **In demo costa 0 €**: server, sito e database sono tutti su piani gratuiti.
> Al lancio si passa ai piani a pagamento (vedi *Checklist del lancio* in fondo). I prezzi sono indicativi: controllali su render.com e mongodb.com.

---

## Fase 1 — Codice pronto ✅

Già fatto su GitHub: tolte le parti di Emergent, aggiunto `render.yaml` (la "ricetta" che Render legge per creare sito e server), aggiornata la Privacy Policy.
La Pull Request va **unita su `main`** prima della Fase 3.

---

## Fase 2 — Database su MongoDB Atlas (circa 10 minuti)

1. Vai su **mongodb.com/atlas** → *Try Free* → registrati.
2. Crea un cluster **M0 (Free)**, provider **AWS**, regione **Frankfurt (eu-central-1)**. Nome: `scontiroma`.
3. **Database Access** → *Add New Database User*:
   - utente: `scontiroma-app`
   - password: genera quella automatica e **salvala** (password manager).
   - permessi: *Read and write to any database*.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   Serve perché Render non ha un indirizzo IP fisso sul piano Starter. La protezione resta la password dell'utente.
5. **Database** → *Connect* → *Drivers* → copia la stringa che inizia con `mongodb+srv://…`.
   Sostituisci `<password>` con la password del punto 3. Questa è la tua **`MONGO_URL`**.

---

## Fase 3 — Sito e server su Render (circa 20 minuti)

1. Vai su **render.com** → registrati **con GitHub** (così vede il repository).
2. *New* → **Blueprint** → scegli il repository `scontiroma2026/Scontiroma`, branch `main`.
3. Render legge `render.yaml` e propone due servizi: `scontiroma-api` e `scontiroma-web`.
   Ti chiede i valori mancanti. Compilali così (le chiavi le hai già nelle impostazioni di Emergent):

### Server `scontiroma-api`

| Variabile | Valore |
|---|---|
| `MONGO_URL` | la stringa della Fase 2 |
| `APP_URL` | `https://scontiroma.it` |
| `FRONTEND_URL` | `https://scontiroma.it` |
| `CORS_ORIGINS` | `https://scontiroma.it,https://www.scontiroma.it` |
| `WEBAUTHN_RP_ID` | `scontiroma.it` |
| `WEBAUTHN_ORIGIN` | `https://scontiroma.it` |
| `STRIPE_SECRET_KEY` | come su Emergent (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | **nuovo**, lo prendi nella Fase 5 (per ora scrivi `da-impostare`) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | come su Emergent |
| `PAYPAL_WEBHOOK_ID` | **nuovo**, lo prendi nella Fase 5 (per ora `da-impostare`) |
| `RESEND_API_KEY`, `SENDER_EMAIL` | come su Emergent |
| `ADMIN_EMAIL`, `ADMIN_NOTIFY_EMAIL` | come su Emergent |
| `ADMIN_PASSWORD`, `ADMIN_MASTER_PASSWORD`, `ADMIN_RECOVERY_ID` | **nuovi**, lunghi e casuali (non quelli di Emergent) |
| `GEMINI_API_KEY` | la chiave di Google AI Studio |

`JWT_SECRET`, `DB_NAME`, `PAYPAL_MODE` e gli altri li imposta Render da solo.
Gli account demo non sono più nel server (esistono solo nei test locali, `e2e/seed_demo.py`).

### Sito `scontiroma-web`

| Variabile | Valore |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://api.scontiroma.it` |

4. Conferma con *Apply*. La prima volta ci vogliono 5–10 minuti.
5. Controllo: apri l'indirizzo `https://scontiroma-api.onrender.com/api/` → deve comparire `"status":"ok"`.

---

## Fase 4 — Collegare il dominio su Aruba (circa 15 minuti + attesa)

1. In Render, servizio **`scontiroma-web`** → *Settings* → *Custom Domains* → aggiungi `scontiroma.it` e `www.scontiroma.it`.
2. Servizio **`scontiroma-api`** → *Settings* → *Custom Domains* → aggiungi `api.scontiroma.it`.
3. Render mostra, per ognuno, **quale record DNS creare** (tipo e valore). Tienili aperti.
4. Su **Aruba**: Area clienti → *Domini* → `scontiroma.it` → **Gestione DNS**. Aggiungi i record indicati da Render:
   - `scontiroma.it` → record **A** con l'IP indicato da Render
   - `www` → record **CNAME** verso l'indirizzo indicato da Render
   - `api` → record **CNAME** verso l'indirizzo indicato da Render
5. ⚠️ **Non toccare** questi record, servono per le email:
   - i record **MX** di `scontiroma.it` (le caselle email Aruba)
   - `resend._domainkey` (TXT), `send` (MX) e `send` (TXT): sono quelli di **Resend**, già verificati
6. Attendi da pochi minuti a qualche ora. Quando in Render compare *Verified* e il lucchetto, il sito risponde su `https://scontiroma.it`.

> Prova l'app sul telefono **dopo** questo passo. Sugli indirizzi provvisori `…onrender.com` Safari su iPhone blocca i cookie tra sito e server e il login non funziona. Con `scontiroma.it` + `api.scontiroma.it` funziona.

---

## Fase 5 — Notifiche di pagamento (circa 10 minuti)

Stripe e PayPal avvisano il server quando qualcuno paga, rinnova o annulla. Oggi avvisano Emergent: vanno puntati al nuovo server.

### Stripe (modalità Test)
1. dashboard.stripe.com → *Developers* → **Webhooks** → *Add endpoint*.
2. URL: `https://api.scontiroma.it/api/stripe/webhook`
3. Eventi: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`.
4. Copia il **Signing secret** (`whsec_…`) → in Render mettilo in `STRIPE_WEBHOOK_SECRET`.

### PayPal (Sandbox)
1. developer.paypal.com → *Apps & Credentials* → la tua app → **Webhooks** → *Add Webhook*.
2. URL: `https://api.scontiroma.it/api/paypal/webhook`
3. Eventi: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.DENIED`, `PAYMENT.CAPTURE.COMPLETED`.
4. Copia il **Webhook ID** → in Render mettilo in `PAYPAL_WEBHOOK_ID`.
   Senza questo valore il server rifiuta tutte le notifiche PayPal (è una protezione voluta).

Dopo aver salvato le variabili, Render riavvia il server da solo.

---

## Fase 6 — Prova completa

- [ ] `https://scontiroma.it` si apre, con foto e mappe
- [ ] Registrazione di un cliente di prova + email di "password dimenticata" ricevuta
- [ ] Abbonamento con carta di test Stripe `4242 4242 4242 4242` (qualsiasi data futura e CVC)
- [ ] Abbonamento con un conto PayPal sandbox
- [ ] Registrazione di un commerciante, caricamento offerta, approvazione da admin
- [ ] Generazione QR dal cliente e scansione dal commerciante
- [ ] "Migliora foto" con Gemini
- [ ] Area admin: sblocco con la nuova master password, **salva il Recovery ID**

---

## Fase 7 — Spegnere Emergent

Dopo qualche giorno senza problemi: chiudi/archivia il progetto su Emergent e revoca la `EMERGENT_LLM_KEY`.

---

## Anteprima delle modifiche future

In Render, servizio `scontiroma-web` → *Settings* → **Pull Request Previews** → attiva.
Da quel momento ogni Pull Request su GitHub riceve un link di anteprima del sito da aprire sul telefono prima di unirla.

Limite: l'anteprima mostra la **grafica e i testi** nuovi, ma per sicurezza il server accetta chiamate solo da `scontiroma.it`, quindi nell'anteprima login e dati non funzionano. Per provare anche quelli ti mando le schermate come ora.

---

## Checklist del lancio (quando arrivano i clienti veri)

Obiettivo: stare tranquilli su affidabilità, dati, pagamenti ed email. Costo indicativo al lancio: circa 90–110 €/mese.

### Servizi a pagamento
- [ ] **Render → `scontiroma-api` → Settings → Instance Type → Starter** (~7 $/mese). Server sempre acceso: i promemoria automatici non saltano più e la prima visita non aspetta.
- [ ] **MongoDB Atlas → passa a M10** (~57 $/mese) con **backup continui** attivi: se qualcosa va storto si recuperano i dati fino al minuto.
- [ ] **Resend → piano Pro** (~20 $/mese): il piano gratuito si ferma a 100 email al giorno, e l'email mensile agli abbonati lo supera.
- [ ] **Google Cloud → budget e avviso di spesa** sul progetto della chiave Gemini.

### Pagamenti veri
- [ ] **Stripe**: attiva l'account (dati aziendali e IBAN), passa alla modalità **Live**, crea un nuovo webhook Live (stesso indirizzo ed eventi della Fase 5) e aggiorna in Render `STRIPE_SECRET_KEY` (`sk_live_…`) e `STRIPE_WEBHOOK_SECRET`.
- [ ] **PayPal**: crea l'app **Live**, il webhook Live e aggiorna `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID` e `PAYPAL_MODE=live`.
- [ ] Un abbonamento vero da 2,99 € fatto da te, poi disdetto, per verificare tutto il giro.

### Sicurezza
- [ ] In Render imposta `CSRF_ORIGIN_MODE=enforce`, dopo aver controllato nei log di qualche giorno che non compaiano righe `[csrf] Origin non riconosciuto` per richieste legittime.
- [ ] Password admin e master password nuove e lunghe, Recovery ID salvato in un password manager.
- [ ] Autenticazione a due fattori attiva su GitHub, Render, MongoDB Atlas, Stripe, PayPal, Resend, Google e Aruba.

### Email
- [ ] Su Aruba aggiungi un record **TXT** `_dmarc` con valore `v=DMARC1; p=none; rua=mailto:info@scontiroma.it`: migliora la consegna delle email (meno spam) ed è richiesto da Gmail per chi invia molte email.

### Controllo
- [ ] Monitor gratuito (es. UptimeRobot) su `https://api.scontiroma.it/api/` ogni 5 minuti, con avviso via email se il server non risponde.
- [ ] Render → *Notifications*: avviso via email se un deploy fallisce.
