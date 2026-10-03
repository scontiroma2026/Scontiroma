import LegalLayout from "./LegalLayout";

export default function Termini() {
  return (
    <div data-testid="termini-page">
      <LegalLayout
        kicker="Documento legale"
        title="Termini e Condizioni d'Uso"
        updatedAt="Ottobre 2026"
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
          <strong>utenti registrati</strong> ("Clienti") con{" "}
          <strong>esercenti locali</strong> ("Commercianti") dei quartieri
          Garbatella, San Paolo e Marconi a Roma, permettendo ai primi di accedere a sconti esclusivi presso i
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
          <li>
            Devi avere almeno <strong>18 anni</strong> per registrarti: con la
            registrazione lo dichiari espressamente.
          </li>
          <li>
            Devi fornire dati veritieri, aggiornati e completi. Sei
            responsabile della custodia delle tue credenziali (password e, se
            lo attivi, Face ID). Dopo 5 tentativi di accesso errati l'accesso
            viene bloccato per 15 minuti.
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

        <h2 className="font-serif text-2xl text-white mt-8">3. Costi del servizio</h2>
        <h3 className="font-serif text-xl text-white mt-6">3.1 Per i Clienti</h3>
        <p>
          Durante la <strong>fase di lancio</strong> la registrazione e l'uso
          degli sconti sono <strong>gratuiti</strong> per i Clienti. Non è
          richiesto alcun abbonamento né alcun dato di pagamento. Se in futuro
          venissero introdotti servizi a pagamento per i Clienti, saranno
          comunicati con almeno 30 giorni di preavviso e si attiveranno solo
          con la tua accettazione espressa.
        </p>
        <h3 className="font-serif text-xl text-white mt-6">3.2 Per i Commercianti</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Fase di lancio</strong>: la partecipazione è gratuita per
            circa 2 mesi. La data di fine viene comunicata via email e
            nell'area del Commerciante.
          </li>
          <li>
            <strong>Dopo la fase di lancio</strong>: €4,99 al mese, IVA
            inclusa.
          </li>
          <li>
            <strong>Prezzo bloccato</strong> per i Commercianti che aderiscono
            durante la fase di lancio, finché restano iscritti senza
            interruzioni.
          </li>
          <li>
            <strong>Preavviso di 30 giorni</strong> prima della fine della fase
            di lancio e di qualsiasi variazione di prezzo.
          </li>
          <li>
            <strong>Nessun addebito senza la tua conferma</strong>: il
            pagamento parte solo se lo confermi espressamente. Se non confermi,
            non paghi nulla e la tua offerta non viene più pubblicata.
          </li>
          <li>
            <strong>Nessun vincolo</strong>: puoi smettere quando vuoi, anche
            scegliendo «Non rinnovo» per l'offerta del mese.
          </li>
          <li>
            <strong>Pagamento</strong>: tramite Stripe o PayPal. Non
            memorizziamo i dati della carta.
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
            Se il Commerciante consente <strong>più utilizzi nello stesso
            mese</strong>, vale comunque il limite di <strong>massimo 1 utilizzo
            al giorno</strong> per lo stesso sconto: gli utilizzi devono
            avvenire in giornate diverse. Il sistema blocca automaticamente la
            generazione di un secondo codice QR nello stesso giorno.
          </li>
          <li>
            Gli sconti sono riservati <strong>esclusivamente al titolare
            dell'account</strong>: non possono essere utilizzati per
            estendere il beneficio ad accompagnatori, amici o familiari non
            registrati. L'uso improprio ripetuto può comportare la sospensione
            dell'account.
          </li>
          <li>
            La condivisione del codice QR con terzi è vietata e comporta la
            chiusura immediata dell'account.
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
            Sapere che le offerte sono <strong>mensili e non si rinnovano
            automaticamente</strong>: ogni offerta termina l'ultimo giorno del
            mese. Per continuare il Commerciante carica l'offerta del mese
            successivo, che viene pubblicata dopo l'approvazione; in
            alternativa può scegliere «Non rinnovo». Prima della scadenza
            riceve dei promemoria via email.
          </li>
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
            Non discriminare i Clienti Sconti Roma rispetto agli altri
            clienti.
          </li>
          <li>
            Verificare sempre la <strong>schermata di scansione</strong>: lo
            sconto va applicato solo a schermata verde. In caso di schermata
            rossa (incluso il messaggio "limite giornaliero raggiunto": il
            cliente ha già usato lo sconto lo stesso giorno) applicare il
            prezzo pieno. Gli utilizzi multipli mensili valgono per{" "}
            <strong>massimo 1 utilizzo al giorno per Cliente</strong> e non
            sono cumulabili nella stessa visita per coprire persone non
            registrate.
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
            Il preavviso di 15 giorni serve a permettere ai Clienti che
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

        <h2 className="font-serif text-2xl text-white mt-8">6. Recesso e cancellazione</h2>
        <p>
          Puoi eliminare il tuo account in qualsiasi momento dal profilo
          ("Elimina il mio account"). Per gli eventuali servizi a pagamento
          rivolti ai Consumatori vale il diritto di recesso di 14 giorni
          previsto dal Codice del Consumo (D.Lgs. 206/2005). Per le modalità
          dettagliate consulta la{" "}
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
          all'importo eventualmente pagato dall'utente stesso nei 12 mesi
          precedenti l'evento dannoso, salvo i casi di dolo o colpa grave e i
          diritti inderogabili del consumatore.
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
