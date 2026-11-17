"""Dependency-free static preview with the same route fallback as Vercel."""
import http.server, os, pathlib, argparse
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'dist'
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        path = self.path.split('?')[0]
        if not (ROOT / path.lstrip('/')).is_file() and not path.startswith('/assets/'):
            self.path = '/index.html'
        super().do_GET()
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '3000')))
parser.add_argument('--host', default='0.0.0.0')
parser.add_argument('--strictPort', action='store_true')
args = parser.parse_args()
http.server.ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
