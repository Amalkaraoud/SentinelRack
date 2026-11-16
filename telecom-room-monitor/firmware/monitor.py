"""Logique METIER pure du moniteur (aucun acces materiel).

Tout ce qui decide (niveaux, alertes, textes d'ecran, motif du buzzer) est ici,
sans `machine` : on peut donc la tester sur un PC avec pytest, puis la faire
tourner a l'identique sur l'ESP32 (cf. tests/ et main.py).
"""
import config as C

OK, WARN, CRIT = 0, 1, 2
NAMES = ("OK", "ATTENTION", "CRITIQUE")


def temp_level(t):
    if t >= C.TEMP_CRIT:
        return CRIT
    if t >= C.TEMP_WARN:
        return WARN
    return OK


def hum_level(h):
    if h > C.HUM_HIGH_CRIT:
        return CRIT
    if h > C.HUM_HIGH_WARN or h < C.HUM_LOW_WARN:
        return WARN
    return OK


def gas_level(raw):
    """TP2 : le seuil critique (2000) est DEPASSE quand raw > 2000."""
    if raw > C.GAS_CRIT:
        return CRIT
    if raw > C.GAS_WARN:
        return WARN
    return OK


def evaluate(r):
    """r : dict de mesures. Retourne (niveau global, liste (cause, niveau)).

    Cles de r : temp, hum (None si DHT22 en panne), gas (int), pir (0/1),
    wifi (bool), gw (bool), warm (bool : MQ-2 encore en chauffe).
    """
    causes = []
    if r.get("temp") is None or r.get("hum") is None:
        causes.append(("DHT", WARN))
    else:
        lv = temp_level(r["temp"])
        if lv:
            causes.append(("TEMP", lv))
        lv = hum_level(r["hum"])
        if lv:
            causes.append(("HUM", lv))
    if not r.get("warm"):
        lv = gas_level(r["gas"])
        if lv:
            causes.append(("GAZ", lv))
    if r.get("pir"):
        causes.append(("PIR", WARN))
    if not r.get("wifi"):
        causes.append(("WIFI", WARN))
    elif not r.get("gw"):
        causes.append(("GW", WARN))
    level = max([lv for _, lv in causes] + [OK])
    return level, causes


def leds(level):
    """(verte, jaune, rouge) : une seule LED allumee selon le niveau."""
    return (level == OK, level == WARN, level == CRIT)


def buzzer_on(level, tick):
    """Motif sonore, un pas = TICK_MS. CRIT : bips rapides ; WARN : bip bref
    toutes les 5 s ; OK : silence."""
    if level == CRIT:
        return tick % 2 == 0
    if level == WARN:
        return tick % 10 == 0
    return False


class AlertManager:
    """Decide QUAND envoyer un e-mail : une fois par cause, puis au plus une
    fois par MAIL_COOLDOWN_S, et reessai MAIL_RETRY_S apres un echec."""

    def __init__(self, cooldown_s=None, retry_s=None):
        self.cooldown = C.MAIL_COOLDOWN_S if cooldown_s is None else cooldown_s
        self.retry = C.MAIL_RETRY_S if retry_s is None else retry_s
        self.sent = {}       # cause -> instant du dernier envoi reussi
        self.tried = {}      # cause -> instant du dernier essai

    def due(self, causes, now_s):
        active = set([c for c, lv in causes if lv >= WARN])
        for gone in list(self.sent):          # une cause disparue est oubliee
            if gone not in active:
                del self.sent[gone]
                self.tried.pop(gone, None)
        out = []
        for c, lv in causes:
            if lv < WARN or c in ("WIFI", "GW"):   # pas d'e-mail pour une panne reseau
                continue
            s, t = self.sent.get(c), self.tried.get(c)
            if s is not None and now_s - s < self.cooldown:
                continue
            if t is not None and now_s - t < self.retry:
                continue
            out.append((c, lv))
        return out

    def mark(self, causes, now_s, ok):
        for c, _ in causes:
            self.tried[c] = now_s
            if ok:
                self.sent[c] = now_s


def subject_for(causes):
    crit = max([lv for _, lv in causes] + [OK])
    tag = "CRITIQUE" if crit == CRIT else "ATTENTION"
    return "[%s] Local technique : %s" % (tag, ", ".join([c for c, _ in causes]))


def body_for(r, causes, clock):
    lines = ["Alerte du moniteur de local technique", "Heure : %s" % clock, ""]
    for c, lv in causes:
        lines.append("- %s : %s" % (c, NAMES[lv]))
    lines.append("")
    if r.get("temp") is not None:
        lines.append("Temperature : %.1f C   Humidite : %.0f %%" % (r["temp"], r["hum"]))
    lines.append("Gaz (ADC) : %d (seuil %d)   Presence : %s" % (
        r["gas"], C.GAS_CRIT, "OUI" if r.get("pir") else "non"))
    return "\n".join(lines)


def screen_lines(r, level, causes, ip, clock, mail):
    """Sept lignes de 16 caracteres maximum pour l'OLED 128x64 (police 8x8)."""
    t = "--.-C" if r.get("temp") is None else "%.1fC" % r["temp"]
    h = "--%" if r.get("hum") is None else "%d%%" % int(r["hum"] + 0.5)
    if not r.get("wifi"):
        net = "WiFi:PERDU"
    elif not r.get("gw"):
        net = "WiFi OK GW:NON"
    else:
        net = "WiFi OK GW OK"
    if level == OK:
        etat = "ETAT: NORMAL"
    else:
        etat = "!" + ",".join([c for c, _ in causes])
    gas = "GAZ:%d%s" % (r["gas"], "*" if r.get("warm") else "")
    pir = "PIR:%s" % ("OUI" if r.get("pir") else "--")
    return [
        ("SALLE TECH %s" % clock[:5])[:16],
        ("T:%s H:%s" % (t, h))[:16],
        ("%s %s" % (gas, pir))[:16],
        net[:16],
        ("IP %s" % (ip or "-"))[:16],
        etat[:16],
        ("Mail:%s" % mail)[:16],
    ]
