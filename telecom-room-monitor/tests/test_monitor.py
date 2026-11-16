import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "firmware"))
import config as C
import monitor as M

BASE = dict(temp=24.0, hum=40.0, gas=400, pir=0, wifi=True, gw=True, warm=False)
def R(**kw):
    d = dict(BASE); d.update(kw); return d

def test_nominal_is_ok():
    lv, causes = M.evaluate(R())
    assert lv == M.OK and causes == []

def test_gas_threshold_is_strictly_greater_than_2000():     # TP2 : "depasse 2000"
    assert C.GAS_CRIT == 2000
    assert M.gas_level(2000) == M.WARN
    assert M.gas_level(2001) == M.CRIT
    assert M.gas_level(1500) == M.OK and M.gas_level(1501) == M.WARN

def test_temperature_levels():
    assert M.temp_level(27.9) == M.OK
    assert M.temp_level(28.0) == M.WARN
    assert M.temp_level(35.0) == M.CRIT

def test_humidity_levels():
    assert M.hum_level(40) == M.OK
    assert M.hum_level(19.9) == M.WARN and M.hum_level(60.1) == M.WARN
    assert M.hum_level(80.1) == M.CRIT

def test_motion_is_warning():
    lv, causes = M.evaluate(R(pir=1))
    assert lv == M.WARN and ("PIR", M.WARN) in causes

def test_wifi_loss_detected_and_shown():
    lv, causes = M.evaluate(R(wifi=False, gw=False))
    assert ("WIFI", M.WARN) in causes and lv == M.WARN
    lines = M.screen_lines(R(wifi=False, gw=False), lv, causes, None, "12:00:00", "--")
    assert any("PERDU" in l for l in lines)

def test_gateway_loss_with_wifi_up():
    lv, causes = M.evaluate(R(gw=False))
    assert ("GW", M.WARN) in causes and ("WIFI", M.WARN) not in causes

def test_gas_ignored_during_warmup():
    assert M.evaluate(R(gas=4000, warm=True))[1] == []

def test_dht_failure_is_a_warning():
    lv, causes = M.evaluate(R(temp=None, hum=None))
    assert ("DHT", M.WARN) in causes

def test_worst_level_wins():
    lv, causes = M.evaluate(R(temp=40.0, pir=1, gas=2500))
    assert lv == M.CRIT and len(causes) == 3

def test_leds_exactly_one_lit():
    for lv in (M.OK, M.WARN, M.CRIT):
        assert sum(M.leds(lv)) == 1

def test_buzzer_patterns():
    assert not any(M.buzzer_on(M.OK, t) for t in range(20))
    assert sum(M.buzzer_on(M.WARN, t) for t in range(20)) == 2
    assert sum(M.buzzer_on(M.CRIT, t) for t in range(20)) == 10

def test_screen_lines_fit_oled():
    for r in (R(), R(temp=40.0, pir=1, gas=2500, wifi=False, gw=False), R(temp=None, hum=None)):
        lv, causes = M.evaluate(r)
        lines = M.screen_lines(r, lv, causes, "10.10.0.2", "12:34:56", "LOCAL")
        assert len(lines) <= 7 and all(len(l) <= 16 for l in lines)

def test_alert_sent_once_then_cooldown():
    a = M.AlertManager(cooldown_s=120, retry_s=30)
    causes = [("GAZ", M.CRIT)]
    assert a.due(causes, 0) == causes
    a.mark(causes, 0, ok=True)
    assert a.due(causes, 60) == []
    assert a.due(causes, 121) == causes

def test_alert_retried_after_failure():
    a = M.AlertManager(cooldown_s=120, retry_s=30)
    causes = [("TEMP", M.WARN)]
    a.mark(causes, 0, ok=False)
    assert a.due(causes, 10) == []
    assert a.due(causes, 31) == causes

def test_new_cause_triggers_new_alert_and_cleared_cause_resets():
    a = M.AlertManager(cooldown_s=120, retry_s=30)
    a.mark([("GAZ", M.CRIT)], 0, ok=True)
    assert a.due([("GAZ", M.CRIT), ("PIR", M.WARN)], 5) == [("PIR", M.WARN)]
    assert a.due([], 10) == []
    assert a.due([("GAZ", M.CRIT)], 20) == [("GAZ", M.CRIT)]   # disparue puis revenue

def test_no_email_for_network_causes():
    a = M.AlertManager()
    assert a.due([("WIFI", M.WARN), ("GW", M.WARN)], 0) == []

def test_subject_and_body():
    causes = [("GAZ", M.CRIT), ("PIR", M.WARN)]
    assert M.subject_for(causes).startswith("[CRITIQUE]")
    body = M.body_for(R(gas=2500, pir=1), causes, "10:00:00")
    assert "2500" in body and "10:00:00" in body
