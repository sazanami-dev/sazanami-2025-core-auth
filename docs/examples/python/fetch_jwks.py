import os
import requests

CORE_AUTH_BASE_URL = os.environ.get("CORE_AUTH_BASE_URL", "http://localhost:3000")


def fetch_jwks() -> dict:
    res = requests.get(
        f"{CORE_AUTH_BASE_URL}/.well-known/jwks.json",
        timeout=5,
    )
    res.raise_for_status()
    return res.json()
