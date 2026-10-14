# Valutazione: rendere privato il repository

Ultimo aggiornamento: 14/10/2026. **È una valutazione: il repository NON è stato reso privato.** Oggi è pubblico (verificato in sola lettura). I prezzi e i limiti di GitHub e Render qui sotto sono quelli che conosco: la rete dell'ambiente non mi lascia leggere le pagine dei prezzi, quindi vanno **riconfermati sui siti** prima di decidere (segnati «da verificare»).

## 1. Perché ci si pone il problema
Nel repository ci sono testi legali in bozza, strategie di lancio, regole di moderazione e copioni che oggi sono leggibili da chiunque. Un repository pubblico, però, ha due vantaggi: **controlli (GitHub Actions) senza limite di minuti** e **strumenti di sicurezza gratuiti**. Il costo vero del privato è quasi tutto lì.

## 2. Cosa cambia su Render
- Render si collega a GitHub con un'app autorizzata: con un repository privato l'app deve avere **accesso esplicito** a quel repository (GitHub → Settings → Applications → Render → Repository access). Se si cambia la visibilità, di solito il collegamento resta, ma i deploy falliscono se l'accesso non include il repository: **da verificare subito dopo il cambio** (un deploy di prova su un cambio di sola documentazione).
- I deploy automatici a ogni unione in `main` restano uguali. Le anteprime delle PR (link di prova sul telefono) funzionano con repository privati se il collegamento è corretto.
- Il Blueprint (`render.yaml`) funziona uguale. Costi di Render: **nessuna differenza**.
- Rischio: se l'accesso salta durante la finestra di lancio, nessun deploy parte. Quindi, se si decide, farlo **mai il giorno del lancio**, e mai il giorno prima: almeno una settimana prima o dopo.

## 3. Minuti di GitHub Actions (il punto più importante)
Misurato il 14/10 sui controlli reali degli ultimi 6 giorni (300 esecuzioni lette):
| Controllo | Esecuzioni in 6,3 giorni | Minuti fatturabili per esecuzione (media) | Minuti al giorno |
|---|---|---|---|
| CI (Server + Sito + end-to-end) | 220 (circa 35 al giorno) | circa 10,6 | circa 370 |
| Smoke produzione | 78 (circa 12 al giorno) | circa 2,7 | circa 33 |
| **Totale** | | | **circa 400 al giorno, circa 12.000 al mese** |

In un repository pubblico sono **gratuiti**. In un repository privato:
- Piano **GitHub Free**: 2.000 minuti al mese inclusi (da verificare). Al ritmo di questa settimana (giorni di lavoro intenso con molte PR) **finirebbero in circa cinque giorni**. Poi i controlli si fermano o si pagano a minuto (Linux: circa 0,008 $/minuto, da verificare): circa **80 $ al mese** al ritmo di oggi.
- Piano **GitHub Pro** (circa 4 $/mese, da verificare): 3.000 minuti inclusi: ancora insufficienti a questo ritmo.
- Un ritmo normale dopo il lancio sarà molto più basso (poche PR al giorno). Stima prudente: 8 esecuzioni CI al giorno + smoke = circa 120 minuti al giorno = **circa 3.500 al mese**: oltre Free, intorno a Pro.

**Come ridurre i minuti (modifiche al workflow, da fare in una PR a parte, non fatte ora):**
1. `concurrency` con `cancel-in-progress` sulle PR: un nuovo push annulla il controllo precedente.
2. `paths` o controlli condizionati: una PR solo di documentazione (`docs/**`) non lancia end-to-end, che dura più di tutti. (Attenzione alla regola «tutti i controlli verdi»: i controlli richiesti devono comunque risultare completati.)
3. Smoke di produzione una volta al giorno (c'è già `cron`) e non a ogni unione, o solo dopo il deploy.
4. Riduzione delle esecuzioni inutili: raggruppare più modifiche in una PR.
Con 1–3 si può scendere sotto circa 1.500–2.000 minuti al mese: sufficiente per Free, con margine stretto.

## 4. Altre differenze
| Tema | Pubblico (oggi) | Privato |
|---|---|---|
| Segreti finiti per errore nel codice | scansione e blocco dei push gratuiti | **non inclusi** nel piano Free (strumenti a pagamento per organizzazioni, da verificare) |
| Regole di protezione del ramo `main` («non unire se rosso») | disponibili | su Free per i repository privati **non disponibili** (servono Pro/Team, da verificare): oggi si affida alla regola scritta in `CLAUDE.md` |
| Aggiornamenti automatici di dipendenze, avvisi di vulnerabilità | gratuiti | di norma gratuiti anche sul privato (da verificare) |
| Visibilità dei testi in bozza e dei documenti | chiunque | solo collaboratori |
| Il passato | già copiato da chi lo ha letto | **i segreti già finiti nello storico restano bruciati**: rendere privato non li protegge |
| Fork esistenti | restano pubblici? | i fork pubblici di un repository che diventa privato sono staccati: da verificare se ne esistono |
| Anteprime di Render, CI, branch, PR | uguali | uguali (con l'accesso corretto) |

## 5. Costi
- Repository privato su Free: **0 $** per il repository, ma i minuti Actions (2.000) si esauriscono al ritmo attuale.
- Pro: circa **4 $ al mese**; minuti extra a consumo (limite di spesa da impostare a 0 per non avere sorprese).
- Render: **0 $** di differenza.
- Totale realistico: da 0 a circa 4 $/mese se si riducono i minuti, fino a oltre 80 $/mese se non si cambia nulla e si paga a consumo.

## 6. Raccomandazione (da decidere dal titolare)
1. **Non cambiare prima del lancio.** Nel periodo 18–31/10 si lancia, si deploya spesso e si incollano molte PR: la combinazione «Render + minuti finiti» è il rischio peggiore.
2. Fare **subito** (indipendentemente dal privato) la pulizia dei minuti del punto 3, che riduce anche i tempi di attesa delle PR.
3. Decidere dopo il lancio con un conto reale dei minuti di un mese; se si passa al privato, prendere **GitHub Pro** e limite di spesa a 0.
4. Nel frattempo vale la regola già presente: nessun segreto o dato personale reale nel repository.
5. Se il motivo è nascondere le bozze legali o strategiche: valutare di tenerle fuori dal repository (cartella privata) invece di nascondere tutto il codice.

## 7. Da verificare (non leggibile da qui)
- Piano GitHub attuale, minuti inclusi e prezzo per minuto.
- Se esistono fork del repository.
- Cosa succede al collegamento Render dopo il cambio (prova su un cambio banale).
- Se la protezione del ramo `main` è attiva oggi e se resterebbe in un repository privato.
