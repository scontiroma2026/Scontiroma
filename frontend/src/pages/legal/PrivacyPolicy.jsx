import LegalLayout from "./LegalLayout";

export default function PrivacyPolicy() {
  return (
    <div data-testid="privacy-policy-page">
      <LegalLayout
        kicker="Documento legale"
        title="Privacy Policy"
        updatedAt="Novembre 2026"
      >
        <p>
          La presente Privacy Policy descrive come <strong>Sconti Roma</strong> (di
          seguito "noi", "Sconti Roma" o il "Titolare") raccoglie, utilizza e
          protegge i tuoi dati personali quando utilizzi la piattaforma
          accessibile dal sito e dall'applicazione. Il trattamento avviene nel
          pieno rispetto del Regolamento (UE) 2016/679 ("GDPR") e del D.Lgs.
          196/2003 così come modificato dal D.Lgs. 101/2018.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">1. Titolare del trattamento</h2>
        {/* [PROPOSTA - DA VALIDARE] 23/10/2026: dati societari dalla visura camerale (denominazione, sede, CF/P.IVA, REA, PEC). */}
        <p>
          Titolare del trattamento è <strong>EUROLINEA S.r.l.s.</strong>{" "}
          (EUROLINEA Società a responsabilità limitata semplificata), con sede
          legale in Via Tasso 5/B, 83031 Ariano Irpino (AV), codice fiscale e
          Partita IVA 03240220644, iscritta al Registro delle Imprese Irpinia
          Sannio, REA AV-313674, PEC{" "}
          <a href="mailto:eurolineasrls@alpec.it" className="text-fucsia hover:underline">
            eurolineasrls@alpec.it
          </a>
          , che gestisce il servizio <strong>Sconti Roma</strong> (di seguito "noi", "Sconti
          Roma" o il "Titolare"). Puoi contattarci in qualsiasi momento
          all'indirizzo{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>{" "}
          per esercitare i tuoi diritti o per qualunque richiesta relativa al
          trattamento dei tuoi dati.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">2. Dati che raccogliamo</h2>
        <p>Trattiamo le seguenti categorie di dati personali:</p>
        <ul className="list-disc pl-6 space-y-2">
          {/* [PROPOSTA][DA VALIDARE] 18/11: aggiunte Partita IVA (obbligatoria dal 15/10, `register`: solo controllo formale) e conferma dell'email dei clienti (impronta del link, 48 ore). Riga Partita IVA ripresa dalla PR #147. */}
          <li>
            <strong>Dati di registrazione</strong>: nome, cognome, indirizzo
            email, password (memorizzata in forma cifrata bcrypt), data
            dell'iscrizione e versione dei testi legali accettati. Per i
            commercianti anche nome dell'attività, indirizzo, telefono e{" "}
            <strong>Partita IVA</strong> (obbligatoria: la controlliamo solo nel
            formato e non la mostriamo in pubblico). Se ti chiediamo di
            confermare l'email, del link che ti mandiamo (valido 48 ore)
            salviamo solo un'impronta, non il link.
          </li>
          <li>
            <strong>Dati di autenticazione biometrica</strong>: se attivi Face
            ID / Touch ID, memorizziamo esclusivamente una chiave pubblica
            WebAuthn generata dal tuo dispositivo. Non abbiamo mai accesso ai
            tuoi dati biometrici, che restano solo sul tuo telefono.
          </li>
          <li>
            <strong>Dati commerciali (solo commercianti)</strong>: nome
            attività, telefono/WhatsApp, indirizzo e posizione sulla mappa,
            zona, categoria merceologica, orari, descrizione, fotografie del
            punto vendita e le offerte (sconti oppure omaggi). Nome, indirizzo,
            telefono, orari, foto e offerte approvate sono pubblici, perché
            servono a farti trovare dai Clienti. Le foto sono salvate nel nostro
            database.
          </li>
          <li>
            <strong>Dati di geolocalizzazione</strong>: se acconsenti, usiamo la
            tua posizione approssimata per mostrarti gli sconti più vicini. La
            posizione viene chiesta solo quando tocchi «Usa la mia posizione»
            ed è elaborata solo sul tuo telefono: non arriva ai nostri server
            e non viene memorizzata.
          </li>
          <li>
            <strong>Dati di pagamento</strong>: durante la fase di lancio il
            servizio è gratuito e <strong>non raccogliamo alcun dato di
            pagamento</strong>. Se in futuro verranno attivati pagamenti (solo
            per i commercianti e solo con la loro conferma), saranno gestiti da{" "}
            <strong>Stripe</strong> o <strong>PayPal</strong>, che agiscono come
            titolari autonomi del trattamento: non conserveremo mai i dati della
            carta, ma solo un identificativo cliente e lo stato del pagamento.
          </li>
          <li>
            <strong>Dati di utilizzo</strong>: sconti richiesti, codici QR
            generati, riscatti effettuati, esito delle scansioni dei codici
            (anche quelle non valide, per prevenire le frodi), recensioni
            lasciate, negozi salvati tra i preferiti. Le recensioni (stelle e
            commento dopo uno sconto usato) le leggono solo le persone
            autorizzate di Sconti Roma: nell'app compare solo la media delle
            stelle del negozio.
          </li>
          <li>
            <strong>Dati condivisi con il commerciante</strong>: quando il
            commerciante scansiona il tuo codice QR vede soltanto il tuo{" "}
            <strong>nome e l'iniziale del cognome</strong> (es. "Mario R."),
            l'ora, l'offerta e se sei un cliente nuovo o di ritorno. Non vede
            la tua email né altri dati. Le statistiche che il commerciante vede
            nella sua area sono solo numeri aggregati e compaiono solo quando i
            clienti del mese sono almeno 3. Dopo la scansione il commerciante
            tratta quanto ha visto come titolare autonomo, per gestire lo
            sconto.
          </li>
          <li>
            <strong>Dati visibili a chi gestisce Sconti Roma</strong>: le
            persone autorizzate di Sconti Roma (amministratori) vedono i dati
            dell'account, cioè <strong>nome, cognome, email</strong> e data di
            iscrizione, per assistenza, sicurezza e approvazione delle offerte.
            Nell'area di amministrazione vedono anche, per chi si è iscritto dal
            QR di un negozio, <strong>da quale negozio</strong> è arrivata
            l'iscrizione e, per chi arriva da un volantino o da un QR di una
            nostra campagna, <strong>da quale volantino o QR</strong> (un codice
            come «volantino-zona», mai dati personali): serve a capire quali
            negozi e quali volantini portano nuovi iscritti. Il commerciante non
            vede queste informazioni.
          </li>
          <li>
            <strong>Valutazioni sull'app</strong>: se rispondi alla richiesta
            «Come valuti Sconti Roma?» conserviamo le stelle e l'eventuale
            commento, collegati al tuo account, per migliorare il servizio.
            Puoi non rispondere e chiudere la richiesta.
          </li>
          <li>
            <strong>Statistiche di visita</strong>: solo se accetti i cookie
            "funzionali", contiamo visite e pagine viste con un identificativo
            casuale non collegato al tuo account (vedi{" "}
            <a href="/cookies" className="text-fucsia hover:underline">Cookie Policy</a>).
          </li>
          {/* [PROPOSTA][DA VALIDARE] 18/11: voci aggiunte dal confronto con il codice di `main` e con i registri della privacy. Segnalazioni (`_crea_segnalazione`: email lasciata o dell'account, nessun IP, 24 mesi, riga ripresa dalla PR #147); «Ci pensiamo noi» (`conferme_offerta`: data, ora, versione del testo, nessun IP); messaggi email e WhatsApp Business ed elenco «non ricontattare» (decisione del titolare del 18/11, `docs/comunicazione/REGOLA_CONTATTO_NEGOZI.md`); notifiche push spente (`PUSH_UTENTI_ENABLED`). */}
          <li>
            <strong>Segnalazioni e reclami</strong>: se segnali un'offerta (anche
            senza account) o, come commerciante, mandi un reclamo, conserviamo
            il testo, l'offerta o il negozio coinvolto e la tua email, se la
            lasci (se hai fatto l'accesso usiamo quella del tuo account), per
            risponderti con l'esito. Non salviamo il tuo indirizzo IP.
          </li>
          <li>
            <strong>Offerte preparate da noi («Ci pensiamo noi»)</strong>: se un
            commerciante ci chiede di inserire la sua offerta, usiamo i testi e
            le foto che ci manda solo per prepararla. Della sua conferma
            salviamo data, ora e versione del testo accettato (non l'indirizzo
            IP), per dimostrare che l'offerta l'ha approvata lui.
          </li>
          <li>
            <strong>Messaggi che ci mandi</strong>: se ci scrivi per email (per
            esempio a info@, partner@ o privacy@) conserviamo il tuo indirizzo,
            il nome che compare e il testo. Se ci scrivi su{" "}
            <strong>WhatsApp Business</strong> al numero 352 247 3526 vediamo e
            conserviamo il tuo <strong>numero di telefono</strong>, il{" "}
            <strong>nome del profilo</strong> (e l'immagine del profilo, se la
            rendi visibile), il <strong>testo dei messaggi</strong> e le{" "}
            <strong>foto o i file</strong> che ci mandi. Li usiamo solo per
            risponderti e, se sei un commerciante, per aiutarti con l'iscrizione
            o con l'offerta. Ti rispondiamo solo se ci scrivi tu: non usiamo
            WhatsApp per il primo contatto.
          </li>
          <li>
            <strong>Elenco «non ricontattare»</strong>: se ci scrivi NO o STOP,
            o ci dici in altro modo di non volere altri messaggi, non ti
            scriviamo più su nessun canale. Per ricordarcelo teniamo un elenco
            privato con il minimo indispensabile: il nome dell'attività (per i
            negozi), il canale e la data della richiesta. Se il tuo numero era
            nella nostra rubrica, lo cancelliamo.
          </li>
          <li>
            <strong>Notifiche sul telefono</strong>: oggi non sono attive per
            Clienti e Commercianti. Prima di attivarle aggiorneremo questa
            informativa e, per quelle promozionali, ti chiederemo un consenso a
            parte.
          </li>
          <li>
            <strong>Log tecnici</strong>: indirizzo IP, tipo di browser, sistema
            operativo, timestamp delle richieste — utilizzati esclusivamente per
            sicurezza e prevenzione frodi. Possono contenere l'indirizzo IP
            anche quando una funzione non lo salva nel nostro database. Li
            registrano il nostro fornitore di hosting e la rete che usa per
            consegnare le pagine (vedi art. 4). Nel nostro server l'indirizzo IP
            serve solo per i limiti contro gli abusi e resta in memoria per poco
            tempo (da pochi minuti a 24 ore).
          </li>
        </ul>

        <p>
          Per creare l'account servono i dati di registrazione: senza non
          possiamo fornire il servizio. La posizione, gli avvisi via email, le
          comunicazioni promozionali, le statistiche di visita, le valutazioni
          sull'app e le recensioni sono invece <strong>facoltativi</strong>.
          Oggi non inviamo comunicazioni promozionali: se lo faremo, le
          manderemo solo a chi ha dato il consenso.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">3. Finalità e basi giuridiche</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-2 text-left">Finalità</th>
                <th className="border border-border p-2 text-left">Base giuridica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Creazione account e autenticazione</td>
                <td className="border border-border p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Gestione dei pagamenti dei commercianti (solo dopo la fase di lancio e con la loro conferma)</td>
                <td className="border border-border p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Invio email transazionali (benvenuto, recupero password, promemoria di scadenza delle offerte e, per i commercianti, avvisi su prova e pagamenti: giorno 30 della prova, 7 giorni prima del primo pagamento, 3 giorni prima di ogni addebito, mancato pagamento, ricevuta)</td>
                <td className="border border-border p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Geolocalizzazione per ordinare sconti vicini</td>
                <td className="border border-border p-2">Consenso esplicito (art. 6.1.a GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Comunicazioni promozionali</td>
                <td className="border border-border p-2">Consenso esplicito (art. 6.1.a GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Avvisi via email quando un negozio preferito pubblica l'offerta del mese (al massimo uno per negozio al mese)</td>
                <td className="border border-border p-2">Consenso (art. 6.1.a GDPR), revocabile dall'app con «Non avvisarmi più»</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Statistiche di visita (identificativo casuale, non collegato al tuo account)</td>
                <td className="border border-border p-2">Consenso (art. 6.1.a GDPR), tramite banner cookie</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Prevenzione frodi e sicurezza</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Obblighi fiscali e contabili</td>
                <td className="border border-border p-2">Obbligo di legge (art. 6.1.c GDPR)</td>
              </tr>
              {/* [PROPOSTA][DA VALIDARE] 18/11: basi giuridiche che mancavano (registro dei trattamenti del 18/11, sezione 10): Partita IVA, recensioni e voto, segnalazioni, provenienza delle iscrizioni, avvisi interni, «Ci pensiamo noi», messaggi email e WhatsApp, elenco «non ricontattare», pagine social. */}
              <tr>
                <td className="border border-border p-2">Partita IVA dei commercianti (identificare l'attività e, quando ci saranno pagamenti, fatturare)</td>
                <td className="border border-border p-2">Esecuzione del contratto (art. 6.1.b GDPR) e, per la fatturazione, obbligo di legge (art. 6.1.c GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Recensioni dopo uno sconto e valutazioni sull'app («Come valuti Sconti Roma?»), facoltative</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR) a migliorare il servizio</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Segnalazioni di contenuti e reclami dei commercianti, con l'esito motivato</td>
                <td className="border border-border p-2">Obbligo di legge (art. 6.1.c GDPR: Reg. UE 2022/2065 e 2019/1150) e legittimo interesse (art. 6.1.f GDPR) a gestire segnalazioni e reclami</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Sapere da quale negozio, volantino o QR arriva un'iscrizione</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR) a capire quali negozi e volantini portano iscritti</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Avvisi interni a chi gestisce Sconti Roma (nuovo commerciante, offerta da approvare, segnalazione arrivata)</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR) a gestire il servizio</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Offerte preparate da noi su richiesta del commerciante («Ci pensiamo noi») e prova della sua conferma</td>
                <td className="border border-border p-2">Esecuzione del contratto (art. 6.1.b GDPR) e legittimo interesse (art. 6.1.f GDPR) a dimostrare la conferma</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Rispondere ai messaggi che ci mandi per email o su WhatsApp</td>
                <td className="border border-border p-2">La tua richiesta e, per i commercianti, le misure prima del contratto o il contratto (art. 6.1.b GDPR); per le domande generali, legittimo interesse (art. 6.1.f GDPR) a risponderti</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Elenco «non ricontattare» (non scrivere più a chi ha detto no)</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR) a rispettare la tua opposizione (art. 21 GDPR)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Pagine social di Sconti Roma (messaggi e commenti, statistiche delle pagine)</td>
                <td className="border border-border p-2">Legittimo interesse (art. 6.1.f GDPR) a far conoscere il servizio e a risponderti</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="font-serif text-2xl text-foreground mt-8">4. Fornitori esterni (Responsabili del trattamento)</h2>
        <p>
          Per erogare il servizio ci avvaliamo di fornitori qualificati che
          agiscono come Responsabili del trattamento ai sensi dell'art. 28 GDPR:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Resend Inc.</strong> (USA) — Invio delle email del servizio.
            I server di invio si trovano in Irlanda (eu-west-1).
          </li>
          <li>
            <strong>MongoDB Atlas</strong> (MongoDB, Inc.) — Archiviazione dei
            dati su un cluster ospitato a Francoforte (Germania, Unione
            Europea).
          </li>
          <li>
            <strong>Render Services, Inc.</strong> (USA) — Hosting
            dell'applicazione, con server a Francoforte (Germania, Unione
            Europea).
          </li>
          {/* [PROPOSTA][DA VALIDARE] 18/11: Cloudflare e AWS verificati nel codice e sul sito (sola lettura): le risposte di scontiroma.it e api.scontiroma.it arrivano da «server: cloudflare» insieme a Render; il server legge CF-Connecting-IP (`_ip_richiesta`). Nessun account Cloudflare della società risulta (DNS su Aruba, verso indirizzi di Render): Cloudflare è indicato come sub-responsabile di Render, scelta prudente. AWS: cluster Atlas AWS Francoforte (scheda DPA Atlas), invio Resend con Amazon SES in Irlanda (record del dominio `send`). Aruba: dominio, DNS e caselle (nomina a responsabile da verificare). La frase su Render qui sopra NON è stata toccata (regione da verificare). */}
          <li>
            <strong>Cloudflare, Inc.</strong> (USA) — Rete usata dal nostro
            fornitore di hosting (Render) per consegnare le pagine del sito e le
            risposte del server e per proteggerli dagli attacchi: tutte le
            richieste passano dalla sua rete, che vede l'indirizzo IP e i dati
            tecnici della richiesta. Agisce come sub-responsabile di Render. Non
            usiamo i suoi servizi di statistica né i suoi cookie di
            profilazione.
          </li>
          <li>
            <strong>Amazon Web Services</strong> (gruppo Amazon, USA) —
            Infrastruttura su cui lavorano alcuni nostri fornitori: il database
            di MongoDB Atlas (centro dati di Francoforte, Germania) e l'invio
            delle email di Resend (Amazon SES, Irlanda). Tratta i dati come
            sub-responsabile di questi fornitori.
          </li>
          <li>
            <strong>Aruba S.p.A.</strong> (Italia) — Registrazione del dominio
            scontiroma.it, gestione dei suoi indirizzi (DNS) e caselle email
            (per esempio info@, partner@ e privacy@): riceve i messaggi che ci
            scrivi per email.
          </li>
          <li>
            <strong>Google LLC</strong> (Gemini API) — Miglioramento automatico
            delle foto delle offerte caricate dai commercianti, solo su loro
            richiesta. <strong>Oggi questa funzione è spenta</strong>: nessuna
            foto viene inviata a Google. Prima di accenderla aggiorneremo questa
            informativa.
          </li>
        </ul>
        {/* [PROPOSTA][DA VALIDARE] 18/11: posta inoltrata a una casella Gmail gratuita (registro dei trattamenti del 18/11, nessun contratto sui dati con Google: rischio alto, decisione del titolare) e WhatsApp Business (352 247 3526, richiesta del titolare del 18/11). Ruolo di WhatsApp: scelta prudente «titolare autonomo per i dati che tratta per sé», da far vedere all'avvocato. */}
        <p>
          Altri servizi che usiamo e che ricevono dati:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Google</strong> (Gmail) — Le email che arrivano alle nostre
            caselle e gli avvisi interni del servizio (per esempio «nuovo
            commerciante», con nome dell'attività, email e telefono, o il testo
            di una segnalazione) vengono inoltrati anche a una casella Gmail di
            chi gestisce Sconti Roma. Google li tratta secondo le proprie
            condizioni e la propria informativa.
          </li>
          <li>
            <strong>WhatsApp Ireland Limited</strong> (gruppo Meta) — Servizio
            WhatsApp Business che usiamo per rispondere a chi ci scrive al 352
            247 3526. WhatsApp tratta i dati necessari a far funzionare il
            servizio (per esempio numero, nome del profilo e dati tecnici dei
            messaggi) anche per conto proprio, come titolare autonomo, secondo
            le proprie condizioni e la propria informativa.
          </li>
          <li>
            <strong>Anthropic</strong> (Claude, USA) — Assistente di
            intelligenza artificiale che usiamo per sviluppare e controllare il
            servizio. Può vedere dati personali solo quando servono per un
            controllo (per esempio l'indirizzo di un'email non consegnata) e
            non scrive mai nel database del servizio.
          </li>
        </ul>
        <p>
          Quando saranno attivati i pagamenti, i servizi di pagamento{" "}
          <strong>Stripe Payments Europe Ltd.</strong> (Irlanda) e{" "}
          <strong>PayPal (Europe) S.à r.l.</strong> (Lussemburgo) tratteranno i
          dati del pagamento come <strong>titolari autonomi</strong>, secondo le
          proprie informative, e non come nostri responsabili.
        </p>

        <h3 className="font-serif text-xl text-foreground mt-6">4.1 Mappa e indirizzi</h3>
        <p>
          Alcune funzioni caricano contenuti da servizi esterni, che ricevono
          dal tuo browser l'<strong>indirizzo IP</strong> e i dati tecnici della
          richiesta e li trattano come titolari autonomi secondo le proprie
          informative:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>OpenStreetMap Foundation</strong> (Regno Unito) — immagini
            della mappa, solo quando apri una pagina con la mappa (
            <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-ciano hover:underline">informativa</a>).
          </li>
          <li>
            <strong>Google Maps</strong> — solo se tocchi "Portami qui": si apre
            Google Maps con la posizione del negozio come destinazione.
          </li>
          <li>
            <strong>WhatsApp</strong> — solo se tocchi un pulsante WhatsApp (di
            un negozio o il nostro «Scrivici su WhatsApp»): si apre WhatsApp e
            il messaggio lo scrivi e lo mandi tu.
          </li>
        </ul>
        {/* [PROPOSTA][DA VALIDARE] 18/11: pagine social (registro dei trattamenti, T16). Contitolarità con Meta per le statistiche delle pagine: scelta prudente, da verificare (anche per TikTok). */}
        <h3 className="font-serif text-xl text-foreground mt-6">4.2 Pagine social</h3>
        <p>
          Sconti Roma ha pagine su Instagram e Facebook (Meta Platforms Ireland
          Limited) e su TikTok. Se le visiti, le segui, commenti o ci scrivi lì,
          i tuoi dati li tratta prima di tutto la piattaforma, secondo la
          propria informativa. Noi vediamo ciò che rendi visibile (nome del
          profilo, commenti, messaggi) e statistiche sulle visite alle pagine
          in forma aggregata: per queste statistiche Meta e Sconti Roma sono
          contitolari del trattamento, secondo le condizioni di Meta. Non
          copiamo i tuoi dati dalle piattaforme in altri archivi.
        </p>
        <p>
          I caratteri tipografici del sito sono ospitati sul nostro server:
          nessun fornitore esterno li carica al posto nostro.
        </p>
        <p>
          La ricerca degli indirizzi durante l'iscrizione del commerciante usa{" "}
          <strong>Nominatim</strong> (OpenStreetMap Foundation): il testo
          dell'indirizzo viene inviato dai nostri server, quindi Nominatim non
          riceve il tuo indirizzo IP.
        </p>
        {/* [PROPOSTA][DA VALIDARE] 18/11: LocationIQ è usato solo se su Render c'è `LOCATIONIQ_API_KEY`; altrimenti Nominatim. «Usiamo» → «possiamo usare». */}
        <p>
          Al posto di Nominatim possiamo usare, per trovare le coordinate degli
          indirizzi dei negozi, un servizio esterno di geocodifica (
          <strong>LocationIQ</strong>), con sede fuori dall'UE. Riceve solo il
          testo dell'indirizzo, inviato dal nostro server: il servizio non
          riceve il tuo indirizzo IP dal browser.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">5. Trasferimenti extra-UE</h2>
        <p>
          Alcuni fornitori (Resend, MongoDB Atlas, Render, Cloudflare, Amazon
          Web Services, Google, WhatsApp e Meta, TikTok, Anthropic, LocationIQ,
          OpenStreetMap Foundation e, quando saranno attivi, Stripe e PayPal)
          possono elaborare dati
          anche al di fuori dell'UE. In tal caso il trasferimento è protetto,
          secondo quanto indicano i fornitori nei loro contratti e nelle loro
          informative, dalle Clausole Contrattuali Standard approvate dalla
          Commissione Europea (SCC), dal Data Privacy Framework UE-USA o da
          decisioni di adeguatezza. Puoi richiedere copia
          delle garanzie scrivendo a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>
          .
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">6. Periodo di conservazione</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Dati account, codici QR, riscatti, recensioni</strong>:
            finché l'account è attivo. Quando elimini l'account vengono
            cancellati subito, insieme alle offerte del commerciante e al loro
            archivio. Oggi non cancelliamo in automatico gli account che non
            vengono più usati: restano finché non li elimini tu o non ce lo
            chiedi.
          </li>
          {/* [PROPOSTA][DA VALIDARE] 18/11: durate scritte come le applica oggi il codice di `main` (nessuna durata nuova nel codice: aspetta la scelta del titolare, PR #114 non riportata). Prima c'era «Log di sicurezza: 12 mesi», che non corrispondeva: il registro delle scansioni non ha scadenza automatica e i log dei fornitori seguono i loro piani. */}
          <li>
            <strong>Account cliente non confermato</strong>: se l'iscrizione
            richiede la conferma dell'email e non la confermi, cancelliamo
            l'account dopo 7 giorni.
          </li>
          <li><strong>Dati contabili / fatture</strong>: 10 anni (obbligo di legge), in forma non più collegata al tuo account.</li>
          <li>
            <strong>Sicurezza</strong>: il registro delle scansioni dei codici
            QR (anche quelle non valide) oggi non ha una cancellazione
            automatica: le righe collegate al tuo account si cancellano con
            l'account. I limiti contro gli abusi tengono l'indirizzo IP solo in
            memoria, da pochi minuti a 24 ore. I log tecnici del fornitore di
            hosting e della sua rete si cancellano secondo i loro servizi.
          </li>
          <li>
            <strong>Statistiche di visita</strong>: l'identificativo casuale
            resta nel tuo browser finché non lo cancelli o non ritiri il
            consenso ai cookie funzionali (in quel caso lo togliamo noi); le
            visite registrate oggi non hanno una cancellazione automatica e non
            sono collegate al tuo account. Stiamo fissando una durata massima e
            la scriveremo qui.
          </li>
          <li>
            <strong>Registro delle scelte sui cookie</strong>: 24 mesi, poi si
            cancella da solo (o prima, se elimini l'account).
          </li>
          <li>
            <strong>Segnalazioni e reclami</strong>: 24 mesi, poi si cancellano
            da soli, anche se nel frattempo elimini l'account.
          </li>
          <li>
            <strong>Messaggi che ci mandi (email e WhatsApp)</strong>: al
            massimo 12 mesi dall'ultimo messaggio, poi li cancelliamo, salvo
            che servano per un reclamo o una contestazione ancora aperti. Lo
            stesso vale per gli avvisi interni via email che li riguardano.
          </li>
          <li>
            <strong>Elenco «non ricontattare»</strong>: 12 mesi dalla tua
            richiesta, poi cancelliamo anche quella riga.
          </li>
          {/* [PROPOSTA - DA VALIDARE dal consulente] 23/10: storico sospensioni dei negozi (PR #219), raccolta `sospensioni`, scadenza automatica 730 giorni, non cancellato con l'account. */}
          <li>
            <strong>Sospensioni dei negozi (solo commercianti)</strong>: se
            sospendiamo o riattiviamo il tuo negozio, conserviamo la data e il
            motivo per 24 mesi da ciascun evento, anche se nel frattempo
            elimini l'account, poi vengono cancellati in automatico. Ci
            servono per rispondere a un tuo reclamo e per difenderci in caso di
            contestazioni. Base giuridica: legittimo interesse (art. 6.1.f
            GDPR).
          </li>
          {/* [PROPOSTA - DA VALIDARE dal consulente] 02/11/2026: lista d'attesa pre-lancio tolta (PR #243); all'avvio il server cancella tutte le iscrizioni (collezione `waitlist`). Tolte finalità, basi giuridiche, email e conservazione della lista. */}
          <li>
            <strong>Lista d'attesa pre-lancio (chiusa)</strong>: la lista per
            ricevere un avviso quando Sconti Roma sarebbe stato online è stata
            chiusa il 2 novembre 2026. Tutte le iscrizioni raccolte (email,
            data e versione del consenso, stato e provenienza generica) sono
            state cancellate dal nostro database e non ti scriveremo per
            questo motivo. Le copie di sicurezza (backup) del database e i
            registri di invio delle email che possono ancora contenerle si
            cancellano da soli alla loro scadenza e non vengono usati per
            altro. Per qualunque domanda puoi scrivere a
            privacy@scontiroma.it.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">7. I tuoi diritti (art. 15-22 GDPR)</h2>
        <p>Puoi in qualsiasi momento esercitare i seguenti diritti:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Accesso</strong>: chiedere copia dei dati che trattiamo.</li>
          <li><strong>Rettifica</strong>: correggere dati inesatti.</li>
          <li><strong>Cancellazione (diritto all'oblio)</strong>: eliminare l'account e tutti i dati collegati.</li>
          <li><strong>Portabilità</strong>: ricevere i tuoi dati in formato JSON leggibile.</li>
          <li><strong>Limitazione</strong>: bloccare temporaneamente il trattamento.</li>
          <li><strong>Opposizione</strong>: opporti al trattamento basato sul legittimo interesse e a quello per finalità di marketing.</li>
          <li><strong>Revoca del consenso</strong>: in qualunque momento, senza pregiudicare la liceità del trattamento precedente.</li>
        </ul>
        <p className="mt-4">
          Puoi esercitare i diritti direttamente dal tuo profilo utente (sezione
          <em> "I miei dati"</em>) usando i pulsanti "Scarica i miei dati" ed
          "Elimina il mio account", oppure scrivendo a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>
          .
        </p>
        {/* [PROPOSTA][DA VALIDARE] 18/11: procedura dei diritti del 18/11. «Scarica i miei dati» (`gdpr_export`) non contiene segnalazioni, storico sospensioni, registro dei pagamenti, messaggi email e WhatsApp; il cliente non può cambiare nome ed email dall'app. */}
        <p>
          Il file «Scarica i miei dati» contiene i dati del tuo account. Non
          contiene le segnalazioni e i reclami, lo storico delle sospensioni,
          il registro dei pagamenti e i messaggi che ci hai mandato per email o
          su WhatsApp: se li vuoi, chiedili a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>{" "}
          e te li mandiamo noi. Per correggere nome o email del tuo account scrivici
          dall'indirizzo dell'account. Rispondiamo entro un mese.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">8. Reclamo al Garante</h2>
        <p>
          Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il
          diritto di proporre reclamo al Garante per la Protezione dei Dati
          Personali (
          <a
            href="https://www.garanteprivacy.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ciano hover:underline"
          >
            garanteprivacy.it
          </a>
          ).
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">9. Sicurezza</h2>
        <p>
          Adottiamo misure di sicurezza tecniche e organizzative adeguate:
          password cifrate con bcrypt, comunicazioni HTTPS/TLS, database
          crittografato at-rest, blocco dell'accesso per 15 minuti dopo 5
          tentativi errati, accesso con Face ID facoltativo, codici QR che
          cambiano ogni 20 secondi e log di frode.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">10. Minori</h2>
        <p>
          Il servizio è riservato a maggiorenni (18+). Non raccogliamo
          consapevolmente dati di minori. Se vieni a conoscenza del contrario,
          contattaci per la cancellazione immediata.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">11. Modifiche</h2>
        <p>
          Ci riserviamo il diritto di aggiornare questa Privacy Policy. Le
          modifiche saranno pubblicate in questa pagina con la data di ultimo
          aggiornamento. Se le modifiche sono sostanziali ti avviseremo via
          email.
        </p>
      </LegalLayout>
    </div>
  );
}
