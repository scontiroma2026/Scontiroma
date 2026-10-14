# Triage delle PR aperte (14/10/2026)

Rilievo in **sola lettura** fatto il 14/10 su GitHub: 24 PR aperte. Per i conflitti ho provato l'unione con `main` senza scrivere nulla (`git merge-tree`), quindi l'elenco dei file in conflitto è reale. Nessuna PR è stata unita, chiusa o modificata; nessun branch toccato.

Regole che guidano le proposte (`CLAUDE.md`): si unisce solo quando **tutti** i controlli sono verdi; Privacy, Cookie, Termini e Recesso solo dopo il consulente; PR con decisioni aperte aspettano il titolare; mai cancellare branch.

Legenda controlli: 🟢 i tre controlli (Server FastAPI, Sito React, Test end-to-end) sono verdi · 🔴 uno è rosso · ⚪ nessun controllo registrato su quell'ultimo commit (branch vecchio: i controlli vanno rilanciati dopo il rinnovo del branch).

## 1. Le PR pronte (o quasi) da unire

| PR | Cosa | Stato oggi | Cosa serve |
|---|---|---|---|
| **#145** | Lista di lancio numerata, regola «si dà sempre questa lista», aggiunge `docs/operazioni/SCHEDA_FORNITORE.md` | 🟢, **pulita**, nessun conflitto | **Unire subito.** Nessuna decisione aperta (è la regola del 14/10). Tocca `CLAUDE.md`: è voluto. |
| **#119** | Immagine del post «Ci siamo!» (solo grafica) | 🟢, conflitto **solo in `docs/STATO.md`** (banale) | Aggiornare il branch (riga di STATO in fondo), aspettare i controlli verdi, poi unire. Nessuna decisione aperta. |

Tutte le altre hanno almeno un motivo per aspettare (tabella sotto).

## 2. Tabella completa

| PR | Titolo (abbreviato) | Conflitti con `main` | Controlli | Tipo | Cosa blocca | Proposta |
|---|---|---|---|---|---|---|
| #145 | Lista numerata | nessuno | 🟢 | non legale | niente | **Unire quando verde (è già verde)** |
| #143 | Video V4 «solo mani» (bozza, draft) | nessuno | 🟢 | video, bozza | 6 domande del titolare (stile dito, scena 3 categoria, durata, QR di prova, musica); i video non si pubblicano prima della validazione di Termini/Privacy | Aspetta decisione del titolare |
| #139 | Locandina: «Roma e dintorni» + titoli Manrope | solo `STATO.md` | 🟢 | non legale | decisione aperta: passare le locandine da Fraunces a Manrope? (voce C della lista) | Aspetta decisione del titolare; conflitto banale da sistemare dopo |
| #134 | Piano automazione email `[DA VALIDARE]` | solo `STATO.md` | 🟢 | documento con punti privacy | scelte del titolare (conferme di ricezione, filtri, «Invia come») + formule per il consulente | Aspetta consulente e decisione del titolare |
| #128 | Operazioni: guida negozi, costi, emergenze (draft) | solo `STATO.md` | ⚪ | documenti | il titolare deve confermare la guida (4,99 € + IVA, «circa due mesi») e scegliere la persona di fiducia; `COSTI_MENSILI.md` è **ripreso e aggiornato** nella PR di questo triage (vedi sotto) | Aspetta decisione del titolare; poi rinnovare il branch togliendo il file dei costi |
| #127 | Manuali operativi (criteri offerte, risposte, social) `[BOZZA DA VALIDARE]` (draft) | solo `STATO.md` | ⚪ | documenti con formule per il consulente | mittente delle risposte ancora aperto; sospensione dopo 3 segnalazioni da validare | Aspetta consulente e decisione del titolare |
| #121 | Video clienti v1 (muto, draft) — **costruita sopra #120** (la sua base è `claude/video-v14`) | solo `STATO.md` | 🟢 | video, bozza | crediti ElevenLabs, voce, tagli; dipende da #120 | Aspetta decisione del titolare; unire dopo #120 |
| #120 | Video v14 commercianti (muto, draft) | solo `STATO.md` | ⚪ | video, bozza | permesso crediti (1.279 caratteri), scelta voce, testo personale | Aspetta decisione del titolare |
| #119 | Immagine social «Ci siamo!» | solo `STATO.md` | 🟢 | grafica | niente | **Unire quando verde, dopo aver sistemato `STATO.md`** |
| #116 | Termini: correzioni proposte | `STATO.md`, `Termini.jsx`, test 10 (e2e) | 🟢 | **testo legale** | consulente | Aspetta consulente (blocca anche i contenuti con prova/prezzo della campagna) |
| #114 | Cancellazione automatica oltre la durata `[DA VALIDARE]` | `ci.yml`, `server.py`, `STATO.md` | 🟢 | codice, durate di conservazione (privacy) | consulente deve confermare le durate (12/13/24 mesi) | Aspetta consulente; conflitti non solo di STATO |
| #103 | Punto social: profili, 12 post `[DA DECIDERE]` | solo `STATO.md` | ⚪ | documenti | in gran parte **ripresa dal pacchetto campagna pre-lancio** (#140, unita il 14/10: lo dice il piano della campagna) e Facebook/Instagram sono già creati | Probabilmente superata: il titolare decide se chiuderla (prima copiare `06_PUNTI_PER_CONSULENTE.md` se serve) |
| #102 | Eliminazione account del negozio dal 1° del mese dopo `[DA VALIDARE]` | `ci.yml`, `email_service.py`, `server.py`, `STATO.md` | 🟢 | codice + avviso privacy/disdetta | consulente; dipende da #100 (usa la sua email di disdetta) | Aspetta consulente; unire dopo #100 |
| #101 | Controllo legale: disdetta e sconto `[NON UNIRE]` | nessuno | 🟢 | **documento legale** | OK del titolare e del consulente | Non unire; portare al consulente |
| #100 | Disdetta: sconto da rispettare fino a fine mese `[DA VALIDARE]` | `email_service.py`, `server.py`, `STATO.md` | 🟢 | codice + testi di disdetta | consulente | Aspetta consulente; conflitti di codice non banali |
| #95 | Banner cookie senza «Marketing» + registro 24 mesi `[NON UNIRE]` | `ci.yml`, `server.py`, `STATO.md` | 🟢 | **cookie** | consulente | Aspetta consulente |
| #92 | Pacchetto legale completo (draft) `[NON UNIRE]` | nessuno | 🟢 | **testi legali**, skill, agenti | consulente; ancora aperti 6 punti 🔴 | Aspetta consulente |
| #83 | Termini: «prova di 60 giorni…» `[DA VALIDARE]` | `Termini.jsx` | 🟢 | **testo legale** | consulente | Probabilmente **superata**: parla di «60 giorni», ma la decisione del 12/10 dice «circa due mesi» e le correzioni ai Termini sono in #116/#92. Il titolare decide se chiuderla |
| #81 | Piano di lancio commercianti `[DA DECIDERE]` | solo `STATO.md` | ⚪ | documento | scritto sul modello «60 giorni per tutti dal giorno D», prima delle decisioni del 12/10 e del 14/10 | Aspetta decisione del titolare; da riallineare o chiudere |
| #80 | Verifica di conformità e dati azienda/DPA `[DA VALIDARE]` | `LISTA_LANCIO.md` (la lista è stata riscritta dopo) | 🟢 | documenti legali | consulente; REA/capitale/PEC dalla visura; la modifica alla lista è obsoleta | Aspetta consulente; togliere dal branch il cambio a `LISTA_LANCIO.md` |
| #76 | Revisione dei Termini per il consulente `[DA VALIDARE]` | nessuno | 🔴 solo test end-to-end: ha fallito al passo «Initialize containers», cioè un guasto dell'infrastruttura GitHub, non del codice (la PR è solo un documento) | **documento legale** | consulente; controllo rosso da rilanciare | Aspetta consulente; rilanciare il controllo prima di qualsiasi unione |
| #62 | Video commercianti v13 | nessuno | 🟢 | video | v14 (#120) lo sostituisce nella lista di lancio; restano da cambiare nell'app «SOLO ROMA» e «3 quartieri pilota» (punto del testo) | Probabilmente **superata** da #120: chiudere solo dopo la scelta del titolare sul v14 |
| #41 | Kit per contattare i commercianti | solo `STATO.md` | ⚪ | messaggi (regole d'uso per il consulente) | il consulente deve vedere le regole d'uso prima dell'uso | Aspetta consulente |
| #40 | Sede legale del titolare nei testi legali `[DA VALIDARE]` | solo `STATO.md` | 🟢 | **testi legali** | consulente; civico «5/B» e PEC da confermare | Aspetta consulente |

