import LegalLayout from "./LegalLayout";

export default function PrivacyPolicy() {
  return (
    <div data-testid="privacy-policy-page">
      <LegalLayout
        kicker="Documento legale"
        title="Privacy Policy"
        updatedAt="Ottobre 2026"
      >
        <p>
          La presente Privacy Policy descrive come <strong>Sconti Roma</strong> (di
          seguito "noi", "Sconti Roma" o il "Titolare") raccoglie, utilizza e
          protegge i tuoi dati personali quando utilizzi la piattaforma
          accessibile dal sito e dall'applicazione. Il trattamento avviene nel
          pieno rispetto del Regolamento (UE) 2016/679 ("GDPR") e del D.Lgs.
          196/2003 così come modificato dal D.Lgs. 101/2018.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">1. Titolare del trattamento</h2>
        <p>
          Titolare del trattamento è <strong>Sconti Roma</strong>. Puoi
          contattarci in qualsiasi momento all'indirizzo{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>{" "}
          per esercitare i tuoi diritti o per qualunque richiesta relativa al
          trattamento dei tuoi dati.
        </p>
        <p className="text-xs text-white/50 italic">
          [Dati identificativi completi (ragione sociale, sede legale, Partita
          IVA, PEC) verranno pubblicati appena la società sarà formalmente
          costituita.]
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">2. Dati che raccogliamo</h2>
        <p>Trattiamo le seguenti categorie di dati personali:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Dati di registrazione</strong>: nome, cognome, indirizzo
            email, password (memorizzata in forma cifrata bcrypt). Per i
            commercianti anche nome dell'attività, indirizzo e telefono.
          </li>
          <li>
            <strong>Dati di autenticazione biometrica</strong>: se attivi Face
            ID / Touch ID, memorizziamo esclusivamente una chiave pubblica
            WebAuthn generata dal tuo dispositivo. Non abbiamo mai accesso ai
            tuoi dati biometrici, che restano solo sul tuo telefono.
          </li>
          <li>
            <strong>Dati commerciali (solo commercianti)</strong>: nome
            attività, telefono/WhatsApp, zona, categoria merceologica,
            fotografie del punto vendita.
          </li>
          <li>
            <strong>Dati di geolocalizzazione</strong>: se acconsenti, usiamo la
            tua posizione approssimata per mostrarti gli sconti più vicini. La
            posizione non viene memorizzata sui nostri server: viene usata solo
            durante la sessione.
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
            generati, riscatti effettuati, recensioni lasciate.
          </li>
          <li>
            <strong>Dati condivisi con il commerciante</strong>: quando il
            commerciante scansiona il tuo codice QR vede soltanto il tuo{" "}
            <strong>nome e l'iniziale del cognome</strong> (es. "Mario R."),
            l'ora, l'offerta e se sei un cliente nuovo o di ritorno. Non vede
            la tua email né altri dati. Le statistiche che il commerciante vede
            nella sua area sono solo numeri aggregati e compaiono solo quando i
            clienti del mese sono almeno 3.
          </li>
          <li>
            <strong>Statistiche di visita</strong>: solo se accetti i cookie
            "funzionali", contiamo visite e pagine viste con un identificativo
            casuale non collegato al tuo account (vedi{" "}
            <a href="/cookies" className="text-fucsia hover:underline">Cookie Policy</a>).
          </li>
          <li>
            <strong>Log tecnici</strong>: indirizzo IP, tipo di browser, sistema
            operativo, timestamp delle richieste — utilizzati esclusivamente per
            sicurezza e prevenzione frodi.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">3. Finalità e basi giuridiche</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="border border-white/10 p-2 text-left">Finalità</th>
                <th className="border border-white/10 p-2 text-left">Base giuridica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 p-2">Creazione account e autenticazione</td>
                <td className="border border-white/10 p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Gestione dei pagamenti dei commercianti (solo dopo la fase di lancio e con la loro conferma)</td>
                <td className="border border-white/10 p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Invio email transazionali (benvenuto, recupero password, promemoria di scadenza delle offerte)</td>
                <td className="border border-white/10 p-2">Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Geolocalizzazione per ordinare sconti vicini</td>
                <td className="border border-white/10 p-2">Consenso esplicito (art. 6.1.a GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Comunicazioni promozionali</td>
                <td className="border border-white/10 p-2">Consenso esplicito (art. 6.1.a GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Statistiche anonime di visita</td>
                <td className="border border-white/10 p-2">Consenso (art. 6.1.a GDPR), tramite banner cookie</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Prevenzione frodi e sicurezza</td>
                <td className="border border-white/10 p-2">Legittimo interesse (art. 6.1.f GDPR)</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">Obblighi fiscali e contabili</td>
                <td className="border border-white/10 p-2">Obbligo di legge (art. 6.1.c GDPR)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="font-serif text-2xl text-white mt-8">4. Fornitori esterni (Responsabili del trattamento)</h2>
        <p>
          Per erogare il servizio ci avvaliamo di fornitori qualificati che
          agiscono come Responsabili del trattamento ai sensi dell'art. 28 GDPR:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Stripe Payments Europe Ltd.</strong> (Irlanda) — Elaborazione
            pagamenti con carta.
          </li>
          <li>
            <strong>PayPal (Europe) S.à r.l.</strong> (Lussemburgo) —
            Elaborazione pagamenti tramite portafoglio PayPal.
          </li>
          <li>
            <strong>Resend Inc.</strong> (USA, region EU-West) — Invio email
            transazionali. I server di invio si trovano in Irlanda (eu-west-1).
          </li>
          <li>
            <strong>MongoDB Atlas</strong> (region EU) — Archiviazione dati
            all'interno dell'Unione Europea.
          </li>
          <li>
            <strong>Render Services, Inc.</strong> (USA, region EU-Francoforte) —
            Hosting dell'applicazione.
          </li>
          <li>
            <strong>Google LLC</strong> (Gemini API) — Miglioramento automatico
            delle foto delle offerte caricate dai commercianti, solo su loro
            richiesta.
          </li>
        </ul>

        <h3 className="font-serif text-xl text-white mt-6">4.1 Mappa, indirizzi e caratteri</h3>
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
            <strong>Google Fonts</strong> (Google Ireland Ltd.) — caratteri
            tipografici del sito, a ogni pagina (
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-ciano hover:underline">informativa</a>).
          </li>
          <li>
            <strong>Google Maps</strong> — solo se tocchi "Portami qui": si apre
            Google Maps con la posizione del negozio come destinazione.
          </li>
        </ul>
        <p>
          La ricerca degli indirizzi durante l'iscrizione del commerciante usa{" "}
          <strong>Nominatim</strong> (OpenStreetMap Foundation): il testo
          dell'indirizzo viene inviato dai nostri server, quindi Nominatim non
          riceve il tuo indirizzo IP.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">5. Trasferimenti extra-UE</h2>
        <p>
          Alcuni fornitori (Stripe, PayPal, Resend, Render, Google, OpenStreetMap
          Foundation) possono elaborare dati
          anche al di fuori dell'UE. In tal caso il trasferimento è protetto
          dalle Clausole Contrattuali Standard approvate dalla Commissione
          Europea (SCC) o da decisioni di adeguatezza. Puoi richiedere copia
          delle garanzie scrivendo a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>
          .
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">6. Periodo di conservazione</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Dati account, codici QR, riscatti, recensioni</strong>:
            finché l'account è attivo. Quando elimini l'account vengono
            cancellati subito, insieme alle offerte del commerciante e al loro
            archivio.
          </li>
          <li><strong>Dati contabili / fatture</strong>: 10 anni (obbligo di legge), in forma non più collegata al tuo account.</li>
          <li><strong>Log di sicurezza</strong>: 12 mesi.</li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">7. I tuoi diritti (art. 15-22 GDPR)</h2>
        <p>Puoi in qualsiasi momento esercitare i seguenti diritti:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Accesso</strong>: chiedere copia dei dati che trattiamo.</li>
          <li><strong>Rettifica</strong>: correggere dati inesatti.</li>
          <li><strong>Cancellazione (diritto all'oblio)</strong>: eliminare l'account e tutti i dati collegati.</li>
          <li><strong>Portabilità</strong>: ricevere i tuoi dati in formato JSON leggibile.</li>
          <li><strong>Limitazione</strong>: bloccare temporaneamente il trattamento.</li>
          <li><strong>Opposizione</strong>: opporti al trattamento per finalità di marketing.</li>
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

        <h2 className="font-serif text-2xl text-white mt-8">8. Reclamo al Garante</h2>
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

        <h2 className="font-serif text-2xl text-white mt-8">9. Sicurezza</h2>
        <p>
          Adottiamo misure di sicurezza tecniche e organizzative adeguate:
          password cifrate con bcrypt, comunicazioni HTTPS/TLS, database
          crittografato at-rest, blocco dell'accesso per 15 minuti dopo 5
          tentativi errati, accesso con Face ID facoltativo, codici QR che
          cambiano ogni 20 secondi e log di frode.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">10. Minori</h2>
        <p>
          Il servizio è riservato a maggiorenni (18+). Non raccogliamo
          consapevolmente dati di minori. Se vieni a conoscenza del contrario,
          contattaci per la cancellazione immediata.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">11. Modifiche</h2>
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
