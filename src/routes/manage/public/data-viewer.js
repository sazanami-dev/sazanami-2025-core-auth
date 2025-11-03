const PAGE_SIZE = 20;

const modelConfigs = {
  user: {
    label: "User",
    primaryKey: "id",
    path: "/manage/api/user",
    columns: [
      { key: "id", label: "id" },
      { key: "displayName", label: "displayName" },
      { key: "isInitialized", label: "isInitialized", format: booleanFormatter },
    ],
    fields: [
      { key: "id", label: "id", type: "text", readOnly: true },
      { key: "displayName", label: "displayName", type: "text" },
      { key: "isInitialized", label: "isInitialized", type: "checkbox" },
    ],
  },
  registrationCode: {
    label: "Registration Code",
    primaryKey: "code",
    path: "/manage/api/regCode",
    columns: [
      { key: "code", label: "code" },
      { key: "userId", label: "userId" },
      { key: "createdAt", label: "createdAt", format: dateFormatter },
    ],
    fields: [
      { key: "code", label: "code", type: "text", readOnly: true },
      { key: "userId", label: "userId", type: "text" },
      { key: "createdAt", label: "createdAt", type: "text", readOnly: true },
    ],
  },
  session: {
    label: "Session",
    primaryKey: "id",
    path: "/manage/api/session",
    columns: [
      { key: "id", label: "id" },
      { key: "userId", label: "userId" },
      { key: "createdAt", label: "createdAt", format: dateFormatter },
    ],
    fields: [
      { key: "id", label: "id", type: "text", readOnly: true },
      { key: "userId", label: "userId", type: "text" },
      { key: "createdAt", label: "createdAt", type: "text", readOnly: true },
    ],
  },
  pendingRedirect: {
    label: "Pending Redirect",
    primaryKey: "id",
    path: "/manage/api/pending-redirect",
    columns: [
      { key: "id", label: "id" },
      { key: "redirectUrl", label: "redirectUrl" },
      { key: "used", label: "used", format: booleanFormatter },
      { key: "expiresAt", label: "expiresAt", format: dateFormatter },
      { key: "createdAt", label: "createdAt", format: dateFormatter },
    ],
    fields: [
      { key: "id", label: "id", type: "text", readOnly: true },
      { key: "redirectUrl", label: "redirectUrl", type: "text" },
      { key: "postbackUrl", label: "postbackUrl", type: "text" },
      { key: "state", label: "state", type: "text" },
      { key: "used", label: "used", type: "checkbox" },
      { key: "expiresAt", label: "expiresAt", type: "datetime" },
      { key: "sessionId", label: "sessionId", type: "text" },
      { key: "createdAt", label: "createdAt", type: "text", readOnly: true },
    ],
  },
};

function booleanFormatter(value) {
  return value ? "true" : "false";
}

function dateFormatter(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("ja-JP", { hour12: false });
}

function setElementDisabled(element, disabled) {
  if (!element) {
    return;
  }
  element.disabled = Boolean(disabled);
}

function formatValue(column, record) {
  const { key, format } = column;
  const raw = record?.[key];
  if (format) {
    try {
      return format(raw, record);
    } catch (_error) {
      return String(raw ?? "");
    }
  }
  if (raw === null || raw === undefined) {
    return "";
  }
  if (typeof raw === "boolean") {
    return booleanFormatter(raw);
  }
  if (raw instanceof Date) {
    return dateFormatter(raw);
  }
  return String(raw);
}

function buildFieldInput(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "data-detail-field";
  const label = document.createElement("label");
  label.textContent = field.label;
  label.setAttribute("for", `field-${field.key}`);
  wrapper.appendChild(label);

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
  } else if (field.type === "checkbox") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.value = "true";
  } else if (field.type === "datetime") {
    input = document.createElement("input");
    input.type = "datetime-local";
  } else {
    input = document.createElement("input");
    input.type = "text";
  }
  input.id = `field-${field.key}`;
  input.dataset.fieldKey = field.key;
  if (field.readOnly) {
    input.readOnly = true;
    input.disabled = true;
  }
  wrapper.appendChild(input);
  return { wrapper, input };
}

