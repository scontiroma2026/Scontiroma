# Controllo online del sito (guida passo passo)

Serve per ricevere una email se il sito o il server si fermano, senza dover guardare tu.
Costo: gratuito (piano gratuito di UptimeRobot, 50 controlli ogni 5 minuti).
Non inserire mai chiavi o password in questo file né in chat.

## Cosa controllare
| Cosa | Indirizzo da controllare | Cosa deve rispondere |
|---|---|---|
| Server (API) | `https://api.scontiroma.it/api/` | «Sconti Roma API» (stato 200) |
| Sito | `https://scontiroma.it/` | la pagina iniziale (stato 200) |

## Passi
1. Vai su uptimerobot.com e crea un account gratuito con l'email di Sconti Roma (non quella personale).
2. **Add New Monitor** → tipo **HTTP(s)**.
3. Nome: `Sconti Roma - server`. URL: l'indirizzo del server dalla tabella. Intervallo: 5 minuti.
4. In **Alert contacts** scegli la tua email. Se vuoi, aggiungi anche l'app UptimeRobot sul telefono per le notifiche.
5. Ripeti per il sito (`Sconti Roma - sito`).
6. Facoltativo: crea un terzo controllo con **Keyword** sul server, parola da trovare `Sconti Roma API`: segnala anche se il server risponde ma con una pagina sbagliata.

## Attenzione al piano gratuito di Render
Con il piano gratuito il server si addormenta dopo circa 15 minuti senza visite, e il controllo ogni 5 minuti lo tiene sveglio ma può dare falsi allarmi nel risveglio (circa 50 secondi). Prima del lancio conviene il piano «Starter» del server: così non si addormenta e gli allarmi diventano affidabili.

## Cosa fare se arriva un allarme
1. Apri Render, servizio `scontiroma-api`, e guarda lo stato e i log.
2. Apri `/admin`, riquadro «Server Health»: ti dice se database, email e indirizzi rispondono.
3. Se non capisci cosa succede, scrivimi lo stato che vedi (senza incollare chiavi o stringhe di collegamento).
