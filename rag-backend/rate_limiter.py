import time
import logging
from typing import Dict, List, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp

logger = logging.getLogger("rate_limiter")
logger.setLevel(logging.INFO)

class RateLimiter:
    """
    Enterprise-Grade Multi-Tier Rate Limiting Engine.
    
    Provides:
    1. Global sliding-window rate limiting for all API endpoints.
    2. Strict failed-attempt rate limiting for authentication/login endpoints
       (Max 5 failed attempts per 15 minutes per client IP).
    3. Thread-safe in-memory sliding window timestamp tracking with automatic cleanup.
    4. Standard RFC rate-limiting headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After).
    """

    def __init__(
        self,
        global_limit: int = 120,
        global_window_seconds: int = 60,
        auth_failed_limit: int = 5,
        auth_window_seconds: int = 900  # 15 minutes
    ):
        self.global_limit = global_limit
        self.global_window_seconds = global_window_seconds
        self.auth_failed_limit = auth_failed_limit
        self.auth_window_seconds = auth_window_seconds

        # Storage: { client_ip: [timestamp1, timestamp2, ...] }
        self._global_requests: Dict[str, List[float]] = {}
        # Storage: { client_ip: [failed_timestamp1, failed_timestamp2, ...] }
        self._auth_failed_attempts: Dict[str, List[float]] = {}

        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, current_time: float):
        """Prunes stale timestamps older than max window to avoid memory leaks."""
        if current_time - self._last_cleanup < 60:
            return

        self._last_cleanup = current_time

        # Cleanup global requests
        cutoff_global = current_time - self.global_window_seconds
        keys_to_del_global = []
        for ip, timestamps in self._global_requests.items():
            valid = [t for t in timestamps if t > cutoff_global]
            if valid:
                self._global_requests[ip] = valid
            else:
                keys_to_del_global.append(ip)
        for ip in keys_to_del_global:
            del self._global_requests[ip]

        # Cleanup auth failed attempts
        cutoff_auth = current_time - self.auth_window_seconds
        keys_to_del_auth = []
        for ip, timestamps in self._auth_failed_attempts.items():
            valid = [t for t in timestamps if t > cutoff_auth]
            if valid:
                self._auth_failed_attempts[ip] = valid
            else:
                keys_to_del_auth.append(ip)
        for ip in keys_to_del_auth:
            del self._auth_failed_attempts[ip]

    def get_client_ip(self, request: Request) -> str:
        """Extracts client IP considering standard reverse-proxy headers."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the comma-separated list
            client_ip = forwarded_for.split(",")[0].strip()
            if client_ip:
                return client_ip

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        if request.client and request.client.host:
            return request.client.host

        return "127.0.0.1"

    def is_auth_endpoint(self, path: str) -> bool:
        """Checks if the request target is an authentication/login endpoint."""
        normalized_path = path.rstrip("/").lower()
        auth_patterns = [
            "/api/v1/auth/login",
            "/api/v1/auth/login/password",
            "/api/v1/auth/login/otp-request",
            "/api/v1/auth/login/otp-verify",
            "/api/v1/auth/login/phone-otp-request",
            "/api/v1/auth/login/phone-otp-verify",
            "/api/v1/auth/check-identifier",
            "/api/v1/auth/register",
        ]
        return any(normalized_path == pattern or normalized_path.startswith(pattern) for pattern in auth_patterns)

    def check_global_rate_limit(self, client_ip: str) -> Tuple[bool, int, int, int]:
        """
        Validates global request rate limit.
        Returns: (is_allowed, limit, remaining, retry_after)
        """
        now = time.time()
        self._cleanup_old_entries(now)

        cutoff = now - self.global_window_seconds
        raw_timestamps = self._global_requests.get(client_ip, [])
        timestamps = [t for t in raw_timestamps if t > cutoff]

        if len(timestamps) >= self.global_limit:
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.global_window_seconds - now))
            reset_time = int(oldest + self.global_window_seconds)
            return False, self.global_limit, 0, retry_after

        # Record this request
        timestamps.append(now)
        self._global_requests[client_ip] = timestamps
        remaining = max(0, self.global_limit - len(timestamps))
        reset_time = int(now + self.global_window_seconds)
        return True, self.global_limit, remaining, reset_time

    def check_auth_rate_limit(self, client_ip: str) -> Tuple[bool, int, int, int]:
        """
        Validates login/auth rate limit (max 5 failed attempts per 15 mins).
        Returns: (is_allowed, limit, remaining, retry_after)
        """
        now = time.time()
        self._cleanup_old_entries(now)

        cutoff = now - self.auth_window_seconds
        raw_attempts = self._auth_failed_attempts.get(client_ip, [])
        failed_attempts = [t for t in raw_attempts if t > cutoff]

        if failed_attempts:
            self._auth_failed_attempts[client_ip] = failed_attempts
        elif client_ip in self._auth_failed_attempts:
            del self._auth_failed_attempts[client_ip]

        if len(failed_attempts) >= self.auth_failed_limit:
            oldest = failed_attempts[0]
            retry_after = max(1, int(oldest + self.auth_window_seconds - now))
            return False, self.auth_failed_limit, 0, retry_after

        remaining = max(0, self.auth_failed_limit - len(failed_attempts))
        reset_time = int(now + self.auth_window_seconds)
        return True, self.auth_failed_limit, remaining, reset_time

    def record_failed_auth(self, client_ip: str):
        """Records a failed authentication attempt timestamp."""
        now = time.time()
        cutoff = now - self.auth_window_seconds
        attempts = self._auth_failed_attempts.setdefault(client_ip, [])
        attempts = [t for t in attempts if t > cutoff]
        attempts.append(now)
        self._auth_failed_attempts[client_ip] = attempts
        logger.warning(f"Recorded failed auth attempt for IP {client_ip}. Total in 15m window: {len(attempts)}")

    def record_successful_auth(self, client_ip: str):
        """Resets failed auth attempts upon successful authentication."""
        if client_ip in self._auth_failed_attempts:
            del self._auth_failed_attempts[client_ip]
            logger.info(f"Cleared failed auth attempts for IP {client_ip} following successful login.")


# Global singleton instance
rate_limiter = RateLimiter(
    global_limit=120,          # 120 requests / minute for general browsing & API endpoints
    global_window_seconds=60,
    auth_failed_limit=5,       # 5 failed attempts
    auth_window_seconds=900    # 15 minutes
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette Middleware enforcing multi-tier rate limits across all routes.
    """

    def __init__(self, app: ASGIApp, limiter: Optional[RateLimiter] = None):
        super().__init__(app)
        self.limiter = limiter or rate_limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = self.limiter.get_client_ip(request)
        path = request.url.path
        is_auth = self.limiter.is_auth_endpoint(path) and request.method == "POST"

        try:
            # 1. Check Global Rate Limit
            is_global_ok, g_limit, g_remaining, g_retry_after = self.limiter.check_global_rate_limit(client_ip)
            if not is_global_ok:
                logger.warning(f"Global rate limit exceeded for IP: {client_ip} on path: {path}")
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please slow down and try again later."},
                    headers={
                        "Retry-After": str(g_retry_after),
                        "RateLimit-Limit": str(g_limit),
                        "RateLimit-Remaining": "0",
                        "RateLimit-Reset": str(int(time.time() + g_retry_after)),
                    }
                )

            # 2. Check Auth-Specific Rate Limit for Login/Auth endpoints (Max 5 failed attempts / 15m)
            if is_auth:
                is_auth_ok, a_limit, a_remaining, a_retry_after = self.limiter.check_auth_rate_limit(client_ip)
                if not is_auth_ok:
                    logger.warning(f"Auth rate limit exceeded (5 failed attempts in 15m) for IP: {client_ip} on {path}")
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many login attempts. Please try again later."},
                        headers={
                            "Retry-After": str(a_retry_after),
                            "RateLimit-Limit": str(a_limit),
                            "RateLimit-Remaining": "0",
                            "RateLimit-Reset": str(int(time.time() + a_retry_after)),
                        }
                    )

            # 3. Process Request
            response = await call_next(request)

            # 4. Auth Result Tracking & Dynamic Header Computation
            if is_auth:
                if response.status_code in (400, 401, 403, 422):
                    # Failed authentication attempt (wrong password, bad OTP, invalid credentials)
                    self.limiter.record_failed_auth(client_ip)
                elif response.status_code == 200:
                    # Successful login - clear failed attempts counter
                    self.limiter.record_successful_auth(client_ip)

                # Re-calculate remaining auth attempts for accurate header
                _, a_limit, a_rem, a_reset = self.limiter.check_auth_rate_limit(client_ip)
                response.headers["RateLimit-Limit"] = str(a_limit)
                response.headers["RateLimit-Remaining"] = str(a_rem)
                response.headers["RateLimit-Reset"] = str(a_reset)
            else:
                # Global rate-limiting headers
                response.headers["RateLimit-Limit"] = str(g_limit)
                response.headers["RateLimit-Remaining"] = str(g_remaining)
                response.headers["RateLimit-Reset"] = str(g_retry_after)

            return response

        except Exception as e:
            # High-availability safety: Fail open and log error instead of crashing API
            logger.error(f"Rate limiting middleware error: {str(e)}", exc_info=True)
            return await call_next(request)
