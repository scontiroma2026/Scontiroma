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
# Lista d'attesa pre-lancio: modalità spenta e limiti per client spenti nei test esistenti; il test dedicato
# (test_lista_attesa.py) accende e imposta da solo ciò che gli serve. Mai invii veri (RESEND_API_KEY vuota).
os.environ.setdefault("PRELAUNCH_MODE", "false")
os.environ.setdefault("WAITLIST_MAX_PER_CLIENT_10MIN", "0")
os.environ.setdefault("WAITLIST_MAX_PER_CLIENT_ORA", "0")
