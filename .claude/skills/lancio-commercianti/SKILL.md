---
name: lancio-commercianti
description: Gestione del piano di lancio verso i commercianti (messaggi, contatti, prova 60 giorni, pagamenti, promemoria). Usala per messaggi ai negozi, calendario e regole di prova/pagamento.
---
# Lancio commercianti
Fonte: `docs/commercianti/PIANO_LANCIO_COMMERCIANTI.md` e `docs/commercianti/MESSAGGI.md`.
Regole decise dal titolare:
- Prova di **60 giorni dalla prima pubblicazione**; dal 61° giorno pagamento per i 30 successivi; pagamenti il 1° del mese, prima il pagamento poi la pubblicazione; tolleranza modificabile (proposta 5 giorni); disdetta: il mese in corso termina; importo pagato non rimborsabile; **niente prezzo bloccato**.
- Promemoria email a 10 e a 3 giorni dalla fine prova.
- Tutto dietro interruttore spento (`MERCHANT_PAYMENT_REQUIRED`); nessun addebito senza conferma esplicita.
- Badge: «Nuovo su Sconti Roma» 7 giorni (prima pubblicazione), «Nuova offerta» 48 ore.
- Messaggi: regole di `comunicazione-marchio` e di `legale-documenti`. Zone pilota: Garbatella, San Paolo, Marconi.
Non pubblicare i Termini #83 finché promemoria e pagamenti non sono nell'app.
