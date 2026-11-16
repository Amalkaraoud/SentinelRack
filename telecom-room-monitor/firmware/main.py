"""Surveillance intelligente d'un local technique telecom - ESP32 / MicroPython.

Chaque bloc renvoie au cours :
  Chap.1/TP1  GPIO, machine.Pin, boucle, time          -> LED, buzzer, PIR
  Chap.3/TP2  capteurs : PIR, MQ-2 (ADC, seuil 2000)   -> sensors ci-dessous
              + DHT22 (module `dht`)
  Chap.4/TP3  ecran OLED SSD1306 en I2C                -> show()
  Chap.1/TP3  Wi-Fi (`network`), adresse IP, heure NTP -> net.py
  Chap.5      alerte e-mail SMTP (umail)               -> notify.py
Commandes serie (console Wokwi) : n = panne reseau simulee, m = e-mail de test,
s = etat detaille, g = diagnostic reseau.
"""
import sys
import time
import select
import dht
from machine import Pin, ADC, I2C, PWM

import config as C
import monitor as M
import net
import notify
from ssd1306 import SSD1306_I2C

# ---- Materiel (Chap.1 / TP1 : machine.Pin) -------------------------------
pir = Pin(C.PIN_PIR, Pin.IN)                          # TP2 ex.1
mq_do = Pin(C.PIN_MQ_DO, Pin.IN)                      # TP2 ex.2 (numerique)
mq_ao = ADC(Pin(C.PIN_MQ_AO))                         # TP2 ex.2 (analogique)
mq_ao.atten(ADC.ATTN_11DB)                            # plage 0-3,3 V -> 0..4095
sensor = dht.DHT22(Pin(C.PIN_DHT))
led_ok = Pin(C.PIN_LED_OK, Pin.OUT, value=0)
led_warn = Pin(C.PIN_LED_WARN, Pin.OUT, value=0)      # TP2 : LED jaune GPIO 4
led_crit = Pin(C.PIN_LED_CRIT, Pin.OUT, value=0)      # TP2 : LED GPIO 2
buzzer = PWM(Pin(C.PIN_BUZZER), freq=2000, duty=0)
i2c = I2C(0, scl=Pin(C.PIN_SCL), sda=Pin(C.PIN_SDA), freq=400000)   # TP3
oled = SSD1306_I2C(128, 64, i2c)

poll = select.poll()
poll.register(sys.stdin, select.POLLIN)


def show(lines):
    """Affiche jusqu'a 7 lignes de 16 caracteres (police 8x8)."""
    oled.fill(0)
    for i, text in enumerate(lines):
        oled.text(text, 0, i * 9)
    oled.show()


def read_gas():
    """Moyenne de GAS_SAMPLES lectures ADC : valeur 0..4095 (TP2)."""
    total = 0
    for _ in range(C.GAS_SAMPLES):
        total += mq_ao.read()
    return total // C.GAS_SAMPLES


def read_dht(last):
    try:
        sensor.measure()
        return sensor.temperature(), sensor.humidity(), 0
    except OSError:
        fails = last[2] + 1
        # une lecture ratee isolee est tolerée ; 3 echecs de suite = capteur HS
        return (last[0], last[1], fails) if fails < 3 else (None, None, fails)


def set_outputs(level, tick):
    ok, warn, crit = M.leds(level)
    led_ok.value(ok)
    led_warn.value(warn)
    led_crit.value(crit)
    buzzer.duty(512 if M.buzzer_on(level, tick) else 0)


def diag(w):
    """Diagnostic reseau (commande g) : teste plusieurs cibles TCP."""
    import socket as _s
    ifc = w.ifconfig()
    print("DIAG> ifconfig", ifc)
    for h, p in ((ifc[2], 80), (ifc[2], 53), (ifc[3], 53), ("8.8.8.8", 53),
                 ("example.com", 80), ("smtp.gmail.com", 465), ("smtp.gmail.com", 587)):
        t0 = time.ticks_ms()
        sk = _s.socket()
        sk.settimeout(3)
        try:
            sk.connect(_s.getaddrinfo(h, p)[0][-1])
            res = "OK"
        except OSError as e:
            res = "OSError %s" % (e.args,)
        except Exception as e:
            res = "ERR %r" % (e,)
        sk.close()
        print("DIAG>", h, p, res, time.ticks_diff(time.ticks_ms(), t0), "ms")


