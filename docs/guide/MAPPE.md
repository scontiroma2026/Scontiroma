# Mappe e indirizzi: guida passo passo

Decisione del 04/10: mappe **Protomaps** ospitate da noi (niente servizi a pagamento) e indirizzi con **LocationIQ** (piano gratuito, senza carta di credito).

Le due parti sono indipendenti e **facoltative**: senza la chiave il sito usa Nominatim per gli indirizzi, senza il file la mappa usa i tile pubblici di OpenStreetMap. Nulla si rompe se manca una delle due.

---

## Parte 1 · Indirizzi con LocationIQ (chiave gratuita)

### Dove prendere la chiave
1. Vai su **https://locationiq.com** e tocca **Sign Up** (registrazione gratuita).
2. Registrati con email e password (o con Google/GitHub). **Non chiede la carta di credito.** Conferma l'email se te la chiede.
3. Nella dashboard (**https://my.locationiq.com/dashboard**) apri **Access Tokens**.
4. Copia il token che trovi lì (una stringa lunga, di solito inizia con `pk.`). Quello è `LOCATIONIQ_API_KEY`.

### Dove metterla (solo su Render)
1. Vai su **https://dashboard.render.com** → il servizio del **server** (API, non il sito) → **Environment**.
2. **Add Environment Variable**:
   - Key: `LOCATIONIQ_API_KEY`
   - Value: il token copiato
3. **Save changes**: Render riavvia il server da solo (circa un minuto).

La chiave non va **mai** scritta nel repository, in una PR, in una chat o in un messaggio: il repository è pubblico. Se la pubblichi per sbaglio, vai su LocationIQ → Access Tokens, creane una nuova ed elimina quella vecchia, poi aggiorna Render.

### Come provare
- Dal telefono: registrazione commerciante → campo indirizzo → scrivi per esempio «Via Ostiense 100»: compaiono i suggerimenti.
- Nei log di Render, se la chiave è sbagliata, compare «LocationIQ ha rifiutato la chiave»: il server ripiega su Nominatim da solo e riprova dopo 10 minuti.

### Limiti del piano gratuito (già rispettati dal codice)
- circa 2 richieste al secondo: il server ne fa al massimo una ogni 0,6 secondi;
- circa 5.000 richieste al giorno;
- gli indirizzi già cercati si ricordano in memoria (cache), quindi la stessa ricerca non conta due volte;
- se si supera il limite (errore 429) il server usa Nominatim per un minuto e poi riprova.

---

## Parte 2 · Mappa Protomaps (file `roma.pmtiles`)

Il sito legge il file `frontend/public/mappe/roma.pmtiles` (indirizzo `/mappe/roma.pmtiles`). I tile vengono disegnati sul telefono, con `protomaps-leaflet` sopra la stessa Leaflet di prima (pin, popup e pulsanti non cambiano). Il codice di Protomaps si scarica solo quando si apre una mappa.

**Finché il file non c'è**, o se il server non lo serve a intervalli (risposta 206), la mappa usa i tile pubblici di OpenStreetMap, come prima. In entrambi i casi in basso a destra c'è l'attribuzione richiesta dalla licenza ODbL: «© OpenStreetMap contributors» (con Protomaps quando si usa il file).

### Creare il file (una volta, dal tuo computer o da una rete che raggiunga `build.protomaps.com`)
1. Apri un terminale nella cartella del progetto.
2. (Facoltativo, consigliato) calcola prima la dimensione senza scaricare nulla: dopo aver lanciato lo script una volta, oppure con la CLI `pmtiles` già installata:
   `pmtiles extract https://build.protomaps.com/AAAAMMGG.pmtiles prova.pmtiles --bbox=11.9,41.4,13.1,42.2 --maxzoom=15 --dry-run`
   (sostituisci `AAAAMMGG` con una data recente; la riga finale indica quanti tile e quanti MB).
3. Lancia: `bash scripts/estrai_mappa_roma.sh`. Lo script scarica la CLI `pmtiles` se manca, cerca l'ultima build giornaliera di Protomaps, estrae Roma e dintorni (lon 11,9–13,1 · lat 41,4–42,2 · zoom fino a 15) e salva `frontend/public/mappe/roma.pmtiles`. Alla fine stampa la dimensione.
4. Variabili per cambiare area o dettaglio: `BBOX=...`, `MAXZOOM=14`, `SORGENTE=<indirizzo di una build .pmtiles>`, `USCITA=<file>`.

### Dimensione e dove tenere il file
- **GitHub rifiuta i file sopra 100 MB** (e il repository è pubblico). Lo script avvisa se il file supera 90 MB.
- Se il file è piccolo (sotto circa 90 MB): metterlo in `frontend/public/mappe/` e committarlo in una PR (Render lo pubblica con il sito).
- Se è più grande: abbassare lo zoom (`MAXZOOM=14` riduce molto il peso) o restringere l'area, **oppure** ospitarlo fuori dal repository (un servizio di file statici con richieste a intervalli e CORS aperto al nostro dominio) e impostare sul **sito** (Render → servizio del sito → Environment) la variabile `REACT_APP_MAP_PMTILES_URL` con l'indirizzo completo del file, poi rifare il deploy. Da decidere con te.
- Il server che ospita il file deve rispondere alle richieste a intervalli (`Range`): lo fanno i siti statici di Render e i servizi di file comuni. Se non lo fa, la mappa resta sui tile OpenStreetMap, senza errori.

### Licenza
I dati sono OpenStreetMap (ODbL): serve l'attribuzione, già presente in mappa. Le build di Protomaps sono pubbliche e gratuite; gli stili (`@protomaps/basemaps`) sono BSD-3. Dettagli in `frontend/public/mappe/LEGGIMI.txt`.
