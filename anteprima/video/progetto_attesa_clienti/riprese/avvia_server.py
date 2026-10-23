"""Server locale per le riprese del video di attesa per i clienti.
È e2e/server_e2e.py (database mongomock in memoria, niente rete, niente segreti, rifiuta database non locali)
ma SENZA i commercianti demo di e2e/seed_demo.py: i dati fittizi del video li crea seed_attesa.py via API.
La modalità pre-lancio si accende solo qui, con la rotta di prova /__e2e/prelancio?acceso=true.
Uso: MONGO_URL=mongomock://localhost E2E_API_PORT=8012 E2E_WEB_URL=http://localhost:3012 python avvia_server.py
"""
import os
import runpy
import sys
import types
from pathlib import Path

ROOT = Path(os.environ.get("ATTESA_ROOT") or Path(__file__).resolve().parents[4])
stub = types.ModuleType("seed_demo")


async def seed_demo(db, hash_password):  # nessun dato demo di serie
    return None


stub.seed_demo = seed_demo
sys.modules["seed_demo"] = stub
runpy.run_path(str(ROOT / "e2e" / "server_e2e.py"), run_name="__main__")
