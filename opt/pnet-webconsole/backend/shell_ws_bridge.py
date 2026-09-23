#!/usr/bin/env python3
"""
shell_ws_bridge.py — WebSocket <-> PTY bridge to an AUTHENTICATED host shell.

Unlike the telnet/vnc/rdp bridges (which reach a node's console port), this lane
opens a pseudo-terminal running login(1) on the appliance itself, so the user
authenticates against the OS (e.g. root / pnet). It is double-gated:

  1. token_mint.php mints a shell token ONLY for an authenticated PNETLab session
     whose user is an admin; the token is a sentinel line "<token>: __pnetshell__:0"
     in the shared tmpfs store. This bridge accepts ONLY that sentinel (it can
     never be steered to an arbitrary host:port), and CONSUMES the token on use.
  2. Apache exposes it only as same-origin wss /shell/ behind the session cookie;
     the bridge binds 127.0.0.1.
  3. login(1) is the real credential check — no shell without valid OS creds.

WebSocket sub-protocol (matches console-tabs.js telnet/shell lane):
  * BINARY frame -> PTY input (keystrokes)
  * TEXT frame   -> JSON control: {"type":"resize","cols":C,"rows":R} -> TIOCSWINSZ
Initial size is also taken from ?cols=&rows=&term= on the ws URL.

Must run as root so login(1) can authenticate and setuid. Binds 127.0.0.1.
Deps: websockets (already required by the telnet bridge).
Env:  PNET_TOKEN_DIR / PNET_SHELL_BRIDGE_HOST / PNET_SHELL_BRIDGE_PORT / PNET_SHELL_LOGIN
"""
import asyncio
import fcntl
import json
import os
import pty
import signal
import struct
import sys
import termios
from urllib.parse import urlparse, parse_qs

import websockets

TOKEN_DIR     = os.environ.get("PNET_TOKEN_DIR", "/dev/shm/pnet-tokens")
LISTEN_HOST   = os.environ.get("PNET_SHELL_BRIDGE_HOST", "127.0.0.1")
LISTEN_PORT   = int(os.environ.get("PNET_SHELL_BRIDGE_PORT", "8023"))
LOGIN_CMD     = os.environ.get("PNET_SHELL_LOGIN", "/bin/login")
SHELL_SENTINEL = "__pnetshell__"


def resolve_token(token):
    """Shared tmpfs store ('<token>: host:port'). Returns (host, port) or None."""
    if not token:
        return None
    try:
        names = os.listdir(TOKEN_DIR)
    except FileNotFoundError:
        return None
    for name in names:
        path = os.path.join(TOKEN_DIR, name)
        if not os.path.isfile(path):
            continue
        try:
            with open(path) as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith("#") or ":" not in line:
                        continue
                    tok, _, target = line.partition(":")
                    if tok.strip() == token:
                        host, _, port = target.strip().rpartition(":")
                        return host.strip(), int(port)
        except OSError:
            continue
    return None


def consume_token(token):
    """Single-use: remove the token file token_mint.php wrote (TOKEN_DIR/<token>)."""
    if not token:
        return
    try:
        os.unlink(os.path.join(TOKEN_DIR, token))
    except OSError:
        pass


def request_path(ws, path=None):
    if path:
        return path
    req = getattr(ws, "request", None)
    if req is not None:
        return getattr(req, "path", "")
    return getattr(ws, "path", "")


def set_winsize(fd, rows, cols):
    try:
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
    except OSError:
        pass


async def handle(ws, *args):
    path = args[0] if args else None
    qs = parse_qs(urlparse(request_path(ws, path)).query)
    token = (qs.get("token") or [None])[0]
    target = resolve_token(token)
    # ONLY the shell sentinel is accepted — this bridge can't reach a node port.
    if not target or target[0] != SHELL_SENTINEL:
        await ws.close(code=4401, reason="invalid token")
        return
    consume_token(token)                       # single-use

    cols = int((qs.get("cols") or ["80"])[0] or 80)
    rows = int((qs.get("rows") or ["24"])[0] or 24)
    term = (qs.get("term") or ["xterm-256color"])[0]

    pid, fd = pty.fork()
    if pid == 0:                               # child: become login(1)
        os.environ["TERM"] = term
        try:
            os.execv(LOGIN_CMD, [LOGIN_CMD])
        except Exception:
            os._exit(127)

    # parent
    set_winsize(fd, rows, cols)
    flags = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)
    loop = asyncio.get_event_loop()

    closing = {"done": False}

    async def shutdown():
        if closing["done"]:
            return
        closing["done"] = True
        try:
            loop.remove_reader(fd)
        except Exception:
            pass
        try:
            os.close(fd)
        except OSError:
            pass
        try:
            os.kill(pid, signal.SIGHUP)
        except OSError:
            pass
        try:
            os.waitpid(pid, os.WNOHANG)
        except OSError:
            pass
        try:
            await ws.close()
        except Exception:
            pass

    def on_pty_readable():
        try:
            data = os.read(fd, 4096)
        except (BlockingIOError, InterruptedError):
            return
        except OSError:
            data = b""
        if not data:                           # PTY EOF — login/shell exited
            asyncio.ensure_future(shutdown())
            return
        asyncio.ensure_future(_safe_send(ws, data, shutdown))

    loop.add_reader(fd, on_pty_readable)

    try:
        async for msg in ws:
            if isinstance(msg, str):           # TEXT = control (resize)
                try:
                    ev = json.loads(msg)
                except ValueError:
                    continue
                if ev.get("type") == "resize":
                    set_winsize(fd, max(0, min(int(ev.get("rows", 24)), 65535)),
                                    max(0, min(int(ev.get("cols", 80)), 65535)))
                continue
            try:
                os.write(fd, msg)              # BINARY = keystrokes
            except OSError:
                break
    except Exception:
        pass
    finally:
        await shutdown()


async def _safe_send(ws, data, shutdown):
    try:
        await ws.send(data)
    except Exception:
        await shutdown()


async def main():
    async with websockets.serve(handle, LISTEN_HOST, LISTEN_PORT, ping_interval=30):
        print(f"shell PTY bridge on {LISTEN_HOST}:{LISTEN_PORT}  tokens={TOKEN_DIR}",
              file=sys.stderr, flush=True)
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
