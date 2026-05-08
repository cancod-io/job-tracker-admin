"""Tests for HTTP reliability (retries, pacing, error codes)."""

from __future__ import annotations

from unittest.mock import patch

import httpx
import pytest

from app.reliability.fetch import ReliableFetcher
from app.reliability.pacing import DomainPacer


@pytest.fixture
def no_robots_delay() -> object:
    with patch(
        "app.reliability.fetch.robots_cache.get_crawl_delay_sec",
        return_value=None,
    ):
        yield


def test_exponential_retry_then_success(no_robots_delay: object) -> None:
    calls: list[int] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(1)
        if len(calls) < 3:
            return httpx.Response(429)
        return httpx.Response(200, text="ok")

    transport = httpx.MockTransport(handler)
    with httpx.Client(transport=transport) as client:
        pacer = DomainPacer(default_min_interval_sec=0.0)
        with ReliableFetcher(client=client, pacer=pacer) as fetcher:
            result = fetcher.get("https://example.com/page")

    assert result.error_code is None
    assert result.response is not None
    assert result.response.status_code == 200
    assert result.attempts == 3
    assert len(calls) == 3


def test_max_retries_returns_error_code(no_robots_delay: object) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="unavailable")

    transport = httpx.MockTransport(handler)
    with httpx.Client(transport=transport) as client:
        pacer = DomainPacer(default_min_interval_sec=0.0)
        with ReliableFetcher(client=client, pacer=pacer) as fetcher:
            result = fetcher.get("https://retry.example/page")

    assert result.response is not None
    assert result.response.status_code == 503
    assert result.error_code == "http_503"
    assert result.attempts == 3


def test_domain_pacer_sleeps_between_calls(no_robots_delay: object) -> None:
    sleeps: list[float] = []

    def fake_sleep(sec: float) -> None:
        sleeps.append(sec)

    call_count = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        call_count["n"] += 1
        return httpx.Response(200)

    transport = httpx.MockTransport(handler)
    with (
        patch("app.reliability.pacing.time.sleep", side_effect=fake_sleep),
        httpx.Client(transport=transport) as client,
    ):
        pacer = DomainPacer(default_min_interval_sec=2.0)
        with ReliableFetcher(client=client, pacer=pacer) as fetcher:
            fetcher.get("https://pacing.example/a")
            fetcher.get("https://pacing.example/b")

    assert call_count["n"] == 2
    assert len(sleeps) >= 1
    assert all(s >= 0 for s in sleeps)