def command(ch, ctx):
    global_state = ctx
    if ch == "n":
        net.SIM_DOWN = not net.SIM_DOWN
        if net.SIM_DOWN and global_state["wlan"]:
            global_state["wlan"].disconnect()
        print("CMD> panne reseau simulee :", "ACTIVE" if net.SIM_DOWN else "levee")
        global_state["next_net"] = 0
    elif ch == "m":
        ok, mode, detail = notify.send_alert("[TEST] Local technique",
                                             "E-mail de test.", net.wifi_up(global_state["wlan"]))
        global_state["mail"] = "SMTP" if ok else "LOCAL"
        print("CMD> test e-mail ->", mode, detail)
    elif ch == "g":
        diag(global_state["wlan"])
    elif ch == "s":
        print("CMD> etat:", global_state["r"], "niveau", M.NAMES[global_state["level"]])


def main():
    print("== Moniteur local technique ==")
    show(["SALLE TECH", "Demarrage...", "Wi-Fi..."])
    wlan = net.wifi_connect(C.WIFI_SSID, C.WIFI_PASS, C.WIFI_TIMEOUT_S)
    ip = wlan.ifconfig()[0] if wlan.isconnected() else None
    print("Wi-Fi :", "connecte, IP", ip, "passerelle", wlan.ifconfig()[2]) if ip else print("Wi-Fi : echec")
    synced = net.sync_time() if ip else False
    print("Heure NTP :", "synchronisee" if synced else "indisponible")

    alerts = M.AlertManager()
    t0 = time.ticks_ms()
    ctx = {"wlan": wlan, "mail": "--", "r": {}, "level": M.OK, "next_net": 0}
    dht_last = (24.0, 40.0, 0)
    next_dht = 0
    gw_ok = False
    tick = 0
    last_level, last_causes = None, None
    next_reco = 0

    while True:
        now = time.ticks_diff(time.ticks_ms(), t0)

        while poll.poll(0):                     # commandes serie (non bloquant)
            command(sys.stdin.read(1), ctx)

        if now >= next_dht:                     # DHT22 : toutes les 2 s
            dht_last = read_dht(dht_last)
            next_dht = now + C.DHT_PERIOD_MS

        if now >= ctx["next_net"]:              # Wi-Fi + passerelle : toutes les 10 s
            if not net.wifi_up(wlan) and not net.SIM_DOWN and now >= next_reco:
                wlan.connect(C.WIFI_SSID, C.WIFI_PASS)   # reconnexion automatique
                next_reco = now + C.RECONNECT_MS
            gw_ok = net.gateway_probe(wlan, C.GW_PORT, C.GW_TIMEOUT_S)
            if net.wifi_up(wlan):
                ip = wlan.ifconfig()[0]
            ctx["next_net"] = now + C.NET_PERIOD_MS

        wifi = net.wifi_up(wlan)
        r = {"temp": dht_last[0], "hum": dht_last[1], "gas": read_gas(),
             "pir": pir.value(), "wifi": wifi, "gw": gw_ok and wifi,
             "warm": now < C.WARMUP_S * 1000}
        level, causes = M.evaluate(r)
        ctx["r"], ctx["level"] = r, level
        set_outputs(level, tick)

        due = alerts.due(causes, now // 1000)
        clock = net.clock_str(synced, C.TZ_OFFSET_S)
        if due:
            ok, mode, detail = notify.send_alert(
                M.subject_for(due), M.body_for(r, due, clock), wifi)
            alerts.mark(due, now // 1000, ok)
            ctx["mail"] = "SMTP" if ok else "LOCAL"
            print("MAIL>", mode, detail)

        if causes != last_causes:               # journal des changements d'etat
            print("[%s] etat=%s causes=%s T=%s H=%s gaz=%d pir=%d wifi=%d gw=%d" % (
                clock, M.NAMES[level], [c for c, _ in causes], r["temp"], r["hum"],
                r["gas"], r["pir"], wifi, r["gw"]))
            last_causes = causes
        show(M.screen_lines(r, level, causes, ip, clock, ctx["mail"]))
        tick += 1
        time.sleep_ms(C.TICK_MS)


main()
