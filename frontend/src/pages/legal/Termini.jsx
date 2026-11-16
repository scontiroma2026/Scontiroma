import LegalLayout from "./LegalLayout";

export default function Termini() {
  return (
    <div data-testid="termini-page">
      <LegalLayout
        kicker="Documento legale"
        title="Termini e Condizioni d'Uso"
        updatedAt="Novembre 2026"
      >
        <p>
          I presenti Termini e Condizioni ("Termini") disciplinano l'accesso e
          l'utilizzo della piattaforma <strong>Sconti Roma</strong> (di seguito
          "il Servizio" o "la Piattaforma") gestita da{" "}
          {/* [PROPOSTA - DA VALIDARE] 23/10/2026: dati societari dalla visura camerale (art. 2250 c.c., D.Lgs. 70/2003). */}
          <strong>EUROLINEA S.r.l.s.</strong>, con sede legale in Via Tasso
          5/B, 83031 Ariano Irpino (AV), codice fiscale e Partita IVA
          03240220644, iscritta al Registro delle Imprese Irpinia Sannio, REA
          AV-313674, capitale sociale 3.000,00 €, PEC{" "}
          <a href="mailto:eurolineasrls@alpec.it" className="text-fucsia hover:underline">
            eurolineasrls@alpec.it
          </a>
          , di seguito "Sconti Roma". Registrandoti al Servizio dichiari di
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

        {/* [PROPOSTA - DA VALIDARE dal consulente] Punto 24: blocco P2B (Reg. UE 2019/1150, norme citate non verificate sui testi ufficiali). */}
        <h3 className="font-serif text-xl text-foreground mt-6">Informazioni per i Commercianti (trasparenza)</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Condizioni chiare.</strong> Le condizioni che valgono per
            i Commercianti sono scritte in questi Termini, in italiano e in
            modo semplice. Le modifiche si comunicano come indicato all'art. 9.
          </li>
          {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: con la durata scelta dal negozio le offerte cambiano spesso; si precisa che l'ordine segue la data della prima offerta del negozio (codice: `list_discounts`, ordinamento per `created_at`, che non cambia con «Prolunga» o con la prossima offerta). Art. 5 Reg. UE 2019/1150 da verificare. */}
          <li>
            <strong>Ordine delle offerte.</strong> Le offerte sono mostrate
            dalla più recente alla meno recente, secondo la data in cui il
            negozio ha creato la sua prima offerta: prolungare l'offerta,
            cambiarla o prepararne un'altra non cambia la posizione. Se il
            Cliente attiva la posizione, sono mostrate dalla più vicina.
            Nessun Commerciante può pagare per comparire prima o in evidenza:
            oggi non esistono corsie a pagamento.
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
            <strong>Prova gratuita di 2 mesi (almeno 60 giorni)</strong>: nella
            fase di lancio la partecipazione è gratuita. La prova parte dalla{" "}
            <strong>prima pubblicazione</strong> della tua offerta (il giorno
            in cui viene approvata e diventa visibile, non da quello
            dell'iscrizione) e dura <strong>almeno 60 giorni</strong>, contando
            anche il giorno della prima pubblicazione (le date sono quelle di
            Roma). Il primo pagamento è sempre il <strong>1° del mese</strong>:
            è il primo giorno 1 del mese che arriva almeno 60 giorni dopo la
            prima pubblicazione. La prova finisce il giorno prima del primo
            pagamento, quindi dura da 60 a 90 giorni.
          </li>
          <li>
            <strong>Esempio</strong>: ti iscrivi il 3 novembre 2026 e la tua
            prima offerta viene pubblicata il <strong>10 novembre 2026</strong>.
            Sessanta giorni dopo è il 9 gennaio 2027, quindi la prova gratuita
            dura fino al <strong>31 gennaio 2027</strong> (83 giorni) e il primo
            pagamento è il <strong>1° febbraio 2027</strong>, poi ogni 1° del
            mese. Se invece la prima pubblicazione è il 2 ottobre 2026, sessanta
            giorni dopo è proprio il 1° dicembre 2026: la prova dura fino al 30
            novembre 2026 (60 giorni) e il primo pagamento è il 1° dicembre
            2026. La data esatta del tuo primo pagamento è sempre indicata
            nell'area del Commerciante.
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
            nulla e, dal giorno dopo la fine della prova, la tua offerta non
            si vede più, anche se la data di fine che hai scelto è
            successiva. Finché i pagamenti non sono attivati non viene
            addebitato alcun importo.
          </li>
          {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: durata scelta dal negozio (decisione del titolare del 14/11). Regole di prezzo, prova e pagamento invariate; adattate solo le parole che davano per scontata l'offerta del mese. Codice dei pagamenti spento e non toccato (`prova_pagamenti.offer_visible_for_payment_core`: un'offerta si vede solo nei mesi pagati; con la disdetta, dal 1° del mese dopo non si vede più anche se la sua data di fine è successiva). Scelta prudente: scriverlo chiaro; dubbio nella lista per l'avvocato. */}
          <li>
            <strong>Pagamento e pubblicazione</strong>: dopo la prova il
            pagamento si fa dal 1° al 5 di ogni mese. Prima si paga, poi
            l'offerta viene approvata e pubblicata. Se il pagamento arriva
            dopo il 5, vale per il mese successivo: fino ad allora l'offerta
            non si vede. Questo vale anche per un'offerta che dura più mesi: si
            vede solo nei mesi pagati e la sua data di fine non si sposta.
          </li>
          <li>
            <strong>Disdetta</strong>: disdici quando vuoi, porti avanti solo
            l'offerta che è in corso, fino a fine mese. La disdetta ha effetto
            alla fine del mese in corso: fino all'ultimo giorno i Clienti
            possono usare l'offerta già pubblicata e devi rispettarla; dal 1°
            del mese successivo l'offerta non si vede più, anche se la data di
            fine che hai scelto è successiva, e non c'è nessun nuovo addebito.
            La disdetta del pagamento è una cosa diversa da «Non rinnovo»
            (art. 5).
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
          {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: limiti d'uso, scadenza e codici con la durata scelta dal negozio. Codice: `create_redemption` (utilizzi contati per esercente e mese di calendario, anche se l'offerta cambia), `_codice_di_mese_scaduto` (codice valido nel mese in cui nasce, fino alle 02:00 del 1° del mese dopo), `_offerta_del_codice_finita` (codice non usato non vale dopo la fine dell'offerta, fino alle 02:00 del giorno dopo, salvo nuova offerta già online). */}
          <li>
            Puoi utilizzare lo sconto di ogni esercente <strong>una sola volta
            al mese</strong> (mese di calendario), salvo diversa indicazione:
            il Commerciante può consentire più utilizzi e il numero lo vedi
            nella pagina dell'offerta. Il conteggio vale per esercente, anche
            se nel corso del mese l'offerta cambia.
          </li>
          <li>
            <strong>Fino a quando vale.</strong> Ogni offerta ha la durata
            scelta dal Commerciante e indica fino a quando vale («Valida fino
            al …»): l'ultimo giorno è compreso. Un omaggio può anche non avere
            una scadenza: in quel caso vale finché resta online. Un'offerta
            può finire prima della data indicata, per esempio se il
            Commerciante lascia Sconti Roma o se l'offerta viene sospesa o
            tolta (per un errore grave o per una violazione di questi
            Termini).
          </li>
          <li>
            <strong>Codici non usati.</strong> Un codice QR non ancora usato
            smette di valere alla fine del mese in cui è stato creato oppure,
            se arriva prima, alla fine dell'offerta, a meno che il Commerciante
            abbia già messo online una nuova offerta: in quel caso il codice
            vale per l'offerta online in quel momento. In entrambi i casi c'è
            tempo fino alle 02:00 (ora di Roma) del giorno dopo.
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
          <li>
            Le regole di questo articolo valgono anche per gli{" "}
            <strong>omaggi</strong> (un regalo o un'esperienza offerti dal
            Commerciante, senza prezzi).
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-foreground mt-8">5. Obblighi dei Commercianti</h2>
        <p>
          I Commercianti che aderiscono alla piattaforma si impegnano a:
        </p>
        {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: obblighi riallineati alla durata scelta dal negozio (tolti «per l'intero mese di validità», «le offerte sono mensili» e «Non modificare l'offerta prima del 1° del mese successivo»). Le regole sulla durata sono nel riquadro «Durata delle offerte» qui sotto. */}
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Rispettare l'offerta pubblicata per tutta la sua durata, fino alla
            data di fine compresa (per un omaggio senza scadenza, finché resta
            online), e accettare i codici dei Clienti finché valgono (art. 4).
          </li>
          <li>
            Conoscere e rispettare le regole sulla durata delle offerte scritte
            qui sotto: in particolare le offerte <strong>non si rinnovano da
            sole</strong> e, finché sono online, non si modificano e non si
            accorciano.
          </li>
          <li>
            Fornire informazioni veritiere su attività, prodotto, prezzo e
            zona.
          </li>
          {/* [PROPOSTA][DA VALIDARE dal consulente] Punto 23: prezzo precedente (testo da #147 sez. 13, adattato). Norma (art. 17-bis Codice del Consumo), eccezioni e sentenza C-330/23 da verificare. 16/11: aggiunta la regola per «Prolunga» e per lo sconto ripresentato come nuova offerta (lettura più prudente della stessa frase: contano i 30 giorni prima della nuova pubblicazione). */}
          <li data-testid="termini-prezzo-30-giorni">
            Garantire che il <strong>prezzo pieno indicato</strong> nell'offerta
            è il prezzo più basso che hai applicato a quel prodotto o servizio
            nei 30 giorni precedenti la pubblicazione dello sconto. Se non puoi
            garantirlo, non indicare un prezzo pieno più alto. Se prolunghi lo
            sconto con «Prolunga» conta la sua prima pubblicazione; se lo
            ripresenti come nuova offerta contano i 30 giorni prima della nuova
            pubblicazione, compresi i giorni in cui era già scontato.
          </li>
          {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: la durata e le date le sceglie il negozio, quindi tocca a lui rispettare le regole sulle vendite promozionali e sui saldi (Lazio e Roma Capitale: periodi e settori da verificare) e, per gli omaggi, la disciplina delle manifestazioni a premio (D.P.R. 430/2001, da verificare). */}
          <li>
            Rispettare le regole sulle vendite promozionali e sui saldi (per
            esempio i periodi in cui alcuni settori non possono fare vendite
            promozionali prima dei saldi) e, se offri un omaggio, quelle sulle
            manifestazioni a premio: la durata e le date dell'offerta le
            scegli tu.
          </li>
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

        {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: regole della durata scelta dal negozio (decisione del titolare del 14/11), scritte sul codice della PR #253: `DiscountIn._durata_valida`, `_validita` (durata dal giorno in cui va online, date di Roma, ultimo giorno compreso; sconto al massimo DURATA_MAX_SCONTO_GIORNI = 90, omaggio 365 o senza scadenza), `_offerta_bloccata` e `admin_force_edit` (sblocco: torna in revisione), `merchant_extend_discount` («Prolunga» senza nuova approvazione, avviso all'admin), `_stato_prossima` e `_cambia_offerta_negozio` (prossima offerta), `_run_next_offer_reminders` (promemoria 7, 3 e 1 giorno prima), `merchant_set_no_renew` («Non rinnovo» ritira la prossima e ferma i promemoria; non tocca il pagamento), `_fine_offerta` (offerte approvate prima: regola del mese). Il massimo di 90 giorni e la «Prolunga» senza nuova approvazione sono nella lista per l'avvocato. */}
        <h3 className="font-serif text-xl text-foreground mt-6">Durata delle offerte</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Quanto dura.</strong> La durata la scegli tu quando crei
            l'offerta: 7, 14, 30, 60 o 90 giorni oppure fino a un giorno
            preciso; se non scegli, dura 30 giorni. Uno sconto può restare
            online al massimo 90 giorni di fila; un omaggio fino a 365 giorni
            oppure senza scadenza. La durata parte dal giorno in cui l'offerta
            va online (il giorno in cui la approviamo oppure, per la prossima
            offerta, il giorno dopo la fine di quella in corso), con le date di
            Roma; l'ultimo giorno è compreso.
          </li>
          <li>
            <strong>Le offerte non si rinnovano da sole.</strong> Alla data di
            fine l'offerta termina e, se non c'è una prossima offerta
            approvata, il negozio non compare più tra gli sconti finché non ne
            pubblichi un'altra. Se non hai preparato la prossima offerta e non
            hai scelto «Non rinnovo», ti avvisiamo per email 7, 3 e 1 giorno
            prima della fine (solo se l'offerta dura più di così); quando
            l'offerta è terminata ti mandiamo un'email.
          </li>
          <li>
            <strong>Offerta online bloccata.</strong> Finché è online,
            l'offerta non si modifica e non si accorcia fino alla sua data di
            fine: i Clienti l'hanno vista con quella data. Se c'è un errore
            grave (per esempio un prezzo sbagliato o un prodotto finito),
            scrivi a partner@scontiroma.it: possiamo sbloccarla. In quel caso
            l'offerta torna in revisione e non si vede finché non la approviamo
            di nuovo; se la sblocchiamo di nostra iniziativa, ti scriviamo il
            motivo.
          </li>
          <li>
            <strong>«Prolunga».</strong> Puoi allungare l'offerta online con
            un tocco, senza una nuova approvazione: resta identica e vale più a
            lungo, entro il massimo (90 giorni in tutto per uno sconto, 365 per
            un omaggio, contati dal giorno in cui è andata online). Prolungando
            confermi che prezzi e condizioni sono ancora veri. Riceviamo un
            avviso e possiamo comunque controllarla. Se avevi scelto «Non
            rinnovo», la proroga annulla la scelta.
          </li>
          <li>
            <strong>«Prossima offerta».</strong> Mentre un'offerta è online
            puoi preparare la prossima quando vuoi. La controlliamo come ogni
            offerta e, se la approviamo, va online da sola il giorno dopo la
            fine di quella in corso (subito, se quella in corso è un omaggio
            senza scadenza). Se alla fine dell'offerta in corso la prossima non
            è ancora approvata, il negozio resta senza offerta visibile finché
            non la approviamo.
          </li>
          <li>
            <strong>«Non rinnovo».</strong> Con «Non rinnovo» l'offerta online
            termina alla sua data di fine, i promemoria si fermano e
            l'eventuale prossima offerta già preparata viene ritirata. Puoi
            annullare la scelta finché l'offerta è online. «Non rinnovo» non è
            la disdetta del pagamento (art. 3.2): serve solo a non far
            continuare l'offerta.
          </li>
          <li>
            <strong>Omaggio senza scadenza.</strong> Resta online finché non lo
            sostituisci con la prossima offerta, non ci chiedi di toglierlo
            (partner@scontiroma.it) o non elimini l'account.
          </li>
          <li>
            Le offerte approvate prima di questo aggiornamento dei Termini
            valgono, come allora, fino all'ultimo giorno del mese in cui sono
            state approvate.
          </li>
        </ul>

        <div className="mt-6 rounded-xl border border-neon/30 bg-neon/5 p-5">
          <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
            <span className="text-neon">✎</span> Modifiche o rimozione del negozio
          </h3>
          {/* [PROPOSTA][DA VALIDARE dal consulente] 16/11: allineato al codice. `gdpr_delete_account` + `_erase_user_data` cancellano subito account, offerta online, prossima offerta, archivio e codici dei Clienti presso il negozio; i dati di pagamento con obbligo di legge restano anonimi. Il testo di prima («visibile fino all'ultimo giorno del mese, rimosso dal 1° del mese successivo») descriveva la PR #102, mai unita. Punto 5 della lista per l'avvocato. */}
          <p className="mt-2 text-sm">
            Il Commerciante può in qualsiasi momento, dal proprio profilo,{" "}
            <strong>modificare</strong> i propri dati, scegliere{" "}
            <strong>«Non rinnovo»</strong> per l'offerta online (termina alla
            sua data di fine) oppure <strong>eliminare l'account</strong>.
            L'eliminazione è immediata: il negozio, l'offerta online,
            l'eventuale prossima offerta e l'archivio spariscono subito dalla
            piattaforma e dalla mappa, e i codici dei Clienti non ancora usati
            non valgono più. I dati collegati vengono cancellati subito,
            tranne quelli che la Privacy Policy indica come conservati più a
            lungo (per esempio i dati di pagamento richiesti dalla legge, in
            forma anonima). Se vuoi che i Clienti possano usare la tua offerta
            fino alla sua data di fine, elimina l'account dopo quella data.
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
            la data di applicazione. Un'offerta già mostrata ai Clienti può
            continuare fino alla sua data di fine solo se il negozio non viene
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
