const header = document.querySelector('.header');
const logViewer = document.querySelector('.log-viewer');
const logOutput = document.getElementById('log-output');
const authStatus = document.getElementById('auth-status');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const authCheckButton = document.getElementById('auth-check-button');
const eventTableBody = document.getElementById('event-log-body');
const eventPageInfo = document.getElementById('event-page-info');
const eventPrevButton = document.getElementById('event-prev-button');
const eventNextButton = document.getElementById('event-next-button');
const eventRefreshButton = document.getElementById('event-refresh-button');
const eventEmptyState = document.getElementById('event-log-empty');
const PAGE_PROVIDED_URL = window.location.origin + '/manage';
const API_KEY = localStorage.getItem('adminApiKey') || '';
const API_BASE_URL = localStorage.getItem('adminApiBaseUrl') || '';
const EVENT_LOG_PAGE_SIZE = 20;

const eventState = {
  page: 1,
  pageSize: EVENT_LOG_PAGE_SIZE,
  totalPages: 1,
  totalCount: undefined,
  loading: false,
};

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
  if (!header || !logViewer) {
    return;
  }
  const headerHeight = header.offsetHeight;
  logViewer.style.top = `${headerHeight}px`;
  logViewer.style.height = `calc(100vh - ${headerHeight}px)`;
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const roundedMs = Math.round(date.getTime() / 60000) * 60000;
  const roundedDate = new Date(roundedMs);
  return roundedDate.toLocaleString("ja-JP", { hour12: false });
}

function getCategoryLabel(category) {
  const normalized = String(category || "OTHER").toUpperCase();
  switch (normalized) {
    case "SECURITY":
      return "Security";
    case "PERFORMANCE":
      return "Performance";
    case "USABILITY":
      return "Usability";
    case "OTHER":
      return "Other";
    default:
      return normalized;
  }
}

function getCategoryClassName(category) {
  return String(category || "other").toLowerCase();
}

function isJsonEvent(logEntry) {
  return String(logEntry?.eventType || "").toUpperCase() === "JSON";
}

function formatPayload(logEntry) {
  const rawPayload = logEntry?.payload;
  if (!rawPayload) {
    return "-";
  }
  if (isJsonEvent(logEntry)) {
    try {
      const parsed = JSON.parse(rawPayload);
      return JSON.stringify(parsed, null, 2);
    } catch (_error) {
      return rawPayload;
    }
  }
  return rawPayload;
}

function renderEventLogs(logs) {
  if (!eventTableBody) {
    return;
  }
  eventTableBody.innerHTML = "";
  logs.forEach((entry) => {
    const row = document.createElement("tr");

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `event-category-badge ${getCategoryClassName(entry?.category)}`;
    badge.textContent = getCategoryLabel(entry?.category);
    categoryCell.appendChild(badge);
    categoryCell.classList.add("event-cell");
    row.appendChild(categoryCell);

    const reporterCell = document.createElement("td");
    reporterCell.textContent = entry?.reporter || "-";
    reporterCell.classList.add("event-cell");
    row.appendChild(reporterCell);

    const payloadCell = document.createElement("td");
    payloadCell.classList.add("event-payload");
    const payloadText = formatPayload(entry);
    payloadCell.textContent = payloadText;
    if (isJsonEvent(entry)) {
      payloadCell.classList.add("event-payload-json");
    }
    row.appendChild(payloadCell);

    const timestampCell = document.createElement("td");
    timestampCell.textContent = formatTimestamp(entry?.createdAt);
    timestampCell.classList.add("event-cell");
    row.appendChild(timestampCell);

    eventTableBody.appendChild(row);
  });
}

function updateEventControls() {
  const totalPages = Math.max(1, Number(eventState.totalPages) || 1);
  const currentPage = Math.max(1, Number(eventState.page) || 1);
  if (eventPageInfo) {
    if (eventState.loading) {
      eventPageInfo.textContent = "Loading...";
    } else {
      const parts = [`Page ${currentPage} / ${totalPages}`];
      if (Number.isFinite(eventState.totalCount)) {
        parts.push(`(${eventState.totalCount} logs)`);
      }
      eventPageInfo.textContent = parts.join(" ");
    }
  }
  if (eventPrevButton) {
    eventPrevButton.disabled = eventState.loading || currentPage <= 1;
  }
  if (eventNextButton) {
    eventNextButton.disabled = eventState.loading || currentPage >= totalPages;
  }
  if (eventRefreshButton) {
    eventRefreshButton.disabled = eventState.loading;
  }
}

