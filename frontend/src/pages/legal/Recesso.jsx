import LegalLayout from "./LegalLayout";

export default function Recesso() {
  return (
    <div data-testid="recesso-page">
      <LegalLayout
        kicker="Diritti del consumatore"
        title="Diritto di Recesso"
        updatedAt="Febbraio 2026"
      >
        <p>
          Ai sensi degli artt. 52 e seguenti del{" "}
          <strong>Codice del Consumo</strong> (D.Lgs. 206/2005), il Cliente
          Consumatore ha diritto di recedere dal contratto di abbonamento
          entro <strong>14 giorni</strong> dalla data di sottoscrizione, senza
          dover fornire alcuna motivazione e senza sostenere costi diversi da
          quelli previsti nel presente documento.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">1. Termine per il recesso</h2>
        <p>
          Il termine di 14 giorni decorre dal giorno in cui viene attivato
          l'abbonamento (data del primo pagamento andato a buon fine).
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">2. Come esercitare il recesso</h2>
        <p>Puoi esercitare il diritto di recesso in due modi:</p>

        <h3 className="font-serif text-xl text-white mt-6">Metodo A — Direttamente dall'app (consigliato)</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Accedi con il tuo account.</li>
          <li>Vai su <em>"Il tuo account"</em> → sezione <em>"Abbonamento"</em>.</li>
          <li>Clicca su <em>"Gestisci"</em> → <em>"Annulla abbonamento"</em>.</li>
          <li>Conferma la richiesta. Il recesso è immediato.</li>
        </ol>

        <h3 className="font-serif text-xl text-white mt-6">Metodo B — Via email</h3>
        <p>
          Invia una email a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>{" "}
          con oggetto <strong>"Recesso abbonamento"</strong> indicando:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Nome, cognome, email dell'account.</li>
          <li>Data di sottoscrizione dell'abbonamento.</li>
          <li>Dichiarazione esplicita di volontà di recedere.</li>
        </ul>
        <p>
          Riceverai conferma di ricezione entro 24 ore e la richiesta sarà
          evasa entro 3 giorni lavorativi.
        </p>

        <h3 className="font-serif text-xl text-white mt-6">Modulo di recesso tipo</h3>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs whitespace-pre-line text-white/80">
{`Destinatario: Sconti Roma — privacy@scontiroma.it

Con la presente notifico il recesso dal mio contratto di abbonamento
al servizio Sconti Roma.

- Sottoscritto in data: ______________
- Nome e cognome del consumatore: ______________
- Indirizzo email dell'account: ______________
- Data: ______________
- Firma (solo se cartaceo): ______________`}
        </div>

        <h2 className="font-serif text-2xl text-white mt-8">3. Rimborso</h2>
        <p>
          A seguito del recesso esercitato entro i 14 giorni, Sconti Roma
          rimborserà l'intera somma versata (€2,99 o €3,00 del mese corrente)
          entro <strong>14 giorni</strong> dalla comunicazione, utilizzando lo
          stesso mezzo di pagamento impiegato per la transazione originaria
          (Stripe o PayPal). Nessun costo aggiuntivo per il rimborso.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">4. Esclusioni al diritto di recesso</h2>
        <p>
          Ai sensi dell'art. 59 del Codice del Consumo, il diritto di recesso
          <strong> non si applica</strong> se:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Hai già <strong>utilizzato uno o più sconti</strong> (riscattato
            almeno un codice QR presso un esercente) durante i 14 giorni. In
            tal caso il contratto si considera integralmente eseguito per la
            parte di servizio già usufruita e non è più recedibile.
          </li>
          <li>
            Al momento del checkout hai spuntato la casella{" "}
            <em>"Rinuncio al diritto di recesso per accesso immediato agli
            sconti"</em> (se presente).
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">5. Disdetta dopo i 14 giorni</h2>
        <p>
          Superati i 14 giorni non è più applicabile il diritto di recesso
          formale, ma puoi comunque <strong>disdire liberamente</strong>{" "}
          l'abbonamento in qualsiasi momento dall'app. La disdetta ha effetto
          alla fine del mese in corso: potrai continuare a usare gli sconti
          fino alla scadenza, senza ulteriori addebiti.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">6. Assistenza</h2>
        <p>
          Se hai problemi ad annullare l'abbonamento o non hai ricevuto il
          rimborso nei termini indicati, contattaci a{" "}
          <a href="mailto:privacy@scontiroma.it" className="text-fucsia hover:underline">
            privacy@scontiroma.it
          </a>
          . Ti risponderemo entro 24 ore lavorative.
        </p>
      </LegalLayout>
    </div>
  );
}
