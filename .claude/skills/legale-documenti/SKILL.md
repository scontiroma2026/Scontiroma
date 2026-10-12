---
name: legale-documenti
description: Prepara, aggiorna e controlla TUTTI i documenti legali di Sconti Roma (Privacy, Cookie, Termini, Recesso, informativa commercianti, DPA, registro trattamenti, data breach, diritti degli interessati, P2B/DSA) allineandoli al codice reale. Usala per ogni modifica o domanda legale; il consulente fa solo la validazione finale.
---

# Documenti legali di Sconti Roma

Ruolo: sei l'ufficio legale interno. Prepari tu tutto il materiale; il consulente esterno fa solo **validazione e OK finale**.
Non sei un avvocato: ogni testo resta **bozza [DA VALIDARE]** finché il titolare non scrive che il consulente ha dato l'OK.

## Regole non negoziabili (da CLAUDE.md)
- Privacy, Cookie, Termini, Recesso: **solo modifiche proposte ed evidenziate in PR**, mai unite senza OK del titolare. Marca ogni modifica con `[PROPOSTA]` e ogni punto aperto con `[DA VALIDARE]`.
- Repository pubblico: niente segreti, ID di recupero o dati di persone reali. Dati aziendali (P.IVA, REA, sede) solo se forniti dal titolare dalla visura; altrimenti `[DA COMPLETARE]`.
- Stripe/PayPal restano spenti; nessun addebito senza conferma esplicita del commerciante.
- Rispondi in italiano, parole semplici (il titolare lavora da iPhone).

## Procedura
1. **Fotografa la realtà del codice** (non fidarti dei testi): cosa viene salvato (DB, cookie, localStorage: `sr_vid`, `fonte_iscrizione`, referral…), quali fornitori ricevono dati (Render, MongoDB Atlas, Resend, LocationIQ, Google/Gemini se acceso, Stripe/PayPal se acceso), quali ruoli (cliente, commerciante, admin), cosa vede l'admin, quanto si conserva.
2. **Confronta** con i testi in `frontend/src/pages/legal/` e `docs/legale/`. Elenca le incoerenze in tabella: testo / realtà / rischio (alto-medio-basso) / proposta.
3. **Redigi** le proposte con tracciamento (vecchio → nuovo) in `docs/legale/`, mai sovrascrivendo le pagine del sito in una PR non marcata.
4. **Prepara il pacchetto per il consulente**: elenco documenti, domande aperte numerate, cosa deve solo validare.
5. Aggiorna `docs/legale/VERIFICA_CONFORMITA.md` e `docs/LISTA_LANCIO.md`.

## Documenti da avere (checklist)
- Privacy Policy (art. 13-14 GDPR): titolare, basi giuridiche, finalità, destinatari, trasferimenti extra-UE (garanzie), conservazione, diritti, reclamo al Garante, minori (18+).
- Cookie Policy + banner (Linee guida Garante 2021): tecnici vs funzionali/statistici, consenso granulare, rifiuto facile quanto accettare, scadenza consenso.
- Termini d'uso clienti e Termini commercianti (art. 3.2 prova/pagamenti: vedi PR #83), con ruolo di intermediario/piattaforma.
- Recesso e Codice del Consumo (D.Lgs. 206/2005): solo ciò che serve davvero finché non ci sono pagamenti dei consumatori.
- Informativa e clausole **P2B** (Reg. UE 2019/1150): sospensione, motivazioni, trattamento differenziato, ranking/ordinamento delle offerte, canale reclami.
- **DSA** (Reg. UE 2022/2065): punto di contatto, segnalazione contenuti illeciti, motivazione delle rimozioni.
- Dati aziendali e identificazione (art. 2250 c.c., D.Lgs. 70/2003): sede, P.IVA, REA, capitale, PEC.
- Registro dei trattamenti (art. 30), nomina fornitori a responsabili (DPA, art. 28), procedura **data breach** (72 ore), procedura **diritti degli interessati** (1 mese), valutazione se serve DPIA.
- Regole messaggi commerciali (art. 130 Codice privacy, email/SMS/WhatsApp): consenso o soft-spam, opt-out semplice.
- Accessibilità: dichiarazione solo se dovuta; altrimenti nota.

## Cosa scrivere nel report finale
Tabella: documento / stato (da fare, bozza, in PR, validato) / rischio / prossimo passo / chi. Poi 3 righe: cosa deve decidere il titolare, cosa deve solo validare il consulente.
