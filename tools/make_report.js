const fs = require("fs");
const { R, P, B, H1, H2, img, table, sp, code, header, build } = require("./lib_docx");
const sc = JSON.parse(fs.readFileSync("docs/resultats_scenarios.json", "utf8"));
const t = fs.readFileSync("docs/TRACABILITE.md", "utf8").split("\n").filter(l => /^\| \d+ \|/.test(l)).map(l => l.split("|").slice(1, 6).map(s => s.trim().replace(/`/g, "")));

const { Table, TableRow, TableCell, Paragraph, ImageRun, WidthType, AlignmentType, BorderStyle } = require("docx");
const oledGrid = () => { const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }; const bd = { top: nb, bottom: nb, left: nb, right: nb };
  const cell = (f) => new TableCell({ width: { size: 4800, type: WidthType.DXA }, borders: bd, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new ImageRun({ type: "png", data: fs.readFileSync(f), transformation: { width: 250, height: 125 }, altText: { title: f, description: "Écran OLED reconstitué", name: f } })] })] });
  return new Table({ width: { size: 9600, type: WidthType.DXA }, columnWidths: [4800, 4800], rows: [
    new TableRow({ children: [cell("assets/oled_normal.png"), cell("assets/oled_gaz.png")] }),
    new TableRow({ children: [cell("assets/oled_wifi.png"), cell("assets/oled_temp.png")] })] }); };
const c = [
  ...header("Surveillance intelligente d’un local technique télécom", "Amal Karaoud · Rapport de projet · ESP32 / MicroPython · projet individuel"),

  H1("1. Contexte et problématique"),
  P("Dans un opérateur de télécommunications, une entreprise ou un établissement, les équipements réseau (routeurs, commutateurs, serveurs) sont regroupés dans un local technique : baie réseau ou petite salle serveur. Ce local est le plus souvent sans présence humaine permanente. Trois événements y causent des pannes ou des dégâts : une montée de température (ventilation ou climatisation défaillante), un début d’incendie ou une fuite de gaz (détectables par la fumée ou le gaz), et un accès non prévu (intrusion, personne non autorisée)."),
  P("Le problème concret est donc le suivant : comment être prévenu à temps, localement et à distance, qu’une condition anormale apparaît dans le local, sans dépendre d’une surveillance humaine continue ? Le projet y répond par un petit système embarqué : un ESP32 programmé en MicroPython lit des capteurs, décide d’un niveau d’alerte, l’affiche sur place (écran, LED, buzzer) et envoie un e-mail lorsque la situation est critique. Il vérifie aussi sa propre connexion au réseau, car une alerte à distance n’a de sens que si la liaison fonctionne."),

  H1("2. Objectifs et cahier des charges"),
  B("Mesurer la température et l’humidité (DHT22), la présence de gaz ou de fumée (MQ-2, seuil 2000 comme dans le TP2) et un mouvement (capteur PIR)."),
  B("Afficher sur un écran OLED SSD1306 en I2C les mesures, l’état du système, l’état du réseau, l’adresse IP et l’heure (TP3)."),
  B("Signaler les niveaux par trois LED (verte, jaune, rouge) et un buzzer."),
  B("Se connecter en Wi-Fi, tester la passerelle, détecter une perte de connexion et l’afficher sur l’OLED."),
  B("Envoyer une alerte e-mail par SMTP en cas de dépassement critique (chapitre 5), avec une solution de repli (OLED + console série) si l’envoi est impossible."),
  B("Relier chaque fonctionnalité au chapitre et au TP correspondants (matrice de traçabilité, section 6)."),

  H1("3. Matériel"),
  table([["Composant", "Rôle", "Broche ESP32"],
    ["ESP32 DevKit C", "Microcontrôleur Wi-Fi, exécute MicroPython", "—"],
    ["DHT22", "Température et humidité (module dht)", "GPIO 15"],
    ["MQ-2", "Gaz / fumée : sortie analogique (ADC) et numérique", "GPIO 34 (AO), GPIO 26 (DO)"],
    ["PIR", "Détection de mouvement / intrusion", "GPIO 14"],
    ["OLED SSD1306 128×64", "Affichage (I2C, adresse 0x3C)", "SDA GPIO 21, SCL GPIO 22"],
    ["3 LED + 3 résistances 330 Ω", "Niveau : vert OK, jaune ATTENTION, rouge CRITIQUE", "GPIO 12, 4, 2"],
    ["Buzzer", "Alerte sonore (PWM)", "GPIO 25"]], [2900, 4200, 2500]),
  sp(),
  ...img("assets/fig_wiring.png", 6.0, "Figure 1 – Tableau de câblage du montage."),
  P("Les broches du PIR (14), de la LED rouge (2), de la LED jaune (4), du MQ-2 (34 et 26) et du bus I2C (21 et 22) reprennent celles des TP2 et TP3, pour rester proche de ce qui a été manipulé en séance. Les capteurs et l’écran sont alimentés en 3,3 V, le PIR en 5 V."),

  H1("4. Architecture"),
  ...img("assets/fig_architecture.png", 6.3, "Figure 2 – Architecture : capteurs, ESP32 et sorties."),
  P("Le code est découpé en sept fichiers. Toute la décision (niveaux, causes, alertes, texte de l’écran, motif du buzzer) est placée dans monitor.py, qui n’accède à aucun matériel. Cette séparation a un intérêt pratique : la même logique est testée sur ordinateur avec 27 tests automatiques, puis exécutée telle quelle sur l’ESP32."),
  table([["Fichier", "Responsabilité"],
    ["main.py", "Câblage matériel (Pin, ADC, I2C, PWM), boucle principale de 500 ms, commandes série"],
    ["monitor.py", "Logique pure : niveaux, causes, gestionnaire d’alertes, textes de l’écran"],
    ["net.py", "Wi-Fi (module network), sonde de passerelle, heure NTP"],
    ["notify.py / umail.py", "Envoi de l’e-mail SMTP et repli local"],
    ["ssd1306.py", "Pilote de l’écran OLED (interface identique à celle du cours)"],
    ["config.py", "Broches, seuils, délais, paramètres réseau"]], [2400, 7200]),

  H1("5. Fonctionnement"),
  H2("5.1 Niveaux et causes"),
  P("À chaque pas de 500 ms, le système lit les capteurs et calcule un niveau global parmi NORMAL, ATTENTION et CRITIQUE, ainsi que la liste des causes actives : TEMP, HUM, GAZ, PIR, WIFI, GW (passerelle muette) et DHT (capteur en panne). Le niveau global est le plus élevé des niveaux de chaque cause."),
  ...img("assets/fig_etats.png", 6.3, "Figure 3 – Niveaux d’alerte et transitions."),
  table([["Mesure", "ATTENTION", "CRITIQUE"],
    ["Température", "≥ 28 °C", "≥ 35 °C"],
    ["Humidité", "< 20 % ou > 60 %", "> 80 %"],
    ["Gaz (valeur ADC 0–4095)", "> 1500 (pré-alerte)", "> 2000 (seuil du TP2)"],
    ["PIR", "mouvement détecté", "—"],
    ["Réseau", "Wi-Fi perdu ou passerelle muette", "—"]], [3000, 3300, 3300]),
  sp(),
  P("Le seuil de 2000 sur le gaz est celui du TP2 : l’alerte est déclenchée lorsque la valeur lue dépasse strictement 2000. Les autres seuils sont des choix du projet, correspondant à des plages usuelles de salle technique. Le MQ-2 a besoin de chauffer au démarrage : pendant les 10 premières secondes, sa mesure est affichée avec une étoile mais ignorée pour la décision. Cette précaution s’est avérée utile : dans le simulateur, la première lecture au démarrage vaut 3123, puis redescend."),
  H2("5.2 Réseau : Wi-Fi, passerelle, heure"),
  P("Au démarrage, la carte se connecte au Wi-Fi avec le module network (WLAN en mode station), affiche l’adresse IP puis synchronise l’heure par NTP (TP3). Toutes les 10 secondes, elle vérifie que le Wi-Fi est toujours connecté et que la passerelle répond. Le ping (ICMP) n’existe ni en MicroPython ni dans Wokwi ; la passerelle est donc testée par une tentative de connexion TCP : une connexion acceptée, ou refusée par la passerelle (réponse RST), prouve qu’elle est vivante ; seul un délai dépassé ou « hôte injoignable » la déclare perdue. En cas de perte, l’OLED affiche « WiFi:PERDU » ou « GW:NON » et la carte tente de se reconnecter toutes les 10 secondes."),
  P("Ce choix a été validé expérimentalement dans Wokwi : la connexion TCP vers le port 80 de la passerelle échoue (hôte injoignable, erreur 113), alors que le port 53 (DNS) est accepté en environ 120 ms. Le projet teste donc le port 53, que les routeurs domestiques et les passerelles d’entreprise exposent fréquemment ; sur un autre réseau, ce port est modifiable dans config.py (GW_PORT)."),
  H2("5.3 Alerte e-mail SMTP et repli"),
  P("Lorsqu’une cause atteint le niveau ATTENTION ou CRITIQUE, le gestionnaire d’alertes décide s’il faut envoyer un e-mail : un seul envoi par cause, puis au plus un toutes les 120 secondes tant que la cause persiste, avec une nouvelle tentative après 30 secondes en cas d’échec. Les pannes réseau ne déclenchent pas d’e-mail, puisqu’il ne pourrait pas partir. L’envoi utilise une classe SMTP qui reprend l’interface du module umail vu au chapitre 5 (SMTP(host, port, ssl=True, username, password), to(), write(), send()), connexion TLS sur le port 465."),
  P("Si l’envoi est impossible (pas de fichier mail_config.py, Wi-Fi coupé, serveur qui refuse), l’alerte n’est pas perdue : elle est affichée sur l’OLED (ligne « Mail:LOCAL ») et écrite dans la console série. Ce repli est celui prévu au cahier des charges ; il a été observé dans Wokwi sous la forme « MAIL> LOCAL pas de mail_config.py »."),
  H2("5.4 Affichage"),
  P("L’écran de 128×64 pixels affiche sept lignes de 16 caractères : titre et heure, température et humidité, gaz et PIR, état du réseau, adresse IP, état du système (NORMAL ou liste des causes), état de l’e-mail. Les quatre écrans ci-dessous sont calculés par la fonction réelle screen_lines (reconstitution graphique ; la capture du simulateur figure en section 8)."),
  oledGrid(),
  P("Figure 5 – Écrans OLED : normal ; gaz > 2000 avec e-mail envoyé ; Wi-Fi perdu ; température 36 °C avec intrusion.", { align: "center", italics: true }),

  H1("6. Notions du cours utilisées (traçabilité)"),
  P("Le tableau suivant relie chaque fonctionnalité du projet au chapitre, au TP, à la notion du cours réutilisée et au fichier concerné. La même matrice est fournie dans docs/TRACABILITE.md."),
  table([["#", "Fonctionnalité", "Chapitre / TP", "Notion du cours", "Fichier"], ...t], [400, 2600, 1500, 3100, 2000]),
  sp(),
  P("Choix propres au projet, non imposés par le cours : seuils de température et d’humidité, pré-alerte gaz à 1500, préchauffage de 10 secondes, moyenne de 5 lectures, délai anti-spam des e-mails."),

  H1("7. Étapes de réalisation"),
  B("Étape 1 – Étude : relecture des chapitres 1, 3, 4 et 5 et des TP1 à TP3 pour fixer les broches, le seuil 2000 et les modules à employer."),
  B("Étape 2 – Conception : séparation entre logique pure (monitor.py) et matériel (main.py) pour pouvoir tester sans carte."),
  B("Étape 3 – Développement et tests sur ordinateur : 27 tests pytest, dont un faux serveur SMTP local."),
  B("Étape 4 – Montage dans Wokwi : diagram.json avec ESP32, DHT22, MQ-2, PIR, OLED, trois LED et buzzer."),
  B("Étape 5 – Exécution dans Wokwi : démarrage, Wi-Fi, NTP, diagnostic réseau (commande g), correction de la sonde de passerelle."),
  B("Étape 6 – Documentation : matrice de traçabilité, rapport, présentation, script oral."),

  H1("8. Tests et résultats"),
  H2("8.1 Tests automatiques sur ordinateur"),
  P("Les 27 tests passent : niveaux et seuils (y compris le seuil strict > 2000), combinaisons de causes, LED, buzzer, anti-spam, textes d’écran de 16 caractères au plus, sonde de passerelle (acceptée, refusée, délai), horloge, client SMTP contre un serveur local de test, repli de notify.py. Les dix scénarios suivants sont rejoués sur la logique réelle de monitor.py."),
  table([["Scénario", "Niveau", "Causes", "LED (V/J/R)", "Buzzer"], ...sc.map(s => [s.scenario, s.niveau, s.causes.join(", ") || "—", s.leds.join("/"), s.buzzer])], [3300, 1300, 1000, 1500, 2500]),
  sp(),
  H2("8.2 Exécution réelle dans Wokwi"),
  P("Le firmware a été exécuté dans le simulateur (ESP32, MicroPython 1.21). Ont été réellement observés : le démarrage et l’affichage OLED ; la connexion à Wokwi-GUEST avec l’IP 10.10.0.2 et la passerelle 10.0.0.1 ; la synchronisation NTP ; la joignabilité TCP de la passerelle (port 53), de 8.8.8.8, de example.com et de smtp.gmail.com (ports 465 et 587) ; l’état NORMAL avec la passerelle détectée ; le repli « MAIL> LOCAL ». La capture ci-dessous est un instantané réel."),
  ...img("assets/wokwi_run_real.jpg", 6.2, "Figure 4 – Capture réelle de la simulation Wokwi (OLED en haut, console série en bas)."),
  H2("8.3 Ce qui n’a pas été vérifié dans le simulateur"),
  B("Capteur de gaz : le MQ-2 simulé fournit environ 1900 à 2100, avec du bruit, quelle que soit la valeur ppm du composant ; l’état oscille donc entre ATTENTION et CRITIQUE autour du seuil. La cause n’a pas été élucidée. Les scénarios de gaz sont validés par les tests sur ordinateur."),
  B("PIR, dépassement du DHT22 et panne réseau simulée (commande n) : validés sur ordinateur, non rejoués dans Wokwi."),
  B("E-mail : la connexion TCP vers smtp.gmail.com est possible depuis Wokwi, mais l’authentification TLS et l’envoi réel n’ont pas été testés, faute d’identifiants (Gmail exige un mot de passe d’application) ; le client SMTP a été validé contre un serveur local sans TLS."),

  H1("9. Limites et perspectives"),
  B("La sonde de passerelle repose sur TCP et non sur ICMP ; le port 53 est adapté à Wokwi et à la plupart des routeurs, mais reste un paramètre."),
  B("Le client SMTP est une réécriture compatible avec l’interface du cours, et non le fichier du cours lui-même ; de même, le pilote OLED conserve l’interface du cours sans être son fichier."),
  B("Sur une carte réelle, le MQ-2 demande une calibration et un vrai préchauffage de plusieurs minutes."),
  B("Pistes : journalisation horodatée, envoi vers un serveur MQTT, alimentation de secours, seuils réglables par le réseau."),

  H1("10. Conclusion"),
  P("Le projet répond à un besoin concret et courant : surveiller à distance un local technique télécom. Il mobilise les capteurs du TP2, l’écran, le Wi-Fi et l’heure du TP3, les GPIO du TP1 et l’envoi d’e-mail du chapitre 5, tout en restant simple à expliquer : lire, décider, afficher, alerter. La séparation entre logique et matériel rend le comportement testable et défendable. Les mesures réelles obtenues dans Wokwi ont corrigé une hypothèse de conception (la passerelle ne répond pas sur le port 80 mais sur le port 53), ce qui illustre l’intérêt de tester sur la cible."),

  H1("Annexe – Extraits de code"),
  H2("Décision sur le gaz (monitor.py)"),
  ...code(`def gas_level(raw):
    """TP2 : le seuil critique (2000) est DEPASSE quand raw > 2000."""
    if raw > C.GAS_CRIT:
        return CRIT
    if raw > C.GAS_WARN:
        return WARN
    return OK`),
  H2("Sonde de passerelle (net.py)"),
  ...code(`def gateway_probe(wlan, port, timeout_s, sock_mod=None):
    if not wifi_up(wlan):
        return False
    gw = wlan.ifconfig()[2]
    s = sm.socket(); s.settimeout(timeout_s)
    try:
        s.connect((gw, port)); return True
    except OSError as e:
        return (e.args[0] if e.args else None) == ECONNREFUSED`),
  H2("Envoi d’e-mail avec repli (notify.py)"),
  ...code(`def send_alert(subject, body, wifi_ok, cfg=None, smtp_factory=None):
    print("ALERTE>", subject); print(body)
    cfg = cfg if cfg is not None else load_config()
    if cfg is None:   return False, "LOCAL", "pas de mail_config.py"
    if not wifi_ok:   return False, "LOCAL", "reseau indisponible"
    try:
        smtp = umail.SMTP(cfg.SMTP_HOST, cfg.SMTP_PORT, ssl=True, ...)
        smtp.to(cfg.MAIL_TO, cfg.SMTP_USER); smtp.write(...); smtp.send()
        return True, "SMTP", "envoye"
    except Exception as e:
        return False, "LOCAL", "echec SMTP: %s" % e`),
];
build(c, "dist/Rapport_surveillance_local_technique.docx");
