from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "0.0.0.0"
PORT = 8000


class AppHandler(SimpleHTTPRequestHandler):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, directory=Path(__file__).parent, **kwargs)


if __name__ == "__main__":
	server = ThreadingHTTPServer((HOST, PORT), AppHandler)
	print(f"Festkasse läuft unter http://localhost:{PORT}")
	print("Auf einem anderen Gerät die lokale IP dieses Computers im gleichen WLAN öffnen.")
	try:
		server.serve_forever()
	except KeyboardInterrupt:
		print("\nServer beendet.")
	finally:
		server.server_close()
print('habedeehre_gleinumoi')