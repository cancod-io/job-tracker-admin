"""HTTP GET with tenacity retries, pacing, and structured failure logging."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx
from loguru import logger
from tenacity import RetryCallState, retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.reliability.config import settings
from app.reliability.pacing import DomainPacer, merge_crawl_delays
from app.reliability.robots import robots_cache


def _retryable_http_error(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TransportError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        return code == 429 or 500 <= code < 600
    return False


def _log_retry(retry_state: RetryCallState, url: str) -> None:
    if not retry_state.outcome or not retry_state.outcome.failed:
        return
    exc = retry_state.outcome.exception()
    attempt = retry_state.attempt_number
    code = "transport_error"
    status: int | None = None
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        code = f"http_{status}"
    elif isinstance(exc, httpx.TimeoutException):
        code = "timeout"
    elif isinstance(exc, httpx.TransportError):
        code = "transport_error"
    logger.warning(
        "scrape_http_retry | attempt={} | max_attempts={} | error_code={} | status={} | url={} | exc={!r}",
        attempt,
        settings.max_retries,
        code,
        status,
        url,
        exc,
    )


@dataclass
class FetchResult:
    response: httpx.Response | None
    error_code: str | None
    attempts: int


class ReliableFetcher:
    """
    Per-domain pacing + robots crawl-delay + exponential backoff on 429/5xx and transport errors.

    Uses `tenacity` with `stop_after_attempt(max_retries)` (default **3** attempts).
    """

    def __init__(
        self,
        *,
        client: httpx.Client | None = None,
        pacer: DomainPacer | None = None,
        extra_crawl_delay_by_host: Mapping[str, float] | None = None,
        global_crawl_delay_sec: float | None = None,
    ) -> None:
        self._owns_client = client is None
        self._client = client or httpx.Client(
            timeout=settings.request_timeout_sec,
            follow_redirects=True,
            headers={"User-Agent": settings.user_agent},
        )
        self._pacer = pacer or DomainPacer(
            default_min_interval_sec=settings.default_min_interval_sec,
        )
        self._extra_delays = dict(extra_crawl_delay_by_host or {})
        self._global_crawl = global_crawl_delay_sec

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> ReliableFetcher:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def _effective_crawl_delay(self, url: str) -> float | None:
        host = urlparse(url).netloc.lower()
        robots_delay = robots_cache.get_crawl_delay_sec(url, user_agent=settings.user_agent)
        configured = merge_crawl_delays(
            host,
            global_delay=self._global_crawl,
            per_host=self._extra_delays,
        )
        candidates = [d for d in (robots_delay, configured) if d is not None and d > 0]
        if not candidates:
            return None
        return max(candidates)

    def get(
        self,
        url: str,
        *,
        headers: Mapping[str, str] | None = None,
    ) -> FetchResult:
        crawl = self._effective_crawl_delay(url)
        self._pacer.wait_before_request(url, crawl)

        attempt_counter: dict[str, int] = {"n": 0}

        def _before_sleep(state: RetryCallState) -> None:
            _log_retry(state, url)

        @retry(
            stop=stop_after_attempt(settings.max_retries),
            wait=wait_exponential(
                multiplier=settings.backoff_multiplier,
                min=settings.backoff_min_sec,
                max=settings.backoff_max_sec,
            ),
            retry=retry_if_exception(_retryable_http_error),
            before_sleep=_before_sleep,
            reraise=True,
        )
        def _do_get() -> httpx.Response:
            attempt_counter["n"] += 1
            merged = {**dict(headers or {}), "User-Agent": settings.user_agent}
            r = self._client.get(url, headers=merged)
            if r.status_code == 429 or 500 <= r.status_code < 600:
                r.raise_for_status()
            return r

        try:
            resp = _do_get()
            return FetchResult(
                response=resp,
                error_code=None,
                attempts=attempt_counter["n"],
            )
        except httpx.HTTPStatusError as exc:
            code = f"http_{exc.response.status_code}"
            logger.error(
                "scrape_http_failed | error_code={} | status={} | attempts={} | url={}",
                code,
                exc.response.status_code,
                attempt_counter["n"],
                url,
            )
            return FetchResult(
                response=exc.response, error_code=code, attempts=attempt_counter["n"]
            )
        except httpx.HTTPError as exc:
            logger.error(
                "scrape_http_failed | error_code=transport_error | attempts={} | url={} | exc={!r}",
                attempt_counter["n"],
                url,
                exc,
            )
            return FetchResult(
                response=None, error_code="transport_error", attempts=attempt_counter["n"]
            )


def fetch_url(url: str, **kwargs: Any) -> FetchResult:
    """Convenience one-shot GET."""
    with ReliableFetcher(**kwargs) as f:
        return f.get(url)
