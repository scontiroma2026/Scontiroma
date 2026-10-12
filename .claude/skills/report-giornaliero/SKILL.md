---
name: report-giornaliero
description: Controllo giornaliero in sola lettura di Sconti Roma (sito, API, CI, PR aperte, email Resend) e report leggibile da iPhone. Usala per il controllo giornaliero o quando il titolare chiede come sta il progetto.
---
# Report giornaliero (sola lettura)
Controlla, senza modificare nulla:
- `https://scontiroma.it/` risponde 200; `https://api.scontiroma.it/api/` risponde `{"status":"ok"}` (annota la versione). Render gratuito: un primo errore può essere il risveglio (~50 s), riprova una volta.
- GitHub: controlli di `main` verdi o rossi, PR aperte (da quanti giorni, chi aspetta chi).
- Resend: errori e rimbalzi recenti (se il connettore non c'è, scrivilo).
- `docs/STATO.md` e `docs/LISTA_LANCIO.md`: voci aperte da più tempo.
Formato: prima riga **TUTTO VERDE**, **DA GUARDARE** (qualcosa non verificabile: permesso o connettore) oppure **ROSSO** (problema vero). Poi punti brevi e cosa deve fare il titolare. Mai chiavi o password nel report. Non chiamare `/api/q/{codice}`.
