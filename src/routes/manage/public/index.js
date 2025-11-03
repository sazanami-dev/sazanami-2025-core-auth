document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.auth-header');
  const logViewer = document.querySelector('.log-viewer');

  function adjustLayout() {
    const headerHeight = header.offsetHeight;
    logViewer.style.top = `${headerHeight}px`;
    logViewer.style.height = `calc(100vh - ${headerHeight}px)`;
  }
  adjustLayout();
  window.addEventListener('resize', adjustLayout);

  const logOutput = document.getElementById('log-output');

  // Helpers
  async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    };
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  }

  function log(level, message) {
    let prefix = "";
    switch (level) {
      case "success":
        prefix = "✅"
        break;
      case "info":
        prefix = "ℹ️"
        break;
      case "error":
        prefix = "❗"
        break;
      case "warn":
        prefix = "⚠️"
        break;
      case "debug":
        prefix = "📝"
        break;
      default:
        prefix = "❓";
    }
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    logOutput.textContent += `[${timestamp}] ${prefix} ${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  }
  log("info", "Admin panel initialized.");

  const authStatus = document.getElementById('auth-status');
  const authCheckButton = document.getElementById('auth-check-button');

  const API_KEY = localStorage.getItem('adminApiKey') || '';
  const API_BASE_URL = localStorage.getItem('adminApiBaseUrl') || '';

  log("success", "API key loaded");
  log("success", "API Base URL loaded");

  if (!API_KEY || !API_BASE_URL) {
    log("warn", "API key or Base URL is not set in localStorage.");
  }

  async function checkAuthStatus() {
    const response = await apiCall('/manage/api/checkKey', {
      method: 'GET',
    });

    if (response && response.valid) {
      authStatus.textContent = "Verified";
      authStatus.style.color = "green";
      log("success", "API key is valid.");
    } else {
      authStatus.textContent = "Invalid";
      authStatus.style.color = "red";
      log("error", "API key is invalid.");
    }
  }

  // 再確認ボタンのロジック
  authCheckButton.addEventListener('click', checkAuthStatus);

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


  document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
  });
});
