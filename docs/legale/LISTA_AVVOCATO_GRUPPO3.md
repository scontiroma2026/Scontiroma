# Lista per l'avvocato, gruppo 3 (punti 13 e 14): lista d'attesa e LocationIQ

Tutto `[DA VALIDARE]`: testi chiusi dall'agente `legale`, non validati da un avvocato. Da unire poi alle righe di `LISTA_PER_AVVOCATO.md` (che sta sulla PR #201, ramo `claude/lista-avvocato`; non è ancora su `main`). Repository pubblico: nessun dato personale, nessun segreto. Le norme citate non sono state controllate sui testi ufficiali.

Legenda: 🔴 prima di accendere il pre-lancio · 🟠 da valutare · 🟢 di conferma.

## Righe

| Punto | Rischio | Cosa abbiamo scelto | Cosa chiedere all'avvocato |
|---|---|---|---|
| 13 | 🔴 | Frase breve sotto il modulo (titolare, scopo, 12 mesi al massimo, come annullare, Resend con server in Irlanda, solo 18+, link alla Privacy) + voce completa nella Privacy (art. 2, 3, 4, 6). Un solo consenso (casella) per conferma e avviso di lancio; doppio passaggio con link nell'email (48 ore). | La frase breve più il link alla Privacy bastano come informativa (art. 13 GDPR) al momento della raccolta, o serve un livello in più? |
| 13 | 🟠 | Chi annulla: teniamo solo l'email per 12 mesi dall'annullamento come elenco di esclusione, base giuridica «legittimo interesse». | È una base giuridica e una durata difendibili, o conviene cancellare subito e accettare il rischio di riscrivere per errore? |
| 13 | 🟠 | Conservazione: non confermate cancellate dopo 7 giorni; confermate al massimo 12 mesi dall'iscrizione, anche se il lancio tarda. | I 12 mesi dalla data del consenso vanno bene o conviene chiedere di nuovo il consenso prima? |
| 13 | 🟢 | «Nel nostro database non salviamo l'indirizzo IP» (i log del server possono contenerlo; durata dei log di Render da leggere dal pannello). | Formula corretta? |
| 13 | 🟠 | Il testo del consenso (casella) è invariato; l'informativa è stata aggiunta sotto. La versione del consenso nel database (`2026-10-v1`) non è stata cambiata. | Se cambia l'informativa, va cambiata anche la versione del consenso registrata? |
| 14 | 🔴 | LocationIQ citato nella Privacy con formula prudente: «servizio esterno di geocodifica degli indirizzi dei negozi, con sede fuori dall'UE; l'indirizzo viene inviato dal nostro server». Nessuna ragione sociale, DPA o durata scritti, perché non verificati. | Basta questa formula? Quali dati servono (ragione sociale, sede, DPA art. 28, trasferimento extra-UE, conservazione) prima di nominarlo responsabile? |
| 15 | 🟠 | DPA Render, Atlas e Resend letti da Claude (schede in `docs/legale/`, PR #194), non validati da un avvocato: Render responsabile, server a Francoforte (UE), SCC con foro in Irlanda; Atlas responsabile, cluster AWS Francoforte, SCC; Resend con DPA, SOC 2, server di invio in Irlanda. Il titolare ha detto «dovrebbe essere tutto ok», non «sicuro». Aruba, Google/Gmail e LocationIQ da chiudere. | Le letture sono corrette? Come chiudere Aruba (dominio e posta), Google (Gemini) e la Gmail usata per `privacy@`? |
| 9 | 🟠 | Stripe e PayPal tolti dall'elenco dei responsabili e descritti come titolari autonomi (come art. 2), solo quando i pagamenti saranno accesi. | Il ruolo non cambia per le attività accessorie (antifrode)? |

## Cosa non è stato fatto
- La Privacy non cita Aruba né Gmail: restano da chiudere con il titolare.
- Nessuna data di conservazione di LocationIQ.
