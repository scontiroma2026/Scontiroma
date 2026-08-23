import LegalLayout from "./LegalLayout";

export default function CookiePolicy() {
  return (
    <div data-testid="cookie-policy-page">
      <LegalLayout
        kicker="Documento legale"
        title="Cookie Policy"
        updatedAt="Febbraio 2026"
      >
        <p>
          Questo documento spiega quali cookie e tecnologie di tracciamento
          simili utilizza <strong>Sconti Roma</strong> e come puoi gestirne le
          preferenze. Il testo è redatto in conformità al Provvedimento del
          Garante Privacy del 10 giugno 2021 (nn. 231) e all'art. 122 del
          Codice Privacy.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">1. Cosa sono i cookie</h2>
        <p>
          I cookie sono piccoli file di testo che i siti web inviano al tuo
          dispositivo durante la navigazione. Vengono memorizzati dal browser
          e riletti ad ogni visita successiva. Alcuni sono essenziali per il
          funzionamento del sito, altri servono per finalità statistiche o di
          personalizzazione.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">2. Cookie che utilizziamo</h2>

        <h3 className="font-serif text-xl text-white mt-6">2.1 Cookie tecnici (sempre attivi)</h3>
        <p>
          Sono strettamente necessari per il funzionamento del servizio. Non
          richiedono consenso perché senza di essi il sito non funziona.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="border border-white/10 p-2 text-left">Nome</th>
                <th className="border border-white/10 p-2 text-left">Scopo</th>
                <th className="border border-white/10 p-2 text-left">Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 p-2 font-mono">sr_session</td>
                <td className="border border-white/10 p-2">Mantiene la sessione utente autenticata</td>
                <td className="border border-white/10 p-2">Sessione</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2 font-mono">sr_auth_token</td>
                <td className="border border-white/10 p-2">Token JWT di autenticazione</td>
                <td className="border border-white/10 p-2">30 giorni</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2 font-mono">sr_cookie_consent</td>
                <td className="border border-white/10 p-2">Memorizza le tue scelte sui cookie</td>
                <td className="border border-white/10 p-2">6 mesi</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2 font-mono">sr_csrf</td>
                <td className="border border-white/10 p-2">Protezione anti-CSRF</td>
                <td className="border border-white/10 p-2">Sessione</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-serif text-xl text-white mt-6">2.2 Cookie di terze parti (richiedono consenso)</h3>
        <p>
          Vengono attivati solo dopo il tuo consenso esplicito nel banner
          cookie. Puoi revocare il consenso in qualunque momento.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="border border-white/10 p-2 text-left">Fornitore</th>
                <th className="border border-white/10 p-2 text-left">Scopo</th>
                <th className="border border-white/10 p-2 text-left">Categoria</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 p-2">Stripe</td>
                <td className="border border-white/10 p-2">Elaborazione pagamenti e prevenzione frodi (attivato solo alla pagina di pagamento)</td>
                <td className="border border-white/10 p-2">Tecnico contestuale</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">PayPal</td>
                <td className="border border-white/10 p-2">Elaborazione pagamenti PayPal (attivato solo alla pagina di pagamento)</td>
                <td className="border border-white/10 p-2">Tecnico contestuale</td>
              </tr>
              <tr>
                <td className="border border-white/10 p-2">OpenStreetMap</td>
                <td className="border border-white/10 p-2">Visualizzazione mappa degli sconti (solo se apri la pagina mappa)</td>
                <td className="border border-white/10 p-2">Funzionalità</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 italic text-white/70">
          Al momento <strong>NON utilizziamo cookie di profilazione, marketing
          o analytics di terze parti</strong> (né Google Analytics, né Facebook
          Pixel, né altri). Se in futuro dovessimo integrarli, ti chiederemo
          nuovamente il consenso esplicito.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">3. Come gestire le tue preferenze</h2>
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

        <h2 className="font-serif text-2xl text-white mt-8">4. Log del consenso</h2>
        <p>
          Ogni scelta espressa nel banner viene registrata sui nostri server
          (data, ora, opzione scelta, hash della sessione) come prova legale
          del consenso, ai sensi dell'art. 7 GDPR. Il log è conservato per 24
          mesi.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">5. Contatti</h2>
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
