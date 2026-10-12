# Indice per il consulente - pacchetto documenti legali di Sconti Roma

> **[PROPOSTA] [DA VALIDARE]** - Tutte le bozze sono state scritte da Claude (ufficio legale interno) leggendo il codice del 12/10/2026. **Non sono pareri legali** e **non sono pubblicate**: nessuna pagina del sito è stata modificata. Il consulente deve solo **validare e dare l'OK** (o correggere).
> Repository pubblico: nessun segreto né dato di persone reali. I dati aziendali mancanti sono `[DA COMPLETARE]` (serve la visura).
> Titolare: Euro Linea S.r.l.s., P.IVA 03240220644.

## 1. Documenti

| N. | Documento | File | Stato | Rischio | Cosa deve solo validare il consulente |
|---|---|---|---|---|---|
| 01 | Privacy Policy | `01_PRIVACY_POLICY.md` | Bozza | Alto | Basi giuridiche, destinatari (LocationIQ, Aruba, Gmail), durate, trasferimenti, nessun DPO |
| 02 | Cookie Policy e banner | `02_COOKIE_POLICY_E_BANNER.md` | Bozza | Medio | Qualificazione tecnico/funzionale dei cookie di attribuzione, testo del banner, pari rilievo dei pulsanti |
| 03 | Termini Clienti | `03_TERMINI_CLIENTI.md` | Bozza | Medio | Ruolo di intermediario, sospensione con motivazione, foro del consumatore |
| 04 | Termini Commercianti | `04_TERMINI_COMMERCIANTI.md` | Bozza | **Alto** | Prova, pagamento il 1°, disdetta a fine mese, limite di responsabilità, manleva, clausole 1341-1342 |
| 05 | Recesso | `05_RECESSO.md` | Bozza | Basso | Nessun recesso finché non ci sono pagamenti dei consumatori; professionisti esclusi |
| 06 | P2B (Reg. 2019/1150) | `06_P2B_INFORMATIVA_COMMERCIANTI.md` | Bozza | **Alto** | Applicabilità, preavviso, motivazioni, ranking, reclami, mediatori |
| 07 | DSA (Reg. 2022/2065) | `07_DSA_SEGNALAZIONI.md` | Bozza | Medio | Qualificazione (hosting/piattaforma), punto di contatto, segnalazioni |
| 08 | Dati aziendali | `08_DATI_AZIENDALI.md` | Bozza + dati mancanti | Medio | Elenco dati dell'art. 2250 c.c. e blocco del piè di pagina |
| 09 | Fornitori / DPA | `09_DPA_FORNITORI.md` | Bozza | Medio | Ruoli, strumenti di trasferimento, Gmail |
| 10 | Registro trattamenti | `10_REGISTRO_TRATTAMENTI.md` | Bozza | Medio | Righe, DPIA non necessaria, bilanciamento |
| 11 | Data breach | `11_DATA_BREACH.md` | Bozza | Basso | Procedura 72 ore |
| 12 | Diritti degli interessati | `12_DIRITTI_INTERESSATI.md` | Bozza | Basso | Procedura 1 mese, verifica identità |
| 13 | Messaggi commerciali | `13_MESSAGGI_COMMERCIALI.md` | Bozza | Medio | Consensi, soft spam, primo contatto ai negozi |
| - | Accessibilità | nota in `08_DATI_AZIENDALI.md` | Nota | Basso | Dichiarazione AgID non dovuta (fatturato sotto soglia): confermare |

