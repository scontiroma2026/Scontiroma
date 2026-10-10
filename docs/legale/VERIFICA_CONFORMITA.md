# Verifica di conformità: Privacy, Cookie, Recesso e obblighi collegati

Redatta il 10/10/2026 leggendo i testi **pubblicati in produzione** (Privacy, Cookie, Recesso) e il codice che li riguarda.
Il documento dei **Termini** è già in `docs/legale/REVISIONE_TERMINI.md` (PR #76): qui non si ripete.

> **Non è un parere legale.** È un elenco di controlli e di domande per il consulente.
> Nessun testo del sito è stato modificato: le frasi sono solo proposte (sezione finale).
> Repository pubblico: nessun segreto né dato di persone reali.

Legenda: 🔴 da sistemare prima del lancio · 🟠 da valutare con il consulente · 🟡 miglioramento

## Riepilogo

| Area | 🔴 | 🟠 | 🟡 |
|---|---|---|---|
| Privacy (GDPR) | 1 | 4 | 2 |
| Cookie (ePrivacy, Garante 2021) | 0 | 2 | 2 |
| Recesso (Codice del Consumo) | 0 | 1 | 1 |
| Altre norme (P2B, DSA, Omnibus, dati societari) | 1 | 3 | 0 |
| Documenti interni mancanti | 0 | 4 | 1 |
| **Totale** | **2** | **14** | **6** |

## 1. Privacy Policy (artt. 12-14 GDPR)

| # | Gravità | Cosa | Perché conta | Proposta |
|---|---|---|---|---|
| P1 | 🔴 | **LocationIQ non è elencato** tra i fornitori. Il server usa LocationIQ (se la chiave è su Render, è così) per trasformare gli indirizzi dei negozi in coordinate. La Privacy cita solo Nominatim. | Art. 13.1.e: vanno indicati i destinatari. Il fornitore ha sede fuori UE (art. 13.1.f). | Aggiungere LocationIQ nei fornitori e tra i trasferimenti extra-UE; verificare il suo contratto sul trattamento dei dati (DPA). |
| P2 | 🟠 | **Sede legale e PEC assenti** nel testo pubblicato; c'è la frase «per conoscere la sede legale e la PEC scrivi a privacy@». | Art. 13.1.a: identità e contatti del titolare. | PR #40 (sede). Aggiungere la PEC appena c'è e togliere la frase. |
| P3 | 🟠 | **Mancano informazioni obbligatorie**: assenza di processi decisionali automatizzati/profilazione (art. 13.2.f); DPO non designato (art. 13.1.b, basta dire che non è obbligatorio); durata del registro dei consensi nella tabella di conservazione. | Informativa incompleta. | Vedi frasi proposte. |
| P4 | 🟠 | **Tabella «finalità e basi giuridiche» non copre tutto**: valutazioni sull'app, attribuzione dell'iscrizione al negozio da QR, dati visibili all'amministratore, dati mostrati al commerciante dopo la scansione, contatore anonimo «Fammi sapere quando arrivate». | Art. 13.1.c: ogni finalità ha la sua base giuridica. | Aggiungere le righe con base: contratto (6.1.b) o legittimo interesse (6.1.f) con breve valutazione di bilanciamento. |
| P5 | 🟠 | **Trasferimenti extra-UE** descritti in modo generico («SCC o decisioni di adeguatezza»). Resend, Render, Google e LocationIQ sono società USA. | Art. 13.1.f / artt. 44-46: indicare lo strumento per ciascun fornitore (certificazione EU-US Data Privacy Framework oppure SCC). | Tabella fornitore → strumento, in `docs/legale/DATI_AZIENDA_E_DPA.md`. |
| P6 | 🟡 | Geolocalizzazione: «consenso esplicito». | Basta il consenso (art. 6.1.a); «esplicito» è riservato ai dati particolari. Poiché la posizione resta sul telefono, si può dirlo e basta. | Semplificare. |
| P7 | 🟡 | Cancellazione «subito» alla chiusura dell'account. | Quando ci saranno i **backup di Atlas** le copie restano per il periodo di conservazione dei backup. | Aggiungere «le copie di sicurezza vengono eliminate entro … giorni». |

Controlli superati: titolare indicato con P.IVA; base giuridica per i principali trattamenti; elenco diritti (artt. 15-22); reclamo al Garante; maggiorenni (18+); sicurezza descritta; consenso separato per le promozioni; elenco chiaro di cosa vede il commerciante e cosa vede l'amministratore (nome e cognome, già inserito).

## 2. Cookie Policy (art. 122 Codice Privacy, Linee guida del Garante del 10/06/2021)

| # | Gravità | Cosa | Perché conta | Proposta |
|---|---|---|---|---|
| C1 | 🟠 | Nella memoria del browser, classificati come «tecnici», ci sono `referral_merchant_id` (30 giorni, attribuisce l'iscrizione al negozio) e `app_feedback_secondi_v1` (conta il tempo d'uso). | Per le Linee guida è «tecnico» solo ciò che serve a fornire il servizio richiesto dall'utente. L'attribuzione ai negozi e il conteggio del tempo hanno finalità nostre. | Chiedere al consulente se servono il consenso; in alternativa ridurre i dati (es. attribuzione solo al momento dell'iscrizione) e spiegarlo. |
| C2 | 🟠 | **Banner**: nella finestra «Personalizza» c'è una categoria «marketing», mentre la policy dice che non usiamo cookie di marketing. Va controllato a vista che **«Rifiuta» abbia lo stesso rilievo di «Accetta tutti»**, che la X in alto valga rifiuto e che nulla sia già spuntato. | Linee guida 2021: stesso peso grafico, nessun consenso con scorrimento, chiusura = rifiuto. | Togliere la categoria marketing finché non esiste; provare il banner da iPhone. |
| C3 | 🟡 | Registro del consenso con IP, 24 mesi. | Va bene per provare il consenso (art. 7.1), ma serve una riga sulla base giuridica e, se possibile, ridurre l'IP. | Indicare la base (obbligo di dimostrare il consenso) e valutare IP abbreviato. |
| C4 | 🟡 | Tabella delle durate: alcune sono «fino a cancellazione». | Il Garante chiede durate chiare. | Mettere un massimo (es. 12 mesi) dove possibile. |

Controlli superati: elenco dei cookie con nome, scopo e durata; cookie funzionali (`sr_vid`) solo dopo consenso; banner richiamabile da «Gestisci cookie»; nuova richiesta dopo 6 mesi; nessun cookie di profilazione né analytics di terzi.

## 3. Recesso (artt. 52 ss. Codice del Consumo)

| # | Gravità | Cosa | Proposta |
|---|---|---|---|
| R1 | 🟠 | Oggi il servizio è gratuito per i clienti, quindi non c'è recesso. Quando ci saranno servizi a pagamento per **consumatori** serviranno: informazioni precontrattuali (art. 49), pulsante «ordina con obbligo di pagare» (art. 51), modulo tipo di recesso, conferma su supporto durevole. | Già annunciato nel testo: preparare i testi **prima** di accendere i pagamenti ai consumatori. |
| R2 | 🟡 | «Subito» (dall'app) e «entro 3 giorni lavorativi» (via email) sono coerenti. | Nessuna modifica; citare che il termine massimo di legge è un mese (art. 12 GDPR). |

Per i **commercianti** (professionisti) il recesso del consumatore non si applica; contano i Termini (rinnovo, preavviso, disdetta, vedi `REVISIONE_TERMINI.md`).

## 4. Altre norme da far verificare al consulente

| # | Gravità | Norma | Perché potrebbe riguardarci | Cosa controllare |
|---|---|---|---|---|
| N1 | 🔴 | **Regolamento UE 2019/1150 (P2B)** | Sconti Roma è un servizio di intermediazione online fra commercianti e consumatori. | Termini scritti in modo chiaro; **preavviso di 15 giorni** per le modifiche; **motivazioni** per sospensione o chiusura; **descrizione dei criteri di posizionamento** delle offerte; sistema interno di **reclami**; indicazione di un mediatore. A mio avviso va verificato prima del lancio. |
| N2 | 🟠 | **Regolamento UE 2022/2065 (DSA)** | Ospitiamo foto e testi dei commercianti (servizio di hosting). | Punto di contatto per autorità e utenti (art. 11-12), meccanismo di **segnalazione di contenuti illeciti** (art. 16), condizioni chiare (art. 14). Le microimprese hanno alleggerimenti solo su alcune parti. |
| N3 | 🟠 | **Annunci di sconto (Omnibus, Codice del Consumo)** | L'app mostra prezzo originale e prezzo scontato. | Chi annuncia la riduzione deve indicare il prezzo precedente (il più basso dei 30 giorni prima). Nei Termini il commerciante deve garantire prezzi veritieri; valutare i dati sul «mercato online» (chi è il professionista che vende). |
| N4 | 🟠 | **Art. 2250 c.c. e D.Lgs. 70/2003, art. 7** | Dati societari obbligatori sul sito. | Ragione sociale, sede legale, **numero REA**, **capitale sociale** (e «i.v.»), P.IVA, PEC, eventuale liquidazione/socio unico. Oggi ci sono ragione sociale e P.IVA; sede in PR #40; mancano REA, capitale, PEC. |
| N5 | 🟡 | **Messaggi promozionali per email (art. 130 Codice Privacy)** | Consenso separato già previsto. | Nessuna azione; mantenere il consenso registrato. |

## 5. Documenti interni che mancano (non sono testi del sito)

| # | Gravità | Documento | Note |
|---|---|---|---|
| D1 | 🟠 | **Registro dei trattamenti** (art. 30 GDPR) | Il trattamento non è occasionale: serve. Posso preparare la bozza. |
| D2 | 🟠 | **Procedura per violazioni dei dati** (artt. 33-34: avviso al Garante entro 72 ore) | Una pagina: chi decide, cosa si controlla, come si avvisano utenti e Garante. Posso prepararla. |
| D3 | 🟠 | **Istruzioni alle persone autorizzate** (art. 29) | Chi accede all'area amministrazione e cosa può fare con nomi ed email. |
| D4 | 🟠 | **Contratti sul trattamento dei dati con i fornitori** (art. 28) | Tabella in `docs/legale/DATI_AZIENDA_E_DPA.md`. |
| D5 | 🟡 | Valutazione di bilanciamento per il «legittimo interesse» (frodi, sicurezza) | Mezza pagina. |

## 6. Frasi proposte (da far validare, non pubblicate)

**Privacy, art. 4 (fornitori).** «LocationIQ (Unwired Labs, USA) — conversione degli indirizzi dei negozi in coordinate sulla mappa; riceve solo il testo dell'indirizzo, inviato dai nostri server.»

**Privacy, art. 1.** «Il Titolare non ha designato un Responsabile della protezione dei dati (DPO), perché non è obbligatorio nel suo caso.»

**Privacy, art. 2.** «Non adottiamo decisioni basate unicamente su trattamenti automatizzati né attività di profilazione.»

**Privacy, art. 6.** «Registro dei consensi ai cookie: 24 mesi. Copie di sicurezza (backup): fino a … giorni dalla cancellazione.»

**Privacy, tabella finalità.** Aggiungere: «Valutazioni sull'app → legittimo interesse (miglioramento del servizio)»; «Attribuzione dell'iscrizione al negozio da QR → legittimo interesse (sapere quali negozi portano clienti)»; «Visibilità dei dati all'amministratore → esecuzione del contratto e legittimo interesse (assistenza e sicurezza)».

**Cookie, art. 2.1.** Valutare se spostare `referral_merchant_id` e `app_feedback_secondi_v1` tra le categorie che richiedono consenso, oppure riscrivere la funzione in modo che sia strettamente necessaria.

## Cosa serve da te

1. Numero **REA**, **capitale sociale** e **PEC** di Euro Linea S.r.l.s. (dalla visura camerale).
2. Conferma che Sconti Roma usa **LocationIQ** in produzione (la chiave è su Render): se sì, P1 va corretto.
3. Se portare questi documenti al consulente: li unisco in un unico elenco di domande.
