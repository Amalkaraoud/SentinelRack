"""Configuration du moniteur de local technique telecom.

Toutes les broches reprennent celles des TP quand c'est possible :
  TP2 : PIR sur GPIO 14, LED temoin GPIO 2, MQ-2 analogique GPIO 34,
        MQ-2 numerique GPIO 26, LED jaune GPIO 4, seuil gaz = 2000
  TP3 : OLED SSD1306 en I2C : SDA = GPIO 21, SCL = GPIO 22
"""

# --- Broches (cf. docs/TRACABILITE.md) -----------------------------------
PIN_PIR = 14        # TP2 ex.1  : capteur de mouvement (sortie numerique)
PIN_MQ_AO = 34      # TP2 ex.2  : MQ-2, sortie analogique (ADC1)
PIN_MQ_DO = 26      # TP2 ex.2  : MQ-2, sortie numerique
PIN_DHT = 15        # DHT22 : donnees (module `dht` de MicroPython)
PIN_LED_CRIT = 2    # TP2 : LED temoin  -> ici LED rouge  (etat CRITIQUE)
PIN_LED_WARN = 4    # TP2 : LED jaune   -> ici LED jaune  (etat AVERTISSEMENT)
PIN_LED_OK = 12     # LED verte (etat NORMAL)
PIN_BUZZER = 25     # buzzer (PWM)
PIN_SDA = 21        # TP3 : I2C
PIN_SCL = 22        # TP3 : I2C

# --- Seuils --------------------------------------------------------------
GAS_CRIT = 2000     # TP2 : alerte si la valeur analogique DEPASSE 2000
GAS_WARN = 1500     # pre-alerte (choix du projet : 75 % du seuil critique)
TEMP_WARN = 28.0    # degres C (choix du projet, plage usuelle de salle serveur)
TEMP_CRIT = 35.0
HUM_LOW_WARN = 20.0   # % HR : air trop sec (electricite statique)
HUM_HIGH_WARN = 60.0  # % HR : risque de condensation
HUM_HIGH_CRIT = 80.0

# --- Cadencement ---------------------------------------------------------
TICK_MS = 500             # pas de la boucle principale
DHT_PERIOD_MS = 2000      # le DHT22 ne se lit pas plus d'une fois / 2 s
NET_PERIOD_MS = 10000     # verification Wi-Fi + passerelle
RECONNECT_MS = 10000      # delai entre deux tentatives de reconnexion
WARMUP_S = 10             # le MQ-2 chauffe : on ignore le gaz au demarrage
GAS_SAMPLES = 5           # moyenne de 5 lectures ADC (filtre le bruit)

# --- Reseau (chapitre 1, TP3) --------------------------------------------
WIFI_SSID = "Wokwi-GUEST"
WIFI_PASS = ""
WIFI_TIMEOUT_S = 15
GW_PORT = 53              # sonde TCP vers la passerelle (port DNS ; ICMP indisponible)
GW_TIMEOUT_S = 2
TZ_OFFSET_S = 3600        # Tunisie : UTC+1

# --- Alertes e-mail (chapitre 5) -----------------------------------------
MAIL_COOLDOWN_S = 120     # ne pas renvoyer le meme e-mail avant 2 min
MAIL_RETRY_S = 30         # nouvel essai apres un echec
