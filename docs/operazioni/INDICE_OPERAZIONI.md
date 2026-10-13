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
5. **Risposte preparate da un assistente**: va dichiarato? (doc. 2 e 3)
6. **Diritti GDPR**: verifica dell'identità con l'email dell'account; conservazione della posta e dei messaggi social (proposta 12 mesi). (doc. 2 e 3)
7. **Sospensione** dopo sconto non rispettato (quante segnalazioni accolte), procedura e preavviso (art. 7 Termini commercianti). (doc. 1)
8. **Minori e social**: comportamento quando qualcuno dichiara meno di 18 anni. (doc. 3)

## Cosa deve decidere il titolare (sintesi)
- **Mittente delle risposte**: «Invia messaggio come» `info@`, invio con Resend dal dominio, oppure solo bozze (doc. 2, D1).
- **Alcol e categoria «Vino & Gastronomia»** (doc. 1, D1) e rendere obbligatorio il campo «Motivo» del rifiuto (D2).
- Se Claude può inviare da solo le sole **conferme di ricezione** per non sforare i 5 giorni (doc. 2, D3).
- Dove tenere il **registro** senza dati personali (doc. 2, D4).
- Riallineare i testi social di PR #103 (doc. 3, D2).

## Documenti collegati
- `docs/legale/bozze/` (ramo `claude/bozze-allineate` e `claude/pacchetto-legale`, PR #92): Termini commercianti (04), P2B (06), DSA (07), diritti degli interessati (12).
- `docs/comunicazione/social/` (ramo `claude/social`, PR #103).
- `.claude/skills/legale-documenti/SKILL.md` e `.claude/skills/comunicazione-marchio/SKILL.md`.
