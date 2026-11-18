import LegalLayout from "./LegalLayout";

export default function CookiePolicy() {
  return (
    <div data-testid="cookie-policy-page">
      <LegalLayout
        kicker="Documento legale"
        title="Cookie Policy"
        updatedAt="Novembre 2026"
      >
        <p>
          Questo documento spiega quali cookie e tecnologie di tracciamento
          simili utilizza <strong>Sconti Roma</strong> e come puoi gestirne le
          preferenze. Il testo è redatto in conformità al Provvedimento del
          Garante Privacy del 10 giugno 2021 n. 231 e all'art. 122 del
          Codice Privacy.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">1. Cosa sono i cookie</h2>
        <p>
          I cookie sono piccoli file di testo che i siti web inviano al tuo
          dispositivo durante la navigazione. Vengono memorizzati dal browser
          e riletti ad ogni visita successiva. Alcuni sono essenziali per il
          funzionamento del sito, altri servono per finalità statistiche o di
          personalizzazione.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">2. Cookie che utilizziamo</h2>

        <h3 className="font-serif text-xl text-foreground mt-6">2.1 Cookie tecnici (sempre attivi)</h3>
        <p>
          Sono strettamente necessari per il funzionamento del servizio. Non
          richiedono consenso perché senza di essi il sito non funziona.
          Oltre ai cookie usiamo la memoria del browser (localStorage e, per la
          sola scheda aperta, sessionStorage) per le stesse finalità tecniche.
          Il negozio e il volantino di provenienza servono solo a statistiche
          interne di Sconti Roma, senza fornitori esterni e senza profilazione:
          per questo li trattiamo come strumenti tecnici.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-2 text-left">Nome</th>
                <th className="border border-border p-2 text-left">Scopo</th>
                <th className="border border-border p-2 text-left">Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2 font-mono">access_token</td>
                <td className="border border-border p-2">Cookie: mantiene l'accesso al tuo account</td>
                <td className="border border-border p-2">1 giorno</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">refresh_token</td>
                <td className="border border-border p-2">Cookie: rinnova l'accesso senza dover reinserire la password</td>
                <td className="border border-border p-2">7 giorni</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">admin_master_token</td>
                <td className="border border-border p-2">Cookie: accesso al pannello di amministrazione (solo per l'amministratore)</td>
                <td className="border border-border p-2">60 minuti</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_cookie_consent</td>
                <td className="border border-border p-2">Memoria del browser: ricorda le tue scelte sui cookie</td>
                <td className="border border-border p-2">6 mesi, poi il banner chiede di nuovo</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">last_email, last_role</td>
                <td className="border border-border p-2">Memoria del browser: ricorda l'ultimo account usato nella pagina di accesso («Cambia account» per toglierlo)</td>
                <td className="border border-border p-2">Fino a cancellazione</td>
              </tr>
              {/* [PROPOSTA][DA VALIDARE] 18/11: memoria del browser riallineata al codice di `main` (chiavi in `lib/referral.js`, `SchedaZonaVuota`, `DaFareCard`, `QRVerify`, `lib/bozza.js`, `NegozioQR`, `lib/analytics.js`, `lib/push.js`). Negozio e volantino di provenienza: statistica interna di prima parte, trattata come tecnica (Linee guida del Garante 2021); dubbio nella lista per l'avvocato. */}
              <tr>
                <td className="border border-border p-2 font-mono">referral_merchant_id, referral_captured_at</td>
                <td className="border border-border p-2">Memoria del browser: ricorda il negozio da cui sei arrivato tramite il suo QR, per attribuirgli l'iscrizione</td>
                <td className="border border-border p-2">30 giorni</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">fonte_iscrizione, fonte_iscrizione_at</td>
                <td className="border border-border p-2">Memoria del browser: ricorda da quale nostro volantino o QR sei arrivato (un codice come «volantino-zona»), per contare le iscrizioni di ogni volantino</td>
                <td className="border border-border p-2">30 giorni</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">fonte_visita_…</td>
                <td className="border border-border p-2">Memoria del browser: conta una sola volta al giorno la visita arrivata da un volantino o da un QR (al server va solo il codice del volantino)</td>
                <td className="border border-border p-2">Fino a cancellazione (si aggiorna ogni giorno)</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_interesse_zona</td>
                <td className="border border-border p-2">Memoria del browser: ricorda per quali zone hai già toccato «Fammi sapere quando arrivate», così il voto conta una volta sola</td>
                <td className="border border-border p-2">Fino a cancellazione</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_da_fare_non_adesso_v1</td>
                <td className="border border-border p-2">Memoria del browser: ricorda i suggerimenti della scheda «Da fare» che hai rimandato con «Non adesso»</td>
                <td className="border border-border p-2">Fino a cancellazione</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_codice_negozio_v1</td>
                <td className="border border-border p-2">Memoria del browser (solo sul telefono del negozio): con «Ricorda su questo telefono» evita di riscrivere il codice del negozio; contiene un attestato firmato dal nostro server, non il codice</td>
                <td className="border border-border p-2">90 giorni</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_bozza_v1:…</td>
                <td className="border border-border p-2">Memoria del browser (solo commercianti): la bozza dell'offerta che stai scrivendo, per non perderla</td>
                <td className="border border-border p-2">Fino all'invio, a «Scarta» o all'uscita dall'account</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">qr_scansione_…</td>
                <td className="border border-border p-2">Memoria della scheda del browser: se ricarichi la pagina di un QR del negozio entro 30 secondi, la scansione non si conta due volte</td>
                <td className="border border-border p-2">Fine della sessione</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">sr_dispositivo_admin, sw-push.js</td>
                <td className="border border-border p-2">Solo per l'amministratore: segna il suo telefono o computer, che non viene contato nelle statistiche; lo strumento delle notifiche (service worker) si installa solo se attiva le notifiche. Per Clienti e Commercianti le notifiche oggi non sono attive</td>
                <td className="border border-border p-2">Fino a cancellazione o disattivazione</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">pwa_install_dismissed_at, app_feedback_dismissed_v1, sr_opened</td>
                <td className="border border-border p-2">Memoria del browser: non ripropone avvisi che hai già chiuso (l'invito a installare l'app torna dopo 7 giorni)</td>
                <td className="border border-border p-2">Fino a cancellazione / fine sessione</td>
              </tr>
              <tr>
                <td className="border border-border p-2 font-mono">app_feedback_secondi_v1</td>
                <td className="border border-border p-2">Memoria del browser: conta da quanto tempo usi l'app, per mostrare la richiesta di valutazione dopo 3 minuti (solo se hai fatto l'accesso)</td>
                <td className="border border-border p-2">Fino a cancellazione</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-serif text-xl text-foreground mt-6">2.1bis Cookie funzionali (richiedono consenso)</h3>
        <p>
          Si attivano solo se accetti la categoria "funzionali" nel banner
          cookie. Servono a capire quante persone usano l'app e quali pagine
          visitano, con un identificativo casuale che non è collegato al tuo
          account né al tuo nome. Non servono per usare l'app: se li rifiuti
          funziona tutto lo stesso.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-2 text-left">Nome</th>
                <th className="border border-border p-2 text-left">Scopo</th>
                <th className="border border-border p-2 text-left">Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2 font-mono">sr_vid</td>
                {/* [PROPOSTA][DA VALIDARE] 18/11: un identificativo casuale è pseudonimo, non anonimo (`lib/analytics.js`); se si ritira il consenso il sito lo cancella (`CookieBanner.saveConsent`). Gli eventi sul server (`analytics_events`) oggi non hanno scadenza automatica: durata da decidere (PR #114 non riportata). */}
                <td className="border border-border p-2">
                  Memoria del browser: identificativo generato a caso, usato
                  solo per contare aperture, visite, pagine viste e clic
                  (statistiche interne, nessun fornitore esterno). Non è
                  collegato al tuo account
                </td>
                <td className="border border-border p-2">Nel browser finché non lo cancelli o non ritiri il consenso (in quel caso lo togliamo noi); sul nostro server le visite oggi non hanno una cancellazione automatica</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-serif text-xl text-foreground mt-6">2.2 Servizi di terze parti</h3>
        <p>
          Alcune parti del sito vengono caricate da fornitori esterni, che
          ricevono dal tuo browser l'indirizzo IP. Non li usiamo per
          profilazione o pubblicità.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-2 text-left">Fornitore</th>
                <th className="border border-border p-2 text-left">Scopo</th>
                <th className="border border-border p-2 text-left">Categoria</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Stripe</td>
                <td className="border border-border p-2">Elaborazione pagamenti e prevenzione frodi (solo alla pagina di pagamento; oggi i pagamenti non sono attivi)</td>
                <td className="border border-border p-2">Tecnico contestuale</td>
              </tr>
              <tr>
                <td className="border border-border p-2">PayPal</td>
                <td className="border border-border p-2">Elaborazione pagamenti PayPal (solo alla pagina di pagamento; oggi i pagamenti non sono attivi)</td>
                <td className="border border-border p-2">Tecnico contestuale</td>
              </tr>
              <tr>
                <td className="border border-border p-2">OpenStreetMap</td>
                <td className="border border-border p-2">Immagini della mappa (solo nelle pagine con la mappa): OpenStreetMap Foundation riceve l'indirizzo IP</td>
                <td className="border border-border p-2">Funzionalità</td>
              </tr>
              {/* [PROPOSTA][DA VALIDARE] 18/11: sito e server rispondono con «server: cloudflare» (verifica in sola lettura del 18/11: nessun cookie impostato sulla home). Scelta prudente: si scrive che può impostare cookie tecnici di sicurezza solo se serve. */}
              <tr>
                <td className="border border-border p-2">Cloudflare</td>
                <td className="border border-border p-2">Rete usata dal nostro fornitore di hosting per consegnare il sito e proteggerlo dagli attacchi, su tutte le pagine: riceve l'indirizzo IP. Oggi non imposta cookie; può impostarne di tecnici solo per la sicurezza (per esempio contro i programmi automatici), mai per profilazione</td>
                <td className="border border-border p-2">Tecnico</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 italic text-muted-foreground">
          Al momento <strong>NON utilizziamo cookie di profilazione, marketing
          o analytics di terze parti</strong> (né Google Analytics, né Facebook
          Pixel, né altri). Se in futuro dovessimo integrarli, ti chiederemo
          nuovamente il consenso esplicito.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">3. Come gestire le tue preferenze</h2>
        <p>Puoi gestire i cookie in tre modi:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Banner iniziale</strong>: al primo accesso puoi scegliere
            "Accetta tutti", "Rifiuta" o "Personalizza".
          </li>
          <li>
            <strong>Modifica successiva</strong>: puoi riaprire il banner in
            qualsiasi momento cliccando "Gestisci cookie" nel footer del sito.
          </li>
          <li>
            <strong>Impostazioni del browser</strong>: puoi bloccare o
            eliminare tutti i cookie dalle impostazioni di Chrome, Safari,
            Firefox o Edge. Attenzione: disabilitando i cookie tecnici il sito
            potrebbe non funzionare correttamente.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">4. Log del consenso</h2>
        <p>
          {/* [PROPOSTA][DA VALIDARE] 18/11: da questa PR il registro si cancella davvero dopo 24 mesi (`expires_at` con indice TTL e pulizia all'avvio, correzione della PR #95). L'IP salvato è quello che arriva al server (`request.client.host`, dietro Render e Cloudflare di norma quello della rete del fornitore): frase prudente. */}
          Ogni scelta espressa nel banner viene registrata sui nostri server
          (data, ora, opzione scelta, indirizzo IP che arriva al nostro server
          e tipo di browser) come prova del consenso, ai sensi dell'art. 7
          GDPR. Il log è conservato per 24 mesi, poi si cancella in automatico;
          se sei registrato si cancella prima, insieme all'account.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">5. Contatti</h2>
        {/* [PROPOSTA - DA VALIDARE] 23/10/2026: titolare identificato con i dati della visura camerale. */}
        <p>
          Titolare del trattamento è <strong>EUROLINEA S.r.l.s.</strong>, Via
          Tasso 5/B, 83031 Ariano Irpino (AV), codice fiscale e Partita IVA
          03240220644, PEC{" "}
          <a href="mailto:eurolineasrls@alpec.it" className="text-fucsia hover:underline">
            eurolineasrls@alpec.it
          </a>
          . Gli altri dati sono nella Privacy Policy.
        </p>
        <p>
          Per qualsiasi domanda su questa Cookie Policy scrivi a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>
          .
        </p>
      </LegalLayout>
    </div>
  );
}
