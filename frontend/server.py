"""
Simple HTTP Server for MyShowz Frontend
Serves static files on port 3000
"""

import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        # Handle root path
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 70)
        print("🎬 MyShowz Frontend Server Starting...")
        print("=" * 70)
        print(f"🌐 Frontend: http://localhost:{PORT}")
        print(f"   ├─ Home:        http://localhost:{PORT}/")
        print(f"   ├─ Sign In:     http://localhost:{PORT}/sign_in.html")
        print(f"   ├─ Movies:      http://localhost:{PORT}/movies.html")
        print(f"   ├─ About:       http://localhost:{PORT}/about.html")
        print(f"   ├─ Contact:     http://localhost:{PORT}/Contact_Us.html")
        print(f"   └─ Booking:     http://localhost:{PORT}/ticket-booking.html")
        print(f"")
        print(f"🔧 Backend API: http://localhost:5000/api")
        print("=" * 70)
        print(f"✨ Serving files from: {DIRECTORY}")
        print(f"✨ Press Ctrl+C to stop the server")
        print("=" * 70)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            sys.exit(0)
