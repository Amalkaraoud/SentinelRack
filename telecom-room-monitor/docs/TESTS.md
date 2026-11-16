# Tests et resultats

## 1. Tests automatiques sur PC (pytest) : 27 tests, tous reussis
- `tests/test_monitor.py` : niveaux de temperature, humidite et gaz (seuil strict > 2000), causes combinees,
  LED, motif du buzzer, anti-spam des e-mails, textes d'ecran (16 caracteres maximum).
- `tests/test_net_mail.py` : sonde de passerelle (acceptee / refusee / delai), horloge, client SMTP contre un faux
  serveur local (`tests/fake_smtp.py`), repli local de `notify.py`.
Commande : `python3 -m pytest -q tests`

## 2. Executions reelles dans le simulateur Wokwi (ESP32, MicroPython 1.21)
Observe :
- demarrage, affichage OLED, journal serie ;
- Wi-Fi `Wokwi-GUEST` : IP 10.10.0.2, passerelle 10.0.0.1 ;
- heure NTP synchronisee ;
- diagnostic reseau (commande `g`) : TCP 10.0.0.1:80 -> hote injoignable (errno 113) ; TCP 10.0.0.1:53 -> accepte ;
  8.8.8.8:53, example.com:80, smtp.gmail.com:465 et :587 -> connexion TCP acceptee ;
- apres le choix du port 53, etat NORMAL avec `gw=1` ;
- le MQ-2 simule fournit ~1900 a 2100 (bruit) quel que soit `ppm` dans `diagram.json` : l'etat oscille donc
  ATTENTION / CRITIQUE autour du seuil 2000 ; cause non elucidee dans la simulation.

## 3. Non verifie dans le simulateur (voir limites)
- scenarios PIR, DHT22 hors seuil, panne reseau simulee (`n`) : valides par les tests PC, pas rejoues dans Wokwi ;
- e-mail SMTP : connexion TCP vers Gmail possible, mais authentification TLS + envoi non testes (pas d'identifiants) ;
  repli OLED + console verifie par les tests PC et par le message `MAIL> LOCAL pas de mail_config.py` observe dans Wokwi.
