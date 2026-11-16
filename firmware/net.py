"""Reseau : Wi-Fi (chapitre 1, TP3), sonde TCP de la passerelle, heure NTP.

Le ping (ICMP) n'est pas disponible dans MicroPython ni dans Wokwi : on teste
la passerelle par une tentative de connexion TCP. Une connexion ACCEPTEE ou
REFUSEE (RST) prouve que la passerelle repond ; seul un delai depasse ou
"hote injoignable" signifie qu'elle est perdue.
"""
import time

try:
    import usocket as socket
except ImportError:  # CPython (tests)
    import socket

ECONNREFUSED = 111
SIM_DOWN = False   # panne simulee par commande serie (demonstration)


def wifi_connect(ssid, password, timeout_s, network=None):
    """Connecte la station Wi-Fi (module `network`, TP3 partie 3)."""
    if network is None:
        import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(ssid, password)
        t0 = time.time()
        while not wlan.isconnected() and time.time() - t0 < timeout_s:
            time.sleep(0.25)
    return wlan


def wifi_up(wlan):
    return (not SIM_DOWN) and wlan is not None and wlan.isconnected()


def gateway_probe(wlan, port, timeout_s, sock_mod=None):
    """True si la passerelle repond (connexion acceptee ou refusee)."""
    if not wifi_up(wlan):
        return False
    sm = sock_mod or socket
    gw = wlan.ifconfig()[2]
    s = sm.socket()
    try:
        s.settimeout(timeout_s)
        s.connect((gw, port))
        return True
    except OSError as e:
        code = e.args[0] if e.args else None
        return code == ECONNREFUSED
    finally:
        try:
            s.close()
        except Exception:
            pass


def sync_time():
    """Heure NTP (TP3 : afficher l'heure). True si reussi."""
    try:
        import ntptime
        ntptime.timeout = 3
        ntptime.settime()
        return True
    except Exception:
        return False


def clock_str(synced, tz_offset_s):
    if not synced:
        return "--:--:--"
    t = time.localtime(time.time() + tz_offset_s)
    return "%02d:%02d:%02d" % (t[3], t[4], t[5])
