import os
from urllib.parse import urlencode

from flask import Flask, jsonify, redirect, request
import requests

CORE_AUTH_BASE_URL = os.environ.get("CORE_AUTH_BASE_URL", "http://localhost:3000")
PORT = int(os.environ.get("PORT", "5000"))

app = Flask(__name__)


@app.route("/login")
def login():
    params = {
        "redirectUrl": f"http://localhost:{PORT}/callback",
        "postbackUrl": f"http://localhost:{PORT}/postback",
        "state": "demo-state",
    }
    return redirect(f"{CORE_AUTH_BASE_URL}/authenticate?{urlencode(params)}")


@app.post("/postback")
def postback():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token")
    state = payload.get("state")
    print("postback received", {"state": state})

    if not token:
        return (jsonify({"message": "token missing"}), 400)

    verify_res = requests.post(
        f"{CORE_AUTH_BASE_URL}/verify",
        json={"token": token},
        timeout=5,
    )
    print("verification result (postback):", verify_res.json())
    return ("", 204)


@app.route("/callback")
def callback():
    token = request.args.get("token")
    state = request.args.get("state")
    if not token:
        return ("token missing", 400)

    verify_res = requests.post(
        f"{CORE_AUTH_BASE_URL}/verify",
        json={"token": token},
        timeout=5,
    )
    return jsonify({"via": "callback", "state": state, "verification": verify_res.json()})


if __name__ == "__main__":
    app.run(port=PORT)
