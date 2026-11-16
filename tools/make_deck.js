const pptxgen = require("pptxgenjs");
const fs = require("fs");
const sc = JSON.parse(fs.readFileSync("docs/resultats_scenarios.json", "utf8"));
const pres = new pptxgen(); pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "Surveillance intelligente d'un local technique télécom"; pres.author = "Amal Karaoud";
const HF = "Cambria", BF = "Calibri", K = "000000", W = "FFFFFF";
let n = 0;
const base = (title, notes) => {
  const s = pres.addSlide(); n++; s.background = { color: W };
  s.addText(title, { x: 0.6, y: 0.35, w: 12.1, h: 0.8, fontFace: HF, fontSize: 30, bold: true, color: K, margin: 0, isTextBox: true });
  s.addShape(pres.ShapeType.line, { x: 0.6, y: 1.2, w: 12.1, h: 0, line: { color: K, width: 2 } });
  s.addText(String(n), { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontFace: BF, fontSize: 11, color: K, align: "right", margin: 0, isTextBox: true });
  s.addText("Surveillance d'un local technique télécom · MPI1 · 2026-2027", { x: 0.6, y: 7.0, w: 8, h: 0.3, fontFace: BF, fontSize: 11, color: K, margin: 0, isTextBox: true });
  if (notes) s.addNotes(notes);
  return s;
};
const T = (s, text, o) => s.addText(text, Object.assign({ fontFace: BF, fontSize: 18, color: K, margin: 0, valign: "top", isTextBox: true }, o));
const bullets = (arr, size = 20) => arr.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < arr.length - 1, paraSpaceAfter: 10, fontSize: size } }));
const box = (s, x, y, w, h, txt, o = {}) => s.addText(txt, Object.assign({ x, y, w, h, fontFace: BF, fontSize: 16, color: K, align: "center", valign: "middle", line: { color: K, width: 2 }, fill: { color: W }, margin: 6, isTextBox: true }, o));
const cell = (t, b) => ({ text: String(t), options: { bold: !!b, fontFace: BF, fontSize: 14, color: K, border: { type: "solid", color: K, pt: 1 }, valign: "middle" } });
const tbl = (s, rows, x, y, w, colW) => s.addTable(rows.map((r, i) => r.map(c => cell(c, i === 0))), { x, y, w, colW, border: { type: "solid", color: K, pt: 1 }, rowH: 0.42 });

// 1 titre
{ const s = pres.addSlide(); n++; s.background = { color: W };
  s.addImage({ path: "assets/logo_fss_official.png", x: 0.6, y: 0.5, w: 1.1, h: 1.09, altText: "Logo officiel de la Faculté des Sciences de Sfax" });
  T(s, "Faculté des Sciences de Sfax", { x: 1.9, y: 0.55, w: 9, h: 0.5, fontSize: 24, bold: true, fontFace: HF });
  T(s, "MicroPython (MPI1) · 2026-2027 · Encadrante : Roua Torjmen", { x: 1.9, y: 1.1, w: 10, h: 0.4, fontSize: 16 });
  s.addShape(pres.ShapeType.line, { x: 0.6, y: 2.2, w: 12.1, h: 0, line: { color: K, width: 3 } });
  T(s, "Surveillance intelligente d'un local technique télécom", { x: 0.6, y: 2.5, w: 12.1, h: 1.6, fontSize: 44, bold: true, fontFace: HF });
  T(s, "Baie réseau / salle serveur : température, humidité, gaz, intrusion, Wi-Fi et alertes e-mail", { x: 0.6, y: 4.3, w: 12.1, h: 0.9, fontSize: 22, italic: true });
  s.addShape(pres.ShapeType.line, { x: 0.6, y: 5.6, w: 12.1, h: 0, line: { color: K, width: 3 } });
  T(s, "Amal Karaoud · projet individuel · ESP32 / MicroPython · simulation Wokwi", { x: 0.6, y: 5.85, w: 12.1, h: 0.5, fontSize: 18 });
  s.addNotes("Présentation du projet : un moniteur de local technique télécom sur ESP32 en MicroPython. Durée totale 15 minutes."); }

