from __future__ import annotations

import os

bind = os.getenv("GUNICORN_BIND", "127.0.0.1:8765")
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
worker_class = "uvicorn.workers.UvicornWorker"
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
