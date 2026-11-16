const { R, P, B, H1, H2, table, sp, header, build } = require("./lib_docx");
const part = (title, time, slides, text) => [H2(`${title}  (${time} · ${slides})`), ...text.map(t => P(t))];
const QA = [
 ["Pourquoi ce projet ?", "Parce que c'est un problème réel : un local technique est souvent sans personne. Il utilise tout le cours : GPIO, capteurs, écran, Wi-Fi, e-mail."],
 ["Pourquoi le seuil 2000 ?", "C'est le seuil du TP2 sur la valeur analogique du MQ-2 (0 à 4095). L'alerte part quand la valeur dépasse strictement 2000. J'ai ajouté une pré-alerte à 1500, qui est mon choix."],
 ["Comment testez-vous la passerelle sans ping ?", "Le ping (ICMP) n'existe pas en MicroPython ni dans Wokwi. Je tente une connexion TCP : acceptée ou refusée veut dire que la passerelle répond. Dans Wokwi, le port 80 est injoignable et le port 53 répond, donc je teste le 53."],
 ["Que se passe-t-il si le Wi-Fi tombe ?", "L'OLED affiche « WiFi:PERDU », l'état passe à ATTENTION (cause WIFI), la carte retente la connexion toutes les 10 secondes. Aucun e-mail n'est tenté puisqu'il ne partirait pas."],
 ["L'e-mail a-t-il été vraiment envoyé ?", "Non, pas dans cette version : je n'ai pas d'identifiants dans le simulateur. J'ai vérifié que la connexion TCP vers Gmail est possible et testé mon client SMTP contre un faux serveur local. Si l'envoi est impossible, l'alerte reste sur l'OLED et la console."],
 ["Pourquoi un mot de passe d'application ?", "Gmail refuse le mot de passe normal pour les programmes. Le mot de passe d'application se met dans mail_config.py, qui n'est jamais publié."],
 ["Pourquoi attendre 10 secondes pour le gaz ?", "Le MQ-2 chauffe au démarrage. Dans le simulateur, la première lecture vaut 3123 puis redescend. On l'affiche avec une étoile mais on ne décide pas dessus."],
 ["Pourquoi séparer monitor.py du reste ?", "Monitor.py ne touche pas le matériel : je le teste sur PC avec 27 tests, puis il tourne à l'identique sur l'ESP32."],
 ["Le gaz oscille entre ATTENTION et CRITIQUE dans la simulation, pourquoi ?", "Le MQ-2 simulé donne environ 1900 à 2100 avec du bruit, quelle que soit la valeur ppm. Je n'ai pas élucidé la cause ; sur matériel réel il faut calibrer. Les scénarios de gaz sont validés sur la logique, sur PC."],
 ["Qu'est-ce qui est le vôtre et qu'est-ce qui vient du cours ?", "Les broches, le seuil 2000, l'OLED, le Wi-Fi et l'interface umail viennent du cours. Les seuils de température, la pré-alerte, l'anti-spam, la sonde de passerelle et la séparation logique/matériel sont mes choix. Le client SMTP et le pilote OLED sont réécrits avec la même interface."],
 ["Que feriez-vous ensuite ?", "Envoyer les mesures vers un serveur MQTT, journaliser avec l'heure, rendre les seuils réglables, ajouter une alimentation de secours."]];