// 2 contexte
{ const s = base("Contexte et problème", "Le local technique est souvent sans présence humaine. Trois risques : chaleur, fumée ou gaz, accès non prévu. La question : comment être prévenu à temps, sur place et à distance ?");
  T(s, bullets(["Un local technique télécom regroupe routeurs, commutateurs et serveurs, souvent sans personne sur place.",
    "Trois risques : montée de température, gaz ou fumée, intrusion.",
    "Une alerte tardive coûte cher : panne de service, matériel détruit, accès non autorisé.",
    "Problème : être prévenu à temps, sur place et à distance, sans surveillance humaine continue."]), { x: 0.6, y: 1.6, w: 7.4, h: 4.8 });
  box(s, 8.5, 1.8, 4.2, 1.1, "Chaleur\nventilation en panne", { fontSize: 18, bold: true });
  box(s, 8.5, 3.3, 4.2, 1.1, "Gaz / fumée\nrisque d'incendie", { fontSize: 18, bold: true });
  box(s, 8.5, 4.8, 4.2, 1.1, "Intrusion\naccès non prévu", { fontSize: 18, bold: true }); }

// 3 justification
{ const s = base("Justification et objectifs", "Le projet relie tout ce qu'on a vu : GPIO du TP1, capteurs du TP2, écran et Wi-Fi du TP3, e-mail du chapitre 5. Chaque objectif correspond à un chapitre.");
  T(s, "Pourquoi ce projet ?", { x: 0.6, y: 1.5, w: 5.8, h: 0.5, fontSize: 22, bold: true, fontFace: HF });
  T(s, bullets(["Problème concret du quotidien d'un réseau télécom", "Capteurs, actionneurs et écrans : tout le programme", "Simple à expliquer : lire, décider, afficher, alerter"], 19), { x: 0.6, y: 2.1, w: 5.8, h: 3.5 });
  T(s, "Objectifs", { x: 6.9, y: 1.5, w: 5.8, h: 0.5, fontSize: 22, bold: true, fontFace: HF });
  T(s, bullets(["Mesurer : DHT22, MQ-2 (seuil 2000), PIR", "Afficher : OLED SSD1306 en I2C", "Signaler : 3 LED et buzzer", "Réseau : Wi-Fi, passerelle, perte détectée", "Alerter : e-mail SMTP + repli local"], 19), { x: 6.9, y: 2.1, w: 5.8, h: 3.8 }); }

// 4 composants
{ const s = base("Composants", "Sept familles de composants. Les broches reprennent celles des TP2 et TP3.");
  tbl(s, [["Composant", "Rôle", "Broche ESP32"],
    ["ESP32 DevKit C", "Microcontrôleur Wi-Fi, MicroPython", "—"],
    ["DHT22", "Température et humidité", "GPIO 15"],
    ["MQ-2", "Gaz / fumée (analogique + numérique)", "GPIO 34 / 26"],
    ["PIR", "Mouvement, intrusion", "GPIO 14"],
    ["OLED SSD1306 (I2C)", "Mesures, état, réseau, IP, heure", "SDA 21 / SCL 22"],
    ["3 LED + 330 Ω", "Vert OK, jaune ATTENTION, rouge CRITIQUE", "GPIO 12 / 4 / 2"],
    ["Buzzer", "Alerte sonore (PWM)", "GPIO 25"]], 0.6, 1.6, 12.1, [3.4, 5.9, 2.8]); }

// 5 câblage
{ const s = base("Câblage", "Tout est alimenté en 3,3 volts sauf le capteur PIR en 5 volts. Les trois LED passent par une résistance de 330 ohms.");
  s.addImage({ path: "assets/fig_wiring.png", x: 0.9, y: 1.5, w: 11.5, h: 4.83, altText: "Tableau de câblage de chaque composant vers l'ESP32" });
  T(s, "Broches identiques à celles des TP2 (PIR 14, LED 2 et 4, MQ-2 34/26) et TP3 (I2C 21/22).", { x: 0.6, y: 6.4, w: 12.1, h: 0.4, fontSize: 15, italic: true, align: "center" }); }

