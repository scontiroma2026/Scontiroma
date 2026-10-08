"""La libreria di immagini di esempio (catalogo «Esempi») deve restare ben formata.

Le foto sono copiate sul nostro sito (frontend/public/esempi): non conta quante sono, ma che
ogni categoria ne abbia abbastanza, che i percorsi siano nel formato atteso, che nessuna foto
sia ripetuta, che ogni file (grande e miniatura) esista davvero e sia un JPEG delle misure
giuste, e che non resti nessun collegamento diretto a Unsplash. Non apre rete né database.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from default_images import DEFAULT_IMAGE_LIBRARY, all_images_flat, list_categories  # noqa: E402

ESEMPI = Path(__file__).resolve().parents[2] / "frontend" / "public" / "esempi"
PERCORSO_RE = re.compile(r"^/esempi/\d{10,14}-[0-9a-f]{12}\.jpg$")


def _tutte():
    return [u for urls in DEFAULT_IMAGE_LIBRARY.values() for u in urls]


def test_dieci_categorie_con_almeno_dieci_foto():
    assert len(DEFAULT_IMAGE_LIBRARY) == 10
    assert list_categories() == list(DEFAULT_IMAGE_LIBRARY.keys())
    for cat, urls in DEFAULT_IMAGE_LIBRARY.items():
        assert cat.strip(), "categoria senza nome"
        assert len(urls) >= 10, f"{cat}: servono almeno 10 foto"


def test_percorsi_nostri_nel_formato_atteso():
    for cat, urls in DEFAULT_IMAGE_LIBRARY.items():
        for url in urls:
            assert PERCORSO_RE.match(url), f"{cat}: percorso non valido {url}"
    assert not any("unsplash" in u for u in _tutte()), "collegamento diretto a Unsplash rimasto"


def test_nessuna_foto_ripetuta():
    tutte = _tutte()
    assert len(tutte) == len(set(tutte))
    assert len(all_images_flat()) == len(tutte)


def _misure_jpeg(percorso: Path):
    """(larghezza, altezza) letti dall'intestazione JPEG (nessuna libreria esterna)."""
    dati = percorso.read_bytes()
    assert dati[:3] == b"\xff\xd8\xff", f"{percorso.name}: non e' un JPEG"
    i = 2
    while i + 9 < len(dati):
        assert dati[i] == 0xFF, f"{percorso.name}: JPEG malformato"
        marcatore, lung = dati[i + 1], int.from_bytes(dati[i + 2:i + 4], "big")
        if marcatore in (0xC0, 0xC1, 0xC2):  # SOF: baseline / progressive
            return int.from_bytes(dati[i + 7:i + 9], "big"), int.from_bytes(dati[i + 5:i + 7], "big")
        i += 2 + lung
    raise AssertionError(f"{percorso.name}: misure non trovate")


def test_ogni_foto_ha_il_file_grande_e_la_miniatura():
    for url in _tutte():
        nome = url.rsplit("/", 1)[1]
        grande, mini = ESEMPI / nome, ESEMPI / "mini" / nome
        assert grande.is_file(), f"manca {grande}"
        assert mini.is_file(), f"manca {mini}"
        assert _misure_jpeg(grande) == (800, 450), nome
        assert _misure_jpeg(mini) == (400, 225), f"{nome} mini"


def test_nessun_file_in_piu_e_nota_della_licenza_presente():
    attesi = {u.rsplit("/", 1)[1] for u in _tutte()}
    assert {p.name for p in ESEMPI.glob("*.jpg")} == attesi
    assert {p.name for p in (ESEMPI / "mini").glob("*.jpg")} == attesi
    nota = (ESEMPI / "LICENZA.txt").read_text(encoding="utf-8")
    assert "Unsplash" in nota and "unsplash.com/license" in nota


def test_peso_totale_ragionevole():
    totale = sum(p.stat().st_size for p in ESEMPI.rglob("*.jpg"))
    assert totale < 40 * 1024 * 1024, f"foto di esempio troppo pesanti: {totale / 1e6:.1f} MB"


def test_la_risposta_dell_endpoint_resta_leggera():
    # /api/default-images manda l'intera libreria in un colpo solo.
    assert len(json.dumps(DEFAULT_IMAGE_LIBRARY)) < 60_000
