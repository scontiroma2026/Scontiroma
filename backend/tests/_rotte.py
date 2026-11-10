"""Elenco piatto delle rotte del server per i test.

Con le versioni recenti di FastAPI le rotte aggiunte con `include_router` non stanno più una per una in
`app.routes`: c'è un solo contenitore. Senza questa funzione i test che scorrono `app.routes` non
troverebbero nessuna rotta `/api/...` e passerebbero a vuoto.
"""


def tutte_le_rotte(app) -> list:
    """Ogni elemento ha `.path` e `.methods`, come le rotte di una volta."""
    rotte = []
    for r in app.routes:
        contesti = getattr(r, "effective_route_contexts", None)
        if contesti is not None:
            rotte.extend(contesti())
        else:
            rotte.append(r)
    return rotte