// 6 architecture
{ const s = base("Architecture du logiciel", "La décision est isolée dans monitor.py, sans matériel : on la teste sur PC avec 27 tests, puis elle tourne à l'identique sur l'ESP32.");
  s.addImage({ path: "assets/fig_architecture.png", x: 0.9, y: 1.4, w: 8.4, h: 4.2, altText: "Schéma : capteurs, ESP32 et sorties" });
  T(s, bullets(["main.py : boucle 500 ms", "monitor.py : logique pure", "net.py : Wi-Fi, passerelle, heure", "notify.py / umail.py : e-mail", "27 tests sur PC"], 17), { x: 9.6, y: 1.8, w: 3.2, h: 4 });
  T(s, "Séparer logique et matériel = testable et défendable.", { x: 0.6, y: 6.2, w: 12.1, h: 0.5, fontSize: 17, italic: true, align: "center" }); }

// 7 états
{ const s = base("Niveaux d'alerte et seuils", "Le niveau global est le plus élevé de toutes les causes. Le seuil de gaz est celui du TP2 : l'alerte part quand la valeur dépasse strictement 2000.");
  s.addImage({ path: "assets/fig_etats.png", x: 0.9, y: 1.4, w: 11.5, h: 4.1, altText: "Trois niveaux : normal, attention, critique, et leurs transitions" });
  tbl(s, [["Mesure", "ATTENTION", "CRITIQUE"], ["Température", "≥ 28 °C", "≥ 35 °C"], ["Gaz (ADC)", "> 1500", "> 2000 (TP2)"]], 3.2, 5.55, 7, [2.4, 2.3, 2.3]); }

// 8 code
{ const s = base("Le code expliqué : la décision", "Voici la fonction clé, copiée du fichier monitor.py. Le préchauffage évite de décider sur la première lecture du MQ-2, qui vaut 3123 au démarrage dans le simulateur.");
  const code = `def gas_level(raw):
    """TP2 : seuil critique (2000) DEPASSE si raw > 2000"""
    if raw > C.GAS_CRIT:  return CRIT
    if raw > C.GAS_WARN:  return WARN
    return OK

def evaluate(r):                      # r = mesures
    causes = []
    ...
    if not r.get("warm"):             # MQ-2 chauffe 10 s
        lv = gas_level(r["gas"])
        if lv: causes.append(("GAZ", lv))
    if r.get("pir"):  causes.append(("PIR", WARN))
    if not r.get("wifi"): causes.append(("WIFI", WARN))
    level = max([lv for _, lv in causes] + [OK])
    return level, causes`;
  s.addText(code, { x: 0.6, y: 1.5, w: 8.3, h: 4.9, fontFace: "Courier New", fontSize: 14, color: K, line: { color: K, width: 2 }, margin: 10, valign: "top", isTextBox: true });
  T(s, bullets(["Seuil strict > 2000 (TP2)", "Pré-alerte à 1500", "Moyenne de 5 lectures ADC", "Cause = (nom, niveau)", "Niveau global = maximum"], 17), { x: 9.3, y: 1.7, w: 3.5, h: 4 }); }

// 9 réseau
{ const s = base("Réseau : Wi-Fi, passerelle, heure", "Résultat réel obtenu dans Wokwi : le port 80 de la passerelle est injoignable, le port 53 répond. Donc la sonde teste le port 53. Pas de ping possible : on utilise une connexion TCP.");
  T(s, bullets(["Wi-Fi : network.WLAN, connect, isconnected, ifconfig (TP3)", "Heure : NTP, affichée sur l'OLED (TP3)", "Passerelle : pas de ping, donc connexion TCP : acceptée ou refusée = vivante", "Perte détectée → OLED « WiFi:PERDU » + reconnexion toutes les 10 s"], 18), { x: 0.6, y: 1.5, w: 6.4, h: 4.8 });
  tbl(s, [["Test TCP dans Wokwi", "Résultat"], ["IP / passerelle", "10.10.0.2 / 10.0.0.1"], ["Passerelle port 80", "injoignable (113)"], ["Passerelle port 53", "accepté, ~120 ms"], ["8.8.8.8:53", "accepté"], ["smtp.gmail.com 465 / 587", "accepté (TCP)"], ["Heure NTP", "synchronisée"]], 7.3, 1.6, 5.4, [3.0, 2.4]); }

