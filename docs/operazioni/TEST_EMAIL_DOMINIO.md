# Test email del dominio `scontiroma.it` — 13/10/2026

Controllo in **sola lettura**: nessun record DNS modificato, nessuna impostazione Resend cambiata, nessuna email inviata. Nessun indirizzo di persone reali in questo file.

Legenda: 🟢 a posto · 🟠 attenzione · 🔴 da correggere · ⚪ non verificabile da qui

## Limite dell'ambiente (da leggere prima)
La rete dell'ambiente Claude blocca il DNS-over-HTTPS (Cloudflare e Google: errore 403 del proxy) e `dig`/`nslookup` non sono installati. Le interrogazioni DNS dirette (UDP verso 8.8.8.8 e 1.1.1.1) hanno dato risposte **non attendibili**: radice senza alcun record MX/TXT/NS e `NXDOMAIN` per `send.`, `resend._domainkey` e `_dmarc`, mentre Resend dichiara gli stessi record "verified". Quindi **non ho potuto leggere i record DNS pubblici** e non scrivo risultati inventati. Per MX radice, SPF radice e DMARC lo stato è ⚪ finché il titolare non li controlla (vedi "Come controllare da iPhone").

## Tabella dei controlli
| # | Controllo | Esito | Dettaglio |
|---|---|---|---|
| 1 | Dominio in Resend | 🟢 | `scontiroma.it` **verified**, regione `eu-west-1` (Irlanda, adatta al GDPR), invio abilitato, ricezione disattivata, tracciamento aperture e clic **spento** (ottimo per la privacy). |
| 2 | DKIM `resend._domainkey` (TXT) | 🟢 | Presente e **verified** secondo Resend (chiave RSA 1024 bit: valida; Resend la gestisce). |
| 3 | `send` MX → `feedback-smtp.eu-west-1.amazonses.com` (priorità 10) | 🟢 | **verified** secondo Resend. Serve per i rimbalzi, non per la posta in arrivo. |
| 4 | `send` SPF TXT `v=spf1 include:amazonses.com ~all` | 🟢 | **verified**, un solo record su `send`. |
| 5 | MX radice (Aruba) | ⚪ | Non leggibile da qui. Secondo i documenti di progetto dovrebbero essere `mx.aruba.it` e `mx2.aruba.it`. Le email di prova a `info@`, `privacy@`, `partner@` del 28/09 risultano "delivered" lato Resend (consegnate al server di destinazione). |
| 6 | SPF radice duplicato | ⚪ | Non leggibile. Regola: sulla radice deve esserci **al massimo un** TXT che inizia con `v=spf1`. Resend NON ha bisogno di nulla sulla radice (usa `send`). |
| 7 | DMARC `_dmarc` | ⚪ / 🟠 | Non leggibile. Resend non lo richiede, quindi può mancare: è il punto più probabile da correggere (vedi sotto). |
| 8 | Allineamento mittente | 🟢 | Le email partono da `info@scontiroma.it` (letto in Resend su email reali). DKIM firma con il dominio `scontiroma.it` = allineato. L'SPF usa `send.scontiroma.it` (sottodominio): allinea in modalità "relaxed", che è quella di default. |
| 9 | Tracciamento (CNAME) | 🟢 | Open/click tracking spenti: nessun CNAME di tracciamento necessario. |
| 10 | Consegne ultimi 30 giorni | 🟢 | 31 inviate, 29 consegnate, **0 segnalazioni di spam**, 0 aperture/clic (tracciamento spento). |
| 11 | Rimbalzi e soppressioni | 🟠 | 2 rimbalzi (1 permanente, 1 temporaneo) e 5 "suppressed". Cause: 1 refuso in un indirizzo di prova personale; 2 indirizzi finti su gmail.com usati nei promemoria del 28/09; 4 invii a `admin@`/`trattoria@scontiroma.it` bloccati perché l'indirizzo era già in lista di soppressione (casella inesistente → rimbalzo precedente). Nessun cliente reale colpito. |
| 12 | Mittente nel codice | 🟠 | `SENDER_EMAIL` si legge da Render (nessun default sicuro: se mancasse, il codice userebbe `onboarding@resend.dev`, che non è il nostro dominio). In produzione risulta `info@scontiroma.it`: ok. Il mittente è senza nome visibile (solo indirizzo): in Gmail appare "info". |
| 13 | Reply-To | 🟠 | Il codice aggiunge `reply_to` solo se `REPLY_TO_EMAIL` è impostata su Render (STATO.md la dà ancora "da fare"). Resend non mi mostra il campo nelle email: ⚪ se è impostata. Se non lo è, le risposte dei clienti vanno a `info@scontiroma.it` (mittente), che è comunque una casella reale: rischio basso. |
| 14 | Link di disiscrizione | 🟠 | Solo l'avviso "Nuova offerta dai preferiti" ha un testo per non riceverlo più (con consenso esplicito), ma **senza** intestazione `List-Unsubscribe` e senza link diretto (rimanda a Sconti › Preferiti). Le altre email sono transazionali/di servizio (password, benvenuto, esiti, promemoria) e non lo richiedono. |
| 15 | Testi e intestazioni | 🟢 | Nessun «IVA inclusa» né «prezzo bloccato» nel codice delle email. Il benvenuto commercianti dice «4,99 € al mese + IVA» (coerente con la decisione del 12/10). Il testo «abbonamento mensile da 2,99 €» dell'email mensile è stato corretto (tolto il prezzo, PR #129, 13/10). Gli altri testi su «abbonamento» cliente restano dormienti finché i pagamenti dei clienti sono spenti. |
| 16 | Soppressione manuale/lista | 🟢 | I rimbalzi permanenti vengono messi in lista da Resend in automatico: protegge la reputazione. |

