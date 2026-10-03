import LegalLayout from "./LegalLayout";

export default function Recesso() {
  return (
    <div data-testid="recesso-page">
      <LegalLayout
        kicker="Diritti del consumatore"
        title="Diritto di Recesso"
        updatedAt="Ottobre 2026"
      >
        <p>
          Durante la <strong>fase di lancio</strong> Sconti Roma è gratuito per
          i Clienti: non c'è alcun abbonamento da annullare e nessun importo da
          rimborsare. Puoi smettere di usare il servizio quando vuoi.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">1. Come chiudere l'account</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Accedi con il tuo account.</li>
          <li>Vai su <em>"Il tuo account"</em> → sezione <em>"I miei dati"</em>.</li>
          <li>Tocca <em>"Elimina il mio account"</em> e conferma.</li>
        </ol>
        <p>
          L'account e i dati collegati vengono cancellati subito. In
          alternativa scrivi a{" "}
          <a href="mailto:info@scontiroma.it?subject=Chiusura%20account" className="text-fucsia hover:underline">
            info@scontiroma.it
          </a>{" "}
          dall'indirizzo email dell'account: la richiesta sarà evasa entro 3
          giorni lavorativi.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">2. Commercianti</h2>
        <p>
          I Commercianti aderiscono come professionisti e non come
          consumatori. Durante la fase di lancio non pagano nulla; dopo, il
          pagamento parte solo con la loro conferma espressa (vedi{" "}
          <a href="/termini" className="text-fucsia hover:underline">Termini e Condizioni</a>, art. 3.2).
          Possono smettere in qualsiasi momento scegliendo{" "}
          <strong>«Non rinnovo»</strong> dalla propria area: l'offerta in corso
          termina l'ultimo giorno del mese e non riparte.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">3. Servizi a pagamento futuri</h2>
        <p>
          Se in futuro verranno introdotti servizi a pagamento per i Clienti
          consumatori, varrà il diritto di recesso entro{" "}
          <strong>14 giorni</strong> previsto dagli artt. 52 e seguenti del{" "}
          <strong>Codice del Consumo</strong> (D.Lgs. 206/2005), con rimborso
          entro 14 giorni sullo stesso mezzo di pagamento. Le modalità
          dettagliate e il modulo di recesso tipo saranno pubblicati in questa
          pagina prima dell'attivazione.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">4. Assistenza</h2>
        <p>
          Per qualsiasi problema scrivi a{" "}
          <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">
            info@scontiroma.it
          </a>
          . Ti risponderemo entro 24 ore lavorative.
        </p>
      </LegalLayout>
    </div>
  );
}
