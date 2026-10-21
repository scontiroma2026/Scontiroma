import LegalLayout from "./LegalLayout";
import { useAppConfig } from "@/context/ConfigContext";

/**
 * Regolamento degli Sconticini: BOZZA [DA VALIDARE]. Il testo di riferimento è docs/sconticini/REGOLAMENTO.md (Parte A).
 * La pagina mostra il testo solo quando gli Sconticini sono accesi sul server (SCONTICINI_ENABLED, spento di default).
 */
export default function RegolamentoSconticini() {
  const { sconticini, loaded } = useAppConfig();
  if (!loaded) return null;
  if (!sconticini) {
    return (
      <div data-testid="regolamento-sconticini-spento">
        <LegalLayout kicker="Sconticini" title="Regolamento degli Sconticini">
          <p>Gli Sconticini non sono ancora attivi. Questa pagina sarà disponibile al lancio.</p>
        </LegalLayout>
      </div>
    );
  }
  return (
    <div data-testid="regolamento-sconticini">
      <LegalLayout kicker="Sconticini" title="Regolamento degli Sconticini" updatedAt="Bozza, ottobre 2026">
        <p className="rounded-xl border border-border bg-muted p-3 text-xs">
          Bozza da validare: il testo può cambiare prima del lancio degli Sconticini.
        </p>
        <h2 className="font-serif text-2xl text-foreground mt-8">1. Cosa sono</h2>
        <p>Gli Sconticini sono una raccolta a premio gratuita offerta dai negozi che aderiscono. Ogni volta che usi uno sconto in un negozio che partecipa, ricevi uno sconticino per quel negozio. Quando ne hai raccolti il numero indicato dal negozio, sblocchi il premio che il negozio ha scelto.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">2. Chi può partecipare</h2>
        <p>I clienti maggiorenni (18+) con un account Sconti Roma. La partecipazione non costa nulla e non richiede nessun acquisto aggiuntivo oltre allo sconto che usi.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">3. Come si guadagna uno sconticino</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Solo uno sconto <strong>usato e verificato al banco</strong> dà uno sconticino: il negozio inquadra il tuo QR e scrive il codice del negozio. Un QR mostrato ma non verificato non conta.</li>
          <li>Ricevi <strong>al massimo uno sconticino al giorno per negozio</strong>.</li>
          <li>Gli sconticini sono per negozio: non si sommano tra negozi diversi e non si trasferiscono ad altre persone.</li>
          <li>Non esistono card fisiche e non si possono ottenere sconticini in altro modo.</li>
        </ul>
        <h2 className="font-serif text-2xl text-foreground mt-8">4. Il premio</h2>
        <p>Ogni negozio decide da solo il premio e quanti sconticini servono (tra 3 e 20). Soglia e premio sono sempre visibili sulla tessera del negozio. Se il negozio li cambia, il cambiamento vale per i premi futuri: un premio già sbloccato resta quello indicato al momento dello sblocco.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">5. Come si usa il premio</h2>
        <p>Raggiunta la soglia ricevi una email e trovi il premio nella tua tessera, con un QR dedicato. Il negozio lo inquadra come uno sconto normale e scrive il codice del negozio. Il QR del premio si usa una sola volta, scade dopo 60 giorni, cambia ogni pochi secondi (uno screenshot non funziona), non è cedibile e non si converte in denaro. Dopo lo sblocco gli sconticini di quel negozio ripartono da zero.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">6. Chi offre il premio</h2>
        <p><strong>Il premio è offerto e consegnato dal negozio, a sue spese e sotto la sua responsabilità.</strong> Sconti Roma fornisce solo lo strumento che conta gli sconticini e genera il QR: non paga il premio e non lo sostituisce.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">7. Se il negozio non consegna il premio</h2>
        <p>Scrivi a <a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">info@scontiroma.it</a> con il nome del negozio e la data: raccogliamo la segnalazione e possiamo mettere in pausa gli Sconticini di quel negozio. Il diritto al premio resta verso il negozio.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">8. Uso scorretto</h2>
        <p>Sconticini ottenuti con scansioni false, accordi per simulare acquisti o più account della stessa persona possono essere annullati, insieme ai premi collegati.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">9. Dati personali</h2>
        <p>Registriamo il numero di sconticini per negozio, la data dell'ultimo, i premi sbloccati, usati e scaduti e un registro di questi eventi. Il negozio vede il tuo nome e l'iniziale del cognome (per esempio «Mario R.»), non la tua email. Le email sul premio sono messaggi di servizio, non pubblicità. Tutto è cancellato quando elimini l'account.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">10. Sospensione e modifiche</h2>
        <p>Il negozio può uscire in qualsiasi momento: gli sconticini già raccolti restano segnati, ma non ne arrivano di nuovi. I premi già sbloccati restano utilizzabili fino alla scadenza.</p>
        <h2 className="font-serif text-2xl text-foreground mt-8">11. Reclami</h2>
        <p><a href="mailto:info@scontiroma.it" className="text-fucsia hover:underline">info@scontiroma.it</a>. Legge italiana.</p>
      </LegalLayout>
    </div>
  );
}