// 10 e-mail
{ const s = base("Alerte e-mail SMTP et repli", "On reprend l'interface du module umail du chapitre 5. Sans identifiants ou sans réseau, l'alerte reste sur l'OLED et dans la console : c'est le repli demandé.");
  box(s, 0.6, 1.7, 3.4, 1.3, "Cause critique\n(gaz, température…)", { fontSize: 16, bold: true });
  box(s, 4.6, 1.7, 3.4, 1.3, "AlertManager\n1 e-mail / cause / 120 s", { fontSize: 16, bold: true });
  box(s, 8.6, 1.7, 4.1, 1.3, "umail.SMTP(…, ssl=True)\nport 465, to / write / send", { fontSize: 16, bold: true });
  s.addShape(pres.ShapeType.line, { x: 4.0, y: 2.35, w: 0.6, h: 0, line: { color: K, width: 2, endArrowType: "triangle" } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 2.35, w: 0.6, h: 0, line: { color: K, width: 2, endArrowType: "triangle" } });
  T(s, "Si l'envoi échoue :", { x: 0.6, y: 3.5, w: 12, h: 0.5, fontSize: 20, bold: true, fontFace: HF });
  T(s, bullets(["Pas de mail_config.py, Wi-Fi coupé ou serveur qui refuse → mode LOCAL", "Alerte affichée sur l'OLED (« Mail:LOCAL ») et écrite sur la console série", "Observé dans Wokwi : « MAIL> LOCAL pas de mail_config.py »", "Les pannes réseau ne déclenchent pas d'e-mail (il ne partirait pas)"], 18), { x: 0.6, y: 4.1, w: 12.1, h: 2.7 }); }

// 11 OLED
{ const s = base("Écran OLED : quatre situations", "Ces écrans sont calculés par la vraie fonction screen_lines. On voit le titre et l'heure, les mesures, le réseau, l'IP, l'état et le statut e-mail.");
  const names = [["oled_normal", "Normal"], ["oled_gaz", "Gaz > 2000, e-mail envoyé"], ["oled_wifi", "Wi-Fi perdu"], ["oled_temp", "36 °C + intrusion"]];
  names.forEach(([f, c], i) => { const x = 0.7 + i * 3.1;
    s.addImage({ path: `assets/${f}.png`, x, y: 1.8, w: 2.9, h: 1.45, altText: "Écran OLED : " + c });
    T(s, c, { x, y: 3.35, w: 2.9, h: 0.5, fontSize: 14, align: "center", bold: true }); });
  T(s, "Sept lignes de 16 caractères : titre + heure · T et H · gaz et PIR · réseau · IP · état · e-mail. Reconstitution graphique de la sortie de screen_lines.", { x: 0.7, y: 4.4, w: 12, h: 1.2, fontSize: 18 }); }

// 12 traçabilité
{ const s = base("Lien avec le cours et les TP", "Chaque fonctionnalité est reliée à un chapitre et à un TP. La matrice complète est dans le rapport et dans docs/TRACABILITE.md.");
  tbl(s, [["Fonctionnalité", "Chapitre / TP", "Notion du cours"],
    ["PIR (GPIO 14)", "Chap. 3 / TP2", "Pin.IN, value()"],
    ["MQ-2 analogique, seuil 2000", "Chap. 3 / TP2", "ADC, atten, read"],
    ["DHT22", "Chap. 3", "module dht"],
    ["LED et buzzer", "Chap. 1 / TP1", "Pin.OUT, PWM"],
    ["OLED SSD1306 I2C", "Chap. 4 / TP3", "I2C, text, show"],
    ["Wi-Fi, IP, heure", "Chap. 1 et 4 / TP3", "network, ntptime"],
    ["Test passerelle, perte Wi-Fi", "Chap. 1 + 4", "TCP/IP, sockets"],
    ["E-mail SMTP", "Chap. 5", "umail.SMTP"]], 0.6, 1.5, 12.1, [4.8, 3.0, 4.3]); }

