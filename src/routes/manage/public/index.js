import { initEventLog } from "./event-log.js";
import { initDataViewer } from "./data-viewer.js";

const header = document.querySelector(".header");
const logViewer = document.querySelector(".log-viewer");
const logOutput = document.getElementById("log-output");
const authStatus = document.getElementById("auth-status");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const authCheckButton = document.getElementById("auth-check-button");
const PAGE_PROVIDED_URL = `${window.location.origin}/manage`;
const API_KEY = localStorage.getItem("adminApiKey") || "";
const API_BASE_URL = localStorage.getItem("adminApiBaseUrl") || "";

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "x-manage-key": `${API_KEY}`,
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
      prefix = "✅";
      break;
    case "info":
      prefix = "ℹ️";
      break;
    case "error":
      prefix = "❗";
      break;
    case "warn":
      prefix = "⚠️";
      break;
    case "debug":
      prefix = "📝";
      break;
    default:
      prefix = "❓";
  }
  const timestamp = new Date().toLocaleTimeString("ja-JP");
  if (logOutput) {
    logOutput.textContent += `[${timestamp}] ${prefix} ${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  }
}

async function checkAuthStatus() {
  const response = await apiCall("/manage/api/checkKey", {
    method: "GET",
  });

  if (response && response.valid) {
    if (authStatus) {
      authStatus.textContent = "Verified";
      authStatus.style.color = "green";
    }
    log("success", "API key is valid.");
  } else {
    if (authStatus) {
      authStatus.textContent = "Invalid";
      authStatus.style.color = "red";
    }
    log("error", "API key is invalid.");
  }
}

function adjustLayout() {
  if (!header || !logViewer) {
    return;
  }
  const headerHeight = header.offsetHeight;
  logViewer.style.top = `${headerHeight}px`;
  logViewer.style.height = `calc(100vh - ${headerHeight}px)`;
}

document.addEventListener("DOMContentLoaded", async () => {
  log("info", "Admin panel initializing...");
  adjustLayout();
  window.addEventListener("resize", adjustLayout);
  log("info", `Page Provided URL: ${PAGE_PROVIDED_URL}`);

  let configured = true;
  if (API_KEY) {
    log("info", "API key loaded");
  } else {
    log("error", "API key not found");
    configured = false;
  }
  if (API_BASE_URL) {
    log("info", "API Base URL loaded");
  } else {
    log("error", "API Base URL not found");
    configured = false;
  }
  if (!configured) {
    alert("API key or Base URL is not configured.\nRedirecting to auth setup page.");
    window.location.href = `${PAGE_PROVIDED_URL}/auth.html`;
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTabId = button.getAttribute("data-tab");
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === targetTabId) {
          content.classList.add("active");
        }
      });
    });
  });

  const dataViewerController = initDataViewer({ apiCall, log });
  if (!dataViewerController) {
    log("warn", "Data viewer controller is not available.");
  }

  const eventLogController = initEventLog({ apiCall, log });
  if (!eventLogController) {
    log("warn", "Event log controller is not available.");
  }

  await checkAuthStatus();
  if (authCheckButton) {
    authCheckButton.addEventListener("click", checkAuthStatus);
  }

  log("success", "Admin panel initialized successfully.");
});
