"""Per-host request spacing (domain sleep timer)."""

from __future__ import annotations

import threading
import time
from collections.abc import Mapping
from urllib.parse import urlparse


class DomainPacer:
    """
    Ensures at least `min_interval_sec` between requests to the same host,
    and at least `crawl_delay_sec` when provided by robots.txt (whichever is larger).
    """

    def __init__(self, *, default_min_interval_sec: float = 1.0) -> None:
        self._default_min = default_min_interval_sec
        self._lock = threading.Lock()
        self._last_request_at: dict[str, float] = {}

    def wait_before_request(self, url: str, crawl_delay_sec: float | None) -> None:
        host = urlparse(url).netloc.lower()
        if not host:
            return

        min_gap = max(self._default_min, crawl_delay_sec or 0.0)
        with self._lock:
            now = time.monotonic()
            last = self._last_request_at.get(host, 0.0)
            elapsed = now - last
            sleep_for = max(0.0, min_gap - elapsed)
            if sleep_for > 0:
                time.sleep(sleep_for)
            self._last_request_at[host] = time.monotonic()


def merge_crawl_delays(
    host: str,
    *,
    global_delay: float | None,
    per_host: Mapping[str, float] | None,
) -> float | None:
    extras = per_host or {}
    host_l = host.lower()
    host_specific = extras.get(host_l)
    candidates = [d for d in (global_delay, host_specific) if d is not None and d > 0]
    if not candidates:
        return None
    return max(candidates)
