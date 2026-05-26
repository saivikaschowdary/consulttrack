#!/usr/bin/env python3
"""
ConsultTrack Local Server with GitHub Auto-Update
Run: python3 server.py
Open: http://localhost:3000
Update: python3 server.py --update
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import subprocess
import json
import urllib.request
import shutil
from datetime import datetime

PORT = 3000
HOST = "localhost"
GITHUB_REPO = ""          # Set this after you create your GitHub repo
# Example: GITHUB_REPO = "yourusername/consulttrack"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────
# GitHub Update Functions
# ─────────────────────────────────────────

def has_git():
    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
        return True
    except Exception:
        return False

def is_git_repo():
    return os.path.exists(os.path.join(SCRIPT_DIR, ".git"))

def get_current_commit():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=SCRIPT_DIR, check=True
        )
        return result.stdout.strip()
    except Exception:
        return "unknown"

def get_remote_commit():
    """Check GitHub for the latest commit hash without pulling"""
    if not GITHUB_REPO:
        return None
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/commits/main"
        req = urllib.request.Request(url, headers={"User-Agent": "ConsultTrack"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data["sha"][:7]
    except Exception:
        return None

def git_pull():
    """Pull latest from GitHub"""
    try:
        result = subprocess.run(
            ["git", "pull", "origin", "main"],
            capture_output=True, text=True, cwd=SCRIPT_DIR
        )
        return result.returncode == 0, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)

def backup_html():
    """Back up current index.html before update"""
    src = os.path.join(SCRIPT_DIR, "index.html")
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dst = os.path.join(SCRIPT_DIR, f"index.backup.{ts}.html")
    if os.path.exists(src):
        shutil.copy2(src, dst)
        return dst
    return None

def check_for_updates():
    """Check if a newer version is available on GitHub"""
    if not is_git_repo() or not GITHUB_REPO:
        return False, None
    current = get_current_commit()
    remote = get_remote_commit()
    if remote and remote != current:
        return True, remote
    return False, None

# ─────────────────────────────────────────
# HTTP Handler with update endpoint
# ─────────────────────────────────────────

class ConsultTrackHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Special endpoint: /api/check-update
        if self.path == "/api/check-update":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            has_update, remote = check_for_updates()
            current = get_current_commit() if is_git_repo() else "n/a"
            resp = json.dumps({
                "hasUpdate": has_update,
                "currentCommit": current,
                "latestCommit": remote,
                "repo": GITHUB_REPO or "not configured",
                "isGitRepo": is_git_repo()
            })
            self.wfile.write(resp.encode())
            return

        # Special endpoint: /api/update
        if self.path == "/api/update":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            if not is_git_repo():
                self.wfile.write(json.dumps({"success": False, "message": "Not a git repository"}).encode())
                return
            backup = backup_html()
            success, output = git_pull()
            resp = json.dumps({
                "success": success,
                "message": output.strip(),
                "backup": backup
            })
            self.wfile.write(resp.encode())
            return

        # Normal file serving
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format, *args):
        if "/api/" in (args[0] if args else ""):
            print(f"  [API] {args[0]}")
        else:
            print(f"  → {format % args}")

# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

def main():
    os.chdir(SCRIPT_DIR)

    # --update flag: pull and exit
    if "--update" in sys.argv:
        print("\n  Checking for updates...")
        if not is_git_repo():
            print("  ✗ Not a git repository. Run: git init && git remote add origin <url>")
            sys.exit(1)
        backup = backup_html()
        if backup:
            print(f"  ✓ Backup saved: {os.path.basename(backup)}")
        success, output = git_pull()
        if success:
            print(f"  ✓ Updated successfully!\n  {output.strip()}")
        else:
            print(f"  ✗ Update failed:\n  {output.strip()}")
        sys.exit(0 if success else 1)

    # Startup banner
    print("=" * 52)
    print("  ConsultTrack  —  Local Server")
    print("=" * 52)

    commit = get_current_commit() if is_git_repo() else "standalone"
    print(f"\n  Version:     {commit}")
    print(f"  GitHub Repo: {GITHUB_REPO or 'not configured (edit server.py)'}")

    # Check for updates on startup (non-blocking)
    if is_git_repo() and GITHUB_REPO:
        print("\n  Checking GitHub for updates...", end=" ", flush=True)
        has_update, remote = check_for_updates()
        if has_update:
            print(f"⚡ Update available! (→ {remote})")
            print(f"  Run: python3 server.py --update")
        else:
            print("✓ Up to date")

    print(f"\n  HR Dashboard:     http://{HOST}:{PORT}")
    print(f"  Employee Portal:  http://{HOST}:{PORT}/#portal")
    print(f"\n  Update command:   python3 server.py --update")
    print(f"\n  Ctrl+C to stop")
    print("=" * 52 + "\n")

    webbrowser.open(f"http://{HOST}:{PORT}")

    with socketserver.TCPServer((HOST, PORT), ConsultTrackHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n  Server stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
