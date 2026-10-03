# Proposte di modifica ai testi legali — ottobre 2026

> **Bozza da validare dal consulente prima della pubblicazione.**
> Motivo: i testi attuali (febbraio 2026) descrivono un abbonamento clienti a 2,99 € con rinnovo automatico e un PIN che non esistono più.

## Situazione reale del servizio, a cui i testi vanno allineati

**Fase di lancio**
- Durata di circa 2 mesi.
- Gratuita per i clienti e per i commercianti.
- Nessun pagamento attivo: Stripe e PayPal sono spenti.

**Commercianti, dopo la fase di lancio**
- 4,99 € al mese, IVA inclusa.
- Prezzo bloccato per chi aderisce durante il lancio.
- Preavviso di 30 giorni.
- **Nessun addebito senza la loro conferma espressa.**

**Offerte**
- Sono mensili e **non si rinnovano automaticamente**.
- Il commerciante carica l'offerta del mese dopo oppure sceglie «Non rinnovo».

**Clienti**
- Nessun abbonamento.

**Zone**
- Garbatella, San Paolo, Marconi.

**Accesso**
- Email e password, con blocco di 15 minuti dopo 5 errori.
- Face ID facoltativo.
- Il PIN è stato tolto.

**Cosa vede il commerciante alla scansione**
- Nome e iniziale del cognome, ora, offerta, cliente nuovo o di ritorno.
- Le statistiche sono solo aggregate e compaiono solo con almeno 3 clienti nel mese.

**Statistiche di visita**
- Solo con il consenso ai cookie «funzionali», tramite un identificativo casuale (`sr_vid`).

**Cancellazione dell'account**
- Cancella subito tutti i dati collegati.
- I dati di pagamento vengono solo anonimizzati (obbligo fiscale).

## Privacy Policy

