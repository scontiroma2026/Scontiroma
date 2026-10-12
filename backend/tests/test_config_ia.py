"""«Migliora foto»: la configurazione pubblica dice al sito se la chiave Gemini c'è (pulsante nascosto se manca).
Database locale (mongomock) come gli altri test."""
import os

from test_interruttore_abbonamento import run


def test_config_pubblica_segnala_chiave_gemini():
    async def body(c):
        vecchia = os.environ.get("GEMINI_API_KEY")
        try:
            os.environ.pop("GEMINI_API_KEY", None)
            r = await c.get("/api/config/public")
            assert r.json()["ai_enhance_enabled"] is False
            os.environ["GEMINI_API_KEY"] = "   "
            assert (await c.get("/api/config/public")).json()["ai_enhance_enabled"] is False
            os.environ["GEMINI_API_KEY"] = "chiave-finta-solo-test"
            assert (await c.get("/api/config/public")).json()["ai_enhance_enabled"] is True
        finally:
            if vecchia is None:
                os.environ.pop("GEMINI_API_KEY", None)
            else:
                os.environ["GEMINI_API_KEY"] = vecchia

    run(body, False)
