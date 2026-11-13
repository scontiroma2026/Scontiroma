// Offerte già pronte da cui il commerciante parte alla prima offerta.
// Riempiono solo titolo, descrizione e condizioni: i prezzi li scrive sempre il commerciante
// (il prezzo originale deve essere il più basso praticato negli ultimi 30 giorni).
// Testi neutri: nessuna promessa di risultati, nessun marchio di terzi.

const COMUNI = [
  {
    id: "benvenuto",
    titolo: "Prima visita scontata",
    description: "Uno sconto per chi viene a trovarci **per la prima volta**. Mostra il QR alla cassa.",
    terms: "Valido una volta per cliente. Non cumulabile con altre promozioni.",
    validity_info: "",
  },
];

const PER_CATEGORIA = {
  "Ristorante": [
    {
      id: "pranzo",
      titolo: "Menu pranzo a prezzo speciale",
      description: "Primo, secondo e acqua a un prezzo speciale, **dal lunedì al venerdì a pranzo**.",
      terms: "Bevande diverse dall'acqua escluse. Valido per una persona.",
      validity_info: "Dal lunedì al venerdì, a pranzo.",
    },
    {
      id: "cena-due",
      titolo: "Cena per due",
      description: "Due piatti a scelta e un dolce da dividere, a un prezzo speciale. **Prenotazione consigliata**.",
      terms: "Valido per due persone. Bevande escluse.",
      validity_info: "",
    },
  ],
  "Pizzeria": [
    {
      id: "pizza-bibita",
      titolo: "Pizza + bibita",
      description: "Una **pizza classica** a scelta e una bibita a un prezzo speciale.",
      terms: "Valido per una persona. Pizze speciali escluse.",
      validity_info: "",
    },
  ],
  "Bar & Caffè": [
    {
      id: "colazione",
      titolo: "Colazione completa",
      description: "**Cappuccino e cornetto** a un prezzo speciale.",
      terms: "Valido per una persona, al banco.",
      validity_info: "Tutti i giorni fino alle 11.",
    },
    {
      id: "aperitivo",
      titolo: "Aperitivo",
      description: "Un drink con stuzzichini a un prezzo speciale.",
      terms: "Valido per una persona.",
      validity_info: "Tutti i giorni dalle 18 alle 20.",
    },
  ],
  "Gelateria": [
    {
      id: "coppetta",
      titolo: "Coppetta media",
      description: "Una **coppetta media** con i gusti che vuoi, a un prezzo speciale.",
      terms: "Valido per una persona.",
      validity_info: "",
    },
  ],
  "Beauty & SPA": [
    {
      id: "piega",
      titolo: "Taglio e piega",
      description: "**Taglio e piega** a un prezzo speciale. Su appuntamento.",
      terms: "Valido per una persona. Trattamenti aggiuntivi esclusi.",
      validity_info: "Dal martedì al venerdì.",
    },
    {
      id: "manicure",
      titolo: "Manicure",
      description: "Una **manicure** a un prezzo speciale. Su appuntamento.",
      terms: "Valido per una persona.",
      validity_info: "",
    },
  ],
  "Sport & Fitness": [
    {
      id: "prova",
      titolo: "Primo mese di prova",
      description: "Il **primo mese** di ingresso a un prezzo speciale.",
      terms: "Valido solo per i nuovi iscritti. Certificato medico richiesto se previsto.",
      validity_info: "",
    },
  ],
  "Shopping": [
    {
      id: "spesa",
      titolo: "Sconto sulla spesa",
      description: "Un prezzo speciale su un **prodotto scelto** del negozio.",
      terms: "Valido fino a esaurimento scorte.",
      validity_info: "",
    },
  ],
  "Vino & Gastronomia": [
    {
      id: "degustazione",
      titolo: "Degustazione",
      description: "Una **degustazione** con assaggi della casa a un prezzo speciale.",
      terms: "Valido per una persona.",
      validity_info: "",
    },
  ],
  "Cultura": [
    {
      id: "ingresso",
      titolo: "Ingresso a prezzo speciale",
      description: "Un **ingresso** a un prezzo speciale.",
      terms: "Valido per una persona.",
      validity_info: "",
    },
  ],
  "Servizi": [
    {
      id: "servizio",
      titolo: "Primo servizio scontato",
      description: "Il tuo **primo servizio** con noi a un prezzo speciale.",
      terms: "Valido una volta per cliente.",
      validity_info: "",
    },
  ],
};

/** Offerte pronte per la categoria del negozio, più quella valida per tutti. */
export function offertePronte(categoria) {
  return [...(PER_CATEGORIA[categoria] || []), ...COMUNI];
}