## Cosa è fatto bene
- Dominio verificato in regione UE, DKIM + SPF + MX di ritorno su `send` tutti "verified".
- Tracciamento aperture/clic spento (nessun pixel, meno rischi privacy).
- Nessuna segnalazione di spam; nessun mittente `onboarding@resend.dev` nelle email reali.
- Testi escapati (`_esc`) contro l'iniezione di HTML; link con il dominio vero.
- Invio con filtro `EMAIL_ALLOWED_RECIPIENTS` per l'ambiente di prova.

## Cosa va corretto (nessun record applicato)
1. 🟠 **DMARC** (se non esiste). Record proposto, in modalità solo-osservazione:
   - Tipo `TXT`, nome `_dmarc`, valore `v=DMARC1; p=none; rua=mailto:INDIRIZZO-CASELLA-REPORT; adkim=r; aspf=r`
   - Poi, dopo 2–4 settimane senza problemi nei report, si può passare a `p=quarantine`. Non passare subito a `reject`.
   - Se esiste già un DMARC con `p=none`, va bene per ora; se ne esistono **due**, tenerne uno solo.
2. 🟠 **SPF radice** (solo se oggi esiste e non copre Aruba o è duplicato): deve esserci un solo record. Se si manda posta in uscita anche da Aruba: `v=spf1 include:_spf.aruba.it ~all`. Se Aruba si usa solo per ricevere, non serve cambiare nulla. **Non** aggiungere `amazonses.com` alla radice: Resend usa `send`.
3. 🟠 **`REPLY_TO_EMAIL`** su Render = una casella reale (es. `info@scontiroma.it`) e **nome visibile** del mittente: `SENDER_EMAIL` = `Sconti Roma <info@scontiroma.it>` (Resend accetta il formato con nome). Sono variabili d'ambiente, non DNS.
4. 🟠 Email preferiti: aggiungere intestazione `List-Unsubscribe` con link diretto alla disattivazione (modifica al codice, da fare in una PR a parte; il testo è privacy, quindi da far vedere al consulente).
5. 🟢 Fatto (PR #129, 13/10): tolto il prezzo «2,99 €» dal testo dell'email mensile. Se un giorno i clienti pagheranno, il testo dell'abbonamento va riscritto con il consulente.

## Posta in ARRIVO (Aruba) e piano B ImprovMX
- Oggi: MX radice su Aruba (`mx.aruba.it`, `mx2.aruba.it`) → caselle `info@`, `privacy@`, `partner@` su Aruba. Non c'entra con l'invio dell'app (che passa da Resend/`send`).
- Con ImprovMX (inoltro verso il Gmail del titolare) cambierebbe **solo la radice**:
  - MX radice: `mx1.improvmx.com` (priorità 10) e `mx2.improvmx.com` (priorità 20), **eliminando** i due MX Aruba (mai mescolarli).
  - SPF radice (un solo record): `v=spf1 include:spf.improvmx.com ~all` (aggiungere `include:_spf.aruba.it` solo se si invia ancora dalle caselle Aruba).
  - DMARC: invariato (`_dmarc` come sopra). Resend non cambia: `send`, `resend._domainkey` restano intatti.
  - Attenzione: un inoltro riscrive il mittente e può far fallire DMARC delle email inoltrate se il mittente ha `p=reject`; per le nostre email di servizio verso `info@` (mittente `info@scontiroma.it`) l'inoltro va testato con una prova di ricezione. Rispondere "come" `info@` dal Gmail richiede il SMTP di Aruba o del piano a pagamento ImprovMX.
  - Conviene farlo solo se le caselle Aruba danno problemi: oggi la ricezione risulta funzionante.

## Come controllare e applicare da iPhone (Aruba)
Controllare (senza modificare): su Safari apri uno strumento DNS online (es. MXToolbox, "TXT Lookup") e cerca `scontiroma.it` (tipo TXT), `_dmarc.scontiroma.it` (TXT), `scontiroma.it` (MX). Conta quanti record `v=spf1` compaiono e se esiste `v=DMARC1`.

Applicare (solo dopo il tuo OK):
1. Accedi a **Aruba** (area clienti) → **Domini** → `scontiroma.it` → **Gestione DNS** (Pannello di controllo DNS).
2. Tocca **Aggiungi record** → tipo **TXT**.
3. Nome host: `_dmarc`; valore: il testo di DMARC qui sopra; salva.
4. Per l'SPF: modifica il TXT esistente che inizia con `v=spf1` (non crearne un secondo).
5. **Non toccare** mai i record `send`, `resend._domainkey` e gli MX di Aruba.
6. Attendi qualche minuto e ripeti il controllo da Safari; poi in Resend tocca "Verify" sul dominio solo se richiesto.
