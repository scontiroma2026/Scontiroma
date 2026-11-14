// Tipo di offerta: «sconto» (prezzo pieno e scontato) oppure «omaggio» (regalo o esperienza, senza prezzi).
// Le offerte salvate prima del 13/11 non hanno il campo e sono sconti.
export const isOmaggio = (d) => d?.offer_type === "omaggio";
