"""Server locale per le riprese del video tutorial per i clienti.
È e2e/server_e2e.py (database mongomock in memoria, niente rete, niente segreti, rifiuta database non locali)
ma SENZA i commercianti demo di e2e/seed_demo.py: i dati fittizi li crea seed_tutorial.py via API.
In più, SOLO qui, la rotta /__video/retrodata (come nel video v17) per spostare indietro la prima pubblicazione
di un negozio: così si vedono entrambi i distintivi, «Nuovo su Sconti Roma» e «Nuova offerta».
Uso: MONGO_URL=mongomock://localhost E2E_API_PORT=8013 E2E_WEB_URL=http://localhost:3013 python avvia_server.py
"""
import os
import runpy
import sys
import types
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(os.environ.get("TUTORIAL_ROOT") or Path(__file__).resolve().parents[4])
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
    async def retrodata(email: str, giorni_negozio: int = 0):
        u = await server.db.users.find_one({"email": email.lower(), "role": "merchant"})
        if not u:
            return {"ok": False}
        quando = (datetime.now(timezone.utc) - timedelta(days=giorni_negozio)).isoformat()
        await server.db.users.update_one({"id": u["id"]}, {"$set": {"first_published_at": quando}})
        return {"ok": True}

    _run(app, **kw)


uvicorn.run = _run_con_rotta_video
runpy.run_path(str(ROOT / "e2e" / "server_e2e.py"), run_name="__main__")
