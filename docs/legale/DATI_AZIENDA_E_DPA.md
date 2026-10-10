# Dati dell'azienda e contratti con i fornitori (DPA)

Elenco di lavoro, non pubblicato sul sito. Compilato il 10/10/2026 con ciò che si sa già.
Repository pubblico: **non scrivere qui** IBAN, password, chiavi, codici fiscali di persone o dati personali.
Dove una voce manca c'è scritto «DA COMPLETARE»: serve la visura camerale o il consulente.

## 1. Dati dell'azienda (da mostrare sul sito e nei testi)

| Dato | Valore | Dove va | Stato |
|---|---|---|---|
| Ragione sociale | Euro Linea S.r.l.s. | Privacy, Termini, piè di pagina | già nei testi |
| Partita IVA | 03240220644 | Privacy, Termini | già nei testi |
| Sede legale | Via Tasso 5/B, 83031 Ariano Irpino (AV) | Privacy art. 1, Termini intro | in PR #40 (da validare; civico «5/B» da confermare) |
| Numero REA | DA COMPLETARE | piè di pagina, Termini | manca |
| Capitale sociale (versato) | DA COMPLETARE | piè di pagina, Termini | manca |
| PEC | DA COMPLETARE | Privacy art. 1, Termini | manca |
| Socio unico / liquidazione | DA COMPLETARE | piè di pagina (se applicabile) | manca |
| Contatti pubblici | `info@`, `privacy@`, `partner@` scontiroma.it | già nei testi | inoltro verso Gmail da fare |

Base di legge: art. 2250 c.c. e art. 7 D.Lgs. 70/2003. Blocco proposto per il piè di pagina (da validare):

> Euro Linea S.r.l.s. · Sede legale: Via Tasso 5/B, 83031 Ariano Irpino (AV) · P.IVA 03240220644 · REA: DA COMPLETARE · Capitale sociale € DA COMPLETARE i.v. · PEC: DA COMPLETARE

## 2. Contratti sul trattamento dei dati (art. 28 GDPR) con i fornitori

I dettagli dei contratti (nome esatto del documento, dove si accetta) vanno **verificati sul sito di ciascun fornitore**: qui non sono riportati indirizzi per non sbagliare.

| Fornitore | Ruolo | Dati che riceve | Sede dati | Cosa fare | Stato |
|---|---|---|---|---|---|
| Render | Responsabile (hosting) | tutti i dati dell'app in transito, log | UE (Francoforte) | accettare/scaricare il DPA dal proprio account, salvarlo | DA FARE |
| MongoDB Atlas | Responsabile (database) | tutti i dati dell'app | UE | il DPA di norma è parte del contratto del cliente: scaricarlo e salvarlo | DA FARE |
| Resend | Responsabile (email) | email del destinatario e testo | UE (Irlanda) per l'invio, società USA | scaricare il DPA, verificare strumento di trasferimento | DA FARE |
| Google (Gemini) | Responsabile solo se si passa al piano a pagamento | foto delle offerte (solo se «Migliora foto» è acceso) | USA/UE | funzione **spenta** fino al lancio; riaccendendo con fatturazione, verificare i termini sul trattamento dei dati del servizio a pagamento (il livello gratuito può usare i contenuti per migliorare i servizi) | SPENTA |
| LocationIQ | Responsabile (indirizzi dei negozi) | testo degli indirizzi | USA | verificare DPA e aggiungere alla Privacy (vedi `VERIFICA_CONFORMITA.md`, P1) | DA FARE |
| Aruba | Responsabile (dominio, posta, DNS) | posta di `info@`, `privacy@`, `partner@` | UE | verificare condizioni; contratto del dominio | DA FARE |
| Gmail (inoltro) | La posta arriva a un account Google | richieste degli utenti (anche privacy) | USA/UE | per la posta aziendale valutare un account Google Workspace (con DPA) o un'alternativa; con Gmail gratuito il consulente decide | DA DECIDERE |
| UptimeRobot | Non riceve dati degli utenti | solo gli indirizzi del sito e l'email di chi ha l'account | — | usare l'email di Sconti Roma quando esiste; nessun DPA necessario per i dati degli utenti | OK |
| Stripe, PayPal | Titolari autonomi (per i pagamenti) | dati di pagamento | UE | pagamenti **spenti**; riverificare all'accensione | SPENTI |
| OpenStreetMap Foundation | Titolare autonomo (immagini mappa) | indirizzo IP del visitatore | UK | già in Privacy | OK |

## 3. Trasferimenti extra-UE: per ogni fornitore USA

Per ciascuno annotare **quale strumento vale** (certificazione EU-US Data Privacy Framework oppure Clausole Contrattuali Standard) e la data di verifica. Da completare dopo la lettura dei contratti: Render, Resend, Google, LocationIQ, Gmail.

## 4. Persone autorizzate (art. 29)

| Persona/ruolo | Accesso | Dati visibili | Istruzioni |
|---|---|---|---|
| Titolare (amministratore) | area `/admin` | nome e cognome, email, iscrizioni, feedback, log | non copiare dati fuori dall'app, non condividerli, accesso solo da dispositivi propri |

Se altre persone avranno l'accesso, aggiungerle qui con un incarico scritto.
