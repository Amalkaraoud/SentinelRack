"""Envoi d'alerte : e-mail SMTP (chapitre 5) avec REPLI LOCAL.

Si `mail_config.py` est absent, si le Wi-Fi est coupe ou si le serveur refuse,
l'alerte n'est pas perdue : elle est affichee sur l'OLED et dans la console
serie (mode "LOCAL"), comme demande par le cahier des charges.
"""
import umail


def load_config():
    try:
        import mail_config as m
        return m
    except ImportError:
        return None


def send_alert(subject, body, wifi_ok, cfg=None, smtp_factory=None):
    """Retourne (ok, mode, detail) ; mode = "SMTP" ou "LOCAL"."""
    print("ALERTE>", subject)
    print(body)
    cfg = cfg if cfg is not None else load_config()
    if cfg is None:
        return False, "LOCAL", "pas de mail_config.py"
    if not wifi_ok:
        return False, "LOCAL", "reseau indisponible"
    try:
        make = smtp_factory or umail.SMTP
        smtp = make(cfg.SMTP_HOST, cfg.SMTP_PORT, ssl=True,
                    username=cfg.SMTP_USER, password=cfg.SMTP_PASS)
        smtp.to(cfg.MAIL_TO, cfg.SMTP_USER)
        smtp.write("From: %s\nTo: %s\nSubject: %s\n\n%s\n" % (
            cfg.SMTP_USER, cfg.MAIL_TO, subject, body))
        smtp.send()
        smtp.quit()
        return True, "SMTP", "envoye"
    except Exception as e:                      # reseau, TLS, authentification...
        return False, "LOCAL", "echec SMTP: %s" % e
