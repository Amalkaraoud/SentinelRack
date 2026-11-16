"""Rejoue 8 scenarios sur la logique monitor.py (PC) et ecrit docs/resultats_scenarios.json."""
import json, os, sys
ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.join(ROOT, "firmware"))
import monitor as M
base = dict(temp=24.0, hum=40.0, gas=420, pir=0, wifi=True, gw=True, warm=False)
S = [("S1 Fonctionnement normal", base),
     ("S2 Temperature 29 C", dict(base, temp=29.0)),
     ("S3 Temperature 36 C", dict(base, temp=36.0)),
     ("S4 Gaz 1800 (pre-alerte)", dict(base, gas=1800)),
     ("S5 Gaz 2300 (> 2000)", dict(base, gas=2300)),
     ("S6 Intrusion (PIR)", dict(base, pir=1)),
     ("S7 Wi-Fi perdu", dict(base, wifi=False, gw=False)),
     ("S8 Wi-Fi ok, passerelle muette", dict(base, gw=False)),
     ("S9 DHT22 en panne", dict(base, temp=None, hum=None)),
     ("S10 Gaz eleve pendant le prechauffage", dict(base, gas=3100, warm=True))]
out = []
for n, r in S:
    lv, ca = M.evaluate(r)
    out.append(dict(scenario=n, niveau=M.NAMES[lv], causes=[c for c, _ in ca], leds=[int(x) for x in M.leds(lv)],
                    buzzer=("bips rapides" if lv == 2 else "bip / 5 s" if lv == 1 else "silence")))
json.dump(out, open(os.path.join(ROOT, "docs", "resultats_scenarios.json"), "w"), indent=1, ensure_ascii=False)
for o in out: print(o)
