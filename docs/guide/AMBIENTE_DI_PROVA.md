# Ambiente di prova su Render (guida passo passo)

Serve per provare le modifiche dal telefono **prima** di pubblicarle, senza toccare l'app vera.
Non inserire mai chiavi o password in questo file né in chat: si scrivono solo nelle pagine di Render e Atlas.

## Come funziona
- Due servizi nuovi su Render, con indirizzo `...onrender.com` (non `scontiroma.it`): un server di prova e un sito di prova.
- Leggono il ramo **`prova`** del repository, non `main`. Quando c'è una modifica da vedere, io la metto sul ramo `prova` e Render la pubblica da solo; se ti piace, la unisco in `main`.
- Hanno un **database a parte** e **nessuna chiave vera**: email spente (restano solo nel registro del server), niente Stripe, niente PayPal.

## Regola ferma
L'ambiente di prova non deve mai usare il database di produzione né le sue chiavi. Per questo il database di prova ha un **utente suo**, che può scrivere solo nel database di prova.

## Passo 1 — Database di prova (Atlas)
1. Apri MongoDB Atlas, entra nel progetto di Sconti Roma.
2. **Database Access** → **Add New Database User**.
3. Nome utente: `prova`. Password: generane una nuova e salvala (non è quella di produzione).
4. **Database User Privileges** → **Specific Privileges** → ruolo `readWrite` sul database `scontiroma_prova` (scrivilo a mano).
5. Conferma. Poi in **Network Access** controlla che Render possa collegarsi (di solito è già aperto, come per la produzione).
6. In **Database** → **Connect** → **Drivers** copia la stringa di collegamento e sostituisci utente e password con quelli di `prova`. Ti servirà al Passo 2.

## Passo 2 — Server di prova (Render)
1. Render → **New +** → **Web Service** → collega il repository `Scontiroma`.
2. Nome: `scontiroma-prova-api`. Regione: Frankfurt. Piano: **Free**.
3. **Branch**: `prova`. **Root Directory**: `backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. **Health Check Path**: `/api/`
7. In **Environment** aggiungi queste variabili (`ADDRESS-SITO` è l'indirizzo del sito di prova del Passo 3, per esempio `https://scontiroma-prova-web.onrender.com`; Render te lo mostra appena crei il sito, quindi puoi tornare qui dopo):

| Variabile | Valore |
|---|---|
| `PYTHON_VERSION` | `3.11.15` |
| `DB_NAME` | `scontiroma_prova` |
| `MONGO_URL` | la stringa dell'utente `prova` (Passo 1) |
| `JWT_SECRET` | un valore casuale lungo, diverso da quello vero |
| `CSRF_ORIGIN_MODE` | `enforce` |
| `CLIENT_SUBSCRIPTION_REQUIRED` | `false` |
| `FRONTEND_URL` | `ADDRESS-SITO` |
| `APP_URL` | `ADDRESS-SITO` |
| `CORS_ORIGINS` | `ADDRESS-SITO` |
| `WEBAUTHN_RP_ID` | solo il nome del sito, senza `https://` (es. `scontiroma-prova-web.onrender.com`) |
| `WEBAUTHN_ORIGIN` | `ADDRESS-SITO` |
| `WEBAUTHN_RP_NAME` | `Sconti Roma (prova)` |
| `ADMIN_EMAIL` | un indirizzo di prova |
| `ADMIN_PASSWORD` | una password di prova, diversa da quella vera |
| `ADMIN_MASTER_PASSWORD` | una password di prova |
| `ADMIN_RECOVERY_ID` | un valore di prova |

