"""Fetch and parse robots.txt for Crawl-delay (per RFC de-facto User-Agent line)."""

from __future__ import annotations

import threading
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx

from app.reliability.config import settings


class RobotsCache:
    """Thread-safe cache of RobotFileParser per origin (scheme://netloc)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._parsers: dict[str, RobotFileParser] = {}

    def get_crawl_delay_sec(self, url: str, *, user_agent: str | None = None) -> float | None:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return None
        origin = f"{parsed.scheme}://{parsed.netloc}"
        ua = user_agent or settings.user_agent

        with self._lock:
            rp = self._parsers.get(origin)
            if rp is None:
                rp = RobotFileParser()
                robots_url = urljoin(origin + "/", "robots.txt")
                try:
                    with httpx.Client(timeout=settings.request_timeout_sec) as client:
                        r = client.get(robots_url, headers={"User-Agent": ua})
                        if r.status_code == 200:
                            rp.parse(r.text.splitlines())
                        else:
                            rp.parse([])  # allow all if missing / error
                except httpx.HTTPError:
                    rp.parse([])
                self._parsers[origin] = rp

        delay = rp.crawl_delay(ua)
        if delay is not None:
            return float(delay)
        # Some sites only set delay under * user-agent
        fallback = rp.crawl_delay("*")
        return float(fallback) if fallback is not None else None


robots_cache = RobotsCache()
