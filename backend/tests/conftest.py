"""Nei test del server i limiti anti-massa per client sono spenti (molti test iscrivono tanti account
dallo stesso client finto). Il test dedicato (test_protezione_registrazioni.py) li riaccende da solo."""
import os

os.environ.setdefault("REGISTRAZIONI_MAX_PER_FINESTRA", "0")
os.environ.setdefault("RESET_MAX_PER_CLIENT_10MIN", "0")
os.environ.setdefault("RESET_MAX_PER_CLIENT_ORA", "0")
# La conferma dell'email dei clienti è spenta nei test esistenti (iscrivono e fanno entrare subito); il test
# dedicato (test_conferma_email_clienti.py) la riaccende da solo.
os.environ.setdefault("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "false")
os.environ.setdefault("CONFERMA_MAX_PER_CLIENT_10MIN", "0")
os.environ.setdefault("CONFERMA_MAX_PER_CLIENT_ORA", "0")
# Notifiche push: i test usano un servizio finto (push.example.com) oltre a quelli ufficiali dei browser.
os.environ.setdefault("PUSH_HOST_EXTRA", "push.example.com")
# Limite per IP sui login sbagliati: spento nei test esistenti (molti login sbagliati dallo stesso client finto).
os.environ.setdefault("LOGIN_FALLITI_MAX_PER_IP", "0")
