# 01 - Informativa Privacy (artt. 13-14 GDPR)

> **[PROPOSTA] [DA VALIDARE]** - Bozza completa per il consulente. Non è pubblicata sul sito. Non è un parere legale.
> Allineata al codice del 12/10/2026 (`backend/server.py`, `frontend/src`). I punti `[DA COMPLETARE]` mancano di dati aziendali.
> Sostituisce, se validata, il testo di `frontend/src/pages/legal/PrivacyPolicy.jsx` (la pagina NON è stata toccata).

Ultimo aggiornamento: **[DA COMPLETARE: data di pubblicazione]** - versione testi proposta: `2026-11` [DA VALIDARE: serve cambiare `LEGAL_VERSION`?]

---

## 1. Titolare del trattamento
**Euro Linea S.r.l.s.** (di seguito «Sconti Roma»), Partita IVA 03240220644.
Sede legale: Via Tasso 5/B, 83031 Ariano Irpino (AV) **[DA COMPLETARE: conferma del civico "5/B" dalla visura]**.
PEC: **[DA COMPLETARE]**. REA: **[DA COMPLETARE]**.
Contatto privacy: **privacy@scontiroma.it**.
Responsabile della protezione dei dati (DPO): non designato, perché non è obbligatorio nel nostro caso (nessun monitoraggio sistematico su larga scala, nessun dato particolare su larga scala). **[DA VALIDARE]**

