# Où trouver chaque livrable

| Ce que vous cherchez | Dossier / fichier |
|---|---|
| **Projet Wokwi complet** (simulation + code) | `wokwi/` : `diagram.json` (montage), `wokwi.toml`, et tous les fichiers Python à copier dans Wokwi (`main.py`, `monitor.py`, `net.py`, `notify.py`, `umail.py`, `ssd1306.py`, `config.py`) |
| Code source « propre » (version de référence) | `firmware/` (mêmes fichiers + `mail_config_example.py`) |
| **Présentation PowerPoint** (16 diapos, notes orateur) | `livrables/1_Presentation_PowerPoint/Presentation_surveillance_local_technique.pptx` (+ `.pdf`) |
| **Rapport du projet** | `livrables/2_Rapport/Rapport_surveillance_local_technique.docx` (+ `.pdf`) |
| **Script de présentation orale** (15 min, partie par partie) | `livrables/3_Script_oral/Script_oral_surveillance_local_technique.docx` (+ `.pdf`) |
| **Questions possibles du jury + réponses** | `livrables/4_Questions_jury_et_reponses/Questions_jury_et_reponses.docx` (+ `.pdf`) |
| Matrice de traçabilité cours / TP | `docs/TRACABILITE.md` |
| Résultats des tests et limites | `docs/TESTS.md`, `docs/resultats_scenarios.json` |
| Tests automatiques (27) | `tests/` |
| Figures et captures utilisées | `assets/` |
| Scripts qui génèrent figures et documents | `tools/` |

Pour lancer la simulation : ouvrir un nouveau projet MicroPython ESP32 sur wokwi.com, remplacer `diagram.json`
et ajouter les fichiers de `wokwi/` (voir `README.md`).
