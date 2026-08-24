import LegalLayout from "./LegalLayout";

export default function Termini() {
  return (
    <div data-testid="termini-page">
      <LegalLayout
        kicker="Documento legale"
        title="Termini e Condizioni d'Uso"
        updatedAt="Febbraio 2026"
      >
        <p>
          I presenti Termini e Condizioni ("Termini") disciplinano l'accesso e
          l'utilizzo della piattaforma <strong>Sconti Roma</strong> (di seguito
          "il Servizio" o "la Piattaforma") gestita da{" "}
          <strong>Sconti Roma</strong>. Registrandoti al Servizio dichiari di
          aver letto, compreso e accettato integralmente i presenti Termini.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">1. Oggetto del Servizio</h2>
        <p>
          Sconti Roma è una piattaforma digitale che mette in contatto{" "}
          <strong>utenti abbonati</strong> ("Clienti") con{" "}
          <strong>esercenti locali</strong> ("Commercianti") della zona di
          Roma, permettendo ai primi di accedere a sconti esclusivi presso i
          punti vendita dei secondi mediante l'esposizione di codici QR
          dinamici.
        </p>
        <p>
          <strong>Sconti Roma non vende beni o servizi propri</strong>: agisce
          esclusivamente come intermediario tecnologico. Il rapporto
          commerciale relativo allo sconto specifico (es. caffè, taglio
          capelli, pizza) resta tra il Cliente e il Commerciante.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">2. Registrazione</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Devi avere almeno <strong>18 anni</strong> per registrarti.</li>
          <li>
            Devi fornire dati veritieri, aggiornati e completi. Sei
            responsabile della custodia delle tue credenziali (password, PIN,
            Face ID).
          </li>
          <li>
            Un solo account per persona. Account multipli o fittizi verranno
            chiusi senza rimborso.
          </li>
          <li>
            Sconti Roma si riserva il diritto di sospendere o chiudere account
            che violano i Termini, ai sensi dell'art. 1456 c.c.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">3. Abbonamento a pagamento</h2>
        <p>
          L'accesso agli sconti richiede la sottoscrizione di un abbonamento
          mensile a rinnovo automatico:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Prezzo</strong>: €2,99 o €3,00 al mese (indicato al
            checkout, IVA inclusa quando applicabile).
          </li>
          <li>
            <strong>Pagamento</strong>: tramite Stripe o PayPal. Non
            memorizziamo i dati della tua carta.
          </li>
          <li>
            <strong>Rinnovo automatico</strong>: l'abbonamento si rinnova
            automaticamente ogni mese finché non lo disattivi dalla tua area
            personale (sezione "Gestisci abbonamento").
          </li>
          <li>
            <strong>Nessun vincolo di durata</strong>: puoi disdire in
            qualsiasi momento. La disdetta ha effetto alla fine del periodo di
            fatturazione in corso.
          </li>
          <li>
            <strong>Mancato pagamento</strong>: se il pagamento al rinnovo non
            va a buon fine, l'abbonamento viene <strong>sospeso
            immediatamente</strong> e non potrai più utilizzare gli sconti.
            Hai <strong>7 giorni</strong> per completare il pagamento (Stripe e
            PayPal riproveranno automaticamente in questo periodo): se
            l'operazione va a buon fine, l'abbonamento riprende subito e viene
            rinnovato di 30 giorni. Se trascorrono <strong>7 giorni senza
            pagamento</strong>, l'abbonamento <strong>decade
            definitivamente</strong> e per riattivarlo dovrai iscriverti di
            nuovo.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">4. Utilizzo degli sconti</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Gli sconti sono <strong>personali e non trasferibili</strong>. Ogni
            codice QR è generato in tempo reale e legato al tuo account.
          </li>
          <li>
            Puoi utilizzare ogni singolo sconto <strong>una sola volta al
            mese</strong> per esercente, salvo diversa indicazione.
          </li>
          <li>
            La condivisione del codice QR con terzi è vietata e comporta la
            chiusura immediata dell'account senza rimborso.
          </li>
          <li>
            Sconti Roma non garantisce la disponibilità dello sconto presso il
            singolo esercente: le condizioni di erogazione dipendono dal
            Commerciante.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-white mt-8">5. Obblighi dei Commercianti</h2>
        <p>
          I Commercianti che aderiscono alla piattaforma si impegnano a:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Rispettare lo sconto pubblicato per l'intero mese di validità.</li>
          <li>
            Fornire informazioni veritiere su attività, prodotto, prezzo e
            zona.
          </li>
          <li>Non modificare l'offerta prima del 1° del mese successivo.</li>
          <li>
            Emettere regolare scontrino / fattura secondo la normativa fiscale
            italiana.
          </li>
          <li>
            Non discriminare gli abbonati Sconti Roma rispetto agli altri
            clienti.
          </li>
        </ul>

        <div className="mt-6 rounded-xl border border-neon/30 bg-neon/5 p-5">
          <h3 className="font-serif text-lg text-white flex items-center gap-2">
            <span className="text-neon">✎</span> Modifiche o rimozione del negozio
          </h3>
          <p className="mt-2 text-sm">
            Il Commerciante che desidera <strong>modificare</strong> i propri
            dati (nome attività, indirizzo, categoria, telefono),{" "}
            <strong>sospendere temporaneamente</strong> l'esposizione dello
            sconto oppure <strong>rimuovere definitivamente</strong> il negozio
            dalla piattaforma e dalla mappa deve inviare richiesta scritta a{" "}
            <a
              href="mailto:partner@scontiroma.it?subject=Richiesta%20modifica%2Frimozione%20negozio"
              className="text-neon hover:underline font-semibold"
              data-testid="link-partner-modifica"
            >
              partner@scontiroma.it
            </a>{" "}
            con un <strong>preavviso minimo di 15 giorni</strong> rispetto alla
            data di efficacia richiesta.
          </p>
          <p className="mt-2 text-sm">
            Sconti Roma processerà la richiesta entro 5 giorni lavorativi dalla
            ricezione e confermerà la data effettiva di applicazione via email.
            Il preavviso di 15 giorni serve a permettere agli abbonati che
            hanno già visualizzato l'offerta di completare eventuali riscatti
            in corso.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Per candidature di nuovi negozi e collaborazioni B2B scrivi allo
            stesso indirizzo{" "}
            <a
              href="mailto:partner@scontiroma.it?subject=Candidatura%20nuovo%20negozio"
              className="text-neon hover:underline"
              data-testid="link-partner-candidatura"
            >
              partner@scontiroma.it
            </a>
            .
          </p>
        </div>

        <h2 className="font-serif text-2xl text-white mt-8">6. Diritto di recesso</h2>
        <p>
          Gli utenti Consumatori possono esercitare il diritto di recesso
          entro 14 giorni dalla sottoscrizione, come previsto dal Codice del
          Consumo (D.Lgs. 206/2005). Per le modalità dettagliate consulta la{" "}
          <a href="/recesso" className="text-fucsia hover:underline">
            pagina Diritto di Recesso
          </a>
          .
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">7. Limitazioni di responsabilità</h2>
        <p>
          Sconti Roma fornisce il Servizio "così com'è" e non garantisce:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>La disponibilità continua e senza interruzioni della Piattaforma;</li>
          <li>
            La qualità, sicurezza o legittimità dei prodotti/servizi erogati
            dai Commercianti;
          </li>
          <li>
            L'esattezza delle informazioni pubblicate dai Commercianti.
          </li>
        </ul>
        <p>
          Nei limiti massimi consentiti dalla legge, la responsabilità
          complessiva di Sconti Roma nei confronti dell'utente è limitata
          all'importo pagato dall'utente stesso nei 12 mesi precedenti
          l'evento dannoso.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">8. Proprietà intellettuale</h2>
        <p>
          Il nome "Sconti Roma", il logo, il design della piattaforma, il
          codice sorgente e tutti i contenuti editoriali sono di proprietà
          esclusiva di Sconti Roma. Ne è vietata la riproduzione senza
          autorizzazione scritta.
        </p>
        <p>
          Le fotografie e i testi caricati dai Commercianti restano di loro
          proprietà; con la pubblicazione concedono a Sconti Roma una licenza
          non esclusiva, gratuita e revocabile per l'utilizzo sulla
          Piattaforma.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">9. Modifiche ai Termini</h2>
        <p>
          Sconti Roma può modificare i Termini in qualsiasi momento. Le
          modifiche sostanziali saranno comunicate via email con almeno 15
          giorni di preavviso. L'utilizzo del Servizio dopo l'entrata in
          vigore delle modifiche costituisce accettazione delle stesse.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">10. Legge applicabile e foro competente</h2>
        <p>
          I presenti Termini sono regolati dalla <strong>legge italiana</strong>.
          Per qualsiasi controversia il foro competente esclusivo è quello di{" "}
          <strong>Roma</strong>, fatti salvi i diritti inderogabili del
          consumatore che gli consentono di adire il foro del proprio luogo di
          residenza.
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">11. Risoluzione alternativa delle controversie (ODR)</h2>
        <p>
          Ai sensi del Reg. UE 524/2013 informiamo l'utente Consumatore della
          possibilità di ricorrere alla piattaforma ODR della Commissione
          Europea:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ciano hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>

        <h2 className="font-serif text-2xl text-white mt-8">12. Contatti</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Assistenza generale:{" "}
            <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline" data-testid="link-termini-info">
              info@scontiroma.it
            </a>
          </li>
          <li>
            Privacy e diritti GDPR:{" "}
            <a href="mailto:privacy@scontiroma.it" className="text-ciano hover:underline" data-testid="link-termini-privacy">
              privacy@scontiroma.it
            </a>
          </li>
          <li>
            Commercianti e partner:{" "}
            <a href="mailto:partner@scontiroma.it" className="text-neon hover:underline" data-testid="link-termini-partner">
              partner@scontiroma.it
            </a>
          </li>
        </ul>
      </LegalLayout>
    </div>
  );
}