**Da lasciare vuote o non creare:** `RESEND_API_KEY`, `SENDER_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, `GEMINI_API_KEY`. Senza chiave le email finiscono solo nel registro del server (riga `[email:mock]`; per email vere solo a te vedi «Email nell'ambiente di prova») e il pulsante «Migliora foto» risponde con un errore: è voluto.

8. **Create Web Service**. Quando risulta *Live*, apri `ADDRESS-SERVER/api/`: deve rispondere «Sconti Roma API».

## Passo 3 — Sito di prova (Render)
1. Render → **New +** → **Static Site** → stesso repository.
2. Nome: `scontiroma-prova-web`. **Branch**: `prova`. **Root Directory**: `frontend`.
3. **Build Command**: `yarn install --frozen-lockfile && CI=false yarn build`
4. **Publish Directory**: `build`
5. **Environment**: `NODE_VERSION` = `22` e `REACT_APP_BACKEND_URL` = l'indirizzo del server di prova (Passo 2, senza `/api`).
6. **Redirects/Rewrites**: aggiungi una regola *Rewrite*, sorgente `/*`, destinazione `/index.html`.
7. Crea il sito. Poi torna al Passo 2 e metti l'indirizzo del sito nelle variabili `FRONTEND_URL`, `APP_URL`, `CORS_ORIGINS`, `WEBAUTHN_ORIGIN` e `WEBAUTHN_RP_ID`, e salva (il server riparte).

## Passo 4 — Il ramo `prova`
Dimmi quando i due servizi sono pronti: creo il ramo `prova` (copia di `main`) e da lì in poi ci metto le modifiche da vedere. Non devi fare nulla su GitHub.

## Passo 5 — Provare dall'iPhone
1. Apri il sito di prova e registrati con indirizzi di prova (non email vere: non partirà nulla).
2. **Attenzione al login su iPhone:** il sito e il server di prova hanno due indirizzi diversi e Safari, di default, blocca i cookie tra siti diversi. Per la prova vai in **Impostazioni → Safari** e spegni **«Impedisci il tracciamento fra siti»**; finito il test, riaccendilo. (L'app vera non ha questo problema perché usa `scontiroma.it` e `api.scontiroma.it`.)
3. Per entrare come admin usa i valori di prova che hai messo su Render.

## Email nell'ambiente di prova
Due opzioni. Scegli la prima se non ti serve davvero ricevere le email.

**Opzione 1 — nessuna chiave (la più sicura).** Lascia vuote `RESEND_API_KEY` e `SENDER_EMAIL`. Nessuna email parte: finiscono solo nei **Logs** del server di prova (riga `[email:mock]`).

**Opzione 2 — email vere, ma solo a te.**
1. In Resend crea una chiave **dedicata alla prova** (non quella vera) con permesso **«Sending access»**.
2. Su Render, nel servizio di prova, imposta: `RESEND_API_KEY` = la chiave di prova; `SENDER_EMAIL` = un indirizzo del dominio verificato (es. `prova@DOMINIO-VERIFICATO`); `EMAIL_ALLOWED_RECIPIENTS` = i tuoi indirizzi separati da virgole, per esempio `INDIRIZZO-TITOLARE-1@esempio.it,INDIRIZZO-TITOLARE-2@esempio.it`. Si può indicare anche un intero dominio con la `@` davanti (es. `@DOMINIO-TUO`). Maiuscole e spazi non contano.
3. Salva: il server riparte. Con questa variabile impostata l'email parte **solo** verso gli indirizzi elencati; agli altri non parte nulla e nei Logs compare una riga `[email:bloccata-prova]` con solo il dominio (mai l'indirizzo intero) e il motivo. L'utente non vede errori. **Non impostare mai `EMAIL_ALLOWED_RECIPIENTS` in produzione** (lì assente = nessun filtro).
4. Come provare: sul sito di prova registra un account con uno degli indirizzi elencati, poi usa «Password dimenticata» e controlla la posta. Prova anche con un indirizzo non elencato: non deve arrivare nulla e nei Logs deve comparire `[email:bloccata-prova]`.

## Promemoria
- Il piano gratuito si addormenta dopo qualche minuto: la prima apertura può metterci circa un minuto.
- Se un servizio mostra «Failed», non toccare i servizi veri: guarda **Logs** del servizio di prova e mandami lo screenshot.
- Le due copie sospese (`scontiroma-api` e `scontiroma-web`) si possono tenere sospese: non servono a questa guida.
- Il piano gratuito ha ore mensili limitate, condivise tra i servizi gratuiti: se finiscono, i servizi si fermano fino al mese dopo.
