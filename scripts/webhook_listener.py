#!/usr/bin/env python3
"""Minimal deploy webhook listener for the admin app."""
from __future__ import annotations

import hmac
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPO_DIR = os.environ.get("REPO_DIR", "/opt/job-tracker-admin")
DEPLOY_TOKEN = os.environ.get("DEPLOY_TOKEN", "")
PORT = int(os.environ.get("WEBHOOK_PORT", "8084"))
LOG_FILE = os.environ.get("DEPLOY_LOG", "/var/log/jobtracker-admin-deploy.log")

_deploy_lock = threading.Lock()


def run_deploy() -> None:
    if not _deploy_lock.acquire(blocking=False):
        return

    try:
        with open(LOG_FILE, "a") as log:
            subprocess.run(
                ["bash", os.path.join(REPO_DIR, "scripts", "deploy.sh")],
                cwd=REPO_DIR,
                stdout=log,
                stderr=subprocess.STDOUT,
                check=False,
            )
    finally:
        _deploy_lock.release()


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") != "/deploy":
            self.send_response(404)
            self.end_headers()
            return

        token = self.headers.get("X-Deploy-Token", "")
        if not DEPLOY_TOKEN or not hmac.compare_digest(token, DEPLOY_TOKEN):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"unauthorized\n")
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length:
            self.rfile.read(length)

        threading.Thread(target=run_deploy, daemon=True).start()
        self.send_response(202)
        self.end_headers()
        self.wfile.write(b"deploy triggered\n")

    def log_message(self, *args: object) -> None:
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