## 2. Quali dati trattiamo
| Chi | Dati | Obbligatorio? |
|---|---|---|
| Tutti gli iscritti | Email, password (salvata solo come impronta cifrata, mai in chiaro), nome e cognome, ruolo (cliente / commerciante), data di iscrizione, versione dei testi accettati e data di accettazione | Sì, per creare l'account |
| Clienti | Offerte usate (data, ora, negozio, offerta), negozi salvati tra i preferiti, eventuale negozio da cui ti sei iscritto (QR della locandina o link), valutazioni e commenti sull'app, valutazioni dei negozi | I primi due sì per il servizio; gli altri sono facoltativi |
| Commercianti | Nome dell'attività, categoria, zona, indirizzo, telefono, orari, descrizione, foto e testi delle offerte, coordinate della mappa ricavate dall'indirizzo | Sì per pubblicare |
| Accesso | Face ID / impronta (facoltativi): sul server resta solo una chiave pubblica, la tua biometria non esce dal telefono. Contatore dei tentativi errati e blocco di 15 minuti dopo 5 errori (salvato come impronta dell'email digitata) | Facoltativo / sicurezza |
| Scansione del QR | Esito (valido / non valido), ora, negozio, cliente. Registro delle scansioni non valide usato contro gli abusi | Sì |
| Consenso ai cookie | Scelta fatta, data, indirizzo IP e tipo di browser (prova del consenso) | Sì, se usi il banner |
| Statistiche di visita | Solo con il tuo consenso ai cookie «funzionali»: un codice casuale non collegato all'account (`sr_vid`), pagine viste, giorno | No |
| Contatori anonimi | «Fammi sapere quando arrivate» (voti per zona) e aperture del link del QR della locandina: solo un numero per zona o per negozio e per giorno, nessun dato personale | No |
| Messaggi | Il testo che ci scrivi via email | No |
| Pagamenti | **Oggi nessuno**: nessun dato di pagamento è raccolto. In futuro, solo dai commercianti, solo dopo la loro conferma espressa (vedi punto 4) | - |

**Cosa vede il commerciante:** quando applica lo sconto vede solo nome e iniziale del cognome (es. «Mario R.»), l'ora, l'offerta e se sei cliente nuovo o di ritorno. Le statistiche sono aggregate e compaiono solo con almeno 3 clienti nel mese. Il «codice del negozio» a 4 cifre è necessario per vedere il nome; chi inquadra il QR senza il codice non vede dati personali. **[PROPOSTA: frase sul personale del commerciante, vedi domanda 9 dell'indice]**
**Cosa vede chi gestisce Sconti Roma (amministratore):** nome, cognome, email, negozio di provenienza, offerte usate, scansioni non valide, valutazioni, per assistenza, sicurezza e controllo degli abusi.

**Non adottiamo decisioni basate unicamente su trattamenti automatizzati e non facciamo profilazione.** **[DA VALIDARE]** (L'ordine delle offerte è per data di pubblicazione, vedi documento 06.)
Non trattiamo dati particolari (art. 9). Il servizio è per maggiorenni (18+): se scopriamo che un minore si è iscritto, chiudiamo l'account.

## 3. Perché li usiamo e su quale base
| Finalità | Base giuridica | Conservazione |
|---|---|---|
| Creare e gestire l'account, far funzionare QR, offerte e preferiti | Contratto (art. 6.1.b) | Finché l'account è attivo; cancellazione immediata quando lo elimini |
| Email di servizio: benvenuto, recupero password, promemoria di scadenza delle offerte, approvazione o rifiuto offerte, conferma di cancellazione | Contratto (6.1.b) | Come sopra |
| Sicurezza, antifrode, blocco dopo tentativi errati, registro delle scansioni non valide | Legittimo interesse (6.1.f) [DA VALIDARE: valutazione di bilanciamento, vedi doc. 10] | **[DA VALIDARE: proposta 12 mesi]** oggi senza cancellazione automatica (vedi indice, punto rosso 3) |
| Mostrare al commerciante i dati della scansione e le statistiche aggregate | Contratto (6.1.b) | Finché l'account è attivo |
| Sapere da quale negozio arrivano le iscrizioni (QR / link) | Legittimo interesse (6.1.f) | Finché l'account è attivo |
| Valutazioni sull'app e sui negozi | Legittimo interesse: migliorare il servizio (6.1.f) | Finché l'account è attivo |
| Prova del consenso ai cookie | Obbligo di dimostrare il consenso (art. 7.1, 6.1.c) | **[DA VALIDARE: 24 mesi]** oggi senza cancellazione automatica (punto rosso 3) |
| Statistiche di visita anonime | Consenso (6.1.a), revocabile dal banner «Gestisci cookie» | **[DA VALIDARE: proposta 13 mesi]** oggi senza cancellazione automatica |
| Avvisi email sulle offerte dei negozi preferiti | Consenso (6.1.a), revocabile («Non avvisarmi più») | Finché non revochi |
| Comunicazioni promozionali di Sconti Roma | Consenso (6.1.a), separato dai Termini; revocabile in ogni momento | Finché non revochi |
| Pagamenti dei commercianti (solo dopo la fase di lancio e con conferma) | Contratto (6.1.b) e obblighi fiscali (6.1.c) | 10 anni (dati contabili) |
| Fatture e obblighi di legge | Obbligo di legge (6.1.c) | 10 anni |
| Difendere un diritto | Legittimo interesse (6.1.f) | Fino al termine della controversia |

La posizione del telefono (per «Vicino a me») è usata solo sul tuo telefono, con il tuo permesso, e non viene inviata a noi. **[DA VALIDARE: conferma che non parte verso il server]**

## 4. A chi comunichiamo i dati (destinatari)
| Fornitore | A cosa serve | Dati | Sede |
|---|---|---|---|
| Render Services, Inc. | Server dell'app e del sito | Tutti i dati in transito, log tecnici | Regione UE (Francoforte); società USA |
| MongoDB, Inc. (Atlas) | Database | Tutti i dati dell'app | **[DA COMPLETARE: regione del cluster]**; società USA |
| Resend (Plus Five Five, Inc.) | Invio email | Email, nome, testo del messaggio | Invio da UE (Irlanda) [DA VALIDARE]; società USA |
| LocationIQ (Unwired Labs) | Trasforma gli indirizzi dei negozi in coordinate | Solo il testo dell'indirizzo, inviato dal nostro server | USA (server `eu1`) [DA VALIDARE] |
| OpenStreetMap Foundation | Immagini della mappa (se il file di mappa nostro non c'è) e ricerca indirizzi (Nominatim: riceve l'indirizzo dal nostro server, non il tuo IP) | IP del visitatore per le immagini della mappa | Regno Unito |
| Google Maps | Solo se premi «Portami qui»: apre l'app mappe | Quello che decidi tu, fuori dalla nostra app | Titolare autonomo |
| Aruba | Dominio e posta `info@`, `privacy@`, `partner@` | Messaggi che ci scrivi | UE |
| Servizio di inoltro posta (Gmail) | La posta arriva a un account Google | Messaggi che ci scrivi | USA/UE **[DA DECIDERE: vedi doc. 09]** |
| Stripe, PayPal | **Spenti.** Pagamenti dei commercianti, solo se e quando saranno attivati con conferma | Dati di pagamento (non li vediamo noi) | Titolari autonomi |
| Google (Gemini) | **Spento.** Miglioramento foto con IA | Foto delle offerte | Se riacceso: aggiornare questa informativa prima |
| Commercianti | Applicare lo sconto | Dati del punto 2 | Titolari autonomi per quei dati |
| Consulenti, autorità | Se richiesto dalla legge | Il necessario | - |

Non vendiamo i tuoi dati. Le mappe Protomaps sono ospitate da noi: **[DA VALIDARE: il file `roma.pmtiles` oggi non è nel repository; se manca, la mappa chiede le immagini a OpenStreetMap e riceve l'IP]**.

## 5. Trasferimenti fuori dall'Unione Europea
Alcuni fornitori sono società statunitensi o del Regno Unito. Garanzie: decisione di adeguatezza (Regno Unito; USA per i fornitori certificati EU-US Data Privacy Framework) oppure Clausole Contrattuali Standard della Commissione UE. Strumento per ogni fornitore: **[DA COMPLETARE dopo la verifica dei contratti, tabella in doc. 09]**. Puoi chiederci copia delle garanzie a privacy@scontiroma.it.

## 6. Quanto conserviamo
- Account e dati collegati: finché l'account è attivo. Quando lo elimini dal profilo, cancelliamo subito offerte usate, scansioni, valutazioni, preferiti, messaggi di consenso e (per i commercianti) offerte, archivio e contatori.
- Dati di pagamento (in futuro): non cancellabili per obbligo fiscale, vengono resi anonimi dall'account; 10 anni.
- Copie di sicurezza (backup) di MongoDB Atlas: **[DA COMPLETARE: se attivi e per quanti giorni]**; le copie contengono i dati fino alla loro scadenza.
- Log tecnici di Render: **[DA COMPLETARE: durata dal pannello Render]**.
- Altre durate: tabella del punto 3.

## 7. I tuoi diritti
Accesso, rettifica, cancellazione, limitazione, portabilità (file JSON dal profilo), opposizione, revoca del consenso, in qualsiasi momento. Scrivi a privacy@scontiroma.it: rispondiamo **entro 1 mese** (procedura nel doc. 12). Dal profilo puoi esportare i dati e cancellare l'account. Hai diritto di reclamo al **Garante per la protezione dei dati personali** (www.garanteprivacy.it).

## 8. Sicurezza
Password cifrate (bcrypt); connessione protetta (HTTPS/TLS); cookie di accesso `HttpOnly` e `Secure`; blocco di 15 minuti dopo 5 tentativi errati; Face ID facoltativo; QR che cambia ogni 20 secondi; accesso amministratore con seconda password. Nessuna misura è assoluta. In caso di violazione dei dati seguiamo la procedura del doc. 11.

## 9. Modifiche
Se cambiamo questa informativa avvisiamo con almeno 15 giorni di preavviso per le modifiche sostanziali, via email e nell'app.

---
### Differenze rispetto al testo oggi sul sito (per il consulente)
1. Aggiunti LocationIQ, Aruba, inoltro posta, Protomaps (assenti o incompleti).
2. Aggiunti: nessun DPO, nessuna profilazione, base giuridica per ogni finalità.
3. Durate esplicite per log e prova del consenso (oggi non applicate dal codice).
4. Backup e log di Render da completare.
5. Rimosso ogni riferimento a PIN, abbonamento clienti, Google Fonts (caratteri ospitati da noi).