| Punto | Prima | Proposta |
|---|---|---|
| 2. Dati di registrazione | «PIN a 6 cifre (cifrato)» | Tolto il PIN; per i commercianti: attività, indirizzo, telefono |
| 2. Dati di pagamento | «Salviamo … lo stato dell'abbonamento» | Fase di lancio: nessun dato di pagamento; in futuro solo commercianti, solo con conferma |
| 2. (nuovo) | — | **Dati condivisi con il commerciante** («Mario R.», ora, offerta, nuovo o di ritorno; statistiche solo aggregate, almeno 3 clienti) |
| 2. (nuovo) | — | **Statistiche di visita** solo con consenso |
| 3. Finalità | «Gestione abbonamento e pagamenti» | «Pagamenti dei commercianti (solo dopo la fase di lancio e con conferma)» |
| 3. Finalità | «welcome, OTP, recupero PIN» | «benvenuto, recupero password, promemoria di scadenza delle offerte» |
| 3. (nuova riga) | — | Statistiche anonime di visita: consenso |
| 4.1 (nuovo) | — | **OpenStreetMap Foundation** (immagini della mappa), **Google Fonts** (caratteri, a ogni pagina), **Google Maps** (solo «Portami qui»), **Nominatim** (riceve l'indirizzo dal nostro server, non l'IP dell'utente) |
| 5. Extra-UE | Stripe, PayPal, Resend, Render, Google | + OpenStreetMap Foundation (Regno Unito) |
| 6. Conservazione | Account: durata + 12 mesi; QR 24 mesi; recensioni fino a cancellazione | Finché l'account è attivo, cancellazione immediata quando lo elimini; contabili 10 anni non collegati all'account |
| 9. Sicurezza | «2 fattori tramite PIN + Face ID», «TLS 1.3» | Blocco 15 minuti dopo 5 errori, Face ID facoltativo, QR che cambia ogni 20 secondi, «TLS» |

## Termini e Condizioni

| Punto | Prima | Proposta |
|---|---|---|
| 1. Oggetto | «utenti abbonati», «zona di Roma» | «utenti registrati», quartieri Garbatella, San Paolo, Marconi |
| 2. Registrazione | Credenziali «password, PIN, Face ID» | Password e Face ID facoltativo; dichiarazione espressa dei 18 anni; blocco 15 minuti dopo 5 errori |
| 3. | «Abbonamento a pagamento» 2,99 €, rinnovo automatico, sospensione e decadenza per mancato pagamento | **3.1 Clienti:** gratis nella fase di lancio, eventuali costi futuri con 30 giorni di preavviso e accettazione espressa. **3.2 Commercianti:** lancio gratuito (~2 mesi), poi 4,99 €/mese IVA inclusa, prezzo bloccato, preavviso 30 giorni, nessun addebito senza conferma, nessun vincolo, «Non rinnovo» |
| 4. Uso degli sconti | «titolare dell'abbonamento», «non abbonati», «chiusura senza rimborso» | «titolare dell'account», «non registrati», «chiusura» |
| 5. Commercianti | — | **Nuovo:** offerte mensili senza rinnovo automatico, approvazione, «Non rinnovo», promemoria via email |
| 5. Commercianti | «abbonati» | «Clienti» |
| 6. | «Diritto di recesso» 14 giorni dalla sottoscrizione | «Recesso e cancellazione»: eliminazione dell'account quando vuoi; 14 giorni per eventuali servizi a pagamento per consumatori |
| 7. Responsabilità | Limite all'importo pagato nei 12 mesi | «eventualmente pagato», salvo dolo o colpa grave e diritti inderogabili del consumatore |

## Diritto di Recesso
La pagina è riscritta per intero. Prima descriveva l'annullamento dell'abbonamento e il rimborso di 2,99 €. Ora contiene:
1. come chiudere l'account;
2. la posizione dei commercianti, che sono professionisti: nessun pagamento senza conferma, «Non rinnovo»;
3. il diritto di recesso di 14 giorni per eventuali servizi a pagamento futuri per i consumatori;
4. i contatti dell'assistenza.

## Cookie Policy

| Punto | Prima | Proposta |
|---|---|---|
| 2.1 Tecnici | `sr_session`, `sr_auth_token`, `sr_csrf` (**nomi che non esistono nel codice**) | Elenco reale: cookie `access_token` (1 giorno), `refresh_token` (7 giorni), `admin_master_token` (60 min, solo admin); memoria del browser `sr_cookie_consent`, `last_email`/`last_role`, `referral_merchant_id`, avvisi già chiusi |
| 2.2 | «Cookie di terze parti (richiedono consenso)» | «Servizi di terze parti», con onestà: Google Fonts e la mappa non sono subordinati al consenso; aggiunto Google Fonts; Stripe e PayPal «oggi non attivi» |
| 4. Log del consenso | «hash della sessione» | Dati reali: IP e tipo di browser; 24 mesi o fino alla cancellazione dell'account |

## Altri testi del sito toccati
- **Iscrizione:** la casella obbligatoria dice anche «Dichiaro di avere almeno 18 anni».
- **Pagina offerta, riquadro «Informative legali»:** «abbonati» diventa «clienti»; «accesso allo sconto tramite abbonamento» diventa «fa da intermediario e fornisce l'accesso allo sconto».

## Domande per il consulente
1. **Titolare del trattamento:** dati identificativi (nome o ditta, sede, CF o P.IVA, PEC). Oggi c'è solo il segnaposto.
2. **Google Fonts:** basta dichiararlo, oppure è meglio ospitare i caratteri sul nostro server, così Google non riceve l'IP? La seconda strada è una piccola modifica tecnica che possiamo fare.
3. **Prezzo bloccato:** va bene «finché restano iscritti senza interruzioni»?
4. **Cosa succede se il commerciante non conferma il pagamento:** va bene «non paga nulla e la sua offerta non viene più pubblicata»?
5. **Recesso dei commercianti:** confermate che, come professionisti, non hanno il recesso del Codice del Consumo?
6. **Versione dei testi:** con la pubblicazione si cambia la versione registrata all'iscrizione (`LEGAL_VERSION`). Bisogna chiedere di nuovo l'accettazione agli iscritti, o basta un avviso via email (art. 9 dei Termini, 15 giorni di preavviso)?
7. **Modifiche e rimozione del negozio:** il riquadro dei Termini chiede 15 giorni di preavviso via email, ma l'app permette di eliminare l'account subito. Va bene così o va riscritto?
8. **Log di sicurezza** (12 mesi) e **log del consenso** (24 mesi): durate da confermare.
