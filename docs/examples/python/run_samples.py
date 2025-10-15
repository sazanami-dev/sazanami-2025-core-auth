import os
import sys

from fetch_jwks import fetch_jwks
from verify_token import verify_token


def main() -> None:
    try:
        jwks = fetch_jwks()
        print("Fetched JWKS:", jwks)
    except Exception as exc:
        print("Failed to fetch JWKS:", exc)
        sys.exit(1)

    token = None
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = os.environ.get("CORE_AUTH_SAMPLE_TOKEN")

    if not token:
        print("No token provided. Pass one as an argument or set CORE_AUTH_SAMPLE_TOKEN.")
        return

    try:
        verification = verify_token(token)
        print("Verification response:", verification)
    except Exception as exc:
        print("Failed to verify token:", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
