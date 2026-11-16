"""Serveur SMTP factice (sans TLS) pour tester umail sur le PC."""
import socketserver, threading

class Handler(socketserver.StreamRequestHandler):
    def send(self, s): self.wfile.write((s + "\r\n").encode())
    def handle(self):
        srv = self.server
        self.send("220 fake ESMTP")
        data_mode, buf = False, []
        while True:
            line = self.rfile.readline()
            if not line: return
            text = line.decode().rstrip("\r\n")
            if data_mode:
                if text == ".":
                    srv.messages.append("\n".join(buf)); data_mode = False; self.send("250 queued")
                else: buf.append(text)
                continue
            cmd = text.upper()
            srv.log.append(text)
            if cmd.startswith("EHLO"): self.send("250-fake"); self.send("250 AUTH LOGIN")
            elif cmd == "AUTH LOGIN": self.send("334 VXNlcm5hbWU6")
            elif cmd.startswith("MAIL FROM") or cmd.startswith("RCPT TO"): self.send("250 ok")
            elif cmd == "DATA": data_mode, buf = True, []; self.send("354 go")
            elif cmd == "QUIT": self.send("221 bye"); return
            else:
                if srv.auth_step == 0: srv.auth_step = 1; self.send("334 UGFzc3dvcmQ6")
                else: srv.auth_step = 0; self.send("235 ok" if srv.accept_login else "535 bad")

def start(accept_login=True):
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler)
    srv.daemon_threads = True
    srv.messages, srv.log, srv.auth_step, srv.accept_login = [], [], 0, accept_login
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv
