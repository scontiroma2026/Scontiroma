import LegalLayout from "./LegalLayout";

export default function CookiePolicy() {
  return (
    <div data-testid="cookie-policy-page">
      <LegalLayout
        kicker="Documento legale"
        title="Cookie Policy"
        updatedAt="Ottobre 2026"
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
          Oltre ai cookie usiamo la memoria del browser (localStorage) per le
          stesse finalità tecniche.
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
              <tr>
                <td className="border border-border p-2 font-mono">referral_merchant_id</td>
                <td className="border border-border p-2">Memoria del browser: ricorda il negozio da cui sei arrivato tramite il suo QR, per attribuirgli l'iscrizione</td>
                <td className="border border-border p-2">30 giorni</td>
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
          cookie. Servono a capire, in forma anonima, quante persone usano
          l'app e quali pagine visitano — nessun dato è collegato alla tua
          identità.
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
                <td className="border border-border p-2">
                  Identificativo anonimo generato a caso, usato solo per
                  contare visite e pagine viste (analytics interna, nessun
                  fornitore esterno)
                </td>
                <td className="border border-border p-2">Fino a cancellazione manuale</td>
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
          Ogni scelta espressa nel banner viene registrata sui nostri server
          (data, ora, opzione scelta, indirizzo IP e tipo di browser) come
          prova del consenso, ai sensi dell'art. 7 GDPR. Il log è conservato
          per 24 mesi o fino alla cancellazione dell'account, se sei
          registrato.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">5. Contatti</h2>
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
