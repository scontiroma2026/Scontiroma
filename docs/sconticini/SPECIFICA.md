# Sconticini: specifica (21/10/2026)

> **Stato: proposta in PR, tutto SPENTO** (`SCONTICINI_ENABLED=false` di default). Finché il regolamento (`docs/sconticini/REGOLAMENTO.md`) non è chiuso e il titolare non accende l'interruttore su Render, nessun dato viene contato, salvato o inviato e le pagine non compaiono.
> Repository pubblico: qui nessun dato di persone reali né segreti.

## 1. Idea in una riga
Ogni sconto **usato** (QR del cliente scansionato dal negozio con il codice a 4 cifre = riscatto verificato) dà **1 sconticino** al cliente per **quel negozio**. Il negozio sceglie premio e soglia; alla soglia il cliente sblocca un **QR dedicato al premio**, che il negozio scansiona come un normale sconto (stesso codice a 4 cifre); poi gli sconticini di quel negozio ripartono da zero. Niente card fisiche. Il premio è **a carico del negozio**.

## 2. Come funzionano oggi i riscatti (punto di partenza, invariato)
1. Il cliente tocca «Usa lo sconto» → `POST /api/redemptions/create/{discount_id}` crea un riscatto `pending` (limiti: `max_uses_per_month`, 1 al giorno per cliente e negozio).
2. Il QR cambia ogni 20 secondi (`GET /api/redemptions/{rid}/token`, firma HMAC a rotazione).
3. Il negozio inquadra il QR con la fotocamera → pagina `/qr/<token>` → `POST /api/qr/redeem` con il **codice del negozio a 4 cifre** (max 5 errori ogni 15 minuti), oppure da commerciante collegato (nessun codice), oppure da `POST /api/redemptions/verify`.
4. Solo qui il riscatto passa `pending → redeemed` (aggiornamento atomico) e il negozio vede «Mario R.».

**Gli Sconticini si agganciano solo a questo passaggio** (`modified_count == 1`): nessun altro evento dà sconticini.

## 3. Regole
| Regola | Come è fatta |
|---|---|
| Solo sconti scansionati | Il conteggio parte dopo la transizione `pending → redeemed`; il codice sbagliato, il QR scaduto, il riscatto solo «creato» non contano. |
| 1 sconticino per riscatto verificato | Riga di tracciamento con chiave unica `guad:<id riscatto>`: la stessa scansione ripetuta (doppio tap) non ne dà un secondo. |
| Limite giornaliero | Massimo 1 sconticino al giorno (ora di Roma) per **cliente e negozio** (`SCONTICINI_MAX_AL_GIORNO`). Il rifiuto è tracciato (`rifiutato_limite`). |
| Il negozio decide | Soglia da 3 a 20, premio a testo libero (3–80 caratteri, niente `<` `>`). Per attivare serve accettare il regolamento (versione e data registrate). |
| Modifiche | Valgono per i premi **futuri**; i premi già sbloccati restano come al momento dello sblocco (testo e soglia copiati nel premio). |
| Premio | Alla soglia il saldo scala di «soglia» (riparte da zero) e nasce un premio con QR a rotazione (20 s), **monouso**, valido `SCONTICINI_PREMIO_GIORNI` giorni (predefinito 60). |
| Uso del premio | Il negozio lo inquadra come uno sconto: stessa pagina, stesso codice a 4 cifre, stessi limiti di tentativi. Il premio **non dà sconticini** e non ha il limite «1 al giorno». |
| Scadenza | Lo stato passa a `expired` quando qualcuno guarda (cliente, negozio, admin) o prova a usarlo; evento `premio_scaduto`. |
| Negozio in pausa | Se il negozio spegne il programma o l'admin lo mette in pausa, non si contano nuovi sconticini; saldi e premi già sbloccati restano (e un premio sbloccato si può ancora usare). |
| Premio a carico del negozio | Detto nel regolamento, nella casella di accettazione, nell'email al negozio e nella scheda. Sconti Roma non rimborsa e non paga premi. |

## 4. Dati (collezioni nuove, solo con interruttore acceso)
- `sconticini_config` — per negozio: `attivo`, `soglia`, `premio`, `regolamento_versione`, `regolamento_accettato_il`, `sospeso_admin`.
- `sconticini_saldi` — per cliente e negozio: `count`, `totale`, `ultimo_uso_at` (indice unico cliente+negozio).
- `sconticini_premi` — `code` (inizia con `PR`), `premio`, `soglia`, `status` (`pending|redeemed|expired`), `created_at`, `expires_at`, `redeemed_at`.
- `sconticini_eventi` — **tracciamento**: `guadagnato`, `rifiutato_limite`, `premio_sbloccato`, `premio_usato`, `premio_scaduto`, `config` (con valori prima/dopo), `admin_sospensione`. Chiave unica per evento.
- Cancellazione account: cliente → cancella saldi, premi, eventi; negozio → cancella tutto ciò che lo riguarda. Esportazione GDPR: include saldi, premi (senza il codice del QR) ed eventi.

