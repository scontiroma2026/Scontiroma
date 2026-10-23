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
          <strong>esercenti locali</strong> ("Commercianti") di Roma e
          dintorni, permettendo ai primi di accedere a sconti esclusivi presso i
          punti vendita dei secondi mediante l'esposizione di codici QR
          dinamici.
        </p>
        <p>
          <strong>Sconti Roma non vende beni o servizi propri</strong>: agisce
          esclusivamente come intermediario tecnologico. Il rapporto
          commerciale relativo allo sconto specifico (es. caffè, taglio
          capelli, pizza) resta tra il Cliente e il Commerciante.
        </p>

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
          <li>
            Sconti Roma si riserva il diritto di sospendere o chiudere account
            che violano i Termini, ai sensi dell'art. 1456 c.c.
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
            <strong>Prova gratuita di circa due mesi</strong>: nella fase di
            lancio la partecipazione è gratuita. La prova parte dalla{" "}
            <strong>prima pubblicazione</strong> della tua offerta (il giorno
            in cui viene approvata e diventa visibile, non da quello
            dell'iscrizione) e prosegue fino alla fine del mese. Il primo
            pagamento è sempre il <strong>1° del mese</strong>: se la prima
            offerta è pubblicata <strong>entro l'11</strong> del mese, la prova
            finisce l'ultimo giorno del mese successivo e si paga dal 1° del
            mese dopo ancora; se è pubblicata <strong>dal 12 in poi</strong>, la
            prova finisce l'ultimo giorno del secondo mese successivo.
          </li>
          <li>
            <strong>Esempio</strong>: ti iscrivi il 3 novembre 2026 e la tua
            prima offerta viene pubblicata il <strong>10 novembre 2026</strong>.
            La prova gratuita dura fino al <strong>31 dicembre 2026</strong> (52
            giorni) e il primo pagamento è il <strong>1° gennaio 2027</strong>,
            poi ogni 1° del mese. Se invece la prima pubblicazione è il 12
            novembre 2026, la prova dura fino al 31 gennaio 2027 (81 giorni) e
            il primo pagamento è il 1° febbraio 2027. La data esatta del tuo
            primo pagamento è sempre indicata nell'area del Commerciante.
          </li>
          <li>
            <strong>Dopo la prova</strong>: €4,99 al mese + IVA. Ogni
            variazione di prezzo ti è comunicata con almeno 30 giorni di
            preavviso.
          </li>
          <li>
            <strong>Avvisi per email</strong>: ti scriviamo al giorno 30 della
            prova, 7 giorni prima del primo pagamento e 3 giorni prima di ogni
            addebito mensile.
          </li>
          <li>
            <strong>Nessun addebito senza la tua conferma</strong>: il
            pagamento parte solo dopo che hai letto il riepilogo (importo, data
            del primo pagamento, regole di disdetta), hai dato la tua conferma
            espressa e hai scelto carta o PayPal. Se non confermi, non paghi
            nulla e la tua offerta non viene più pubblicata. Finché i
            pagamenti non sono attivati non viene addebitato alcun importo.
          </li>
          <li>
            <strong>Pagamento e pubblicazione</strong>: il pagamento si fa dal
            1° al 5 del mese. Prima si paga, poi l'offerta del mese viene
            approvata e pubblicata: se il pagamento arriva dopo il 5, l'offerta
            è pubblicata dal mese successivo.
          </li>
          <li>
            <strong>Disdetta</strong>: disdici quando vuoi, porti avanti solo
            l'offerta che è in corso a fine mese. La disdetta ha effetto alla
            fine del mese in corso: fino all'ultimo giorno i Clienti possono
            usare lo sconto già pubblicato e devi rispettarlo; dal 1° del mese
            successivo non c'è nessun nuovo addebito.
          </li>
          <li>
            <strong>Mese pagato non rimborsabile</strong>: l'importo del mese
            già pagato non viene rimborsato, anche se disdici durante il mese.
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
          {/* [PROPOSTA][DA VALIDARE dal consulente] Punto 23: prezzo precedente (testo da #147 sez. 13, adattato). Norma (art. 17-bis Codice del Consumo), eccezioni e sentenza C-330/23 da verificare. */}
          <li data-testid="termini-prezzo-30-giorni">
            Garantire che il <strong>prezzo pieno indicato</strong> nell'offerta
            è il prezzo più basso che hai applicato a quel prodotto o servizio
            nei 30 giorni precedenti la pubblicazione dello sconto. Se non puoi
            garantirlo, non indicare un prezzo pieno più alto.
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
            <strong>eliminare l'account</strong>: se hai un'offerta in
            corso, il negozio resta visibile fino all'ultimo giorno del mese
            (i Clienti possono usare lo sconto) e viene rimosso dalla
            piattaforma e dalla mappa dal 1° del mese successivo; senza offerte
            in corso la rimozione è immediata. I dati collegati vengono poi
            cancellati.
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
        {/* [PROPOSTA][DA VALIDARE dal consulente] Punti 20 e 21: manleva, persone nelle foto, criteri di approvazione, contestazione. Norme (artt. 96-97 L. 633/1941, art. 4 Reg. UE 2019/1150) da verificare; termine di 10 giorni lavorativi = proposta. */}
        <p data-testid="termini-foto-persone">
          <strong>Non caricare foto in cui si riconoscono persone senza il
          loro permesso.</strong> Il Commerciante è l'unico responsabile dei
          contenuti e delle foto che carica e ci tiene indenne (manleva) da
          pretese di terzi, comprese richieste di risarcimento, collegate a
          quei contenuti, per quanto consentito dalla legge.
        </p>
        <p data-testid="termini-approvazione-foto">
          Ogni offerta e ogni foto sono controllate da Sconti Roma prima della
          pubblicazione. Non pubblichiamo contenuti che: mostrano persone
          riconoscibili senza permesso; contengono marchi o opere altrui senza
          diritto di usarli; non riguardano l'offerta; sono ingannevoli
          (anche sul prezzo); sono di scarsa qualità o contrari alla legge. Se
          scartiamo una foto o un'offerta, ti scriviamo il motivo. Se non sei
          d'accordo, scrivi a{" "}
          <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">info@scontiroma.it</a>
          : riesaminiamo la decisione e rispondiamo entro 10 giorni lavorativi.
        </p>

        <h2 className="font-serif text-2xl text-foreground mt-8">9. Modifiche ai Termini</h2>
        <p>
          Sconti Roma può modificare i Termini in qualsiasi momento. Le
          modifiche sostanziali saranno comunicate via email con almeno 15
          giorni di preavviso. L'utilizzo del Servizio dopo l'entrata in
          vigore delle modifiche costituisce accettazione delle stesse.
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
