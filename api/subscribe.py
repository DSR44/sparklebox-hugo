"""
Subscribe endpoint for Sparklebox
Handles email subscriptions via Resend API
"""

import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
AUDIENCE_ID = os.environ.get("RESEND_AUDIENCE_ID", "")

WELCOME_HTML = """
<div style="font-family: 'Cormorant Garamond', Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0118;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a0a2e 0%, #0f0520 100%); padding: 48px 24px; text-align: center; border-bottom: 2px solid rgba(192,132,252,0.3);">
        <h1 style="font-family: 'Cinzel', serif; font-size: 28px; margin: 0; letter-spacing: 3px; background: linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #f9a8d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SPARKLEBOX</h1>
        <p style="color: rgba(196,181,253,0.7); font-size: 14px; margin: 12px 0 0 0; letter-spacing: 2px; font-style: italic;">perception is creation</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 24px;">
        <p style="font-size: 20px; color: #f1f5f9; margin-bottom: 20px; font-style: italic;">Welcome, beautiful soul.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 16px;">Thank you for joining the Sparklebox Sanctuary. Here, we explore how perception shapes reality — one mindful moment at a time.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 16px;">You will receive whispers of wonder when new content arrives. No noise. No algorithms. Just magic.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 24px;">If you ever wish to leave the sanctuary, simply reply "unsubscribe" and the doors will gently close.</p>
        <p style="font-size: 18px; background: linear-gradient(135deg, #c084fc, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: italic;">With love and light,<br>Elle Vida</p>
    </div>
    
    <!-- Footer -->
    <div style="background: rgba(15,5,30,0.8); padding: 24px; text-align: center; border-top: 1px solid rgba(192,132,252,0.15);">
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;"><a href="https://sparklebox.blog" style="color: #c084fc; text-decoration: none;">sparklebox.blog</a> | Perception is Creation</p>
    </div>
</div>
"""

def send_welcome_email(email):
    cmd = [
        "curl", "-s", "-X", "POST", "https://api.resend.com/emails",
        "-H", f"Authorization: Bearer {RESEND_API_KEY}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({
            "from": "Elle Vida <Elle_Vida@sparklebox.blog>",
            "reply_to": "Elle_Vida@sparklebox.blog",
            "to": email,
            "subject": "Welcome to the Sparklebox Sanctuary",
            "html": WELCOME_HTML
        })
    ]
    subprocess.run(cmd, capture_output=True, text=True, timeout=30)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body)
            email = data.get("email", "").strip()
            
            if not email or "@" not in email:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid email"}).encode())
                return
            
            cmd = [
                "curl", "-s", "-X", "POST", "https://api.resend.com/contacts",
                "-H", f"Authorization: Bearer {RESEND_API_KEY}",
                "-H", "Content-Type: application/json",
                "-d", json.dumps({
                    "email": email,
                    "audience_id": AUDIENCE_ID,
                    "unsubscribed": False
                })
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            response = json.loads(result.stdout) if result.returncode == 0 else {}
            
            if response.get("id") or response.get("error") == "Contact already exists":
                send_welcome_email(email)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "subscribed", "email": email}).encode())
            else:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": response.get("error", "Unknown error")}).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
