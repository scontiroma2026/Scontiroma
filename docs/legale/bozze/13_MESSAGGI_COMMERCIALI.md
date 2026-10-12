# 13 - Regole per i messaggi commerciali (art. 130 Codice privacy; Direttiva ePrivacy)

> **Rischio: 🟠 medio: primo contatto ai negozi (B2B), consenso e opt-out; regole social aggiunte.**
> **[PROPOSTA] [DA VALIDARE]** - Regole interne per email, SMS e WhatsApp. Valgono per i messaggi di Sconti Roma a Clienti e Commercianti, **non** per le email di servizio (conferme, recupero password, avvisi sul proprio account).

## 1. Distinzione
| Tipo | Esempi nel codice | Serve consenso? |
|---|---|---|
| Servizio (contratto) | Benvenuto, recupero password, offerta approvata/rifiutata, promemoria di scadenza/rinnovo, promemoria di fine prova (10 e 3 giorni prima), conferma di disdetta, conferma di cancellazione | No (base: contratto). Niente promozioni dentro |
| Avvisi su richiesta | «Il tuo negozio preferito ha una nuova offerta» (`send_preferito_nuova_offerta`) | **Sì**, consenso specifico (`consents.avvisi_preferiti`), revocabile con «Non avvisarmi più» |
| Promozionali di Sconti Roma | Newsletter, novità, inviti | **Sì**, casella separata e facoltativa (`marketing_opt_in`), mai preselezionata |
| Messaggi ai Commercianti (prospecting) | Primo contatto da lista pubblica (email, WhatsApp, telefono) | Vedi punto 3 |
| «Mensili sconti» (`send_monthly_discounts_notification`) | Email mensile ai clienti | **[DA VALIDARE]**: oggi parte in codice insieme ai pagamenti (spenti); prima di usarla verificare consenso |

## 2. Regole per email/SMS/WhatsApp ai Clienti
1. Consenso libero, specifico, informato, **provato** (data e testo; ci sono `marketing_opt_in_at`).
2. Ogni messaggio: mittente chiaro (Sconti Roma), oggetto non ingannevole, link **«Annulla iscrizione» / «Non avvisarmi più»** facile e gratuito. Opt-out effettivo subito. **[DA VALIDARE: oggi non tutte le email hanno il link in calce; verificare]**
3. Nessuna cessione di liste a terzi.
4. Registro delle revoche (campo `marketing_revoked_at`).
5. Fascia oraria ragionevole (non di notte).

## 3. Messaggi ai commercianti (B2B) per il lancio
- **Email** a indirizzi professionali da fonti pubbliche: possibile come «soft spam» solo per prodotti **analoghi a quelli già acquistati** (art. 130 c. 4): non è il caso del primo contatto. Per le persone giuridiche il consenso preventivo è richiesto per email/SMS automatizzati; **[DA VALIDARE, domanda 10]**.
- **WhatsApp / SMS:** considerati comunicazioni elettroniche: consenso preventivo. **Primo contatto: preferire il contatto di persona o la telefonata con operatore** e, solo dopo l'accordo, messaggio con consenso. **[DA VALIDARE]**
- Nel primo messaggio: chi siamo (Euro Linea S.r.l.s.), perché lo contattiamo, come opporsi, informativa breve privacy (art. 14: fonte dei dati).
- Elenchi: registrare la fonte del contatto e la data. Liste di opposizione: rispettare il Registro Pubblico delle Opposizioni per i telefoni fissi/mobili dove applicabile **[DA VALIDARE]**.
- Nessun messaggio ripetuto dopo un «no».
- Contenuti: seguire `comunicazione-marchio`: **4,99 € al mese + IVA** (mai «IVA inclusa»), niente prezzo bloccato, nessuna promessa di guadagno, **«circa due mesi di prova»** (mai «60 giorni»: va da 49 a 81 giorni), nessun addebito senza conferma esplicita.

## 4. Frasi pronte [PROPOSTA]
- *Casella promozioni (facoltativa):* «Voglio ricevere novità e offerte di Sconti Roma via email. Posso revocare il consenso in ogni momento.»
- *Casella avvisi preferiti:* «Avvisami via email quando i miei negozi preferiti pubblicano una nuova offerta.»
- *Piè di ogni email promozionale:* «Ricevi questa email perché hai dato il consenso. Non vuoi più riceverla? [Annulla iscrizione]. Euro Linea S.r.l.s., [sede], privacy@scontiroma.it.»
- *Primo messaggio a un negozio (breve):* «Buongiorno, sono [nome] di Sconti Roma (Euro Linea S.r.l.s.). Facciamo conoscere i negozi del quartiere ai clienti con uno sconto mensile. Circa due mesi di prova gratuita dalla prima pubblicazione, poi 4,99 € al mese + IVA; nessun addebito senza la vostra conferma. Se non volete essere ricontattati scrivete "no". Info privacy: privacy@scontiroma.it.»

## 5. Social e post pubblici [PROPOSTA]
Regole decise dal titolare, da applicare a post, storie, video e locandine:
- Sconti Roma è **«gratuita nella fase di lancio»** per i clienti (non scrivere «gratis per sempre»).
- Area: **«Roma e dintorni»** (non elencare solo tre quartieri).
- Servizio per **maggiorenni (18+)**.
- Ai negozi: «circa due mesi di prova», **4,99 € al mese + IVA**, nessun prezzo bloccato, nessun addebito senza conferma.
- Nessuna data di lancio (resta vuota).
- Tutto resta **[DA VALIDARE]** dal consulente prima della pubblicazione.
