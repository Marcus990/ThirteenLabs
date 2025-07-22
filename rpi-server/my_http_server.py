from http.server import HTTPServer, BaseHTTPRequestHandler

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"""
                <html>
                <body>
                    <h1>Image from Raspberry Pi</h1>
                    <img src="/image" alt="Raspberry Pi Image"/>
                </body>
                </html>
            """)
        elif self.path == '/image':
            try:
                with open('screenshot.bmp', 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-type', 'image/jpeg')
                    self.end_headers()
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Image not found")
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 - Not Found")

if __name__ == "__main__":
    PORT = 8081
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, SimpleHandler)
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
