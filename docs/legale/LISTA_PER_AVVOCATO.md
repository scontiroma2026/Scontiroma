# Lista per l'avvocato: tutto ciò che non è stato chiuso con certezza

Regola del titolare (21/10): ciò di cui Claude e l'agente `legale` non sono sicuri **si chiude con la scelta più prudente e si scrive qui**, per farlo vedere a un avvocato (consigliata un'ora, soprattutto sui Termini per i negozi). Testi «chiusi dall'agente, non validati da un avvocato». Repository pubblico: nessun dato personale, nessun segreto. Le norme citate non sono state controllate sui testi ufficiali.

Legenda: 🔴 prima di accendere i pagamenti o il pre-lancio · 🟠 da valutare · 🟢 di conferma. «Punto» = numero in `DOMANDE_PER_IL_CONSULENTE.md`.

## Decisioni del titolare già prese (non vanno rimesse in discussione)
- Calendario email ai negozi (punto 3, 21/10): giorno 30 della prova, 7 giorni prima del primo pagamento, 3 giorni prima di ogni addebito; niente promemoria a 10 e 3 giorni (PR #199).
- IVA al 22% (punto 8, 21/10): confermata dal titolare. Resta da decidere chi emette la fattura.
- Stripe e PayPal titolari autonomi (15/10); Partita IVA obbligatoria; nessuna spunta foto per ora.
- Lista d'attesa pre-lancio **tolta** (02/11, PR #243): iscrizioni cancellate all'avvio del server. Le scelte del 21/10 (12 mesi, elenco di esclusione) non valgono più.

## Dati mancanti (segnaposto nei testi)
| Dato | Dove serve | Segnaposto |
|---|---|---|
| Chi emette la fattura elettronica e codice SdI/PEC da raccogliere | Termini 3.2 (punto 8) | `[DA COMPLETARE: emittente fattura]` |
| Visura camerale: REA, capitale, PEC, civico | Fondo del sito (punto 35) | `[DA COMPLETARE: REA / capitale / PEC]` |
| LocationIQ: ragione sociale, sede, DPA, conservazione | Privacy (punto 14) | `[DA COMPLETARE: LocationIQ]` |
| DPA Render, Atlas, Aruba; regione di Atlas; durata log di Render | Privacy (punti 15, 16) | `[DA COMPLETARE]` |

## Da far vedere all'avvocato (gruppi 1 e 2: Termini, prova e pagamenti)
| Punto | Rischio | Cosa abbiamo scelto | Cosa chiedere |
|---|---|---|---|
| 1 | 🟠 | Dal 31/10 (decisione del titolare): «Prova gratuita di 2 mesi (almeno 60 giorni)»; primo pagamento il primo giorno 1 del mese che cade almeno 60 giorni dopo la prima pubblicazione (giorni di Roma); prova da 60 a 90 giorni; due esempi con date. Tolta la regola «entro l'11 / dal 12» | «2 mesi» nel titolo è corretto anche quando la prova dura fino a 90 giorni? Regola ed esempi bastano? |
| 2 | 🟠 | Una sola frase: disdetta quando vuoi, effetto a fine mese, sconto da rispettare, mese pagato non rimborsabile; tolto «Nessun vincolo» | La formula è corretta verso un professionista? Va bene identica in Termini, email e guida? |
| 3 | 🟠 | Calendario di #169 (PR #199); 30 giorni solo per variazioni di prezzo | Il preavviso minimo per cambiare i Termini (P2B, 15 giorni da verificare) è rispettato? |
| 5 | 🟠 | Cancellazione dell'account negozio dal 1° del mese dopo se c'è un'offerta in corso (#102) | Il rinvio fino a un mese è compatibile con GDPR art. 12.3 e 17.3? |
| 6 | 🔴 | Una conferma con riepilogo + link ai Termini e alla Privacy + nome della società + registro di data, ora e versione dei testi | Basta una sola conferma per un professionista (D.Lgs. 70/2003 art. 12)? |
| 7 | 🔴 | Seconda casella (artt. 1341-1342 c.c.) anche alla schermata di pagamento, con rinnovo automatico, disdetta e mese non rimborsabile | L'elenco delle clausole da approvare per iscritto è completo? Numerazione degli articoli da fissare dopo la riscrittura dei Termini. |
| 8 | 🟠 | IVA 22% (decisa); emittente della fattura: segnaposto | Obblighi informativi minimi e fatturazione elettronica (SdI) |
| 9 | 🟠 | Stripe e PayPal titolari autonomi anche per l'antifrode; tolti dall'elenco dei responsabili | Il ruolo non cambia per le attività accessorie? |
| 10 | 🟠 | Frasi «dopo il giorno 5 vale per il mese successivo» e «la ricevuta non è un documento fiscale»; una sola email di sollecito al mese | Le frasi sono corrette? Nei Termini proposti (#157) la frase «fino a fine mese più il mese successivo» non c'è più: già corretta (dal 31/10 regola «almeno 60 giorni» con due esempi). Resta solo nell'email del giorno 30 (#169, spenta), da allineare lì |
| 11 | 🟠 | Testo prudente: «Autorizzi ora l'addebito automatico: il primo importo sarà addebitato solo il [data]» (evita «preautorizzato») | Tempi minimi di avviso nelle regole di Stripe e PayPal per le prove gratuite; il promemoria prima di ogni addebito serve per legge? |
| Storico sospensioni dei negozi | 🟠 | Decisione del titolare (23/10, PR #219 e #203): data e motivo di ogni sospensione o riattivazione conservati 24 mesi da ciascun evento, anche dopo la cancellazione dell'account; base giuridica legittimo interesse (rispondere ai reclami, difesa in caso di contestazioni). Riga aggiunta in Privacy art. 6. | 24 mesi anche dopo la cancellazione sono proporzionati (art. 5.1.e e 17.3.e GDPR)? Il legittimo interesse basta o serve un bilanciamento scritto? Va detto anche nella email di sospensione? |
| 12 | 🟢 | Tenuta la sezione sui servizi a pagamento futuri nel Recesso | Conferma |
| 1-bis | 🟠 | Prova di 60 giorni (31/10): il conteggio include il giorno della prima pubblicazione (pubblicazione 2/10 → prova fino al 30/11 = 60 giorni) e usa le date di Roma; scritto così nei Termini | Contare il giorno di pubblicazione come primo giorno di prova è corretto e chiaro («almeno 60 giorni»)? |
| 1-ter | 🟠 | Negozi già pubblicati prima del 31/10 con la vecchia regola (49-81 giorni): con la regola nuova la prova si allunga o resta uguale, mai si accorcia (scelta prudente: si applica la regola nuova a tutti, perché è sempre più favorevole) | Serve un'email di avviso del cambio ai negozi già iscritti (P2B, preavviso sulle modifiche dei Termini), anche se la modifica è solo a loro favore? |
| 1-quater | 🟠 | Email del giorno 30 della prova e altri messaggi ai negozi (`docs/comunicazione/`, kit, guida) dicono ancora «circa due mesi»: non toccati in questo lavoro (fuori da `docs/legale/` e dalle pagine legali) | Da allineare alla formula dei Termini prima di riaccendere gli invii |

## Fornitori: Aruba e Google/Gmail (21/10, non chiusi)
Letti da un agente solo in parte: i siti ufficiali non erano raggiungibili dall'ambiente; solo l'addendum di Google è stato letto (a metà). Il resto viene da risultati di ricerca, **da verificare sul testo originale**.
| Fornitore | Rischio | Cosa risulta | Cosa chiedere / fare |
|---|---|---|---|
| Aruba (dominio e posta) | 🟠 | La nomina a responsabile (art. 23 delle condizioni) sembra inclusa nel contratto. Non trovati: termine di notifica violazioni, cancellazione a fine servizio, elenco subfornitori, sede dei dati della posta. Dati del titolare visibili nel whois senza l'opzione privacy. | Basta la nomina dentro le condizioni generali come art. 28? Titolare: scaricare le condizioni in vigore dall'area clienti Aruba e chiedere al loro DPO (indirizzo da confermare). |
| Google / Gmail gratuito (casella privacy@) | 🔴 | Nessun contratto sui dati trovato per un Gmail gratuito; l'addendum vale per Workspace e piani a pagamento. | Tenere privacy@ su Gmail gratuito è accettabile finché non si cambia? Scelta del titolare: spostare su casella Aruba, oppure Workspace (circa 6,80 € per utente al mese, IVA esclusa, da controllare). |
Nella Privacy (#202, #203) non è scritto nulla su Aruba e Google. **18/11:** ora la Privacy li cita (art. 4), vedi la sezione «Testi legali allineati al codice (17-18/11)».

## Modifiche ai Termini con negozi già iscritti, e lista d'attesa (21/10)
| Tema | Rischio | Cosa abbiamo | Cosa chiedere |
|---|---|---|---|
| Negozi già iscritti prima delle modifiche ai Termini | 🟠 | All'iscrizione si salvano solo le due caselle spuntate, non la versione del testo visto. Esiste almeno un negozio iscritto il 21/10. | Come comunicare le modifiche (email con preavviso, art. 9 dei Termini; P2B: preavviso minimo da verificare)? Conviene salvare da ora la versione dei Termini accettata? |
| ~~Lista d'attesa: iscritti con consenso `2026-10-v1`~~ | 🟢 | **Superato il 02/11**: lista tolta e iscrizioni cancellate (PR #243); nessun avviso di lancio è partito né partirà. | Nessuna domanda: vedi la sezione «Lista d'attesa tolta (02/11)». |

## Lista d'attesa tolta (02/11)
Decisione del titolare del 02/11: lista d'attesa pre-lancio tolta (PR #243). All'avvio il server cancella tutte le iscrizioni (collezione `waitlist`). Privacy aggiornata in PR `[TESTO LEGALE]` (art. 2, 3, 4 e 6), versione dei testi `2026-11`. Scelte chiuse in modo prudente:
| Tema | Rischio | Cosa abbiamo scelto | Cosa chiedere |
|---|---|---|---|
| Avviso agli ex iscritti | 🟠 | **Nessuna email** agli iscritti per dire che la lista è chiusa: le email sono già cancellate e scrivere servirebbe un dato che non teniamo più; la chiusura è scritta nella Privacy (art. 6). | È sufficiente, o andava mandata un'email di chiusura prima di cancellare? Ormai non è più possibile. |
| Backup del database e registri di invio delle email | 🟠 | Frase prudente nella Privacy: le copie di sicurezza (backup di Atlas) e i registri di invio di Resend che possono ancora contenere le email si cancellano da soli alla loro scadenza e non vengono usati. Durata dei backup Atlas e dei registri Resend **non verificata**. | Va scritta una durata precisa? Serve cancellare anche dai backup (art. 17 GDPR) o basta non usarli fino alla scadenza? |
| Data della cancellazione | 🟢 | Nella Privacy: «lista chiusa il 2 novembre 2026», iscrizioni «cancellate dal nostro database». La cancellazione avviene al primo avvio del server con il codice della #243 (deploy su Render). | Il titolare conferma che il deploy è avvenuto (nel log: numero di iscrizioni cancellate)? |
| Versione dei testi | 🟢 | `LEGAL_VERSION` passa da `2026-10` a `2026-11`: chi si iscrive da ora registra la versione nuova; a chi è già iscritto non si chiede una nuova accettazione (togliere un trattamento non peggiora la sua posizione). | Conferma che non serve una nuova accettazione. |
| Domanda 13 del consulente | 🟢 | Superata: la lista non esiste più. | Togliere dalla lista dell'incontro. |

## Nome e pagina omonima su Facebook (24/10)
| Punto | Rischio | Cosa sappiamo | Domanda per l'avvocato |
|---|---|---|---|
| Pagina Facebook «ScontiRoma.it» di terzi | 🟠 | Pagina pubblica «Gruppo d'acquisto 100% romano», **creata a luglio 2012**, profilo aggiornato l'ultima volta circa 2 anni fa, circa 13.900 follower e 5.500 post: uso del nome per circa 12 anni; ultimi post (solo «ha aggiornato il suo stato») del 31/03/2024, quindi ferma da circa 19 mesi. Il campo «Sito web» indica ancora `www.scontiroma.it`, che oggi è il nostro dominio: con ogni probabilità il dominio era loro, non è stato rinnovato ed è stato registrato dalla società. Non li abbiamo contattati. | Un uso precedente del nome «Sconti Roma» / «ScontiRoma.it» da parte di terzi (marchio di fatto) è un rischio per noi? Conviene chiedere che tolgano il link o proporre di rilevare la pagina? Va fatto prima del deposito del marchio? |

## Altri gruppi
Gruppi 3–8 (punti 13–35): da aggiungere man mano che si chiudono con il titolare.

## Testi legali allineati al codice (17-18/11)
Decisione del titolare del 17/11: l'avvocato non risponde più, si va avanti da soli. Testi chiusi dall'agente `legale` con la scelta più prudente nella PR `[TESTO LEGALE] Testi legali allineati al codice (17/11)` (comprende la #244 e la correzione della #95), **[DA VALIDARE]**, si unisce solo con il «procedi» del titolare. Fonti: codice di `main` del 18/11, risposte pubbliche del sito lette in sola lettura il 18/11, registri della privacy del 18/11 (fuori dal repository). Sezione messa prima di «Sconticini» e non in fondo, perché la PR #255 aggiunge la sua sezione proprio in fondo: così le due PR non vanno in conflitto. Durata dell'offerta: non toccata, è nella #255.

| Punto | Rischio | Cosa abbiamo scelto (prudente) | Cosa chiedere |
|---|---|---|---|
| Posta e avvisi inoltrati a una Gmail gratuita | 🔴 | Scritto nella Privacy (art. 4): le email alle nostre caselle e gli avvisi interni (con email e telefono dei nuovi negozi, testo delle segnalazioni) arrivano anche a una casella Gmail. Nessun contratto sui dati con Google: la soluzione è del titolare (caselle Aruba senza inoltro, oppure Google Workspace con contratto) | Basta dichiararlo finché non si sposta la posta? Quanto è grave senza contratto art. 28? |
| Regione del server su Render | 🟠 | **Frase non toccata** («server a Francoforte»): il nome tecnico pubblico del server contiene «us-west1». Prima la verifica del titolare (Render → servizio → Settings → Region) | Se il server è negli USA: correggere Privacy (art. 4 e 5) e registro; bastano clausole standard e Data Privacy Framework? |
| WhatsApp Business (352 247 3526) | 🟠 | Privacy: numero, nome e immagine del profilo, testo, foto e file; solo per rispondere a chi scrive per primo; WhatsApp (gruppo Meta) titolare autonomo per i dati che tratta per sé; conservazione **12 mesi dall'ultimo messaggio**, poi cancellazione a mano (salvo reclami aperti). Il backup delle chat su iCloud o Google Drive non è dichiarato: da spegnere (decisione del titolare) | Il ruolo di WhatsApp per l'app WhatsApp Business è giusto (titolare autonomo o responsabile)? 12 mesi vanno bene? Serve il link alla Privacy nel profilo o nel messaggio di benvenuto (proposta della PR delle risposte rapide)? |
| Elenco «non ricontattare» | 🟠 | Solo nome dell'attività (per i negozi), canale e data; **12 mesi** dalla richiesta, come le altre righe dell'elenco privato (`docs/comunicazione/REGOLA_CONTATTO_NEGOZI.md`); legittimo interesse a rispettare l'opposizione (art. 21) | Si può tenere più a lungo, per non ricontattare per errore chi ha detto no? Per chi non è un negozio basta non scrivere più e cancellare il numero? |
| Cloudflare | 🟠 | Verificato in sola lettura (18/11): sito e server rispondono con «server: cloudflare» insieme a Render; DNS su Aruba verso indirizzi di Render, nessun account Cloudflare della società trovato. Scritto come **sub-responsabile di Render**; nella Cookie Policy: oggi nessun cookie, «può» impostare cookie tecnici di sicurezza | Il ruolo è giusto? Va nominato anche se è un sub-responsabile? |
| Amazon Web Services | 🟢 | Sub-responsabile di MongoDB Atlas (Francoforte) e di Resend (Amazon SES, Irlanda) | Conferma |
| Anthropic (Claude) | 🟠 | Dichiarato nella Privacy come assistente per sviluppo e controlli: vede dati solo quando serve, non scrive mai nel database. Tipo di abbonamento e contratto sui dati **da verificare** | Responsabile o altro ruolo? Serve un contratto (piano per aziende)? |
| Banner cookie: «funzionali» descritti male | 🟠 | Il banner diceva «preferenze come mappa e geolocalizzazione», ma la scelta accende solo le statistiche di visita: testo corretto. Le scelte già date restano valide e scadono comunque entro 6 mesi (il banner le richiede) | Serve chiedere di nuovo il consenso a tutti subito? Se sì: una riga di codice (`CONSENT_VERSION` 2) e l'adeguamento dei test |
| «Marketing» nel banner (PR #95) | 🟢 | Tolto: «Accetta tutti» e «Salva preferenze» lo lasciano sempre spento. Le scelte vecchie con marketing «sì» non hanno effetto (nessun cookie di marketing esiste) | Conferma |
| Registro delle scelte sui cookie | 🟢 | Dalla PR si cancella davvero dopo 24 mesi (indice di scadenza e pulizia all'avvio). Le righe dei consensi alle notifiche restano finché c'è l'account. L'indirizzo IP salvato è quello che arriva al server (di norma quello della rete del fornitore): frase prudente | Conferma |
| Statistiche di visita e registro delle scansioni senza scadenza | 🟠 | Codice **non toccato** (le durate aspettano la scelta del titolare, PR #114 non riportata). Privacy e Cookie Policy dicono la verità: «oggi non hanno una cancellazione automatica»; «Log di sicurezza: 12 mesi» tolto perché non vero | È accettabile per poco tempo? Durate proposte: scansioni 12 mesi, statistiche 13 mesi, sconti usati 24 mesi |
| `sr_vid` non è anonimo | 🟢 | Un identificativo casuale è pseudonimo: «anonimo» tolto da Cookie Policy e Privacy | Conferma |
| Negozio e volantino di provenienza nel browser | 🟠 | `referral_*`, `fonte_iscrizione*` e `fonte_visita_*` trattati come tecnici (statistica interna di prima parte, Linee guida del Garante 2021), ma il negozio e il volantino finiscono poi nell'account | Serve il consenso ai cookie «funzionali»? |
| Email ai negozi su prova e pagamenti | 🔴 prima dei pagamenti | Termini 3.2 e Privacy dicono giorno 30, 7 giorni prima del primo pagamento e 3 giorni prima di ogni addebito; il codice di `main` (spento con i pagamenti) manda invece 10 e 3 giorni prima della fine della prova. Testi non toccati (decisione del 21/10) | Prima di accendere i pagamenti: unire la #169 o allineare il codice |
| «Ci pensiamo noi» nei Termini | 🟠 | Paragrafo nuovo (art. 5, dopo il riquadro «Modifiche o rimozione»), dal testo di `PROPOSTA_CI_PENSIAMO_NOI.md`: gratuito, invisibile senza conferma, link di 7 giorni monouso, responsabilità del negozio dopo la conferma, prova conservata **finché c'è l'account** (come fa il codice) | Va tenuta la prova anche dopo la cancellazione dell'account (per esempio 2 anni, art. 17.3.e)? |
| Partita IVA dei negozi | 🟢 | Frasi della PR #147 in Termini (art. 2) e Privacy (art. 2 e 3) | Conferma |
| Omaggio | 🟢 | Definizione nell'art. 1 dei Termini («sconto oppure omaggio», regole uguali salvo i prezzi). Regole complete e manifestazioni a premio nella #255 (punto c della sua sezione) | Conferma |
| Notifiche push e «Migliora foto» | 🟠 | Privacy: «oggi non sono attive» e «oggi questa funzione è spenta». Prima di accendere `PUSH_UTENTI_ENABLED`: righe di `PROPOSTA_NOTIFICHE_PUSH.md`; prima di Gemini: piano a pagamento e nuova valutazione d'impatto | Conferma |
| LocationIQ | 🟠 | Privacy: «possiamo usare». Scelta prudente dei registri: non mettere la chiave su Render finché LocationIQ non conferma le clausole per l'India | Conferma |
| Segnalazioni con l'email dell'account | 🟢 | Se chi segnala ha fatto l'accesso, il codice salva l'email dell'account: ora lo dicono Privacy e Termini (art. 11) | Conferma |
| «Scarica i miei dati» incompleto, rettifica a mano | 🟠 | Privacy art. 7: cosa non c'è nel file e come chiederlo; nome ed email si correggono scrivendo dall'indirizzo dell'account | Basta finché l'esportazione non è completa? |
| Pagine social | 🟠 | Privacy art. 4.2: Instagram, Facebook, TikTok; contitolarità con Meta per le statistiche delle pagine (scelta prudente) | TikTok: stesso ruolo? Serve l'accordo di Meta citato per nome? |
| Eliminazione dell'account del negozio | 🟠 | Termini art. 5 su `main` dicono «fino a fine mese», il codice cancella subito: correzione già nella #255, qui non toccata | Vedi punto i) della sezione della #255 |
| Link nelle pagine legali | 🟢 | Tutti sottolineati e in grassetto (anche senza colori, WCAG 1.4.1); freccia ↗ per quelli che aprono un'altra scheda | — |

### Registri della privacy e contratti sui dati (18/11)
Preparati dall'agente `legale` il 18/11 **fuori dal repository** (registro dei trattamenti, violazioni, diritti, valutazione d'impatto, contratti, lettera al DPO di Aruba): vanno nella cartella privata della società. Qui solo i dubbi.
| Tema | Rischio | Cosa abbiamo scelto (prudente) | Cosa chiedere |
|---|---|---|---|
| Registro dei trattamenti (art. 30) | 🟠 | **Serve**: il trattamento non è occasionale (account, codici e email ogni giorno). 20 trattamenti descritti; registro come responsabile oggi non serve | Conferma che l'eccezione per meno di 250 dipendenti non vale |
| Valutazione d'impatto (DPIA, art. 35) | 🟠 | **Non obbligatoria oggi**, con due riserve: statistiche senza scadenza e attività sanitarie. Da rifare prima di Sconticini, notifiche per zona, «Migliora foto», molti più utenti | Conferma |
| Attività sanitarie (oggi l'unico negozio iscritto è uno studio odontoiatrico) | 🟠 | L'uso di uno sconto in un'attività sanitaria può rivelare un dato sulla salute (art. 9; causa C-21/23 da verificare). Per ora: nessun dato in più su quei clienti, nessuna statistica sul singolo, accesso solo del titolare; la Privacy non ne parla | Serve una base dell'art. 9.2 o un consenso? Si possono accettare altre attività sanitarie? |
| LocationIQ | 🟠 | Contratto sui dati online ma non letto; società in India senza garanzie trovate: **non accendere** finché non conferma per iscritto. Testo della richiesta in inglese pronto (lo manda il titolare) | Basta il contratto online? |
| Aruba (dominio, DNS, posta) | 🟠 | Nomina a responsabile che sembra nelle condizioni; lettera al DPO pronta (la manda il titolare dalla PEC) | Basta la nomina dentro le condizioni generali? |
| Tempi di conservazione proposti (codice non toccato) | 🟠 | Scansioni dei QR 12 mesi; statistiche 13 mesi; sconti usati 24 mesi; account inattivi 24 mesi con avviso; avvisi nella casella dell'amministratore 12 mesi; email e WhatsApp: 12 mesi nella Privacy (i registri proponevano 24); negozi contattati 12 mesi | Le durate sono giuste? Per account inattivi serve un avviso prima? |
| Basi giuridiche | 🟢 | Aggiunte nella Privacy: Partita IVA, recensioni e voto, segnalazioni, provenienza delle iscrizioni, avvisi interni, «Ci pensiamo noi», messaggi, «non ricontattare», pagine social | Sono quelle giuste (soprattutto «obbligo di legge» per segnalazioni DSA/P2B in una microimpresa)? |
| Diritti degli interessati | 🟠 | Procedura con risposta entro 1 mese e registro con numero di pratica (senza nomi). Esportazione incompleta e rettifica a mano dichiarate nella Privacy | Conferma |
| Cancellazione | 🟠 | «Elimina il mio account» cancella subito; restano segnalazioni e sospensioni (24 mesi), registro dei pagamenti (10 anni), messaggi nelle caselle e in WhatsApp (a mano), backup e log dei fornitori (scadono da soli) | È corretto dire che i backup scadono da soli senza cancellarli? |
| Negozi contattati (circa 232 attività da fonti pubbliche) | 🟠 | Legittimo interesse verso attività; serve un'informativa breve al primo contatto (art. 14): da mettere nel primo messaggio e nel copione (fuori da `docs/legale/`, non toccati) | Testo e momento dell'informativa breve |
| Ruoli di WhatsApp, Claude e Cloudflare | 🟠 | WhatsApp titolare autonomo; Claude da verificare (abbonamento); Cloudflare sub-responsabile di Render | Ruoli corretti? |
| Pagine social | 🟠 | Contitolarità con Meta per le statistiche delle pagine; TikTok da verificare | Conferma |
| Responsabile della protezione dei dati (DPO) | 🟢 | Non nominato: oggi non obbligatorio (niente monitoraggio su larga scala, niente dati particolari su larga scala); da rivalutare se crescono gli utenti o si accendono notifiche per zona, Sconticini o pagamenti | Conferma |

## Sconticini (PR #195, spenti)
- 🔴 Operazione a premio (D.P.R. 430/2001): il programma rientra? Chi è il promotore, serve cauzione/comunicazione? Finché non risponde, `SCONTICINI_ENABLED=false`.
- 🔴 Responsabilità del premio se il negozio non lo consegna.
- 🟠 Nome «Sconticini» (UIBM/EUIPO non verificati); dati nuovi (saldi, premi, eventi); nome mostrato al negozio («Mario R.»).
