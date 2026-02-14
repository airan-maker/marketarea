"""HTTP 요청 공통 래퍼 — 재시도, 타임아웃, 로깅."""
import time
import httpx
from app.etl.logger import get_etl_logger

logger = get_etl_logger("api_client")


def fetch_json(
    url: str,
    params: dict | None = None,
    max_retries: int = 3,
    timeout: int = 30,
) -> dict | None:
    """GET 요청 후 JSON 파싱. 실패 시 지수 백오프 재시도."""
    for attempt in range(max_retries):
        try:
            resp = httpx.get(url, params=params, timeout=timeout)
            if resp.status_code != 200:
                logger.warning(
                    "HTTP %d from %s (attempt %d/%d)",
                    resp.status_code, url, attempt + 1, max_retries,
                )
                time.sleep(2 ** attempt)
                continue
            return resp.json()
        except (httpx.TimeoutException, httpx.RequestError) as e:
            logger.warning("Request failed: %s (attempt %d/%d)", e, attempt + 1, max_retries)
            time.sleep(2 ** attempt)
        except ValueError:
            logger.error("Invalid JSON response from %s", url)
            return None
    logger.error("All %d attempts failed for %s", max_retries, url)
    return None
