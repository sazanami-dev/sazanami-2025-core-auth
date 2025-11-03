document.addEventListener('DOMContentLoaded', () => {

  // --- 0. レイアウト調整 (配置のため) ---
  const header = document.querySelector('.auth-header');
  const logViewer = document.querySelector('.log-viewer');

  function adjustLayout() {
    const headerHeight = header.offsetHeight;
    logViewer.style.top = `${headerHeight}px`;
    logViewer.style.height = `calc(100vh - ${headerHeight}px)`;
  }
  adjustLayout();
  window.addEventListener('resize', adjustLayout);

  // --- 1. ログ出力機能 ---
  const logOutput = document.getElementById('log-output');

  function log(message) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    logOutput.textContent += `[${timestamp}] ${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  }
  log("管理画面スクリプト初期化完了。");

  // --- 2. 認証機能 ---
  const authStatus = document.getElementById('auth-status');
  const authCheckButton = document.getElementById('auth-check-button');

  /**
   * [DUMMY] 認証ステータスを確認する
   * (将来的に、ここで /api/admin/ping 等を fetch してください)
   */
  async function checkAuthStatus() {
    log("認証ステータスを確認中...");
    authStatus.textContent = "確認中...";
    authCheckButton.disabled = true;

    // --- ここからダミー処理 (0.5秒待つ) ---
    await new Promise(resolve => setTimeout(resolve, 500));

    // 50%の確率で成功/失敗をシミュレート
    const isAuthSuccess = Math.random() > 0.5;
    // --- ダミー処理ここまで ---

    if (isAuthSuccess) {
      // (実際の処理: fetchが 200 OK で返ってきた場合)
      authStatus.textContent = "✔ OK";
      log("認証ステータス: OK");
    } else {
      // (実際の処理: fetchが 401 や 403 で返ってきた場合)
      authStatus.textContent = "✘ NG (認証エラー)";
      log("[エラー] 認証に失敗しました。");
    }
    authCheckButton.disabled = false;
  }

  // 再確認ボタンのロジック
  authCheckButton.addEventListener('click', checkAuthStatus);

  // ページ読み込み時にも認証確認を実行
  checkAuthStatus();

  // --- 3. タブ切り替え機能 ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');
      log(`タブ切り替え: ${targetTabId}`);

      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTabId) {
          content.classList.add('active');
        }
      });
    });
  });

  // --- 4. ダミー操作ログ ---
  // (APIキーのチェックロジックを削除。認証は checkAuthStatus が担う)
  document.getElementById('dummy-action-1').addEventListener('click', () => log("ダミー操作 (ユーザー) 実行"));
  document.getElementById('dummy-action-2').addEventListener('click', () => log("ダミー操作 (セッション) 実行"));
  document.getElementById('dummy-action-3').addEventListener('click', () => log("ダミー操作 (リダイレクト) 実行"));
});
