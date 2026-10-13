# 10 - Registro dei trattamenti (art. 30 GDPR) e valutazioni

> **Rischio: 🟠 medio: durate non applicate dal codice, Partita IVA e attribuzione e segnalazioni aggiunte; durate ora nel codice (PR #114), da far confermare; DPIA da confermare.**
> **[PROPOSTA] [DA VALIDARE]** - Documento interno, non pubblico. Compilato dal codice del 12/10/2026. Obbligo: art. 30 (il trattamento non è occasionale). Titolare: Euro Linea S.r.l.s., P.IVA 03240220644, contatto privacy@scontiroma.it. DPO: non designato.

## 1. Registro
| # | Trattamento | Interessati | Dati (collezione nel database) | Base | Destinatari | Extra-UE | Conservazione | Misure |
|---|---|---|---|---|---|---|---|---|
| T1 | Account e accesso | Clienti, commercianti, admin | `users`: email, password cifrata, nome, ruolo, consensi, chiavi Face ID | Contratto | Render, MongoDB, Resend | Sì (USA) | Fino alla cancellazione | HTTPS, bcrypt, cookie HttpOnly |
| T2 | Sicurezza accessi | Chi tenta l'accesso | `login_guard` (impronta dell'email, contatore) | Legittimo interesse | Render, MongoDB | Sì | Scadenza automatica (TTL) | Impronta SHA-256 |
| T3 | Offerte e negozi | Commercianti | `users` (profilo, **Partita IVA**), `discounts`, `next_discounts`, `discounts_archive` | Contratto | Render, MongoDB, LocationIQ, Nominatim | Sì | Fino alla cancellazione (negozi con offerta in corso: dal 1° del mese dopo, fino a un mese) | Approvazione admin manuale |
| T4 | QR e sconti | Clienti, commercianti | `redemptions`, `qr_scans` (anche non valide) | Contratto / legittimo interesse | Commerciante (nome + iniziale) | Sì | **`qr_scans`: 12 mesi; `redemptions` (sconti usati e mai usati): 24 mesi**, cancellazione automatica (PR #114) [DA VALIDARE] | Codice negozio, QR 20 s |
| T5 | Preferiti e avvisi email | Clienti | `users.preferiti`, `consents.avvisi_preferiti`, `avvisi_preferiti` | Consenso | Resend | Sì | Finché non revoca | Revoca in app |
| T6 | Valutazioni e feedback | Clienti, commercianti | `reviews`, `app_feedback` (email, stelle, commento) | Legittimo interesse | Admin | Sì | Fino alla cancellazione | - |
| T7 | Consenso cookie | Visitatori | `consent_logs`: scelta, IP, user agent, data | Obbligo (art. 7.1) | MongoDB | Sì | **24 mesi, cancellazione automatica (PR #95)** [DA VALIDARE] | - |
| T8 | Statistiche di visita | Visitatori con consenso | `analytics_events`: `vid` casuale, pagina, giorno | Consenso | MongoDB | Sì | **13 mesi, cancellazione automatica (PR #114)** [DA VALIDARE] | `vid` non legato all'account |
| T9 | Contatori anonimi | Visitatori | `interesse_zona`, `scansioni_locandina` (solo numeri) | Nessun dato personale | - | - | - | - |
| T10 | Email transazionali | Tutti | Resend (indirizzo, testo) | Contratto | Resend | Sì | Secondo Resend [DA COMPLETARE] | - |
| T11 | Pagamenti commercianti (dormiente): 4,99 € + IVA al mese, addebito automatico il 1° dopo una conferma esplicita | Commercianti | `subscriptions`, `payment_transactions`, `renewal_events`, `merchant_payments` | Contratto / legge | Stripe, PayPal | UE | 10 anni (anonimizzati dalla cancellazione) | Spenti; nessun addebito senza conferma |
| T11b | Identificazione e fatturazione commercianti | Commercianti | **Partita IVA** (11 cifre, controllo alla registrazione), ragione sociale, indirizzo | Contratto / obbligo di legge | Render, MongoDB, Stripe/PayPal (spenti) | Sì | Finché l'account è attivo; dati contabili 10 anni | Controllo formale della P.IVA. Regola per i nuovi iscritti (i vecchi senza P.IVA erano fittizi, cancellati) |
| T12 | Amministrazione e sicurezza admin | Admin | `admin_security` (impronte, impronta dell'ID di recupero) | Legittimo interesse | - | - | Fino a cambio | Seconda password |
| T13 | Posta in arrivo (anche segnalazioni e reclami su info@) | Chi ci scrive | Email su Aruba/Gmail (gratuito finché non c'è il secondo account Google, poi Workspace) | Legittimo interesse / contratto | Aruba, Google | Sì | [DA COMPLETARE] | - |
| T14 | Attribuzione iscrizioni (`referral_merchant_id`, `fonte_iscrizione`) | Visitatori che arrivano da QR/link | Dati nel browser e nell'account | Legittimo interesse | MongoDB | Sì | **Browser: 30 giorni** (decisione del 13/10, scelta A annullata, da rivalutare). Account: solo l'attribuzione dell'iscrizione | Qualificazione (tecnico o consenso) da validare |
| T16 | Segnalazioni su offerte e reclami dei commercianti (DSA/P2B) | Chiunque segnali, commercianti | Testo, offerta/negozio, email di chi vuole risposta; **nessun IP**; max 5 all'ora | Legittimo interesse / obbligo se applicabile | MongoDB, Resend | Sì | **24 mesi** (PR #113) [DA VALIDARE] | Conferma in 5 giorni lavorativi, esito motivato, solo admin |
| T17 | Eliminazione definitiva clienti da admin (richieste art. 17) | Clienti | Scheda admin «Clienti» | Obbligo di legge | MongoDB | Sì | Esegue la cancellazione richiesta | Solo admin [DA VALIDARE] |
| T15 | Foto con IA (Gemini) | Commercianti | Foto delle offerte | Da definire | Google | Sì | - | **Spento; solo dopo il lancio.** Da rivalutare (DPIA) prima |

## 2. Valutazione d'impatto (DPIA, art. 35)
Non sembra obbligatoria: nessun dato particolare su larga scala, nessuna profilazione, nessun monitoraggio sistematico, nessun minore. **[DA VALIDARE]** Da rivalutare se si accende la funzione di IA sulle foto o si aggiungono dati di posizione sul server.

## 3. Bilanciamento del legittimo interesse (T2, T4 non valide, T6, attribuzione iscrizioni)
| Interesse | Necessità | Impatto sugli interessati | Esito |
|---|---|---|---|
| Sicurezza e antifrode | Serve a evitare abusi del QR | Basso: dati minimi, nome non salvato nel registro | Prevale il nostro interesse **[DA VALIDARE]** |
| Capire quale negozio porta iscrizioni | Informare i commercianti | Basso: nessun dato nuovo | Prevale **[DA VALIDARE]** |
| Valutazioni | Migliorare il servizio | Basso, facoltative | Prevale **[DA VALIDARE]** |

## 4. Da correggere nel codice (non in questa PR)
- Durate dei registri `consent_logs` (24 mesi), `qr_scans` (12), `analytics_events` (13), `redemptions` (24) e segnalazioni (24): **realizzate** (PR #95, #113, #114); il consulente conferma le durate.
- IP nel registro del consenso: dietro il proxy di Render `request.client.host` può essere l'IP del proxy; valutare IP abbreviato o X-Forwarded-For corretto.
