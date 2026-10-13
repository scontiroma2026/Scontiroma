"""Nei test del server i limiti anti-massa per client sono spenti (molti test iscrivono tanti account
dallo stesso client finto). Il test dedicato (test_protezione_registrazioni.py) li riaccende da solo."""
import os

os.environ.setdefault("REGISTRAZIONI_MAX_PER_FINESTRA", "0")
os.environ.setdefault("RESET_MAX_PER_CLIENT_ORA", "0")
