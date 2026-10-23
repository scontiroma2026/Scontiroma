# Lista per l'avvocato - Gruppo 5 (punti 24, 25, 26): P2B, DSA, sospensione (21/10/2026)

Legenda: 🔴 alto, da sistemare prima del lancio · 🟠 medio, da valutare col consulente · 🟢 basso o già a posto.

Stato: **[DA VALIDARE]** dal consulente. Non è un parere legale. Regola del titolare (21/10): dove non ero sicuro ho scelto la strada più prudente (più tutele per i negozi, più preavviso) e la scrivo qui.
Norme citate (Reg. UE 2019/1150 «P2B» artt. 3-5-7-11-12; Reg. UE 2022/2065 «DSA» artt. 16-17-19; art. 1456 c.c.): **non verificate sui testi ufficiali**.
Testi nuovi: `frontend/src/pages/legal/Termini.jsx` (art. 1, 2, 9, 11), proposti in PR, non uniti. Gli art. 5 e 8 non sono toccati (li modifica la #204).

## Righe

| Punto | Rischio | Scelta prudente fatta | Domanda all'avvocato |
|---|---|---|---|
| 24 - P2B | 🟠 | Blocco breve in art. 1 (condizioni chiare, ordine offerte, motivazioni, reclami). Preavviso modifiche ai negozi da 15 a **30 giorni** (art. 9), con possibilità di disdire senza penali prima dell'entrata in vigore. Ai clienti restano 15 giorni. Trattiamo Sconti Roma come se il P2B si applicasse. | 1) Sconti Roma è «servizio di intermediazione online» ai sensi del P2B? 2) La piccola impresa (meno di 50 addetti e fatturato non sopra 10 milioni) è esentata dagli artt. 11-12: confermi che gli altri articoli (3, 5, 7) valgono comunque? 3) 30 giorni vanno bene o serve altro? 4) Il blocco in art. 1 basta come «informazione sul posizionamento» (art. 5)? |
| 25 - Contatto e reclami | 🟠 | `info@scontiroma.it` dichiarato punto di contatto per segnalazioni e reclami (art. 11) con la procedura vera di #113: conferma entro 5 giorni lavorativi, esito motivato, nessun IP, conservazione 24 mesi. Nessuna dichiarazione di esenzione scritta nei Termini. | 1) Siamo «hosting» (artt. 16-17 DSA) o «piattaforma online» (anche art. 19)? 2) Come microimpresa/piccola impresa siamo esenti dalle norme delle piattaforme? 3) Basta `info@` come punto di contatto o serve un punto dedicato? 4) La segnalazione senza account va bene così? 5) Serve un sistema interno di gestione reclami (art. 11 P2B) anche se esenti? |
| 26 - Sospensione e chiusura | 🟠 | Sostituita la voce dell'art. 2 (clausola secca con art. 1456 c.c.): sospensione con motivo scritto su supporto durevole al più tardi al momento; chiusura con 30 giorni di preavviso salvo urgenza o violazione grave; reclamo a `info@` con riesame in **10 giorni lavorativi** (decisione del titolare); la disdetta non è una sospensione. Tolto il richiamo all'art. 1456 c.c. | 1) L'art. 1456 c.c. si può ancora richiamare insieme a queste tutele? 2) «Violazione grave o ripetuta» e «urgenza» sono definite abbastanza? 3) Per i clienti (non negozi) la stessa procedura è eccessiva? Oggi vale per tutti gli account nella voce dell'art. 2. 4) L'email dell'account è un «supporto durevole» valido? |

## Coerenza testo / codice (verificata il 21/10 su `main`)

| Cosa dice il testo | Cosa fa il codice | Esito |
|---|---|---|
| Offerte «dalla più recente» | `GET /discounts` ordina per `created_at` decrescente. Il sito (`Discounts.jsx`, `MapView.jsx`) ordina per distanza se il cliente dà la posizione. Nessun campo, filtro o prezzo che alzi un'offerta. | 🟢 Vero (testo dice entrambi i casi). Da dire all'avvocato: l'ordine per vicinanza è un criterio principale? |
| Nessuna corsia a pagamento | Nessuna ricerca di «sponsor», «in evidenza», «boost» nel codice. L'abbonamento del negozio (spento) non cambia l'ordine. | 🟢 Vero oggi. Va ridetto se si introduce. |
| Motivazione scritta per il rifiuto offerte | `_motivo_rifiuto`: almeno 10 caratteri, salvata (`approval_note`) e inviata per email al negozio (`send_merchant_rejected`). | 🟢 Coerente |
| Sospensione del negozio con motivo | L'admin sospende con `PUT /admin/merchants/{id}` `{approved:false}` (pulsante in `AdminMerchantsTable.jsx`). **Nessun motivo richiesto, nessuna email al negozio.** | 🔴 **Non coerente** col nuovo testo art. 2 |
| Preavviso 30 giorni per modifiche ai Termini | Nessun invio automatico di avvisi di modifica dei Termini: l'avviso è manuale (email ai negozi). | 🟠 Non automatizzato: va ricordato nel calendario di lancio |
| Conferma ricezione entro 5 giorni lavorativi | Salvata `conferma_entro` = creazione + 7 giorni di calendario; il promemoria all'admin dice «5 giorni lavorativi»; **non parte nessuna email automatica di ricezione** (parte solo l'esito, se c'è email, e l'avviso all'admin). | 🟠 Impegno gestito a mano dall'admin |
| Esito motivato | `send_esito_segnalazione`; per «accolta»/«respinta» motivazione di almeno 10 caratteri obbligatoria. Email solo se l'autore ha lasciato l'indirizzo. | 🟢 Coerente |
| Nessun IP | Non si salva; per il limite di 5 segnalazioni all'ora si usa solo in memoria un codice anonimo (hash dell'IP, non scritto nel database). | 🟢 Coerente. Domanda: l'hash temporaneo in memoria va citato in Privacy? |
| Conservazione 24 mesi | `SEGNALAZIONE_CONSERVAZIONE` = 730 giorni, indice di scadenza automatico. | 🟢 Coerente |
| Riesame dei reclami in 10 giorni lavorativi | Nessuna scadenza nel codice (nessun promemoria per i 10 giorni; solo per i 5). | 🟠 Impegno manuale |

## Proposta (non implementata): motivazione della sospensione al negozio
Oggi il testo promette un motivo scritto ma il codice no. Proposta per una PR di codice a parte (serve OK del titolare): quando l'admin sospende un negozio, la finestra chiede un motivo (almeno 10 caratteri, come per il rifiuto offerte), lo salva e lo invia per email al negozio; aggiungere nel promemoria admin la scadenza dei 10 giorni lavorativi per il riesame. **Finché non c'è, prima di lanciare con i negozi, sospendere solo scrivendo a mano l'email col motivo.**

## Da non dimenticare
- Sovrapposizione con la **#204** (Termini art. 5 e 8): questa PR tocca solo art. 1, 2, 9, 11. Possibile conflitto solo se #204 ha rimesso a posto righe vicine; risolvere tenendo entrambe le modifiche.
- Il testo dell'art. 2 dice «Commerciante» per la chiusura con 30 giorni; per i clienti resta solo la sospensione con motivo. Scelta prudente da validare.
