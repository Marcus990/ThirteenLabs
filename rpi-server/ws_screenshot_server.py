#!/usr/bin/env python3
"""
Streams QNX screenshots over a WebSocket at ~15 fps, using only std-lib.
Each frame = base64-encoded BMP produced by the `screenshot` command.
"""
import base64, subprocess, time, threading, os
from websocket_server import WebsocketServer   # <-- the tiny lib you already have

HOST, PORT      = "0.0.0.0", 8080   # listen on all interfaces
TARGET_FPS      = 15
SHOT_FILE       = "screenshot.bmp"
SHOT_CMD        = ["screenshot"]     # add flags if you need them

def grab_and_broadcast(server: WebsocketServer):
    period = 1.0 / TARGET_FPS
    while True:
        t0 = time.perf_counter()

        # 1. take a fresh screenshot
        if subprocess.run(SHOT_CMD, stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).returncode:
            time.sleep(period); continue  # failed → skip this frame

        # 2. read + b64-encode
        try:
            with open(SHOT_FILE, "rb") as fp:
                payload = base64.b64encode(fp.read()).decode("ascii")
        except FileNotFoundError:
            time.sleep(period); continue  # file vanished? skip

        # 3. broadcast
        if server.clients:
            server.send_message_to_all(payload)

        # 4. keep ~15 fps
        time.sleep(max(0, period - (time.perf_counter() - t0)))

def main():
    ws = WebsocketServer(host=HOST, port=PORT, loglevel=3)
    ws.run_forever(threaded=True)  # listener → background thread
    print(f"★ streaming on ws://{HOST}:{PORT}/  – press Ctrl-C to quit")
    try:
        grab_and_broadcast(ws)     # frame producer on main thread
    except KeyboardInterrupt:
        ws.shutdown_gracefully()

if __name__ == "__main__":
    main()
