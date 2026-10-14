# Lista d'attesa e codici fonte: controllo del codice e proposte

Controllo fatto il 14/10 **leggendo il codice** su `main` (dopo la PR #141): `backend/server.py` (lista d'attesa, righe 1418–1575 e 4411–4540), `frontend/src/components/ListaAttesaForm.jsx`, `PrelaunchHome.jsx`, `pages/Landing.jsx`, `lib/referral.js`, test `backend/tests/test_lista_attesa.py`. **Nessun file di codice né testo legale è stato modificato.** Non ho provato il sito da un telefono: la prova da iPhone resta del titolare.

## 1. Cosa fa oggi la lista d'attesa (fatti)
- Funziona solo con `PRELAUNCH_MODE` acceso (di serie **spento**). Spento: `POST /api/prelaunch/waitlist` risponde 404 e la home è quella normale con l'invito a registrarsi. **Quindi nessun link o QR della campagna va pubblicato prima di accendere l'interruttore e provare dall'iPhone.**
- Acceso: la home dice «Stiamo arrivando a Roma e dintorni» (nessuna data, nessun numero, 18+, modulo «Avvisami quando parte», sezione «Hai un negozio?»). Coerente con la campagna.
- Il modulo legge la fonte dall'indirizzo: `?src=` oppure `?fonte=` (`ListaAttesaForm.jsx`) e la manda al server.
- **Il server riduce la fonte a una lista chiusa** (`_waitlist_fonte`): `instagram`, `facebook`, `volantino`, `passaparola`; chi non ha fonte è `diretto`; **qualsiasi altra cosa diventa `altro`**. Si riconosce il prefisso seguito da un trattino (`volantino-qualunque` → `volantino`). Il test `test_lista_attesa.py` lo conferma (un codice che comincia per `volantino-` → `volantino`, `tiktok` → `altro`).
- Doppio consenso con link a 48 ore, non confermati cancellati dopo 7 giorni, nessun IP né cookie, avviso unico di lancio con parola **AVVISA** nell'admin (tetto 80 al giorno), CSV delle sole confermate, conteggi per fonte nella scheda admin «Lista d'attesa».

## 2. Cosa non torna con la campagna (da correggere nei testi o nel codice)
1. **I codici di `CONTENUTI_SOCIAL.md` §1 (`ig-bio`, `ig-storia`, `ig-reel`, `fb-pagina`, `gruppo-01`, `video-amici`, `negozi-dm`) finirebbero tutti in «altro»** nella lista d'attesa, tranne `volantino-clienti`. Risolto nei testi: la tabella di §1 di `CONTENUTI_SOCIAL.md` ora usa i codici validi qui sotto.
2. **Non si può distinguere gruppo da gruppo.** `facebook-gruppo-01` e `facebook-gruppo-02` sono entrambi «facebook». Due strade: (a) **senza codice**: un gruppo per giorno e si guarda di quanto sale «facebook» nella scheda admin (semplice, impreciso); (b) **piccola modifica al codice** (proposta in §4, da approvare).
3. **Il conteggio «Iscrizioni per fonte» dell'admin e del riepilogo settimanale conta i clienti registrati** (`fonte_iscrizione`, qualsiasi codice valido `^[a-z0-9-]{1,40}$`), **non la lista d'attesa**. Prima del lancio quindi mostrerà zero; la lista ha il suo conteggio nella scheda «Lista d'attesa». Dopo il lancio i codici funzionano anche per la registrazione.
4. **Negozi: la fonte non si misura.** `fonte` viene salvata solo per chi si registra come cliente. Un QR o un link per i negozi con `?fonte=` non lascia traccia; per i negozi si conta a mano (risposte ai messaggi).
5. **Memoria del telefono.** `Landing.jsx` salva `?fonte=` nel `localStorage` per 30 giorni **anche in pre-lancio** (`salvaFonte`), mentre il commento di `ListaAttesaForm.jsx` dice «non usa cookie né memoria del telefono» (vero per il modulo, non per la home). Non è un cookie e non contiene dati personali, ma la Privacy/Cookie in revisione parlano di «cookie di attribuzione ridotti»: **da far verificare al consulente** (non toccato).
6. **Limite delle email.** Ogni iscrizione manda subito un'email di conferma (Resend). Il piano gratuito ha un tetto di 100 email al giorno (`MIGRAZIONE.md`, `BOZZA_LISTA_ATTESA.md` §5): se un post va bene e le iscrizioni superano il tetto, le conferme in eccesso falliscono (il codice lo registra ma non avvisa l'iscritto) e l'avviso di lancio ha già un tetto di 80 al giorno. **Da controllare il piano Resend in uso prima del 22/10** (non verificato da qui).
7. La pagina non nomina «gratuita nella fase di lancio»: non è obbligatorio, ma la campagna la ripete sempre. Se si vuole, una riga in più nella home: è una modifica di testo del sito, da decidere (non fatta).
8. La parola «AVVISA» è già nel codice come conferma admin dell'invio dell'avviso. Nei social è invece la parola che chi legge scrive per ricevere il link: usi diversi, nessun conflitto tecnico (la risposta a AVVISA è manuale, `CALENDARIO_PRONTO.md` §6).

