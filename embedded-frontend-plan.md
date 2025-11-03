# 組み込みフロント実装メモ

この文書は core-auth バックエンドに組み込むフロントエンド（初期設定画面や再認証画面などバックエンドと密に連携する UI）の実装方針を整理したものです。

## 想定シナリオとエンドポイント

- `GET /authenticate`  
  認証フローの入口。未認証の場合は匿名セッションを発行し、`redirectUrl` / `postbackUrl` / `state` を PendingRedirect として保存して再認証ページへリダイレクト。認証済みならトークンを発行してリダイレクト、`postbackUrl` があれば POST 通知。
- `GET /initialize`  
  `regCode` からユーザーを特定し、匿名セッションがあれば引き継ぎつつ認証済みセッションを作成。初期設定用トークンを付けて `ACCOUNT_INITIALIZATION_PAGE` へリダイレクト。
- `GET /i` / `PUT /i`  
  セッションに紐づくユーザー情報の取得・更新。`hasPendingRedirect` で未完了のリダイレクト有無を判定できる。
- `POST /verify`  
  トークンの有効性検証。初期設定画面などで付与されたトークンを確認する用途。
- `GET /.well-known/jwks.json`  
  署名鍵の JWK 公開。外部サービスや将来的な診断 UI で利用可能。

## フロントエンドで提供すべき画面

1. **再認証ページ (`REAUTHENTICATION_PAGE`)**  
   匿名セッションから誘導される画面。利用者にログイン・登録コード入力などの手段を提示し、完了時に `/initialize` へ遷移または regCode を連携する。
2. **初期設定ページ (`ACCOUNT_INITIALIZATION_PAGE`)**  
   `/initialize` から `token` クエリを付与して遷移。  
   - ページ初期化時に `POST /verify` でトークン検証 → `/i` でユーザー情報読み込み。  
   - プロフィール編集フォーム（現在は `displayName` のみ）を用意し、`PUT /i` で更新。
3. **保留リダイレクト案内 UI**  
   `/i` の `hasPendingRedirect` が true の場合に、元のサービスに戻る導線（例: 再度 `/authenticate` を叩いてリダイレクトを完了させるボタン）を表示。
4. **エラーハンドリング/ステータス表示**  
   400/401 など `DoResponse` から返るメッセージを表示。再試行や問い合わせ先の案内を含める。
5. **（任意）トークン診断ビュー**  
   `/verify` を使って現在のトークン・セッション状態を確認できる簡易ツール。運用時のトラブルシュートに有用。

## 実装上の注意点

- API 呼び出しは `credentials: 'include'` を指定し、`sessionId` Cookie を常に送信する。
- バックエンドの Zod 制約（例: `displayName` は 1〜100 文字）をフロント検証でも再現して 400 を避ける。
- `redirectUrl` / `postbackUrl` / `state` は PendingRedirect に保持されるため、再認証完了後は `/authenticate` の呼び出しを再試行してリダイレクトを完了させる想定。
- 環境変数 `REAUTHENTICATION_PAGE` / `ACCOUNT_INITIALIZATION_PAGE` を組み込みフロントのホストパスに合わせて設定する。バックエンドと同じリポジトリで提供する場合はビルド成果物を同一ホスティングで公開する構成を検討。
- Swagger UI (`/api-docs`, 非本番のみ) と `docs/` を用いて API 仕様を随時更新すると実装が追いやすい。

以上を前提に、再認証→初期設定→元サービス復帰までの一連の導線をフロント側で構築する。

## ディレクトリ構成と配信方法

### 推奨構成

- `frontend/`  
  React や Vue などで実装する SPA のソースコード。Vite を例にすると、`npm run build` で `frontend/dist` に成果物を出力する。
- `public/`  
  バックエンドが静的配信するディレクトリ。ビルド済みの `frontend/dist` をここへコピー（またはシンボリックリンク）する。
- `src/app.ts`  
  Express に `app.use('/app', express.static(path.join(__dirname, '..', 'public')));` を設定し、`/app/*` で組み込みフロントを配信する。

### リダイレクト先の設定例

- `.env`（本番運用想定）
  ```
  REAUTHENTICATION_PAGE=https://api.example.com/app/reauth
  ACCOUNT_INITIALIZATION_PAGE=https://api.example.com/app/init
  CLIENT_ORIGIN=https://api.example.com
  ```
- `.env.dev`（ローカル開発用）
  ```
  REAUTHENTICATION_PAGE=http://localhost:5173/reauth
  ACCOUNT_INITIALIZATION_PAGE=http://localhost:5173/init
  CLIENT_ORIGIN=http://localhost:5173
  ```

## 開発フローとデバッグ手順

1. **バックエンド開発サーバー**  
   `npm run dev`（内部で `dotenv -e .env.dev -- npx tsx src/index.ts`）。ポートは `.env.dev` の `PORT`（デフォルト 3000）。

2. **フロント開発サーバー**  
   `frontend` ディレクトリで `npm install` ののち `npm run dev -- --host 0.0.0.0 --port 5173`。Vite の `server.proxy` に `/authenticate` などを `http://localhost:3000` へ転送する設定を追加しておく。

3. **同時起動の補助**  
   ルートの `package.json` に `dev:frontend`（`npm --prefix frontend run dev`）や `dev:full`（`concurrently "npm run dev" "npm run dev:frontend"`）などを用意しておくと便利。

4. **リダイレクトの挙動**  
   開発中は `.env.dev` の `REAUTHENTICATION_PAGE` / `ACCOUNT_INITIALIZATION_PAGE` をフロント開発サーバー（例: `http://localhost:5173/reauth`）に向ける。バックエンドからのリダイレクトがそのままフロントへ届き、Cookie も `sameSite=lax` なので同一オリジンに近い扱いで動作する。

5. **本番ビルドと反映**  
   `npm --prefix frontend run build` → `frontend/dist` の内容を `public/` にコピー → バックエンドをリリース。`.env` を本番向け URL に切り替えれば既存のリダイレクトフローでビルド済みフロントが開く。

このワークフローなら、本番では Express で SPA を配信しつつ、開発中は Vite のホットリロードを活用できる。環境変数を書き換えるだけでリダイレクト先を自在に変えられるため、将来的に別ホストへ切り出す場合も容易に移行可能。
