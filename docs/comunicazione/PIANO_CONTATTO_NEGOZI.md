# Piano per contattare i negozi dal 19/10

Stato al 14/10/2026. **Nessuno è stato contattato, nulla è stato pubblicato, nessun credito è stato speso.** Questa PR contiene solo documenti e la guida di una pagina; non unisce né chiude altre PR.

## 1. Cosa fare delle PR esistenti (proposta)
Lo stato dei controlli (CI) non è leggibile dall'ambiente (nessuno stato riportato): prima di ogni unione va guardato.

| PR | Cosa contiene | Proposta | Perché |
|---|---|---|---|
| **#41** Kit messaggi (`docs/commercianti/MESSAGGI.md`) | WhatsApp, Instagram, Facebook, email, telefonata, SMS | **SCARTARE** (chiudere senza unire) | Sostituita da `KIT_MESSAGGI_NEGOZI.md`. Ha ancora «quartiere», «preavviso di 30 giorni», «senza vincoli» (non decisi) e il «disdici quando vuoi» senza la precisazione sull'offerta in corso e il prezzo nel primo messaggio. Le «Regole d'uso» sono state riprese qui |
| **#62** Video v13 | Cartella `progetto_v13`, riprese con app vecchia, 32 file | **SCARTARE** | Superata dal v14 (app nuova, niente quartieri). Il titolare ha comunque già deciso i tre punti di voce; nessun valore da riprendere |
| **#120** Video v14 (bozza) | Copione, riprese, montaggio; video fuori dal repository | **AGGIORNARE, poi unire** (dopo la scelta della voce) | È il video buono. Da cambiare nel `COPIONE_v14.md`: frase sulla disdetta decisa dal titolare (riga a parte), esempio senza prezzi, «+ IVA» già a posto. Il copione parlato aggiornato è in `COPIONI_VOCE_ELEVENLABS.md`. **Video non pubblicabile** finché i Termini (#116) non sono validati. Il COPIONE contiene due versioni dello stesso stato (muto / con voci Fernando ed Enea): chiarire nel testo quale è l'ultima |
| **#127** Manuali operativi (bozza) | Criteri di approvazione, risposte info/partner, social | **TENERE IN BOZZA** (non unire ora) | Ha testi con rilievo legale ([DA VALIDARE]); serve per le risposte dopo i primi contatti. Unire dopo il consulente |
| **#128** Guida negozi, costi, emergenze (bozza, in conflitto) | Guida A4, `COSTI_MENSILI.md`, `EMERGENZE_E_ACCESSI.md` | **DIVIDERE**: guida **scartata da #128** (la versione finale è in questa PR, con la frase decisa sulla disdetta); `COSTI_MENSILI` ed `EMERGENZE_E_ACCESSI` **da unire a parte** dopo il rebase (il ramo ha conflitti) | La guida di #128 dice «Puoi disdire quando vuoi» e rimanda al pulsante «Disdici»: non è la frase decisa. Per evitare un conflitto tra file uguali, la nuova guida sta in `docs/comunicazione/guida-negozi/` (non in `docs/commercianti/guida/`) |
| **#139** Locandina negozio: «Roma e dintorni» + Manrope | Codice `Locandina.jsx` + test e2e | **UNIRE** (dopo rebase e controlli verdi) | Piccola, corregge «quartiere» e il carattere; i test e2e sono già stati eseguiti dall'autore. Serve per la locandina che i negozi stampano dall'app |
| (fuori elenco) 10 locandine A4 in `docs/comunicazione/locandine/` | Ancora in Fraunces e con temi stagionali | **Decidere**: passare a Manrope e usare solo `app-chiara` | Lo chiede già #139. Non è un blocco per il 19/10 |

**Ordine consigliato:** (1) #139; (2) questa PR; (3) #128 ridotta (costi ed emergenze); (4) #120 dopo la scelta della voce; (5) #127 dopo il consulente. #41 e #62 vanno chiuse dal titolare (nessun ramo cancellato).

## 2. Cosa cambia nei materiali (versione finale)
| Materiale | File | Novità |
|---|---|---|
| Kit messaggi | `KIT_MESSAGGI_NEGOZI.md` | In negozio, WhatsApp (e promemoria), Instagram, email; risposte alle domande; modo gentile per dire no in ogni messaggio; regole d'uso; controllo prima dell'invio |
| Guida di una pagina (A4 orizzontale) | `guida-negozi/guida-prima-offerta.{html,pdf,png}` | Testi da #128, «Roma e dintorni», «gratuita nella fase di lancio», «circa due mesi di prova», 18+; **«Come disdire»** con la frase decisa dal titolare |
| Copioni da leggere | `COPIONI_VOCE_ELEVENLABS.md` | Video v14 e guida, riga per riga, senza generare nulla |
| Scheda di prospezione | `SCHEDA_PROSPEZIONE_NEGOZI.md` | Criteri, ricerca, orari, script, obiezioni, tracciamento |
| Modello del foglio | `modello_tracciamento_negozi.csv` | Solo intestazione, nessun dato |