## 3. Codici fonte consigliati (8, validi oggi)
Link: `https://scontiroma.it/?fonte=<codice>` (lettere minuscole, numeri, trattini, massimo 40 caratteri).
| # | Codice | Dove si usa | Come lo conta oggi la lista |
|---|---|---|---|
| 1 | `instagram-bio` | Link nella bio di Instagram | instagram |
| 2 | `instagram-storia` | Adesivo link nelle storie | instagram |
| 3 | `instagram-reel` | Reel (V4, V1, V5, V6): se Instagram permette il link, altrimenti la bio | instagram |
| 4 | `instagram-commento` | Risposta a chi scrive AVVISA su Instagram | instagram |
| 5 | `facebook-pagina` | Pulsante e post della Pagina Facebook | facebook |
| 6 | `facebook-gruppo-01` (`-02`, …) | Un codice per ogni gruppo con permesso; la tabella codice-gruppo sta **solo nell'elenco privato** | facebook (senza modifica al codice) |
| 7 | `volantino-clienti` | QR della cartolina clienti (M5) | volantino |
| 8 | `passaparola-whatsapp` | Stati e risposte WhatsApp Business, link mandati agli amici | passaparola |
Facoltativi: `volantino-locandina` (QR delle locandine dei negozi dal lancio), `passaparola-amici` (link da condividere). I negozi non hanno codice (punto 4 del §2): il QR della cartolina negozi può puntare direttamente a `https://scontiroma.it/per-i-commercianti`.

## 4. Proposta di modifica al codice (NON applicata, da approvare)
Per distinguere i gruppi nella lista d'attesa serve **un secondo campo**, `src_dettaglio`, con la fonte intera se rispetta `^[a-z0-9-]{1,40}$` (altrimenti vuoto), accanto a `src` che resta generico. Circa 10 righe in `server.py` (`campi` dell'iscrizione, `_waitlist_riepilogo` per mostrare il dettaglio) più il test. Effetti: nessun dato personale in più (è il codice del link, non un nome), ma **la Privacy descrive una «provenienza generica da un elenco fisso»**: la frase va allineata e fatta vedere al consulente. Finché non è approvata, si usa la strada (a) del §2 punto 2. Se il titolare approva, la fa un'altra PR.

## 5. Controlli sugli URL e sui QR
- `https://scontiroma.it/?fonte=volantino-clienti` apre la home (in pre-lancio la pagina «Stiamo arrivando» con il modulo): ok per il QR della cartolina. Il QR deve essere nero su bianco, almeno 3×3 cm, provato da due telefoni.
- L'indirizzo deve restare con la sola parte `?fonte=…`: se un telefono apre prima un'altra pagina del sito e poi la home, la fonte si perde nel modulo (si legge dall'indirizzo del momento), ma `Landing` l'ha già ricordata per i clienti registrati.
- Le pagine `/lista-attesa/conferma` e `/lista-attesa/annulla` esistono e sono raggiunte dai link dell'email.
- **Prima della pubblicazione** (titolare, da iPhone): iscrizione con un'email vera di prova → email di conferma (guarda anche lo spam) → conferma → «Iscrizione confermata» → annullamento dall'email. Poi dire a Claude l'esito.
- Non stampare nessuna cartolina prima che `PRELAUNCH_MODE` sia acceso e la prova sia riuscita.
