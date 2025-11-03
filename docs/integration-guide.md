# Core-Auth Integration Guide

このガイドは連携サービスが Core-Auth を利用して利用者を認証し、発行されたトークンを検証するまでの最低限の手順をまとめたものです。ここに記載された API は `/authenticate`、`/verify`、`/.well-known/jwks.json` の 3 つのみです。

## 前提
- Core-Auth のベース URL（例：`http://localhost:3000`）を `CORE_AUTH_BASE_URL` として扱います。
- リダイレクト先やポストバック先は絶対 URL（スキーム付き）で指定してください。
- JavaScript/TypeScript 例では Node.js 18 以降を、Python 例では Python 3.11 以降を想定しています。

## 認証フローの概要
1. 利用者を Core-Auth の `/authenticate` にリダイレクトする。
2. Core-Auth がトークンを発行し、以下のいずれかで連携サービスへ返却する。
   - `postbackUrl` を指定した場合は JSON POST `{ token, state }` を送信し、ブラウザは `redirectUrl` へ戻る。
   - `postbackUrl` が無い場合は `redirectUrl` に `token` と `state` をクエリとして付与してリダイレクトする。
3. 受け取ったトークンを `/verify` に投げるか、`/.well-known/jwks.json` を利用して 独自に検証する。

## エンドポイント詳細

### GET `/authenticate`
- **クエリ**
  - `redirectUrl` (必須): 認証完了後に戻る URL。
  - `postbackUrl` (任意): トークンを受け取る HTTPS エンドポイント。
  - `state` (任意): 往復で維持したい任意文字列。
- **主なレスポンス**
  - `302 Found`: 認証ページまたは `redirectUrl` へのリダイレクト。匿名セッション作成時は `sessionId` Cookie がセットされます。
  - `400 Bad Request`: クエリが不正、またはポストバックが失敗した場合（本文は `{ "message": "..."} `）。

#### Node.js 例（Express）
`redirectUrl` でトークンを受け取る例と、ポストバックを受信して `/verify` に流す例をまとめています。

```ts
// docs/examples/node/auth-flow-example.ts
import express from 'express';

const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';
const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(express.json());

// 認証開始トリガー
app.get('/login', (_req, res) => {
  const url = new URL(`${CORE_AUTH_BASE_URL}/authenticate`);
  url.searchParams.set('redirectUrl', `http://localhost:${PORT}/callback`);
  url.searchParams.set('postbackUrl', `http://localhost:${PORT}/postback`);
  url.searchParams.set('state', 'demo-state');
  res.redirect(url.toString());
});

// postbackUrl で受け取ったトークンを検証
app.post('/postback', async (req, res) => {
  const { token, state } = req.body;
  console.log('postback received', { state });
  const verifyRes = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const result = await verifyRes.json();
  console.log('verification result (postback):', result);
  res.status(204).end();
});

// postback 失敗や未設定時でも最後は redirectUrl でトークンを受け取れる
app.get('/callback', async (req, res) => {
  const { token, state } = req.query;
  if (!token) return res.status(400).send('token missing');

  const verifyRes = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const result = await verifyRes.json();
  res.json({ via: 'callback', state, verification: result });
});

app.listen(PORT, () => console.log(`Demo relying party listening on :${PORT}`));
```

#### Python 例（Flask）
```python
# docs/examples/python/auth_flow_example.py
import os
from urllib.parse import urlencode

import requests
from flask import Flask, redirect, request, jsonify

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
    token = request.json.get("token")
    state = request.json.get("state")
    print("postback received", {"state": state})
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
```

### POST `/verify`
- **ボディ**
  - `token`: Core-Auth から受け取ったトークン。
- **レスポンス**
  - `200 OK`: `{ "valid": true, "payload": { ... } }` または `{ "valid": false }`
  - `400 Bad Request`: `{ "error": "Token is required" }`

#### Node.js での直接検証
```ts
// docs/examples/node/verify-token.ts
const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';

export async function verifyToken(token: string) {
  const res = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(`verify failed: ${res.status}`);
  return res.json();
}
```

#### Python での直接検証
```python
# docs/examples/python/verify_token.py
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
```

### GET `/.well-known/jwks.json`
- 発行されたトークンを連携サービス側で検証する場合に利用します。
- レスポンスは `{"keys":[...]}`。RSA または EC の公開鍵フィールドのみが含まれます。
- キー切り替えが行われる可能性があるため、適宜再取得してください。

#### Node.js での JWKS 取得
```ts
// docs/examples/node/fetch-jwks.ts
const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';

export async function fetchJwks() {
  const res = await fetch(`${CORE_AUTH_BASE_URL}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`);
  return res.json();
}
```

#### Python での JWKS 取得
```python
# docs/examples/python/fetch_jwks.py
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
```

## 動作確認
同梱の `docs/examples/node/run_samples.ts` および `docs/examples/python/run_samples.py` は、上記サンプルのユーティリティを呼び出して JWKS の取得とトークン検証（任意）をまとめて実行するスクリプトです。詳細は後述のスクリプトを参照してください。
