import http.server
import socketserver
import os

PORT = 8000
HOST = "127.0.0.1"

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = http.server.SimpleHTTPRequestHandler

    with socketserver.TCPServer((HOST, PORT), handler) as httpd:
        print(f"Serving HTTP on {HOST} port {PORT} (http://{HOST}:{PORT}/) …")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")
            httpd.shutdown()
