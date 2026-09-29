"""Test: un abbonamento con end_date passata senza rinnovo viene marcato 'expired' e non risulta piu' attivo. Richiede: pip install mongomock-motor pytest."""
import os, sys, asyncio
os.environ.update(MONGO_URL="mongodb://localhost:27017", DB_NAME="t2", JWT_SECRET="x"*40, CORS_ORIGINS="https://app.example.com")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mongomock_motor import AsyncMongoMockClient
import server
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta

server.db = AsyncMongoMockClient()["t2"]
c = TestClient(server.app, base_url="https://app.example.com")
asyncio.set_event_loop(asyncio.new_event_loop())
loop = asyncio.get_event_loop()

uid = "u-francesco"
loop.run_until_complete(server.db.users.insert_one({
    "id": uid, "email": "francesco@gmail.com", "name": "Francesco", "role": "client",
    "password_hash": server.hash_password("Password1")}))
past_end = (datetime.now(timezone.utc) - timedelta(days=6)).isoformat()
loop.run_until_complete(server.db.subscriptions.insert_one({
    "id": "s1", "user_id": uid, "status": "active", "plan": "monthly",
    "start_date": (datetime.now(timezone.utc) - timedelta(days=36)).isoformat(),
    "end_date": past_end, "provider": "mock",
}))

token = server.create_token(uid, "francesco@gmail.com", "access")
c.cookies.set("access_token", token)

r = c.get("/api/subscription/me")
data = r.json()
print("prima: status nel DB =", loop.run_until_complete(server.db.subscriptions.find_one({"id": "s1"}))["status"])
print("/subscription/me ->", {"active": data["active"], "subscription_status": (data.get("subscription") or {}).get("status")})

ok1 = data["active"] is False
sub_after = loop.run_until_complete(server.db.subscriptions.find_one({"id": "s1"}))
ok2 = sub_after["status"] == "expired"
ok3 = loop.run_until_complete(server.user_has_active_sub(uid)) is False

for label, ok in [
    ("pagina account NON mostra piu' Attivo con data passata", ok1),
    ("il DB viene corretto in automatico a 'expired'", ok2),
    ("riscatto sconto resta correttamente bloccato", ok3),
]:
    print(("OK  " if ok else "FAIL"), label)
sys.exit(0 if (ok1 and ok2 and ok3) else 1)