## 3. Proposta di ordine delle PR

**Subito (nessuna decisione, nessun testo legale):**
1. **#145** (già verde e pulita).
2. **#119** (dopo aver aggiornato il branch per `STATO.md`; unire a controlli verdi).
3. La PR di questo triage (`claude/operazioni-prelancio`): solo documenti, nessun testo legale.

**Il titolare decide (poi si aggiorna il branch e si unisce a controlli verdi), nell'ordine:**
4. #128 (guida negozi, emergenze), #127 (manuali), #139 (locandine), #120 poi #121, #143 (video), #81, #103 e #62 (chiudere o no).

**Aspettano il consulente (e poi l'OK del titolare), nell'ordine suggerito:**
5. Base: #40 (sede legale) → #92 (pacchetto) → #116 (Termini) con #83 chiusa/riassorbita → #95 (cookie) → #114 (durate) → #100 (disdetta) → #102 (eliminazione, dipende da #100) → #101 e #76, #80 (documenti) → #41 e #134 (messaggi/email con formule).
6. Prima di ogni unione di questo blocco il branch va aggiornato: 4 PR hanno conflitti di codice non banali (#100, #102, #95, #114: `server.py`, `email_service.py`, `ci.yml`) e vanno rifatte con cura, non risolte alla cieca.

**Perché questo ordine:** ogni PR aggiunge una riga in fondo a `STATO.md`, quindi ogni unione fa entrare in conflitto banale tutte le altre. Meglio aggiornare e unire **una PR alla volta**, nell'ordine sopra, senza aprire altro in parallelo.

## 4. PR con conflitti banali (NON risolti, da fare in un secondo momento)
Non legali, senza decisioni aperte, conflitto solo in `docs/STATO.md` (basta tenere entrambe le righe in fondo):
- **#119** (unibile appena sistemata).
Con conflitto banale ma ferme per altri motivi (non toccarle ora): #139, #134, #128, #127, #121, #120, #103, #81, #41 (e la legale #40).
Nessun branch è stato modificato.

## 5. Cosa deve decidere il titolare (sintesi)
- Locandine in Manrope sì/no (#139).
- Video: stile V4 (#143), voce e crediti (#120, #121), se v13 (#62) si chiude.
- Chiudere come superate #83, #103, (#62 dopo il v14), e che cosa fare di #81.
- Confermare la guida negozi e scegliere la persona di fiducia (#128); mittente delle risposte e conferme di ricezione (#127, #134).
- Portare al consulente il blocco legale (#40, #76, #80, #83, #92, #95, #100, #101, #102, #114, #116) in un unico pacchetto: oggi sono 11 PR separate.
