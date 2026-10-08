"""La libreria di immagini di esempio (catalogo «Esempi») deve restare ben formata.

Non conta quante foto ci sono: controlla solo che ogni categoria abbia abbastanza foto,
che gli indirizzi siano tutti di Unsplash nel formato atteso e che nessuna foto sia ripetuta
(né nella stessa categoria né fra categorie). Non apre rete né database.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from default_images import DEFAULT_IMAGE_LIBRARY, all_images_flat, list_categories  # noqa: E402

URL_RE = re.compile(
    r"^https://images\.unsplash\.com/photo-\d{10,14}-[0-9a-f]{12}\?w=800&h=450&fit=crop&auto=format&q=80$"
)


def test_dieci_categorie_con_almeno_dieci_foto():
    assert len(DEFAULT_IMAGE_LIBRARY) == 10
    assert list_categories() == list(DEFAULT_IMAGE_LIBRARY.keys())
    for cat, urls in DEFAULT_IMAGE_LIBRARY.items():
        assert cat.strip(), "categoria senza nome"
        assert len(urls) >= 10, f"{cat}: servono almeno 10 foto"


def test_indirizzi_nel_formato_atteso():
    for cat, urls in DEFAULT_IMAGE_LIBRARY.items():
        for url in urls:
            assert URL_RE.match(url), f"{cat}: indirizzo non valido {url}"


def test_nessuna_foto_ripetuta():
    tutte = [u for urls in DEFAULT_IMAGE_LIBRARY.values() for u in urls]
    assert len(tutte) == len(set(tutte))
    assert len(all_images_flat()) == len(tutte)


def test_la_risposta_dell_endpoint_resta_leggera():
    # /api/default-images manda l'intera libreria in un colpo solo: tenerla sotto i 200 KB.
    import json
    assert len(json.dumps(DEFAULT_IMAGE_LIBRARY)) < 200_000
