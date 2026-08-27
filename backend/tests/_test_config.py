"""Shared pytest fixtures + credentials caricate da environment.

Tutti i test dovrebbero importare `ADMIN_EMAIL/ADMIN_PASSWORD/MASTER_PW/JWT_SECRET/CLIENT_EMAIL/CLIENT_PASSWORD`
da qui invece di hard-codarli. In CI si iniettano via env; in locale si fallback ai default della
`test_credentials.md` così i test rimangono runnable senza setup.
"""
import os


def _env(key: str, default: str) -> str:
    """Ritorna una variabile d'ambiente con fallback ai default di test noti in
    /app/memory/test_credentials.md. In produzione/CI queste devono essere sovrascritte."""
    return os.environ.get(key, default)


# Credenziali test — mai usare in produzione, i fallback sono per lo sviluppo locale
ADMIN_EMAIL = _env("TEST_ADMIN_EMAIL", "admin@scontiroma.it")
ADMIN_PASSWORD = _env("TEST_ADMIN_PASSWORD", "")
MASTER_PW = _env("TEST_ADMIN_MASTER_PASSWORD", "")
CLIENT_EMAIL = _env("TEST_CLIENT_EMAIL", "francesco@gmail.com")
CLIENT_PASSWORD = _env("TEST_CLIENT_PASSWORD", "francesco123")

# JWT secret di test (matching backend/.env). In produzione DEVE arrivare da env.
JWT_SECRET = _env(
    "TEST_JWT_SECRET",
    "7bf1620c584ce701c6eaa055faa0d7599172631b3a4203ad6d68e950d50b1e6b",
)

# URL base per i test (usa il preview URL come default)
BASE_URL = _env("TEST_BASE_URL", os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")).rstrip("/")
API_URL = f"{BASE_URL}/api"
