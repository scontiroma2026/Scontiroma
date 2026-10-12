# 11 - Procedura per violazione dei dati personali (data breach, artt. 33-34 GDPR)

> **Rischio: 🟢 basso: procedura interna delle 72 ore, nessun punto aperto grave.**
> **[PROPOSTA] [DA VALIDARE]** - Documento interno. Una pagina. Il Garante va avvisato **entro 72 ore** da quando si ha conoscenza della violazione, se c'è rischio per le persone.

## 1. Cos'è una violazione
Perdita, distruzione, modifica, divulgazione o accesso non autorizzato a dati personali: es. password o database esposti, email inviate alla persona sbagliata, account admin violato, chiave di un fornitore trapelata, backup rubato, dati personali finiti nel repository pubblico.

## 2. Chi fa cosa
| Ruolo | Chi | Cosa |
|---|---|---|
| Decide e avvisa | Titolare (Euro Linea S.r.l.s.) [DA COMPLETARE: nome] | Valuta il rischio, decide se avvisare |
| Contenimento tecnico | Claude Code / chi gestisce il codice, su ordine del titolare | Ruota chiavi e password, chiude l'accesso, salva le prove |
| Consulente | [DA COMPLETARE] | Parere sull'avviso al Garante |
| Fornitori | Render, MongoDB Atlas, Resend, LocationIQ, Stripe, PayPal, Google | Avvisano senza ritardo se la violazione è dalla loro parte (clausola nei DPA, doc. 09) |

## 3. Passi (orologio: parte dal momento in cui lo veniamo a sapere)
1. **Subito (0-2 ore): contenere.** Cambiare le chiavi coinvolte (JWT, database, Resend, LocationIQ, Stripe, PayPal, ecc.) nei pannelli dei fornitori; revocare sessioni; togliere dati dal repository (e considerarli già esposti). Non cancellare le prove.
2. **Annotare** in un registro (modello sotto): data/ora, chi l'ha scoperta, cosa è successo, dati e persone coinvolte (numero approssimativo), conseguenze, misure.
3. **Valutare il rischio (entro 24 ore):**
   - *Nessun rischio probabile* (es. dati già cifrati, solo numeri anonimi): solo registro interno.
   - *Rischio* (es. email + nomi esposti): **avviso al Garante entro 72 ore** dal portale del Garante.
   - *Rischio elevato* (es. password in chiaro, dati di pagamento): in più **avviso agli interessati** senza ritardo, in italiano semplice, via email.
4. **Avviso al Garante (art. 33)** contenuto: natura della violazione, categorie e numero di persone e dati, contatto (privacy@scontiroma.it), conseguenze probabili, misure prese. Se non si hanno tutti i dati, si manda per fasi.
5. **Avviso agli interessati (art. 34):** cosa è successo, che dati, cosa possono fare (cambiare password), come contattarci.
6. **Dopo:** correggere la causa, aggiornare registro dei trattamenti e misure, ripassare con il consulente.

## 4. Modello di registro (art. 33.5)
| Data/ora scoperta | Scoperta da | Cosa è successo | Dati coinvolti | Persone (n.) | Rischio (nessuno/medio/alto) | Avviso Garante (sì/no, data) | Avviso interessati (sì/no, data) | Misure |
|---|---|---|---|---|---|---|---|---|

## 5. Contatti utili
Garante: servizio online per le notifiche di violazione (sito del Garante). **[DA COMPLETARE: collegamento verificato]**. Numeri: nessun dato personale in questo file.

## 6. Cosa tenere sotto controllo
Repository **pubblico**: ogni commit con un dato personale o un segreto è una violazione potenziale. Prima di ogni PR si fa il controllo segreti (skill `pr-checklist`).
