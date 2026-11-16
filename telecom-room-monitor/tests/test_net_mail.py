import os, sys, types, binascii
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "firmware"))
sys.path.insert(0, os.path.dirname(__file__))
# MicroPython-only module name used by umail for base64
sys.modules.setdefault("ubinascii", binascii)
import umail, notify, net, fake_smtp

def test_umail_sends_through_local_server():
    srv = fake_smtp.start()
    s = umail.SMTP("127.0.0.1", srv.server_address[1], ssl=False, username="a@b.c", password="pw")
    s.to("dest@x.y", "a@b.c"); s.write("Subject: Test\n\nbonjour\n"); s.send(); s.quit()
    assert any("bonjour" in m for m in srv.messages)
    assert any(l.startswith("RCPT TO:<dest@x.y>") for l in srv.log)

def test_umail_login_refused_raises():
    srv = fake_smtp.start(accept_login=False)
    try:
        umail.SMTP("127.0.0.1", srv.server_address[1], ssl=False, username="a", password="b")
        assert False
    except RuntimeError as e:
        assert "LOGIN" in str(e)

def test_notify_falls_back_without_config(capsys):
    assert notify.load_config() is None          # aucun mail_config.py dans le depot
    ok, mode, detail = notify.send_alert("[X] t", "corps", wifi_ok=True)
    assert (ok, mode) == (False, "LOCAL") and "mail_config" in detail
    assert "ALERTE>" in capsys.readouterr().out

def test_notify_falls_back_when_wifi_down():
    cfg = types.SimpleNamespace(SMTP_HOST="h", SMTP_PORT=465, SMTP_USER="u", SMTP_PASS="p", MAIL_TO="t")
    ok, mode, detail = notify.send_alert("s", "b", wifi_ok=False, cfg=cfg)
    assert (ok, mode) == (False, "LOCAL") and "reseau" in detail

def test_notify_falls_back_on_smtp_error():
    cfg = types.SimpleNamespace(SMTP_HOST="h", SMTP_PORT=465, SMTP_USER="u", SMTP_PASS="p", MAIL_TO="t")
    def boom(*a, **k): raise OSError("timeout")
    ok, mode, detail = notify.send_alert("s", "b", wifi_ok=True, cfg=cfg, smtp_factory=boom)
    assert (ok, mode) == (False, "LOCAL") and "timeout" in detail

def test_notify_sends_when_everything_works():
    srv = fake_smtp.start()
    cfg = types.SimpleNamespace(SMTP_HOST="127.0.0.1", SMTP_PORT=srv.server_address[1], SMTP_USER="u@x.y", SMTP_PASS="p", MAIL_TO="t@x.y")
    f = lambda h, p, ssl, username, password: umail.SMTP(h, p, ssl=False, username=username, password=password)
    ok, mode, detail = notify.send_alert("[CRITIQUE] GAZ", "corps du message", wifi_ok=True, cfg=cfg, smtp_factory=f)
    assert (ok, mode) == (True, "SMTP")
    assert any("Subject: [CRITIQUE] GAZ" in m for m in srv.messages)

class FakeWlan:
    def __init__(self, up=True): self.up = up
    def isconnected(self): return self.up
    def ifconfig(self): return ("10.10.0.5", "255.255.255.0", "10.10.0.2", "8.8.8.8")

class FakeSock:
    def __init__(self, exc): self.exc = exc
    def settimeout(self, t): pass
    def connect(self, a):
        if self.exc: raise self.exc
    def close(self): pass
def mod(exc): return types.SimpleNamespace(socket=lambda: FakeSock(exc))

def test_gateway_accepts_or_refuses_means_alive_timeout_means_lost():
    w = FakeWlan()
    assert net.gateway_probe(w, 80, 2, mod(None)) is True
    assert net.gateway_probe(w, 80, 2, mod(OSError(111, "refused"))) is True
    assert net.gateway_probe(w, 80, 2, mod(OSError(110, "timeout"))) is False
    assert net.gateway_probe(w, 80, 2, mod(OSError(113, "no route"))) is False

def test_gateway_false_when_wifi_down_or_simulated_outage():
    assert net.gateway_probe(FakeWlan(up=False), 80, 2, mod(None)) is False
    net.SIM_DOWN = True
    try:
        assert net.wifi_up(FakeWlan()) is False
        assert net.gateway_probe(FakeWlan(), 80, 2, mod(None)) is False
    finally:
        net.SIM_DOWN = False

def test_clock_string():
    assert net.clock_str(False, 3600) == "--:--:--"
    assert len(net.clock_str(True, 3600)) == 8
