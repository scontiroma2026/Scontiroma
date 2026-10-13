# Operazioni: indice dei documenti

> **Legenda rischio:** 🔴 alto, da sistemare prima del lancio · 🟠 medio, da valutare col consulente · 🟢 basso o già a posto.
> **[PROPOSTA] [DA VALIDARE]** Manuali interni di lavoro: come si approvano le offerte, come si risponde alla posta e alle segnalazioni, come si gestiscono i social. Non sono testi pubblici. Nessuno è stato applicato al codice o al sito. Ultimo aggiornamento: 13/10/2026.

| # | Documento | A cosa serve | Rischio | Chi lo usa |
|---|---|---|---|---|
| 1 | `CRITERI_APPROVAZIONE_OFFERTE.md` | Cosa approvare e cosa rifiutare, con esempi, 11 motivazioni pronte da scrivere al negozio e come trattare i casi dubbi | 🟠 | amministratore (titolare); Claude prepara la proposta |
| 2 | `RISPOSTE_INFO_E_PARTNER.md` | Come si risponde su `info@`, `privacy@`, `partner@` e alle segnalazioni dell'app: tempi, 12 modelli, quando avvisare il titolare, registro senza dati personali, limite del mittente Gmail | 🟠 | Claude; titolare per i casi gravi |
| 3 | `SOCIAL_COMMENTI_E_MESSAGGI.md` | Come si risponde e si modera su Instagram e Facebook; riallinea `05_RISPOSTE.md` (PR #103) alle decisioni del 13/10 | 🟠 | Claude prepara; titolare pubblica |

## Punti da far vedere al consulente
1. **Criteri di rifiuto** delle offerte (alcol, tabacco, azzardo, prodotti vietati, claim sanitari, foto): elenco completo? Quali divieti di pubblicità toccano una piattaforma intermediaria? (doc. 1, sez. 8)
2. **Motivazione dei rifiuti** (Reg. UE 2019/1150 e DSA): basta il campo «Motivo» via email? Va reso obbligatorio nel codice? (doc. 1)
3. **Prezzo di riferimento** (art. 17-bis Codice del Consumo): come lo verifichiamo in pratica? (doc. 1)
4. **Tempi dei reclami**: conferma entro 5 giorni lavorativi (già nei Termini); proposta di esito in 30 giorni e riesame in 10 giorni lavorativi. (doc. 2, sez. 3)
5. **Dichiarazione che alcune risposte sono preparate da un assistente** (decisa dal titolare): formula e posizione. (doc. 2 e 3)
6. **Diritti GDPR**: verifica dell'identità con l'email dell'account; conservazione della posta e dei messaggi social (proposta 12 mesi). (doc. 2 e 3)
7. **Sospensione** dopo 3 segnalazioni accolte (numero deciso dal titolare, da validare), procedura e preavviso (art. 7 Termini commercianti). (doc. 1)
8. **Minori e social**: comportamento quando qualcuno dichiara meno di 18 anni. (doc. 3)

## Decisioni del titolare (13/10)
- ✅ Alcol: si rifiuta solo se è l'oggetto principale dell'offerta (doc. 1, D1).
- ✅ Il «Motivo» del rifiuto è obbligatorio (doc. 1, D2); modifica al codice in una PR a parte.
- ✅ Sospensione dopo **3** segnalazioni accolte (doc. 1, D3): numero da validare dal consulente.
- ✅ Le approvazioni le decide il titolare con un giudizio preparato da Claude (doc. 1, D4).
- ✅ Claude può inviare da solo le conferme di ricezione (doc. 2, D3).
- ✅ Si dichiara che alcune risposte sono preparate da un assistente (doc. 2, D2): formula da far vedere al consulente.
- ✅ Registro, telefono, social (doc. 2 D4-D5, doc. 3 D1-D4): ok alle proposte.
- ⏳ **Ancora aperto:** mittente delle risposte (doc. 2, D1). Proposta: partire con le bozze e passare a «Invia messaggio come» `info@` appena funziona.

## Documenti collegati
- `docs/legale/bozze/` (ramo `claude/bozze-allineate` e `claude/pacchetto-legale`, PR #92): Termini commercianti (04), P2B (06), DSA (07), diritti degli interessati (12).
- `docs/comunicazione/social/` (ramo `claude/social`, PR #103).
- `.claude/skills/legale-documenti/SKILL.md` e `.claude/skills/comunicazione-marchio/SKILL.md`.
