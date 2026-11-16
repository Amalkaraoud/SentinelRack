# Matrice de tracabilite : fonctionnalite -> cours -> TP -> fichier

| # | Fonctionnalite du projet | Chapitre / TP | Notion du cours reutilisee | Fichier |
|---|---|---|---|---|
| 1 | Lecture du capteur de mouvement PIR (GPIO 14) | Chap. 3 / TP2 ex.1 | `Pin(14, Pin.IN)`, `pir.value()` | main.py |
| 2 | Lecture analogique du MQ-2 (GPIO 34), seuil 2000 | Chap. 3 / TP2 ex.2 | `ADC`, `atten(ADC.ATTN_11DB)`, `read()`, alerte si valeur **> 2000** | main.py, monitor.py (`gas_level`) |
| 3 | Sortie numerique du MQ-2 (GPIO 26) | Chap. 3 / TP2 ex.2 | `Pin.IN` | main.py |
| 4 | Temperature et humidite DHT22 | Chap. 3 (capteurs) | module `dht`, `measure()`, `temperature()`, `humidity()` | main.py |
| 5 | LED d'etat (verte GPIO 12, jaune GPIO 4, rouge GPIO 2) | Chap. 1 / TP1, TP2 | `Pin(n, Pin.OUT)`, `value()` | main.py, monitor.py (`leds`) |
| 6 | Buzzer d'alerte (GPIO 25) | Chap. 1 / TP1 | sortie GPIO / PWM, `time.sleep_ms` | main.py, monitor.py (`buzzer_on`) |
| 7 | Ecran OLED SSD1306 en I2C (SDA 21, SCL 22) | Chap. 4 / TP3 | `I2C`, `SSD1306_I2C`, `fill`, `text`, `show` | main.py, ssd1306.py |
| 8 | Affichage mesures + etat + reseau + IP + heure | Chap. 4 / TP3 | affichage de texte, IP, heure | monitor.py (`screen_lines`) |
| 9 | Connexion Wi-Fi, adresse IP | Chap. 1 et Chap. 4 / TP3 | module `network`, `WLAN(STA_IF)`, `connect`, `isconnected`, `ifconfig` | net.py |
| 10 | Test de la passerelle | Chap. 1 (reseaux) | notion de passerelle, TCP/IP, sockets | net.py (`gateway_probe`) |
| 11 | Detection de perte Wi-Fi affichee sur l'OLED | Chap. 1 + Chap. 4 | `isconnected()`, reconnexion | net.py, main.py, monitor.py |
| 12 | Heure reseau (NTP) | Chap. 4 / TP3 | `ntptime`, `time.localtime` | net.py |
| 13 | Alerte e-mail SMTP | Chap. 5 | `umail.SMTP(host, port, ssl=True, ...)`, `to()`, `write()`, `send()` | umail.py, notify.py |
| 14 | Repli sans e-mail : OLED + console | Chap. 5 (limites) | `print`, exceptions `try/except` | notify.py |
| 15 | Logique pure testable | Notions du langage (fonctions, dict, classes, exceptions) | fonctions, `dict`, classe `AlertManager`, `try/except` | monitor.py, tests/ |

Choix propres au projet (non imposes par le cours) : seuils de temperature et d'humidite, pre-alerte gaz a 1500,
temps de prechauffage du MQ-2 (10 s), moyenne de 5 lectures, delai anti-spam des e-mails (120 s).