const c = [
  ...header("Script oral – 15 minutes", "Surveillance intelligente d’un local technique télécom · à dire avec ses propres mots"),
  P("Conseil : parler lentement, regarder le jury, montrer la simulation au moment de la démonstration. Les durées sont indicatives (total 14 minutes, 1 minute de marge)."),
  ...part("1. Introduction", "1 min", "diapos 1-2", [
    "Bonjour. Je m’appelle Amal Karaoud. Mon projet s’appelle « Surveillance intelligente d’un local technique télécom ».",
    "Un local technique, c’est la pièce où se trouvent les routeurs et les serveurs. Souvent, il n’y a personne dedans. Trois choses peuvent mal tourner : il fait trop chaud, il y a du gaz ou de la fumée, ou quelqu’un entre sans autorisation. Mon système prévient à temps, sur place et à distance."]),
  ...part("2. Justification et objectifs", "1 min", "diapo 3", [
    "J’ai choisi ce problème parce qu’il est réel et parce qu’il utilise tout le cours : les GPIO du TP1, les capteurs du TP2, l’écran et le Wi-Fi du TP3, l’e-mail du chapitre 5.",
    "L’idée tient en quatre verbes : lire, décider, afficher, alerter."]),
  ...part("3. Composants et câblage", "2 min", "diapos 4-5", [
    "Le cerveau est un ESP32 en MicroPython. Trois capteurs : le DHT22 pour la température et l’humidité, le MQ-2 pour le gaz, et le PIR pour le mouvement. Pour le résultat : un écran OLED en I2C, trois LED (verte, jaune, rouge) et un buzzer.",
    "Les broches sont celles des TP : PIR sur 14, MQ-2 sur 34 et 26, I2C sur 21 et 22, LED sur 2 et 4. Les LED ont une résistance de 330 ohms."]),
  ...part("4. Architecture et code", "3 min", "diapos 6-8", [
    "Le code est découpé en fichiers. Le point important : toute la décision est dans monitor.py, qui ne touche pas au matériel. Je peux donc le tester sur mon ordinateur avec 27 tests, et il tourne ensuite à l’identique sur l’ESP32.",
    "Il y a trois niveaux : normal, attention, critique. Le niveau global est le plus élevé de toutes les causes. Pour le gaz, le seuil critique est celui du TP2 : l’alerte part quand la valeur dépasse 2000. J’ai ajouté une pré-alerte à 1500.",
    "Sur la diapositive du code : gas_level compare la valeur à 2000 et 1500. evaluate collecte les causes et prend le maximum. Le MQ-2 chauffe au démarrage, donc pendant 10 secondes je ne décide pas sur le gaz."]),
  ...part("5. Réseau et e-mail", "2 min", "diapos 9-10", [
    "La carte se connecte en Wi-Fi, affiche son adresse IP et son heure. Toutes les 10 secondes, elle vérifie le Wi-Fi et la passerelle. Il n’y a pas de ping en MicroPython : je tente une connexion TCP. Dans Wokwi, j’ai mesuré que le port 80 de la passerelle ne répond pas, mais le port 53 oui. Donc je teste le port 53. Si le Wi-Fi tombe, l’écran affiche « WiFi:PERDU ».",
    "Quand une cause devient critique, la carte envoie un e-mail avec l’interface du module umail du chapitre 5. Un seul e-mail par cause, puis au plus un toutes les deux minutes. Si l’envoi est impossible, l’alerte reste sur l’écran et dans la console : c’est le repli prévu."]),
  ...part("6. Lien avec le cours", "1 min", "diapo 12", [
    "Chaque fonction est reliée à un chapitre : capteurs, chapitre 3 et TP2 ; écran, Wi-Fi et heure, chapitre 4 et TP3 ; LED et buzzer, chapitre 1 et TP1 ; e-mail, chapitre 5. Le tableau complet est dans mon rapport."]),
  ...part("7. Démonstration", "2 min", "diapos 11 et 13", [
    "Voici la simulation Wokwi. Au démarrage, l’écran affiche le Wi-Fi, l’IP 10.10.0.2 et l’heure. La passerelle est détectée. Dans la console, chaque changement d’état est journalisé. Sans fichier d’identifiants, l’e-mail passe en mode LOCAL : l’alerte reste visible sur l’écran et dans la console.",
    "(Si possible : montrer le démarrage en direct dans Wokwi ; sinon, présenter la capture de la diapositive 13.)"]),
  ...part("8. Tests, limites, conclusion", "2 min", "diapos 14-16", [
    "27 tests automatiques passent, et j’ai rejoué dix scénarios sur la logique. Dans Wokwi, j’ai vraiment observé le Wi-Fi, l’heure et la passerelle.",
    "Je tiens à dire les limites. Le gaz simulé fluctue autour de 2000. L’e-mail réel n’a pas été envoyé, faute d’identifiants ; la connexion vers Gmail est possible et mon client est testé sur un faux serveur. Le PIR et la panne réseau simulée sont validés sur ordinateur.",
    "En conclusion : un problème réel, tout le cours mobilisé, une logique testée, et une hypothèse corrigée par les mesures. Merci, je suis prêt pour vos questions."]),
  H1("Questions probables du jury"),
  ...QA.flatMap(([q, a]) => [P([R("Q : " + q, { bold: true })], { align: "left" }), P("R : " + a)]),
  H1("Commandes utiles pendant la démonstration"),
  table([["Touche (console série)", "Effet"], ["n", "active / lève une panne Wi-Fi simulée"], ["m", "envoie un e-mail de test (repli LOCAL sans identifiants)"], ["s", "affiche l'état détaillé"], ["g", "diagnostic réseau (ports TCP testés)"]], [3000, 6600]),
];
build(c, "dist/Script_oral_surveillance_local_technique.docx");
