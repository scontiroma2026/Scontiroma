"""Server locale per le riprese del video v17: e2e/server_e2e.py (database mongomock in memoria,
niente rete, niente segreti) ma SENZA i commercianti demo di e2e/seed_demo.py: i dati fittizi
del video li crea seed_v17.py via API.
In più, SOLO per le riprese, una rotta /__video/retrodata che sposta indietro nel tempo la prima
pubblicazione di un negozio e la data di un'offerta (serve a mostrare i due distintivi diversi:
«Nuovo su Sconti Roma» e «Nuova offerta»). Esiste solo nel database in memoria di questa prova.
Uso: MONGO_URL=mongomock://localhost python avvia_server_v17.py
"""
import os
import runpy
import sys
import types
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(os.environ.get("V17_ROOT") or Path(__file__).resolve().parents[4])
stub = types.ModuleType("seed_demo")


async def seed_demo(db, hash_password):  # nessun dato demo di serie
    return None


stub.seed_demo = seed_demo
sys.modules["seed_demo"] = stub

import uvicorn  # noqa: E402

_run = uvicorn.run


def _run_con_rotta_video(app, **kw):
    import server

    @app.post("/__video/retrodata")
    async def retrodata(email: str, giorni_negozio: int = 0, giorni_offerta: int = 0):
        u = await server.db.users.find_one({"email": email.lower(), "role": "merchant"})
        if not u:
            return {"ok": False}
        now = datetime.now(timezone.utc)
        if giorni_negozio:
            await server.db.users.update_one({"id": u["id"]}, {"$set": {"first_published_at": (now - timedelta(days=giorni_negozio)).isoformat()}})
        if giorni_offerta:
            await server.db.discounts.update_many({"merchant_id": u["id"]}, {"$set": {"published_at": (now - timedelta(days=giorni_offerta)).isoformat()}})
        return {"ok": True}

    _run(app, **kw)


uvicorn.run = _run_con_rotta_video
runpy.run_path(str(ROOT / "e2e" / "server_e2e.py"), run_name="__main__")
