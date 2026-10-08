"""Server locale per le riprese del video v13: e2e/server_e2e.py (database mongomock in memoria,
niente rete, niente segreti) ma SENZA i commercianti demo di e2e/seed_demo.py (hanno foto da internet
e titoli con «-50%»): i dati fittizi del video li crea seed_v13.py via API.
Uso: MONGO_URL=mongomock://localhost python avvia_server_v13.py
"""
import runpy
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
stub = types.ModuleType("seed_demo")


async def seed_demo(db, hash_password):  # nessun dato demo di serie
    return None


stub.seed_demo = seed_demo
sys.modules["seed_demo"] = stub
runpy.run_path(str(ROOT / "e2e" / "server_e2e.py"), run_name="__main__")