Regole rispettate: nessuna percentuale, nessun «gratis per sempre», «nessuna commissione», «prezzo bloccato», «nessun vincolo»; nessun nome di persona né contatto personale; nessun elenco di attività reali nel repository (il file con i nomi è privato).

## 3. Cosa deve decidere il titolare (la disdetta è già decisa)
1. **Frase sulla disdetta: DECISA dal titolare** e inserita ovunque (kit, guida, copioni, scheda): «Disdici quando vuoi, porti avanti solo l'offerta che è in corso a fine mese.» (decisione esplicita del titolare, che ha sostituito la formula precedente). **«Disdici quando vuoi» va fatto vedere al consulente** prima dell'uso: finora la evitavamo, ora è ammessa solo in questa frase intera. Non si usano altre formule («puoi smettere quando vuoi», «nessun vincolo»).
2. **Il prezzo (4,99 € + IVA)** nei messaggi: la proposta è non scriverlo nel primo contatto (solo a richiesta e nella guida). Va bene?
3. **Quando si può usare «circa due mesi di prova»** nei messaggi e nel video: dopo il consulente e i Termini (#116).
4. **Voce del video** (Fernando o Enea) e permesso ai crediti ElevenLabs per le righe cambiate.
5. **Esempio del video senza prezzi** («50 → 30» fa intuire una percentuale): va tolto anche dallo schermo?
6. **Locandine A4**: passare a Manrope e usare solo `app-chiara`?
7. **Chi chiude #41 e #62**.

## 4. Checklist per il 19/10 (cosa serve al titolare)
**Prima del giro (entro sabato 17/10)**
- [ ] OK del consulente ai testi (kit e guida), compresa la frase sulla disdetta già decisa — senza non si parte con «prova» e prezzo
- [ ] **Stampare la guida di una pagina** (PDF in `guida-negozi/`, A4 orizzontale, a colori, 40 copie per i primi 30 negozi + scorta)
- [ ] **QR dei negozi:** controllare che il link con `?fonte=volantino-negozi` si apra da due telefoni diversi; un QR nero su bianco, grande almeno 2 cm per la card
- [ ] **Card da lasciare** (formato biglietto o A6): nome «Sconti Roma», scontiroma.it, QR, 18+; 40-60 pezzi. (Testo della cartolina: `campagna-prelancio/ELENCO_VOLANTINI_E_MATERIALI.md`, M6)
- [ ] **Cartellina** con: guide, card, penna, foglio di tracciamento stampato (o telefono con il foglio privato), questa pagina del kit
- [ ] **Foglio di tracciamento privato** (copia del modello CSV) e la lista dei primi 30, controllata su Google Maps
- [ ] Telefono carico, con un'offerta di prova già visibile da mostrare (sito di prova o negozio finto)
- [ ] Il sito e la posta `info@` funzionanti (LISTA_LANCIO A.3): se un negozio scrive, deve arrivare una risposta
**Il giorno**
- [ ] Un giro di 5-6 negozi, in orari calmi (scheda di prospezione §4)
- [ ] Annotare l'esito subito; chi dice no non si ricontatta
**Non serve (e non si fa)**
- [ ] Niente video pubblicato, niente messaggi in serie, niente WhatsApp a chi non ha dato il numero

## 5. Cosa non ho potuto verificare
- Lo stato dei controlli (CI) delle PR (nessuno stato leggibile).
- Orari, giorni di chiusura e indirizzi esatti dei negozi trovati, e se sono ancora aperti.
- Il numero di attività per categoria a Roma (dato ufficiale Infocamere non raggiungibile).
- Quali orari funzionano davvero (nessuna fonte: ipotesi).
- Le regole per i contatti commerciali alle imprese (Registro delle opposizioni, art. 130): da far vedere al consulente.
- Il testo dei Termini attuali sui punti «prova» e «disdetta» (testi legali non toccati).
- Che i pulsanti e le schermate della guida corrispondano all'app del giorno 19/10: le schermate vengono dalla PR #128 (13/10).
