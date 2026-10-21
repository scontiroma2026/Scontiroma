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
          <strong>Euro Linea S.r.l.s.</strong> (Partita IVA 03240220644),
          di seguito "Sconti Roma". Registrandoti al Servizio dichiari di
          aver letto, compreso e accettato integralmente i presenti Termini.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">1. Oggetto del Servizio</h2>
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

        {/* [PROPOSTA - DA VALIDARE dal consulente] Punto 24: blocco P2B (Reg. UE 2019/1150, norme citate non verificate sui testi ufficiali). */}
        <h3 className="font-serif text-xl text-foreground mt-6">Informazioni per i Commercianti (trasparenza)</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Condizioni chiare.</strong> Le condizioni che valgono per
            i Commercianti sono scritte in questi Termini, in italiano e in
            modo semplice. Le modifiche si comunicano come indicato all'art. 9.
          </li>
          <li>
            <strong>Ordine delle offerte.</strong> Le offerte sono mostrate
            dalla più recente alla meno recente. Se il Cliente attiva la
            posizione, sono mostrate dalla più vicina. Nessun Commerciante
            può pagare per comparire prima o in evidenza: oggi non esistono
            corsie a pagamento.
          </li>
          <li>
            <strong>Motivazioni.</strong> Se rifiutiamo un'offerta, ne
            indichiamo il motivo per iscritto. Per la sospensione o la
            chiusura del negozio vedi l'art. 2.
          </li>
          <li>
            <strong>Reclami.</strong> Il Commerciante può fare un reclamo dalla
            sua area o scrivere a{" "}
            <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">
              info@scontiroma.it
            </a>
            . La procedura è descritta all'art. 11.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">2. Registrazione</h2>
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
            Un solo account per persona. Account multipli o fittizi possono
            essere chiusi.
          </li>
          {/* [PROPOSTA - DA VALIDARE] Punto 26: sostituisce «sospendere o chiudere account che violano i Termini, ai sensi dell'art. 1456 c.c.» (art. 1456 c.c. non verificato sul testo ufficiale). */}
          <li>
            <strong>Sospensione.</strong> Se un account o un negozio viola i
            Termini, possiamo sospenderlo. Ti scriviamo il motivo, in modo
            chiaro, su un supporto durevole (di norma l'email dell'account),
            al più tardi nel momento in cui la sospensione ha effetto.
          </li>
          <li>
            <strong>Chiusura.</strong> Se decidiamo di chiudere l'account di
            un Commerciante, lo avvisiamo con almeno <strong>30 giorni</strong>{" "}
            di preavviso. Il preavviso non c'è se la chiusura è urgente (ad
            esempio per tutelare i Clienti o per obbligo di legge) o se la
            violazione è grave o ripetuta: in questi casi scriviamo comunque il
            motivo.
          </li>
          <li>
            <strong>Reclamo.</strong> Se non sei d'accordo con una sospensione
            o una chiusura, scrivi a{" "}
            <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">
              info@scontiroma.it
            </a>
            : riesaminiamo la decisione e rispondiamo con un motivo entro{" "}
            <strong>10 giorni lavorativi</strong>.
          </li>
          <li>
            <strong>La disdetta non è una sospensione.</strong> Se un
            Commerciante disdice il servizio, la disdetta segue le regole
            dell'art. 3.2 e dell'art. 6, non queste.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">3. Costi del servizio</h2>
        <h3 className="font-serif text-xl text-foreground mt-6">3.1 Per i Clienti</h3>
        <p>
          Durante la <strong>fase di lancio</strong> la registrazione e l'uso
          degli sconti sono <strong>gratuiti</strong> per i Clienti. Non è
          richiesto alcun dato di pagamento. Se in futuro
          venissero introdotti servizi a pagamento per i Clienti, saranno
          comunicati con almeno 30 giorni di preavviso e si attiveranno solo
          con la tua accettazione espressa.
        </p>
        <h3 className="font-serif text-xl text-foreground mt-6">3.2 Per i Commercianti</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Fase di lancio</strong>: la partecipazione è gratuita per
            circa 2 mesi. La data di fine viene comunicata via email e
            nell'area del Commerciante.
          </li>
          <li>
            <strong>Dopo la fase di lancio</strong>: €4,99 al mese + IVA.
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

        <h2 className="font-serif text-2xl text-foreground mt-8">4. Utilizzo degli sconti</h2>
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
            La condivisione del codice QR con terzi è vietata e può comportare
            la sospensione o la chiusura dell'account.
          </li>
          <li>
            Sconti Roma non garantisce la disponibilità dello sconto presso il
            singolo esercente: le condizioni di erogazione dipendono dal
            Commerciante.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">5. Obblighi dei Commercianti</h2>
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
          <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
            <span className="text-neon">✎</span> Modifiche o rimozione del negozio
          </h3>
          <p className="mt-2 text-sm">
            Il Commerciante può in qualsiasi momento, dal proprio profilo,{" "}
            <strong>modificare</strong> i propri dati, scegliere{" "}
            <strong>«Non rinnovo»</strong> per l'offerta del mese oppure{" "}
            <strong>eliminare l'account</strong>: l'eliminazione rimuove subito
            il negozio dalla piattaforma e dalla mappa e cancella i dati
            collegati.
          </p>
          <p className="mt-2 text-sm">
            Per <strong>sospendere temporaneamente</strong> l'esposizione dello
            sconto o per qualsiasi altra richiesta scrivi a{" "}
            <a
              href="mailto:partner@scontiroma.it?subject=Richiesta%20modifica%2Frimozione%20negozio"
              className="text-neon hover:underline font-semibold"
              data-testid="link-partner-modifica"
            >
              partner@scontiroma.it
            </a>
            : rispondiamo entro 5 giorni lavorativi e ti confermiamo via email
            la data di applicazione. Le offerte già mostrate ai Clienti nel mese
            in corso possono essere completate solo se il negozio non viene
            rimosso.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
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

        <h2 className="font-serif text-2xl text-foreground mt-8">6. Recesso e cancellazione</h2>
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

        <h2 className="font-serif text-2xl text-foreground mt-8">7. Limitazioni di responsabilità</h2>
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
          <strong>Clienti (consumatori).</strong> La responsabilità di Sconti
          Roma resta quella prevista dalla legge: nulla in questi Termini
          limita o esclude la responsabilità per dolo o colpa grave, per danni
          alla persona o per ciò che la legge non permette di escludere, né
          i diritti inderogabili del consumatore.
        </p>
        <p>
          <strong>Commercianti (professionisti).</strong> Nei limiti consentiti
          dalla legge, la responsabilità complessiva di Sconti Roma è limitata
          all'importo pagato dal Commerciante nei 12 mesi precedenti l'evento
          dannoso, salvi i casi di dolo o colpa grave.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">8. Proprietà intellettuale</h2>
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
          Piattaforma. Il Commerciante garantisce di avere i diritti su foto
          e testi che carica, comprese le foto migliorate con strumenti
          automatici, e di non violare diritti di terzi.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">9. Modifiche ai Termini</h2>
        {/* [PROPOSTA - DA VALIDARE] Punto 24: preavviso portato da 15 a 30 giorni per i Commercianti (art. 3 Reg. UE 2019/1150, non verificato sul testo ufficiale). */}
        <p>
          Sconti Roma può modificare i Termini. Le modifiche sostanziali
          saranno comunicate via email: ai <strong>Commercianti</strong> con
          almeno <strong>30 giorni</strong> di preavviso, agli altri utenti
          con almeno 15 giorni. Il Commerciante può disdire prima della data
          di entrata in vigore, senza penali. L'utilizzo del Servizio dopo
          l'entrata in vigore delle modifiche costituisce accettazione delle
          stesse.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">10. Legge applicabile e foro competente</h2>
        <p>
          I presenti Termini sono regolati dalla <strong>legge italiana</strong>.
          Per qualsiasi controversia il foro competente esclusivo è quello di{" "}
          <strong>Roma</strong>, fatti salvi i diritti inderogabili del
          consumatore che gli consentono di adire il foro del proprio luogo di
          residenza.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">11. Risoluzione alternativa delle controversie</h2>
        <p>
          Se hai un problema scrivici prima a{" "}
          <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">
            info@scontiroma.it
          </a>
          : cerchiamo una soluzione insieme. L'utente Consumatore può inoltre
          ricorrere agli organismi di risoluzione alternativa delle
          controversie previsti dalla legge.
        </p>
        {/* [PROPOSTA - DA VALIDARE] Punto 25: info@ come punto di contatto per segnalazioni e reclami (artt. 11-12 Reg. UE 2019/1150 e artt. 16-17-19 Reg. UE 2022/2065, non verificati sui testi ufficiali). */}
        <h3 className="font-serif text-xl text-foreground mt-6">Segnalazioni e reclami</h3>
        <p>
          <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">
            info@scontiroma.it
          </a>{" "}
          è il nostro punto di contatto per segnalazioni (ad esempio contenuti
          che ritieni illeciti o uno sconto non rispettato) e per i reclami
          dei Commercianti. Puoi anche usare il pulsante «Segnala questa
          offerta», anche senza account, oppure la scheda «Reclami» nell'area
          del Commerciante.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ti confermiamo la ricezione entro 5 giorni lavorativi.</li>
          <li>
            Ti diamo l'esito con una motivazione scritta, se ci lasci
            un'email.
          </li>
          <li>Non salviamo il tuo indirizzo IP.</li>
          <li>
            Conserviamo la segnalazione per 24 mesi, poi si cancella da sola.
          </li>
          <li>
            Il riesame di una sospensione o chiusura si fa entro 10 giorni
            lavorativi (art. 2).
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">12. Contatti</h2>
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