// 13 démo
{ const s = base("Démonstration dans Wokwi (capture réelle)", "Capture réelle de la simulation : écran OLED en haut, console série en bas. On y voit l'IP, l'heure synchronisée, les changements d'état et la passerelle détectée.");
  s.addImage({ path: "assets/wokwi_run_real.jpg", x: 0.6, y: 1.4, w: 8.0, h: 5.15, altText: "Capture de la simulation Wokwi avec l'écran OLED et la console série" });
  T(s, bullets(["Wi-Fi : IP 10.10.0.2", "Heure NTP synchronisée", "Passerelle détectée (gw=1)", "Journal des changements d'état", "Repli e-mail : LOCAL"], 17), { x: 8.9, y: 1.7, w: 3.9, h: 4.5 }); }

// 14 tests
{ const s = base("Tests et résultats", "27 tests automatiques passent. Dix scénarios rejoués sur la logique réelle : voici les principaux. Ce qui est vérifié dans Wokwi et ce qui l'est seulement sur PC est précisé à la diapositive suivante.");
  const pick = [0, 2, 4, 5, 6, 9].map(i => sc[i]);
  tbl(s, [["Scénario", "Niveau", "Causes", "LED V/J/R", "Buzzer"], ...pick.map(p => [p.scenario, p.niveau, p.causes.join(", ") || "—", p.leds.join("/"), p.buzzer])], 0.6, 1.6, 12.1, [4.3, 1.8, 1.4, 1.9, 2.7]);
  T(s, "27 tests pytest réussis · 10 scénarios rejoués sur monitor.py · exécution réelle dans Wokwi (Wi-Fi, NTP, passerelle)", { x: 0.6, y: 5.3, w: 12.1, h: 0.8, fontSize: 18, bold: true, align: "center" }); }

// 15 limites
{ const s = base("Limites, en toute transparence", "Je préfère annoncer les limites moi-même. Le gaz simulé fluctue autour de 2000, et l'e-mail réel n'a pas été envoyé faute d'identifiants.");
  T(s, bullets(["Gaz simulé : ~1900 à 2100 (bruit), l'état oscille autour du seuil ; cause non élucidée", "E-mail : connexion TCP vers Gmail possible, envoi authentifié non testé (mot de passe d'application requis)", "PIR, DHT22 hors seuil, panne réseau simulée : validés sur PC, non rejoués dans Wokwi", "Passerelle testée par TCP (port 53), pas par ping", "Client SMTP et pilote OLED réécrits, interface identique au cours"], 19), { x: 0.6, y: 1.6, w: 12.1, h: 4.8 }); }

// 16 conclusion
{ const s = base("Conclusion", "Un projet complet, relié au cours, testé, avec ses limites annoncées. Les mesures réelles dans Wokwi ont corrigé une hypothèse : le port 80 de la passerelle ne répond pas, le 53 oui.");
  T(s, bullets(["Problème réel : surveiller un local technique télécom", "Capteurs, écran, LED, buzzer, Wi-Fi, e-mail : tout le cours mobilisé", "Logique séparée du matériel : testée et défendable", "Test sur la cible = hypothèse corrigée (passerelle port 53)", "Suite : MQTT, journalisation, seuils réglables"], 21), { x: 0.6, y: 1.6, w: 12.1, h: 4.2 });
  T(s, "Merci. Questions ?", { x: 0.6, y: 6.0, w: 12.1, h: 0.7, fontSize: 28, bold: true, fontFace: HF, align: "center" }); }

pres.writeFile({ fileName: "livrables/1_Presentation_PowerPoint/Presentation_surveillance_local_technique.pptx" }).then(() => console.log("ok"));