## 5. Pagine e API
| Chi | Dove | API |
|---|---|---|
| Cliente | «Il tuo account» → «I tuoi Sconticini»: una tessera per negozio, barra «3 su 5», ultimo uso, premio, bottone «Mostra il QR del premio» (QR a rotazione) | `GET /api/sconticini/me`, `GET /api/sconticini/premi/{id}/token` |
| Commerciante | Dashboard → scheda «Sconticini»: interruttore, soglia, premio, casella del regolamento, numeri (dati, clienti con tessera, premi sbloccati, riscattati), ultimi premi con «Mario R.» | `GET/PUT /api/merchants/me/sconticini` |
| Negozio al banco | Pagina `/qr/…` (la stessa degli sconti): per un premio mostra «Premio valido» / «Consegna il premio»; dopo uno sconto mostra «Sconticino 3 su 5» (nessun dato personale in più) | `/api/qr/verify`, `/api/qr/redeem` |
| Admin (con master password) | Scheda «Sconticini»: totali, riga per negozio (regolamento accettato quando), pausa/riattiva, tracciamento con nome intero | `GET /api/admin/sconticini`, `POST /api/admin/sconticini/negozi/{id}/sospendi` |
| Tutti | `/sconticini/regolamento` (bozza, visibile solo a interruttore acceso) | `GET /api/config/public` (`sconticini_enabled`) |

Gli scansionamenti dei premi finiscono anche nel registro scansioni dell'admin (con `tipo: premio_sconticini`).

## 6. Email (solo a interruttore acceso)
- **Al cliente** quando raggiunge il premio: «Hai sbloccato il premio di <negozio>», premio, scadenza, pulsante «Apri la mia tessera». **Il QR non è nell'immagine dell'email**: cambia ogni 20 secondi (come gli sconti, contro gli screenshot), quindi l'email porta alla tessera dove il QR si mostra al banco. *(Decisione 1 per il titolare: se si vuole un QR fisso nell'email serve un QR monouso non a rotazione, meno sicuro.)*
- **Al commerciante**: «Un cliente ha raggiunto il premio», con il cliente indicato come «Mario R.» (nome + iniziale del cognome, come già alla scansione), il premio, la scadenza e la frase «Il premio è a carico del negozio».
- Sono email di servizio legate all'account, non marketing; niente percentuali, prezzi o promesse. Dichiarate come **proposta** in `REGOLAMENTO.md` (sezioni Privacy).

## 7. Abusi considerati
| Rischio | Misura |
|---|---|
| Un cliente accumula sconticini senza comprare | Servono scansione del negozio + codice a 4 cifre (o commerciante collegato); il codice ha blocco dopo 5 errori. |
| Stessa scansione contata due volte (doppio tap, ritentativo di rete) | Chiave unica dell'evento + aggiornamento atomico del riscatto. |
| Più sconticini lo stesso giorno | Limite 1 al giorno per cliente e negozio. |
| Due richieste insieme al limite della soglia | Il prelievo del saldo è atomico (`count >= soglia`): un solo premio. |
| Screenshot o inoltro del QR del premio | QR a rotazione 20 s con firma, monouso, scadenza, legato al proprietario (altri clienti ricevono 404). |
| Premio usato in un altro negozio | Il codice del negozio e il commerciante collegato devono essere quelli del premio. |
| Negozio e cliente d'accordo (sconticini finti) | **Non evitabile dal sistema**: il costo è del negozio stesso. Tracciamento completo e pausa admin per i casi sospetti. |
| Account multipli dello stesso cliente | Ogni account ha il suo saldo; ognuno richiede uno sconto vero scansionato. Rischio residuo basso, da valutare dopo i primi mesi. |
| Negozio che cambia premio dopo | Il premio sbloccato resta quello al momento dello sblocco; le modifiche sono tracciate (`config`, prima/dopo). |

## 8. Interruttore e variabili (Render)
| Nome | Predefinito | Cosa fa |
|---|---|---|
| `SCONTICINI_ENABLED` | `false` | Spento: nessun conteggio, nessuna pagina, endpoint 404. Acceso solo dopo regolamento chiuso e OK del titolare. |
| `SCONTICINI_PREMIO_GIORNI` | `60` | Giorni di validità di un premio sbloccato. |

## 9. Test
`backend/tests/test_sconticini.py` (18 test, database locale mongomock, nessuna email vera): spento di default; impostazioni e regolamento; un sconticino per scansione, doppio tap, codice sbagliato; limite giornaliero (con simulazione di più giorni); soglia, ripartenza, giorni di validità, modifiche che non toccano i premi già sbloccati; QR premio (proprietario, firma, codice del negozio, monouso, scadenza, altro commerciante, `/redemptions/verify`); email (invio solo alla soglia, «Mario R.» al negozio, testo protetto da HTML); admin (master password, nome intero, pausa); GDPR (esportazione e cancellazione). Aggiunto anche in `tests/test_campi_riservati_risposte.py` il parametro `premio_id` così le nuove rotte sono controllate per campi riservati. Aggiunto al CI.

## 10. Per accenderlo (in ordine, non prima)
1. Regolamento chiuso (agente `legale` + avvocato per la parte «operazioni a premio»), pagina `/sconticini/regolamento` verificata, Privacy/Termini aggiornati **dopo** l'OK del titolare.
2. Prova su ambiente di prova con `SCONTICINI_ENABLED=true` e `EMAIL_ALLOWED_RECIPIENTS`.
3. Messaggio ai negozi (skill `lancio-commercianti`) e video aggiornato: prima i negozi, poi i clienti.
4. Solo allora `SCONTICINI_ENABLED=true` su Render.
