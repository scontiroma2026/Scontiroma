"""Test di sicurezza (round 3). Richiede: pip install mongomock-motor pytest. Nessun server o database reale necessario."""
import os, sys, asyncio
os.environ.update(MONGO_URL="mongodb://localhost:27017", DB_NAME="t", JWT_SECRET="x"*40, CORS_ORIGINS="https://app.example.com")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mongomock_motor import AsyncMongoMockClient
import server
from fastapi.testclient import TestClient

server.db = AsyncMongoMockClient()["t"]
sent = []
async def fake_pin(to, name, code): sent.append(("pin", to, code))
async def fake_reset(to, name, tok): sent.append(("reset", to, tok))
import email_service
email_service.send_pin_reset_code = fake_pin
server.send_password_reset = fake_reset
c = TestClient(server.app, base_url="https://app.example.com")

def mk(email, pin="123456"):
    asyncio.get_event_loop().run_until_complete(server.db.users.insert_one({
        "id": "u-"+email, "email": email, "name": "T", "role": "client",
        "password_hash": server.hash_password("Password1"), "pin_hash": server.hash_password(pin), "pin_set": True}))
asyncio.set_event_loop(asyncio.new_event_loop())
mk("a@x.it"); mk("b@x.it"); mk("c@x.it")

res = {}
# 1) PIN login: 5 errati -> al 6° bloccato anche col PIN giusto
codes = [c.post("/api/auth/pin-login", json={"email":"a@x.it","pin":"000000"}).status_code for _ in range(5)]
r6 = c.post("/api/auth/pin-login", json={"email":"a@x.it","pin":"123456"})
res["pin-login: 5 errati=401, 6° (PIN giusto)=429"] = codes == [401]*5 and r6.status_code == 429
# PIN giusto su altro utente funziona e azzera
r = c.post("/api/auth/pin-login", json={"email":"b@x.it","pin":"123456"})
res["pin-login: PIN giusto entra (200)"] = r.status_code == 200

# 2) reset PIN: richiesta, 5 codici errati invalidano il codice, anche quello giusto poi non vale
c.post("/api/auth/pin-forgot", json={"email":"c@x.it"})
good = [s for s in sent if s[0]=="pin" and s[1]=="c@x.it"][-1][2]
wrong = "000000" if good != "000000" else "111111"
st = [c.post("/api/auth/pin-reset", json={"email":"c@x.it","code":wrong,"new_pin":"654321"}).status_code for _ in range(5)]
rg = c.post("/api/auth/pin-reset", json={"email":"c@x.it","code":good,"new_pin":"654321"})
res["pin-reset: 4x401 poi 429, codice giusto poi rifiutato"] = st == [401,401,401,401,429] and rg.status_code == 400

# 3) limite richieste reset: 2° richiesta entro 60s non manda email
n0 = len(sent)
c.post("/api/auth/forgot", json={"email":"b@x.it"})
c.post("/api/auth/forgot", json={"email":"b@x.it"})
res["forgot: 2 richieste ravvicinate -> 1 sola email"] = len([s for s in sent[n0:] if s[0]=="reset"]) == 1
r1 = c.post("/api/auth/forgot", json={"email":"b@x.it"}); r2 = c.post("/api/auth/forgot", json={"email":"nonesiste@x.it"})
res["forgot: risposta identica per utente esistente/inesistente"] = r1.json() == r2.json()

# 4) origin check: modalita' enforce
server.CSRF_ORIGIN_MODE = "enforce"
bad = c.post("/api/auth/forgot", json={"email":"z@x.it"}, headers={"Origin":"https://evil.example"})
ok1 = c.post("/api/auth/forgot", json={"email":"z@x.it"}, headers={"Origin":"https://app.example.com"})
ok2 = c.post("/api/auth/forgot", json={"email":"z@x.it"}, headers={"Origin":"https://app.example.com", "Host":"app.example.com"})
none = c.post("/api/auth/forgot", json={"email":"z@x.it"})
res["origin: sito estraneo=403 (enforce)"] = bad.status_code == 403
res["origin: nostro sito e chiamate senza Origin passano"] = ok1.status_code == 200 and none.status_code == 200
server.CSRF_ORIGIN_MODE = "log"
res["origin: modalita' log non blocca"] = c.post("/api/auth/forgot", json={"email":"z@x.it"}, headers={"Origin":"https://evil.example"}).status_code == 200
# stesso host (senza CORS_ORIGINS) deve passare anche in enforce
server.CSRF_ORIGIN_MODE = "enforce"
c2 = TestClient(server.app, base_url="https://altro.host.it")
res["origin: stesso host passa (enforce)"] = c2.post("/api/auth/forgot", json={"email":"z@x.it"}, headers={"Origin":"https://altro.host.it"}).status_code == 200

for k, v in res.items(): print(("OK  " if v else "FAIL"), k)
sys.exit(0 if all(res.values()) else 1)
