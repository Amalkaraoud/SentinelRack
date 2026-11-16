"""Figures noir et blanc du projet (aucune couleur, aucun gris, aucune ombre)."""
import os, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.join(ROOT, "firmware"))
import monitor as M
plt.rcParams.update({"font.family": "serif", "font.serif": ["Liberation Serif", "DejaVu Serif"],
                     "axes.edgecolor": "black", "text.color": "black", "savefig.facecolor": "white"})
OUT = os.path.join(ROOT, "assets"); os.makedirs(OUT, exist_ok=True)
LW = 1.2

def box(ax, x, y, w, h, t, fs=9, lw=LW, fw="normal", ls="-"):
    ax.add_patch(Rectangle((x, y), w, h, fill=False, lw=lw, ec="black", ls=ls))
    ax.text(x + w / 2, y + h / 2, t, ha="center", va="center", fontsize=fs, fontweight=fw)

def arr(ax, p, q, t=None, ls="-", fs=8, dy=0.15):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=11, lw=LW, color="black", ls=ls))
    if t: ax.text((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + dy, t, ha="center", fontsize=fs)

# ---- Architecture ----
fig, ax = plt.subplots(figsize=(10, 5)); ax.set_xlim(0, 20); ax.set_ylim(0, 10); ax.axis("off")
ax.text(2.6, 9.4, "CAPTEURS (entrees)", ha="center", fontsize=9, fontweight="bold")
for i, t in enumerate(["DHT22\ntemperature / humidite", "MQ-2\ngaz / fumee (ADC)", "PIR\nmouvement / intrusion"]):
    box(ax, 0.3, 6.9 - i * 2.5, 4.6, 1.8, t, 8.5)
box(ax, 7.0, 2.0, 5.6, 6.5, "", lw=1.6)
ax.text(9.8, 8.1, "ESP32 / MicroPython", ha="center", fontsize=9, fontweight="bold")
for i, t in enumerate(["main.py : boucle 500 ms", "monitor.py : niveaux et alertes", "net.py : Wi-Fi, passerelle, heure NTP", "notify.py + umail.py : e-mail SMTP"]):
    box(ax, 7.3, 6.5 - i * 1.15, 5.0, 0.95, t, 7.6)
ax.text(15.6, 9.4, "SORTIES", ha="center", fontsize=9, fontweight="bold")
box(ax, 13.8, 6.9, 5.6, 1.8, "OLED SSD1306 (I2C)\nmesures, etat, reseau, IP, heure", 8.2)
box(ax, 13.8, 4.4, 5.6, 1.8, "3 LED (verte / jaune / rouge)\n+ buzzer", 8.2)
box(ax, 13.8, 1.9, 5.6, 1.8, "Wi-Fi -> e-mail SMTP\n(repli : OLED + console)", 8.2)
for i in range(3): arr(ax, (4.9, 7.8 - i * 2.5), (7.0, 7.0 - i * 1.6))
for i in range(3): arr(ax, (12.6, 6.5 - i * 1.55), (13.8, 7.8 - i * 2.5))
ax.text(10, 0.7, "Toute la logique de decision est dans monitor.py (sans materiel) : testable sur PC.", ha="center", fontsize=8.5, style="italic")
fig.savefig(f"{OUT}/fig_architecture.png", dpi=220, bbox_inches="tight"); plt.close(fig)

# ---- Cablage ----
rows = [("DHT22", "SDA", "GPIO 15", "VCC 3V3, GND"),
        ("MQ-2", "AO / DO", "GPIO 34 / GPIO 26", "VCC 3V3, GND"),
        ("PIR", "OUT", "GPIO 14", "VCC 5V, GND"),
        ("OLED SSD1306", "SDA / SCL", "GPIO 21 / GPIO 22", "VCC 3V3, GND"),
        ("LED verte (OK)", "anode via 330 ohm", "GPIO 12", "cathode GND"),
        ("LED jaune (ATTENTION)", "anode via 330 ohm", "GPIO 4", "cathode GND"),
        ("LED rouge (CRITIQUE)", "anode via 330 ohm", "GPIO 2", "cathode GND"),
        ("Buzzer", "borne +", "GPIO 25 (PWM)", "borne - GND")]
fig, ax = plt.subplots(figsize=(10, 4.2)); ax.set_xlim(0, 20); ax.set_ylim(0, 9.4); ax.axis("off")
xs = [0.2, 5.4, 10.2, 15.2]; ws = [5.0, 4.6, 4.8, 4.6]
for j, h in enumerate(["Composant", "Broche du composant", "Broche ESP32", "Alimentation"]):
    box(ax, xs[j], 8.2, ws[j], 1.0, h, 9, fw="bold")
for i, r in enumerate(rows):
    for j, c in enumerate(r): box(ax, xs[j], 7.2 - i * 0.95, ws[j], 0.9, c, 8.5)
fig.savefig(f"{OUT}/fig_wiring.png", dpi=220, bbox_inches="tight"); plt.close(fig)

# ---- Etats ----
fig, ax = plt.subplots(figsize=(10, 3.6)); ax.set_xlim(0, 24); ax.set_ylim(0, 7.5); ax.axis("off")
box(ax, 0.2, 2.2, 5.6, 3.0, "NORMAL\nLED verte\nsilence", 9.5, fw="bold")
box(ax, 9.2, 2.2, 5.6, 3.0, "ATTENTION\nLED jaune\nbip toutes les 5 s", 9.5, fw="bold")
box(ax, 18.2, 2.2, 5.6, 3.0, "CRITIQUE\nLED rouge, bips rapides\n+ e-mail", 9.5, fw="bold")
arr(ax, (5.8, 4.4), (9.2, 4.4), "seuil bas", fs=8.5); arr(ax, (14.8, 4.4), (18.2, 4.4), "seuil critique", fs=8.5)
arr(ax, (9.2, 3.0), (5.8, 3.0), "plus de cause", fs=8.5, dy=-0.6); arr(ax, (18.2, 3.0), (14.8, 3.0), "sous le seuil", fs=8.5, dy=-0.6)
ax.text(12, 0.8, "Causes : TEMP, HUM, GAZ (seuil 2000), PIR, WIFI, GW (passerelle), DHT (capteur en panne)", ha="center", fontsize=8.5, style="italic")
fig.savefig(f"{OUT}/fig_etats.png", dpi=220, bbox_inches="tight"); plt.close(fig)

# ---- Ecrans OLED (texte reel calcule par monitor.screen_lines) ----
def oled(name, r, ip="10.10.0.2", clock="21:58:21", mail="--"):
    level, causes = M.evaluate(r)
    lines = M.screen_lines(r, level, causes, ip, clock, mail)
    S = 4
    im = Image.new("1", (128 * S, 64 * S), 1)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 8 * S - 2)
    for i, t in enumerate(lines): d.text((0, i * 9 * S), t, font=f, fill=0)
    d.rectangle((0, 0, 128 * S - 1, 64 * S - 1), outline=0, width=3)
    im.convert("RGB").save(f"{OUT}/oled_{name}.png")
    return lines
base = dict(temp=24.0, hum=40.0, gas=420, pir=0, wifi=True, gw=True, warm=False)
oled("normal", base)
oled("gaz", dict(base, gas=2300), mail="SMTP")
oled("wifi", dict(base, wifi=False, gw=False), ip=None, mail="LOCAL")
oled("temp", dict(base, temp=36.2, pir=1), mail="LOCAL")
print("figures ok")
