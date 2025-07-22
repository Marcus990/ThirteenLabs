#!/usr/bin/env python3
import io, os, time, threading
from http import server

BOUNDARY = b'frame'
FRAME_LEN = 4608*2592*2          # adjust if you pick a lower resolution
DEV = "/dev/sensor/data1"

SKIP = 3

class MJPEGHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/':
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type',
                         'multipart/x-mixed-replace; boundary=%s' %
                         BOUNDARY.decode())
        self.end_headers()

        count = 0

        with open(DEV, 'rb', buffering=0) as cam:
            while True:
                raw = cam.read(FRAME_LEN)

                count = (count + 1) % SKIP
                if count: 
                    continue

                if len(raw) != FRAME_LEN:
                    continue
                # quick & dirty: downscale and JPEG-encode
                import rawpy, cv2, numpy as np
                rgb_full = rawpy.imread(raw, raw_len=FRAME_LEN).postprocess()
                rgb = cv2.resize(rgb_full, (0, 0), fx=0.33, fy=0.33, interpolation=cv2.INTER_AREA)
                ok, jpeg = cv2.imencode('.jpg', rgb, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
                if not ok:
                    continue
                self.wfile.write(b'--' + BOUNDARY + b'\r\n')
                self.wfile.write(b'Content-Type: image/jpeg\r\n')
                self.wfile.write(b'Content-Length: %d\r\n\r\n' % len(jpeg))
                self.wfile.write(jpeg.tobytes() + b'\r\n')

def run_server(port=8080):
    server_address = ('', port)
    httpd = server.HTTPServer(server_address, MJPEGHandler)
    print(f"MJPEG stream ready at http://qnxpi-andrew:{port}/")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