export function initDataViewer(options = {}) {
  const {
    apiCall,
    log = () => {},
    elements = {},
  } = options;

  const navButtons = Array.from(
    elements.navButtons ||
      document.querySelectorAll(".data-tab-button")
  );
  const tableHead =
    elements.tableHead || document.getElementById("data-table-head");
  const tableBody =
    elements.tableBody || document.getElementById("data-table-body");
  const pageInfo =
    elements.pageInfo || document.getElementById("data-page-info");
  const prevButton =
    elements.prevButton || document.getElementById("data-prev-button");
  const nextButton =
    elements.nextButton || document.getElementById("data-next-button");
  const refreshButton =
    elements.refreshButton || document.getElementById("data-refresh-button");
  const emptyState =
    elements.emptyState || document.getElementById("data-empty-state");
  const detailTitle =
    elements.detailTitle || document.getElementById("data-detail-title");
  const detailForm =
    elements.detailForm || document.getElementById("data-detail-form");
  const detailFieldsContainer =
    elements.detailFieldsContainer ||
    document.getElementById("data-detail-fields");
  const detailSubmit =
    elements.detailSubmit || document.getElementById("data-detail-submit");
  const detailReset =
    elements.detailReset || document.getElementById("data-detail-reset");
  const detailMessage =
    elements.detailMessage ||
    document.getElementById("data-detail-message");

  if (!apiCall || typeof apiCall !== "function") {
    log("error", "Data viewer initialization failed: apiCall is missing.");
    return null;
  }
  if (!tableHead || !tableBody || !pageInfo) {
    log("warn", "Data viewer initialization skipped: missing required elements.");
    return null;
  }

  const state = {
    model: "user",
    page: 1,
    totalPages: 1,
    totalCount: undefined,
    loading: false,
    records: [],
    selectedRecord: null,
    fieldInputs: {},
  };

  function getConfig(modelKey) {
    return modelConfigs[modelKey] || modelConfigs.user;
  }

function getEndpoint(modelKey, id) {
  const config = getConfig(modelKey);
  const base = config.path || `/manage/api/${modelKey}`;
  if (!id) {
    return base;
  }
  return `${base}/${encodeURIComponent(id)}`;
}

  function updateNavButtons(activeModel) {
    navButtons.forEach((button) => {
      if (button.dataset.model === activeModel) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  function updatePageInfo() {
    const totalPages = Math.max(1, Number(state.totalPages) || 1);
    const currentPage = Math.max(1, Number(state.page) || 1);
    if (state.loading) {
      pageInfo.textContent = "Loading...";
    } else {
      const parts = [`Page ${currentPage} / ${totalPages}`];
      if (Number.isFinite(state.totalCount)) {
        parts.push(`(${state.totalCount} records)`);
      }
      pageInfo.textContent = parts.join(" ");
    }
    setElementDisabled(prevButton, state.loading || currentPage <= 1);
    setElementDisabled(nextButton, state.loading || currentPage >= totalPages);
    setElementDisabled(refreshButton, state.loading);
  }

  function resetDetailForm() {
    state.selectedRecord = null;
    if (detailTitle) {
      detailTitle.textContent = `${getConfig(state.model).label} detail`;
    }
    if (detailMessage) {
      detailMessage.hidden = true;
      detailMessage.textContent = "";
    }
    Object.values(state.fieldInputs).forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else if (input.type === "datetime-local") {
        input.value = "";
      } else {
        input.value = "";
      }
      if (input.dataset.readonly === "true") {
        input.disabled = true;
      } else {
        input.disabled = true;
      }
    });
    setElementDisabled(detailSubmit, true);
    setElementDisabled(detailReset, true);
  }

  function populateDetail(record) {
    const config = getConfig(state.model);
    if (detailTitle) {
      const idValue = record?.[config.primaryKey];
      detailTitle.textContent = idValue
        ? `${config.label} detail (${idValue})`
        : `${config.label} detail`;
    }
    Object.entries(state.fieldInputs).forEach(([key, input]) => {
      const fieldConfig = config.fields.find((field) => field.key === key);
      const value = record?.[key];
      if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else if (input.type === "datetime-local") {
        if (value) {
          const date = new Date(value);
          if (!Number.isNaN(date.getTime())) {
            const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            input.value = iso;
          } else {
            input.value = "";
          }
        } else {
          input.value = "";
        }
      } else {
        input.value = value === null || value === undefined ? "" : String(value);
      }
      if (!fieldConfig?.readOnly) {
        input.disabled = false;
      }
    });
    setElementDisabled(detailSubmit, false);
    setElementDisabled(detailReset, false);
  }

  function renderTable(records) {
    const config = getConfig(state.model);
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    const columns = [...config.columns, { key: "__actions", label: "actions" }];
    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.label;
      tableHead.appendChild(th);
    });

    records.forEach((record) => {
      const tr = document.createElement("tr");
      config.columns.forEach((column) => {
        const td = document.createElement("td");
        td.textContent = formatValue(column, record);
        tr.appendChild(td);
      });
      const actionCell = document.createElement("td");
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        state.selectedRecord = record;
        populateDetail(record);
      });
      actionCell.appendChild(editButton);
      tr.appendChild(actionCell);
      tableBody.appendChild(tr);
    });
  }

  function showEmptyState(show, message) {
    if (!emptyState) {
      return;
    }
    emptyState.hidden = !show;
    if (typeof message === "string") {
      emptyState.textContent = message;
    }
  }

  async function loadRecords(page = 1) {
    const config = getConfig(state.model);
    state.loading = true;
    updatePageInfo();
    showEmptyState(false);
    tableBody.innerHTML = "";
    try {
      const params = new URLSearchParams({
        page: String(Math.max(1, page)),
        pageSize: String(PAGE_SIZE),
      });
      const endpoint = `${getEndpoint(state.model)}?${params.toString()}`;
      const response = await apiCall(endpoint, { method: "GET" });
      const data = Array.isArray(response?.data) ? response.data : [];
      const pagination = response?.pagination || {};
      state.records = data;
      state.page = Number(pagination.page) || page;
      state.totalPages = Math.max(1, Number(pagination.totalPages) || 1);
      const totalCount = Number(pagination.totalCount);
      state.totalCount = Number.isFinite(totalCount)
        ? totalCount
        : data.length;
      renderTable(data);
      if (data.length === 0) {
        showEmptyState(true, "No records.");
        resetDetailForm();
      }
      updatePageInfo();
      log(
        "info",
        `Loaded ${data.length} ${config.label} records (page ${state.page}/${state.totalPages}).`
      );
    } catch (error) {
      state.records = [];
      showEmptyState(true, "Failed to load records.");
      updatePageInfo();
      log("error", `Failed to load ${config.label}: ${error.message}`);
    } finally {
      state.loading = false;
      updatePageInfo();
    }
  }

  function switchModel(modelKey) {
    if (!modelConfigs[modelKey]) {
      log("warn", `Unknown model "${modelKey}", fallback to user.`);
      state.model = "user";
    } else {
      state.model = modelKey;
    }
    state.page = 1;
    state.totalPages = 1;
    state.selectedRecord = null;
    state.records = [];
    updateNavButtons(state.model);
    const config = getConfig(state.model);
    if (detailTitle) {
      detailTitle.textContent = `${config.label} detail`;
    }
    if (detailFieldsContainer) {
      detailFieldsContainer.innerHTML = "";
      state.fieldInputs = {};
      config.fields.forEach((field) => {
        const { wrapper, input } = buildFieldInput(field);
        state.fieldInputs[field.key] = input;
        if (field.readOnly) {
          input.dataset.readonly = "true";
        }
        detailFieldsContainer.appendChild(wrapper);
      });
      resetDetailForm();
    }
    loadRecords(1);
  }

  async function submitDetail(event) {
    event.preventDefault();
    if (!state.selectedRecord) {
      return;
    }
    const config = getConfig(state.model);
    const idValue = state.selectedRecord[config.primaryKey];
    if (!idValue) {
      log("warn", "Selected record does not have a primary key value.");
      return;
    }
    const payload = {};
    Object.entries(state.fieldInputs).forEach(([key, input]) => {
      const fieldConfig = config.fields.find((field) => field.key === key);
      if (fieldConfig?.readOnly) {
        return;
      }
      if (input.type === "checkbox") {
        payload[key] = input.checked;
      } else if (input.type === "datetime-local") {
        payload[key] = input.value ? new Date(input.value).toISOString() : null;
      } else {
        payload[key] = input.value;
      }
    });
    try {
      await apiCall(getEndpoint(state.model, idValue), {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (detailMessage) {
        detailMessage.hidden = false;
        detailMessage.textContent = "Update completed.";
      }
      log(
        "success",
        `${config.label} ${idValue} updated successfully.`
      );
      await loadRecords(state.page);
      const updatedRecord = state.records.find(
        (record) => record[config.primaryKey] === idValue
      );
      if (updatedRecord) {
        state.selectedRecord = updatedRecord;
        populateDetail(updatedRecord);
      } else {
        resetDetailForm();
      }
    } catch (error) {
      if (detailMessage) {
        detailMessage.hidden = false;
        detailMessage.textContent = "Failed to update.";
      }
      log("error", `Failed to update ${config.label}: ${error.message}`);
    }
  }

  function clearDetailSelection() {
    resetDetailForm();
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.loading) {
        return;
      }
      const model = button.dataset.model;
      if (model && model !== state.model) {
        switchModel(model);
      }
    });
  });

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (!state.loading && state.page > 1) {
        loadRecords(state.page - 1);
      }
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (!state.loading && state.page < state.totalPages) {
        loadRecords(state.page + 1);
      }
    });
  }
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      if (!state.loading) {
        loadRecords(state.page);
      }
    });
  }
  if (detailForm) {
    detailForm.addEventListener("submit", submitDetail);
  }
  if (detailReset) {
    detailReset.addEventListener("click", clearDetailSelection);
  }

  switchModel(state.model);

  return {
    getState: () => ({ ...state }),
    reload: () => loadRecords(state.page),
    switchModel: (model) => switchModel(model),
    clearSelection: () => clearDetailSelection(),
  };
}
