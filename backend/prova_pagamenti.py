"""Prova gratuita e pagamento mensile dei negozi: funzioni PURE (nessun database, nessun addebito).

Regole (decisioni del titolare, PIANO_LANCIO_COMMERCIANTI.md, sezioni 0, 3-bis e 3-ter):
  - la prova dura 60 giorni dal PRIMO GIORNO DI PUBBLICAZIONE (giorno 1 = quel giorno);
  - il giorno 61 la prova continua fino alla fine di quel mese; si paga dal 1° del mese successivo
    (se il giorno 61 cade già un 1°, il pagamento parte quel giorno);
  - pagamento entro N giorni dal 1° -> offerta subito nel mese corrente; oltre N giorni -> il
    pagamento vale per il mese successivo;
  - «Non rinnovo»: l'offerta resta visibile fino a fine mese, dal 1° successivo decade.
I confini del mese sono quelli di Roma (Europe/Rome).
"""
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Union
from zoneinfo import ZoneInfo

ROMA = ZoneInfo("Europe/Rome")
GIORNI_PROVA = 60
TOLLERANZA_PREDEFINITA = 5


def a_data_roma(valore: Union[str, date, datetime, None]) -> Optional[date]:
    """Data (giorno di Roma) di un valore ISO / datetime / date. Un datetime senza fuso vale UTC."""
    if valore is None or valore == "":
        return None
    if isinstance(valore, datetime):
        dt = valore
    elif isinstance(valore, date):
        return valore
    else:
        try:
            dt = datetime.fromisoformat(str(valore).replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ROMA).date()


def chiave_mese(d: date) -> str:
    return f"{d.year}-{d.month:02d}"


def primo_del_mese_dopo(d: date) -> date:
    return date(d.year + 1, 1, 1) if d.month == 12 else date(d.year, d.month + 1, 1)


def mese_dopo(chiave: str) -> str:
    y, m = chiave.split("-")
    return chiave_mese(primo_del_mese_dopo(date(int(y), int(m), 1)))


def billing_start_date(first_published_at) -> Optional[date]:
    """Primo giorno in cui si paga. Giorno 61 = primo giorno + 60; se è un 1° si paga quel giorno,
    altrimenti il 1° del mese dopo."""
    primo = a_data_roma(first_published_at)
    if primo is None:
        return None
    giorno_61 = primo + timedelta(days=GIORNI_PROVA)
    return giorno_61 if giorno_61.day == 1 else primo_del_mese_dopo(giorno_61)


def trial_end_date(first_published_at) -> Optional[date]:
    """Ultimo giorno di prova gratuita (compreso): il giorno prima dell'inizio dei pagamenti."""
    inizio = billing_start_date(first_published_at)
    return inizio - timedelta(days=1) if inizio else None


def pagato_in_tempo(paid_at, month_key: str, tolleranza: int) -> bool:
    """Vero se il pagamento del mese `month_key` è arrivato entro `tolleranza` giorni dal 1°
    (anche prima del 1° va bene). Data non leggibile -> prudente: non in tempo."""
    giorno = a_data_roma(paid_at)
    if giorno is None:
        return False
    y, m = month_key.split("-")
    return giorno <= date(int(y), int(m), 1) + timedelta(days=int(tolleranza))


def stato_pagamento(first_published_at, pagamenti: dict, oggi: date, tolleranza: int) -> dict:
    """Stato del negozio rispetto al pagamento. `pagamenti` = {month_key: paid_at}.
    fase: "senza_prova" (mai pubblicato: dati insufficienti, prudente = visibile), "in_prova",
    "pagato", "da_pagare". «pagato» = offerta visibile questo mese grazie a un pagamento (in tempo
    per questo mese, oppure arrivato in ritardo il mese scorso e quindi valido per questo)."""
    inizio = billing_start_date(first_published_at)
    if inizio is None:
        return {"fase": "senza_prova", "prova_fino_al": None, "primo_pagamento": None, "visibile": True}
    base = {"prova_fino_al": inizio - timedelta(days=1), "primo_pagamento": inizio}
    if oggi < inizio:
        return {**base, "fase": "in_prova", "visibile": True}
    mk = chiave_mese(oggi)
    prec = chiave_mese(oggi.replace(day=1) - timedelta(days=1))
    in_tempo = mk in pagamenti and pagato_in_tempo(pagamenti[mk], mk, tolleranza)
    # pagamento del mese scorso arrivato oltre la tolleranza: vale per questo mese.
    # Un pagamento di questo mese arrivato in ritardo NON rende visibile l'offerta ora (vale dal mese dopo).
    ritardo_prec = prec in pagamenti and not pagato_in_tempo(pagamenti[prec], prec, tolleranza)
    pagato = in_tempo or ritardo_prec
    return {**base, "fase": "pagato" if pagato else "da_pagare", "visibile": pagato}


def offer_visible_for_payment_core(*, required: bool, first_published_at, pagamenti: dict, oggi: date,
                                   tolleranza: int, no_renew_month: Optional[str] = None) -> bool:
    """Decisione pura. Interruttore spento -> sempre vero (comportamento di oggi)."""
    if not required:
        return True
    mk = chiave_mese(oggi)
    if no_renew_month:
        if no_renew_month == mese_dopo(mk):
            return True   # disdetta: l'offerta resta pubblica fino all'ultimo giorno del mese
        if no_renew_month <= mk:
            return False  # disdetta già in vigore: offerta e pagamento decaduti
    return stato_pagamento(first_published_at, pagamenti, oggi, tolleranza)["visibile"]
