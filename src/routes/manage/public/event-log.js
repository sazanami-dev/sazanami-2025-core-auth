const EVENT_LOG_PAGE_SIZE = 20;

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

export function initEventLog(options = {}) {
  const {
    apiCall,
    log = () => {},
    elements = {},
  } = options;

  const {
    tableBody = document.getElementById("event-log-body"),
    pageInfo = document.getElementById("event-page-info"),
    prevButton = document.getElementById("event-prev-button"),
    nextButton = document.getElementById("event-next-button"),
    refreshButton = document.getElementById("event-refresh-button"),
    emptyState = document.getElementById("event-log-empty"),
  } = elements;

  if (!tableBody || !pageInfo) {
    log("warn", "Event log UI elements are missing. Skipping event log initialization.");
    return null;
  }
  if (typeof apiCall !== "function") {
    log("error", "Event log initialization failed: apiCall is not provided.");
    return null;
  }

  const state = {
    page: 1,
    pageSize: EVENT_LOG_PAGE_SIZE,
    totalPages: 1,
    totalCount: undefined,
    loading: false,
  };

  function renderEventLogs(logs) {
    tableBody.innerHTML = "";
    logs.forEach((entry) => {
      const row = document.createElement("tr");

      const categoryCell = document.createElement("td");
      categoryCell.classList.add("event-cell");
      const badge = document.createElement("span");
      badge.className = `event-category-badge ${getCategoryClassName(entry?.category)}`;
      badge.textContent = getCategoryLabel(entry?.category);
      categoryCell.appendChild(badge);
      row.appendChild(categoryCell);

      const reporterCell = document.createElement("td");
      reporterCell.classList.add("event-cell");
      reporterCell.textContent = entry?.reporter || "-";
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
      timestampCell.classList.add("event-cell");
      timestampCell.textContent = formatTimestamp(entry?.createdAt);
      row.appendChild(timestampCell);

      tableBody.appendChild(row);
    });
  }

  function updateControls() {
    const totalPages = Math.max(1, Number(state.totalPages) || 1);
    const currentPage = Math.max(1, Number(state.page) || 1);

    if (pageInfo) {
      if (state.loading) {
        pageInfo.textContent = "Loading...";
      } else {
        const parts = [`Page ${currentPage} / ${totalPages}`];
        if (Number.isFinite(state.totalCount)) {
          parts.push(`(${state.totalCount} logs)`);
        }
        pageInfo.textContent = parts.join(" ");
      }
    }
    if (prevButton) {
      prevButton.disabled = state.loading || currentPage <= 1;
    }
    if (nextButton) {
      nextButton.disabled = state.loading || currentPage >= totalPages;
    }
    if (refreshButton) {
      refreshButton.disabled = state.loading;
    }
  }

  async function loadEventLogs(page = state.page) {
    state.loading = true;
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = "Loading event logs...";
    }
    updateControls();

    try {
      const targetPage = Math.max(1, Number(page) || 1);
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(state.pageSize),
      });
      const response = await apiCall(`/manage/api/event?${params.toString()}`, {
        method: "GET",
      });
      const logs = Array.isArray(response?.data) ? response.data : [];
      const pagination = response?.pagination || {};
      state.page = Number(pagination.page) || targetPage;
      state.pageSize = Number(pagination.pageSize) || state.pageSize;
      state.totalPages = Math.max(1, Number(pagination.totalPages) || 1);
      const totalCount = Number(pagination.totalCount);
      state.totalCount = Number.isFinite(totalCount) ? totalCount : logs.length;

      state.loading = false;
      renderEventLogs(logs);
      if (emptyState) {
        if (logs.length === 0) {
          emptyState.hidden = false;
          emptyState.textContent = "No event logs found.";
        } else {
          emptyState.hidden = true;
        }
      }
      updateControls();
      log("success", `Loaded ${logs.length} event logs (page ${state.page}/${state.totalPages}).`);
    } catch (error) {
      state.loading = false;
      state.totalCount = undefined;
      tableBody.innerHTML = "";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "Failed to load event logs.";
      }
      updateControls();
      log("error", `Failed to load event logs: ${error.message}`);
    }
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (!state.loading && state.page > 1) {
        loadEventLogs(state.page - 1);
      }
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (!state.loading && state.page < state.totalPages) {
        loadEventLogs(state.page + 1);
      }
    });
  }
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      if (!state.loading) {
        loadEventLogs(state.page);
      }
    });
  }

  loadEventLogs(1);

  return {
    reload: () => loadEventLogs(state.page),
    goToPage: (page) => loadEventLogs(page),
    getState: () => ({ ...state }),
  };
}
