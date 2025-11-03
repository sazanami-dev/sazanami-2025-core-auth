const header = document.querySelector('.auth-header');
const logViewer = document.querySelector('.log-viewer');
const logOutput = document.getElementById('log-output');
const authStatus = document.getElementById('auth-status');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const authCheckButton = document.getElementById('auth-check-button');
const PAGE_PROVIDED_URL = window.location.origin + '/manage';
const API_KEY = localStorage.getItem('adminApiKey') || '';
const API_BASE_URL = localStorage.getItem('adminApiBaseUrl') || '';

// Helpers
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-manage-key': `${API_KEY}`,
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
function adjustLayout() {
  const headerHeight = header.offsetHeight;
  logViewer.style.top = `${headerHeight}px`;
  logViewer.style.height = `calc(100vh - ${headerHeight}px)`;
}

document.addEventListener('DOMContentLoaded', async () => {
  log("info", "Admin panel initializing...");
  adjustLayout();
  window.addEventListener('resize', adjustLayout);
  log("info", `Page Provided URL: ${PAGE_PROVIDED_URL}`);

  let tmp_CorrectlyConfigured = true;
  if (API_BASE_URL) {
    log("success", "API key loaded");
  } else {
    log("error", "API key not found");
    tmp_CorrectlyConfigured = false;
  }
  if (API_BASE_URL) {
    log("success", "API Base URL loaded");
  } else {
    log("error", "API Base URL not found");
    tmp_CorrectlyConfigured = false;
  }
  if (!tmp_CorrectlyConfigured) {
    alert("API key or Base URL is not configured.\nRedirecting to auth setup page.");
    window.location.href = PAGE_PROVIDED_URL + '/auth.html';
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');
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

  await checkAuthStatus();
  authCheckButton.addEventListener('click', checkAuthStatus);
});
