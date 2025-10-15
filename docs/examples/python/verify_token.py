import os
import requests

CORE_AUTH_BASE_URL = os.environ.get("CORE_AUTH_BASE_URL", "http://localhost:3000")


def verify_token(token: str) -> dict:
    res = requests.post(
        f"{CORE_AUTH_BASE_URL}/verify",
        json={"token": token},
        timeout=5,
    )
    res.raise_for_status()
    return res.json()