Documenti già esistenti collegati: `PROPOSTE_TESTI_LEGALI.md`, `REVISIONE_TERMINI.md` (PR #76), `VERIFICA_CONFORMITA.md` e `DATI_AZIENDA_E_DPA.md` (PR verifica-conformita), PR #40 (sede e zone), PR #41, PR #83 (Termini senza prezzo bloccato). Non toccate.

## 2. Punti rossi (da sistemare prima del lancio)
1. **LocationIQ non è nella Privacy attuale** (e non nei trasferimenti extra-UE) anche se il server lo usa se la chiave è su Render. Corretto nella bozza 01. [Titolare: conferma che la chiave è su Render.]
2. **Banner cookie con categoria «Marketing»** che «Accetta tutti» imposta a vero, mentre la policy dice che non usiamo marketing. Togliere la categoria (bozza 02).
3. **Durate dichiarate ma non applicate dal codice:** registro del consenso (24 mesi), scansioni non valide, statistiche di visita, offerte usate non hanno cancellazione automatica. O si aggiunge la pulizia automatica o si dichiara «fino alla cancellazione dell'account». Decisione tecnica + legale.
4. **Incoerenza sul primo pagamento dei commercianti:** la regola del lancio dice «dal 61° giorno pagamento per i 30 successivi, il 1° del mese»; i Termini in bozza dicono «la prova prosegue fino a fine mese e si paga dal 1° del mese successivo». Serve una sola regola (bozza 04, art. 3.5).
5. **P2B e DSA:** preavviso, motivazioni, ranking, reclami e segnalazione contenuti non sono ancora nei Termini né nell'app (non c'è modulo di segnalazione).
6. **Dati aziendali mancanti:** REA, capitale sociale, PEC, conferma civico della sede (art. 2250 c.c.).
7. **Gmail gratuito per la posta privacy@:** nessun DPA; servono Workspace o alternativa.
8. **File di mappa `roma.pmtiles` assente dal repository:** la mappa ripiega su OpenStreetMap (riceve l'IP dei visitatori). Dichiarato nella bozza 01, da verificare in produzione.
9. **Cookie di attribuzione (`referral_merchant_id`, `fonte_iscrizione`) e tempo d'uso (`app_feedback_secondi_v1`)** classificati «tecnici» ma con finalità nostre.

## 3. Domande aperte per il consulente (numerate)
1. Titolare: confermare dati identificativi (sede, REA, capitale, PEC) e il blocco del piè di pagina (doc. 08).
2. Cookie di attribuzione e tempo d'uso: tecnici o con consenso? Opzione A/B del doc. 02, art. 3.
3. P2B: Sconti Roma rientra nel Reg. 2019/1150? Il sistema interno di reclami è obbligatorio o solo consigliato (piccola impresa)? Serve indicare mediatori? (doc. 06)
4. DSA: siamo hosting o piattaforma online? Quali obblighi (punto di contatto, segnalazioni, motivazioni, trasparenza)? (doc. 07)
5. Commercianti: confermare che non hanno il recesso del consumatore (doc. 04-05).
6. Versione dei testi: serve nuova accettazione esplicita di Termini/Privacy dagli iscritti, o basta l'avviso email con 15 giorni (art. 10 dei Termini clienti)? Va bene un unico `LEGAL_VERSION`?
7. Prezzo: conferma che **senza prezzo bloccato** basta il preavviso di 30 giorni con diritto di disdetta; nessuna promessa residua nei messaggi o nel video (da controllare).
8. Pagamento e prova: scegliere tra «dal 1° del mese successivo alla fine prova» e «dal 61° giorno». Tolleranza di 5 giorni: va bene come regola contrattuale?
9. Personale del commerciante: è sufficiente la frase «il commerciante, o il suo personale a cui comunica il codice, vede nome e iniziale» e l'obbligo di uso limitato? Il commerciante è titolare autonomo o contitolare?
10. Messaggi ai negozi: primo contatto via WhatsApp/email consentito? Come trattare il consenso B2B e il Registro delle Opposizioni?
11. Fatturazione ai commercianti dopo la prova: fattura elettronica, IVA 22% inclusa nei 4,99 €, tempi, ricevuta.
12. Limite di responsabilità verso i commercianti: minimo fisso? Approvazione specifica ai sensi degli artt. 1341-1342 c.c. così come scritta?
13. Manleva del commerciante e licenza sulle foto (cosa accade alle copie condivise): clausola proposta (doc. 04, art. 6).
14. Foro: Roma per i professionisti con sede ad Ariano Irpino: accettabile?
15. ODR: confermare l'abrogazione e la formula ADR (doc. 03, art. 11).
16. Trasferimenti: strumento per Render, MongoDB, Resend, LocationIQ, Gmail (doc. 09).
17. Durate di conservazione: log di sicurezza e scansioni (12 mesi?), prova consenso (24 mesi?), statistiche (13 mesi?), backup di Atlas, log Render.
18. Geolocalizzazione solo sul telefono: confermare che basta «consenso» e che non c'è invio al server.
19. DPIA: confermare che non è necessaria. DPO: confermare che non è obbligatorio.
20. Accessibilità: confermare che la dichiarazione non è dovuta.
21. Recensioni dei negozi: se pubbliche, tutele (DSA, Omnibus art. 45-bis).

## 4. Decisioni per il titolare (non per il consulente)
- **A.** Fornire visura: REA, capitale, PEC, conferma civico; nome di chi risponde alle richieste.
- **B.** Primo pagamento: opzione A (1° del mese dopo la fine prova) o B (61° giorno).
- **C.** Tolleranza di pagamento: 5 giorni confermati?
- **D.** Limite di responsabilità: minimo fisso in euro?
- **E.** Cookie di attribuzione: ridurre i dati (solo fino all'iscrizione) o chiedere consenso?
- **F.** Posta privacy@: restare su Gmail gratuito o passare a Workspace?
- **G.** Cancellazioni automatiche dei registri (lavoro tecnico).
- **H.** Indirizzo per segnalazioni DSA e reclami P2B.
- **I.** Mediatori per P2B.
- **L.** Quando pubblicare: dopo OK del consulente, e non finché promemoria e pagamenti non sono nell'app.

## 5. Dopo il «sì» del consulente
1. Il titolare scrive in chat «OK consulente».
2. Claude prepara una PR separata che porta i testi nelle pagine del sito (Privacy, Cookie, Termini, Recesso), cambia `LEGAL_VERSION`, aggiorna footer e banner.
3. Unione solo con OK del titolare (CLAUDE.md).