async function loadEventLogs(page = eventState.page) {
  if (!eventTableBody) {
    return;
  }
  eventState.loading = true;
  if (eventEmptyState) {
    eventEmptyState.hidden = false;
    eventEmptyState.textContent = "Loading event logs...";
  }
  updateEventControls();
  try {
    const targetPage = Math.max(1, Number(page) || 1);
    const params = new URLSearchParams({
      page: String(targetPage),
      pageSize: String(eventState.pageSize),
    });
    const response = await apiCall(`/manage/api/event?${params.toString()}`, {
      method: "GET",
    });
    const logs = Array.isArray(response?.data) ? response.data : [];
    const pagination = response?.pagination || {};
    eventState.page = Number(pagination.page) || targetPage;
    eventState.pageSize = Number(pagination.pageSize) || eventState.pageSize;
    eventState.totalPages = Math.max(1, Number(pagination.totalPages) || 1);
    const totalCount = Number(pagination.totalCount);
    eventState.totalCount = Number.isFinite(totalCount) ? totalCount : logs.length;

    eventState.loading = false;
    renderEventLogs(logs);
    if (eventEmptyState) {
      if (logs.length === 0) {
        eventEmptyState.hidden = false;
        eventEmptyState.textContent = "No event logs found.";
      } else {
        eventEmptyState.hidden = true;
      }
    }
    updateEventControls();
    log("success", `Loaded ${logs.length} event logs (page ${eventState.page}/${eventState.totalPages}).`);
  } catch (error) {
    eventState.loading = false;
    eventState.totalCount = undefined;
    if (eventTableBody) {
      eventTableBody.innerHTML = "";
    }
    if (eventEmptyState) {
      eventEmptyState.hidden = false;
      eventEmptyState.textContent = "Failed to load event logs.";
    }
    updateEventControls();
    log("error", `Failed to load event logs: ${error.message}`);
  }
}

function initializeEventLogUI() {
  if (!eventTableBody || !eventPageInfo) {
    log("warn", "Event log UI elements are missing. Skipping event log initialization.");
    return;
  }
  updateEventControls();
  if (eventPrevButton) {
    eventPrevButton.addEventListener("click", () => {
      if (!eventState.loading && eventState.page > 1) {
        loadEventLogs(eventState.page - 1);
      }
    });
  }
  if (eventNextButton) {
    eventNextButton.addEventListener("click", () => {
      if (!eventState.loading && eventState.page < eventState.totalPages) {
        loadEventLogs(eventState.page + 1);
      }
    });
  }
  if (eventRefreshButton) {
    eventRefreshButton.addEventListener("click", () => {
      if (!eventState.loading) {
        loadEventLogs(eventState.page);
      }
    });
  }
  loadEventLogs(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  log("info", "Admin panel initializing...");
  adjustLayout();
  window.addEventListener('resize', adjustLayout);
  log("info", `Page Provided URL: ${PAGE_PROVIDED_URL}`);

  let tmp_CorrectlyConfigured = true;
  if (API_KEY) {
    log("info", "API key loaded");
  } else {
    log("error", "API key not found");
    tmp_CorrectlyConfigured = false;
  }
  if (API_BASE_URL) {
    log("info", "API Base URL loaded");
  } else {
    log("error", "API Base URL not found");
    tmp_CorrectlyConfigured = false;
  }
  if (!tmp_CorrectlyConfigured) {
    alert("API key or Base URL is not configured.\nRedirecting to auth setup page.");
    window.location.href = PAGE_PROVIDED_URL + '/auth.html';
    return;
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

  initializeEventLogUI();

  await checkAuthStatus();
  if (authCheckButton) {
    authCheckButton.addEventListener('click', checkAuthStatus);
  }

  log("success", "Admin panel initialized successfully.");
});
