"""Client SMTP minimal, meme interface que `umail` du chapitre 5.

    smtp = umail.SMTP(host, port, ssl=True, username=..., password=...)
    smtp.to("destinataire@exemple.com")
    smtp.write("Subject: ...\n\n corps")
    smtp.send()

Reecrit pour ce projet (le fichier du cours se telecharge depuis Internet).
ssl=True = TLS implicite (port 465). ssl=False sert aux tests sur un serveur local.
"""
try:
    import usocket as socket
except ImportError:
    import socket

DEFAULT_TIMEOUT = 10


class SMTP:
    def __init__(self, host, port, ssl=False, username=None, password=None,
                 timeout=DEFAULT_TIMEOUT):
        addr = socket.getaddrinfo(host, port)[0][-1]
        s = socket.socket()
        s.settimeout(timeout)
        s.connect(addr)
        if ssl:
            try:
                import ussl as tls
            except ImportError:
                import ssl as tls
            s = tls.wrap_socket(s) if hasattr(tls, "wrap_socket") else \
                tls.create_default_context().wrap_socket(s, server_hostname=host)
        self._s = s
        self._rd = s.makefile("rwb", 0) if hasattr(s, "makefile") else None
        code, _ = self._read()
        if code != 220:
            raise RuntimeError("SMTP banner %s" % code)
        code, _ = self._cmd("EHLO umail")
        if code != 250:
            raise RuntimeError("EHLO %s" % code)
        if username and password:
            self._login(username, password)
        self._to = []
        self._from = username or "esp32@localhost"
        self._body = ""

    # -- bas niveau --------------------------------------------------------
    def _read(self):
        data = b""
        while True:
            line = self._rd.readline()
            if not line:
                break
            data += line
            if len(line) < 4 or line[3:4] != b"-":   # derniere ligne : "250 ..."
                break
        text = data.decode()
        return int(text[:3]) if text[:3].isdigit() else 0, text

    def _cmd(self, line):
        self._rd.write((line + "\r\n").encode())
        return self._read()

    def _login(self, user, pwd):
        import ubinascii as b64
        code, _ = self._cmd("AUTH LOGIN")
        if code != 334:
            raise RuntimeError("AUTH %s" % code)
        code, _ = self._cmd(b64.b2a_base64(user.encode()).decode().strip())
        code, _ = self._cmd(b64.b2a_base64(pwd.encode()).decode().strip())
        if code != 235:
            raise RuntimeError("LOGIN refuse (%s)" % code)

    # -- interface du cours -------------------------------------------------
    def to(self, addrs, mail_from=None):
        if mail_from:
            self._from = mail_from
        self._to = [addrs] if isinstance(addrs, str) else list(addrs)

    def write(self, content):
        self._body += content

    def send(self, content=""):
        self._body += content
        code, _ = self._cmd("MAIL FROM:<%s>" % self._from)
        if code != 250:
            raise RuntimeError("MAIL FROM %s" % code)
        for a in self._to:
            code, _ = self._cmd("RCPT TO:<%s>" % a)
            if code not in (250, 251):
                raise RuntimeError("RCPT %s" % code)
        code, _ = self._cmd("DATA")
        if code != 354:
            raise RuntimeError("DATA %s" % code)
        self._rd.write(self._body.replace("\n.", "\n..").encode() + b"\r\n.\r\n")
        code, _ = self._read()
        if code != 250:
            raise RuntimeError("fin DATA %s" % code)
        self._body = ""

    def quit(self):
        try:
            self._cmd("QUIT")
        finally:
            self._s.close()
