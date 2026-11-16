# Surveillance intelligente d'un local technique telecom (ESP32 / MicroPython)

Projet d'examen MicroPython (MPI1, Faculte des Sciences de Sfax, 2026-2027).
Surveille une baie reseau / salle serveur : temperature + humidite (DHT22), gaz / fumee (MQ-2, seuil 2000),
intrusion (PIR) ; affiche sur OLED SSD1306 (I2C) mesures, etat, Wi-Fi, IP et heure ; LED + buzzer ;
test de la passerelle ; alerte e-mail SMTP avec repli local.

## Structure
- `firmware/` : code MicroPython (config, monitor, net, notify, umail, ssd1306, main)
- `wokwi/` : `diagram.json` + copie a plat des fichiers pour le simulateur Wokwi
- `tests/` : 27 tests pytest (`python3 -m pytest -q tests`)
- `docs/` : traçabilite cours/TP, tests, resultats de scenarios
- `tools/` : generation des figures et scenarios

## Lancer dans Wokwi
Nouveau projet MicroPython ESP32, remplacer `diagram.json`, ajouter les fichiers de `wokwi/`, demarrer.
Console serie : `n` panne Wi-Fi simulee, `m` e-mail de test, `s` etat, `g` diagnostic reseau.

## E-mail
Copier `firmware/mail_config_example.py` en `mail_config.py` et renseigner vos identifiants
(mot de passe d'application). Ce fichier est ignore par git : ne le publiez jamais.
Sans lui, l'alerte reste affichee sur l'OLED et dans la console.
