"""HTTP reliability: robots.txt, pacing, retries, structured failure logs."""

from __future__ import annotations

from app.reliability.fetch import FetchResult, ReliableFetcher, fetch_url

__all__ = ["FetchResult", "ReliableFetcher", "fetch_url"]
