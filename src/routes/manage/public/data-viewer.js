const PAGE_SIZE = 20;

const modelConfigs = {
  user: {
    label: "User",
    pluralLabel: "Users",
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
    allowPrimaryKeyInput: true,
  },
  registrationCode: {
    label: "Registration Code",
    pluralLabel: "Registration Codes",
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
    allowPrimaryKeyInput: true,
  },
  session: {
    label: "Session",
    pluralLabel: "Sessions",
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
    allowPrimaryKeyInput: true,
  },
  pendingRedirect: {
    label: "Pending Redirect",
    pluralLabel: "Pending Redirects",
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
    allowPrimaryKeyInput: true,
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

function buildFieldInput(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "data-detail-field";

  const label = document.createElement("label");
  label.textContent = field.label;
  wrapper.appendChild(label);

  let input;
  switch (field.type) {
    case "textarea":
      input = document.createElement("textarea");
      break;
    case "checkbox":
      input = document.createElement("input");
      input.type = "checkbox";
      input.value = "true";
      break;
    case "datetime":
      input = document.createElement("input");
      input.type = "datetime-local";
      break;
    default:
      input = document.createElement("input");
      input.type = "text";
  }
  input.dataset.fieldKey = field.key;
  if (field.readOnly) {
    input.readOnly = true;
    input.disabled = true;
  }
  wrapper.appendChild(input);
  return { wrapper, input };
}

class DataViewer {
  constructor(container, options) {
    this.container = container;
    this.apiCall = options.apiCall;
    this.log = options.log || (() => {});
    this.modelKey = container.dataset.model || "user";
    this.config = modelConfigs[this.modelKey] || modelConfigs.user;

    this.state = {
      page: 1,
      totalPages: 1,
      totalCount: 0,
      loading: false,
      records: [],
      selectedRecord: null,
    };

    this.fieldInputs = {};
    this.fieldConfigs = {};

    this.cacheElements();
    this.setupFields();
    this.bindEvents();
    this.renderTableHead();
    this.resetDetail();
    this.loadRecords(1);
  }

  cacheElements() {
    this.titleEl = this.container.querySelector(".data-viewer-title");
    this.refreshButton = this.container.querySelector(".data-refresh-button");
    this.tableHead = this.container.querySelector(".data-table-head");
    this.tableBody = this.container.querySelector(".data-table-body");
    this.emptyState = this.container.querySelector(".data-empty-state");
    this.prevButton = this.container.querySelector(".data-prev-button");
    this.nextButton = this.container.querySelector(".data-next-button");
    this.pageInfo = this.container.querySelector(".data-page-info");
    this.detailTitle = this.container.querySelector(".data-detail-title");
    this.detailForm = this.container.querySelector(".data-detail-form");
    this.detailFieldsContainer = this.container.querySelector(".data-detail-fields");
    this.updateButton = this.container.querySelector(".data-update-button");
    this.createButton = this.container.querySelector(".data-create-button");
    this.deleteButton = this.container.querySelector(".data-delete-button");
    this.clearButton = this.container.querySelector(".data-clear-button");

    if (this.titleEl) {
      this.titleEl.textContent = this.config.pluralLabel;
    }
  }

  bindEvents() {
    if (this.refreshButton) {
      this.refreshButton.addEventListener("click", () => {
        if (!this.state.loading) {
          this.loadRecords(this.state.page);
        }
      });
    }
    if (this.prevButton) {
      this.prevButton.addEventListener("click", () => {
        if (!this.state.loading && this.state.page > 1) {
          this.loadRecords(this.state.page - 1);
        }
      });
    }
    if (this.nextButton) {
      this.nextButton.addEventListener("click", () => {
        if (!this.state.loading && this.state.page < this.state.totalPages) {
          this.loadRecords(this.state.page + 1);
        }
      });
    }
    if (this.detailForm) {
      this.detailForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!this.state.loading) {
          this.handleUpdate();
        }
      });
    }
    if (this.createButton) {
      this.createButton.addEventListener("click", () => {
        if (!this.state.loading) {
          this.handleCreate();
        }
      });
    }
    if (this.deleteButton) {
      this.deleteButton.addEventListener("click", () => {
        if (!this.state.loading) {
          this.handleDelete();
        }
      });
    }
    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        if (!this.state.loading) {
          this.resetDetail();
        }
      });
    }
  }

  setupFields() {
    if (this.detailTitle) {
      this.detailTitle.textContent = `${this.config.label} detail`;
    }
    if (!this.detailFieldsContainer) {
      return;
    }
    this.detailFieldsContainer.innerHTML = "";
    this.fieldInputs = {};
    this.fieldConfigs = {};

    this.config.fields.forEach((field) => {
      const { wrapper, input } = buildFieldInput(field);
      this.fieldInputs[field.key] = input;
      this.fieldConfigs[field.key] = field;
      this.detailFieldsContainer.appendChild(wrapper);
      if (field.readOnly && this.config.allowPrimaryKeyInput && field.key === this.config.primaryKey) {
        input.readOnly = false;
        input.disabled = false;
        input.dataset.primaryKeyField = "true";
      }
    });
  }

  renderTableHead() {
    if (!this.tableHead) {
      return;
    }
    this.tableHead.innerHTML = "";
    [...this.config.columns, { key: "__actions", label: "Actions" }].forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.label;
      this.tableHead.appendChild(th);
    });
  }

  setLoading(loading) {
    this.state.loading = loading;
    if (this.refreshButton) {
      this.refreshButton.disabled = loading;
    }
    if (this.prevButton) {
      this.prevButton.disabled = loading || this.state.page <= 1;
    }
    if (this.nextButton) {
      this.nextButton.disabled = loading || this.state.page >= this.state.totalPages;
    }
    if (this.updateButton) {
      this.updateButton.disabled = loading || !this.state.selectedRecord;
    }
    if (this.createButton) {
      this.createButton.disabled = loading;
    }
    if (this.deleteButton) {
      this.deleteButton.disabled = loading || !this.state.selectedRecord;
    }
    if (this.clearButton) {
      this.clearButton.disabled = loading;
    }
    if (this.detailFieldsContainer) {
      Object.entries(this.fieldInputs).forEach(([key, input]) => {
        const fieldConfig = this.fieldConfigs[key];
        const isPrimaryKeyField = this.config.allowPrimaryKeyInput && input.dataset.primaryKeyField === "true";
        if (fieldConfig?.readOnly && !isPrimaryKeyField) {
          input.disabled = true;
          return;
        }
        if (isPrimaryKeyField) {
          input.disabled = loading || Boolean(this.state.selectedRecord);
          return;
        }
        input.disabled = loading;
      });
    }
  }

  updatePageInfo() {
    if (!this.pageInfo) {
      return;
    }
    const page = Math.max(1, this.state.page);
    const totalPages = Math.max(1, this.state.totalPages);
    if (this.state.loading) {
      this.pageInfo.textContent = "Loading...";
      return;
    }
    const infoParts = [`Page ${page} / ${totalPages}`];
    if (Number.isFinite(this.state.totalCount)) {
      infoParts.push(`(${this.state.totalCount} records)`);
    }
    this.pageInfo.textContent = infoParts.join(" ");
  }

  showEmptyState(show, message) {
    if (!this.emptyState) {
      return;
    }
    this.emptyState.hidden = !show;
    if (typeof message === "string") {
      this.emptyState.textContent = message;
    }
  }

  formatCell(column, record) {
    const raw = record?.[column.key];
    if (column.format) {
      try {
        return column.format(raw, record);
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

  renderRows(records) {
    if (!this.tableBody) {
      return;
    }
    this.tableBody.innerHTML = "";
    records.forEach((record) => {
      const tr = document.createElement("tr");
      this.config.columns.forEach((column) => {
        const td = document.createElement("td");
        td.textContent = this.formatCell(column, record);
        tr.appendChild(td);
      });
      const actionCell = document.createElement("td");
      actionCell.className = "actions-cell";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.className = "data-action-button";
      editButton.addEventListener("click", () => this.selectRecord(record));
      actionCell.appendChild(editButton);
      tr.appendChild(actionCell);
      this.tableBody.appendChild(tr);
    });
  }

  collectInputValues({ includeReadOnly = false, includePrimaryKey = false } = {}) {
    const payload = {};
    Object.entries(this.fieldInputs).forEach(([key, input]) => {
      const fieldConfig = this.fieldConfigs[key];
      const isPrimaryKeyField = this.config.allowPrimaryKeyInput && key === this.config.primaryKey && input.dataset.primaryKeyField === "true";
      if (!includeReadOnly && fieldConfig?.readOnly && !(includePrimaryKey && isPrimaryKeyField)) {
        return;
      }
      if (input.type === "checkbox") {
        payload[key] = input.checked;
      } else if (input.type === "datetime-local") {
        payload[key] = input.value ? new Date(input.value).toISOString() : null;
      } else {
        payload[key] = input.value;
      }
      if (isPrimaryKeyField && payload[key] === "") {
        delete payload[key];
      }
    });
    return payload;
  }

  populateFields(record) {
    Object.entries(this.fieldInputs).forEach(([key, input]) => {
      const fieldConfig = this.fieldConfigs[key];
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
      const isPrimaryKeyField = this.config.allowPrimaryKeyInput && input.dataset.primaryKeyField === "true";
      if (fieldConfig?.readOnly && !isPrimaryKeyField) {
        input.disabled = true;
      } else if (isPrimaryKeyField) {
        input.disabled = this.state.loading || Boolean(record);
      } else {
        input.disabled = this.state.loading;
      }
    });
  }

  updateDetailTitle() {
    if (!this.detailTitle) {
      return;
    }
    if (this.state.selectedRecord) {
      const idValue = this.state.selectedRecord[this.config.primaryKey];
      if (idValue !== undefined) {
        this.detailTitle.textContent = `${this.config.label} detail (${idValue})`;
        return;
      }
    }
    this.detailTitle.textContent = `${this.config.label} detail`;
  }

  resetDetail() {
    this.state.selectedRecord = null;
    this.populateFields(null);
    this.updateDetailTitle();
    if (this.updateButton) {
      this.updateButton.disabled = true;
    }
    if (this.deleteButton) {
      this.deleteButton.disabled = true;
    }
  }

  selectRecord(record) {
    this.state.selectedRecord = record;
    this.populateFields(record);
    this.updateDetailTitle();
    if (this.updateButton) {
      this.updateButton.disabled = this.state.loading;
    }
    if (this.deleteButton) {
      this.deleteButton.disabled = this.state.loading;
    }
  }

  getEndpoint(id) {
    const base = this.config.path || `/manage/api/${this.modelKey}`;
    if (!id) {
      return base;
    }
    return `${base}/${encodeURIComponent(id)}`;
  }

  async loadRecords(page = 1) {
    const selectedId = this.state.selectedRecord
      ? this.state.selectedRecord[this.config.primaryKey]
      : null;
    this.setLoading(true);
    this.updatePageInfo();
    this.showEmptyState(false);
    if (this.tableBody) {
      this.tableBody.innerHTML = "";
    }
    try {
      const params = new URLSearchParams({
        page: String(Math.max(1, page)),
        pageSize: String(PAGE_SIZE),
      });
      const response = await this.apiCall(`${this.getEndpoint()}?${params.toString()}`, {
        method: "GET",
      });
      const data = Array.isArray(response?.data) ? response.data : [];
      const pagination = response?.pagination || {};

      this.state.records = data;
      this.state.page = Number(pagination.page) || page;
      this.state.totalPages = Math.max(1, Number(pagination.totalPages) || 1);
      const totalCount = Number(pagination.totalCount);
      this.state.totalCount = Number.isFinite(totalCount) ? totalCount : data.length;

      this.renderRows(data);
      if (data.length === 0) {
        this.showEmptyState(true, "No records.");
        this.resetDetail();
      } else if (selectedId) {
        const nextRecord = data.find(
          (record) => record[this.config.primaryKey] === selectedId,
        );
        if (nextRecord) {
          this.selectRecord(nextRecord);
        } else {
          this.resetDetail();
        }
      } else {
        this.resetDetail();
      }
      this.log("info", `Loaded ${data.length} ${this.config.label} records (page ${this.state.page}/${this.state.totalPages}).`);
    } catch (error) {
      this.state.records = [];
      this.showEmptyState(true, "Failed to load records.");
      this.log("error", `Failed to load ${this.config.label}: ${error.message}`);
    } finally {
      this.setLoading(false);
      this.updatePageInfo();
    }
  }

  async reload() {
    await this.loadRecords(this.state.page);
  }

  async handleUpdate() {
    if (!this.state.selectedRecord) {
      this.log("warn", "No record selected for update.");
      return;
    }
    const idValue = this.state.selectedRecord[this.config.primaryKey];
    if (!idValue) {
      this.log("warn", "Selected record does not have a primary key value.");
      return;
    }
    const payload = this.collectInputValues({ includeReadOnly: false });

    this.setLoading(true);
    this.updatePageInfo();
    try {
      await this.apiCall(this.getEndpoint(idValue), {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      this.log("success", `${this.config.label} ${idValue} updated successfully.`);
      await this.loadRecords(this.state.page);
      const updated = this.state.records.find(
        (record) => record[this.config.primaryKey] === idValue,
      );
      if (updated) {
        this.selectRecord(updated);
      } else {
        this.resetDetail();
      }
    } catch (error) {
      this.log("error", `Failed to update ${this.config.label}: ${error.message}`);
    } finally {
      this.setLoading(false);
      this.updatePageInfo();
    }
  }

  async handleCreate() {
    const payload = this.collectInputValues({ includeReadOnly: false, includePrimaryKey: true });
    this.setLoading(true);
    this.updatePageInfo();
    let createdId;
    try {
      const response = await this.apiCall(this.getEndpoint(), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const created = response && typeof response === "object"
        ? response.data || response
        : null;
      if (created && typeof created === "object" && this.config.primaryKey in created) {
        createdId = created[this.config.primaryKey];
      }
      this.log("success", `${this.config.label} created successfully.`);
      await this.loadRecords(1);
      if (createdId) {
        const createdRecord = this.state.records.find(
          (record) => record[this.config.primaryKey] === createdId,
        );
        if (createdRecord) {
          this.selectRecord(createdRecord);
          return;
        }
      }
      this.resetDetail();
    } catch (error) {
      this.log("error", `Failed to create ${this.config.label}: ${error.message}`);
    } finally {
      this.setLoading(false);
      this.updatePageInfo();
    }
  }

  async handleDelete() {
    if (!this.state.selectedRecord) {
      this.log("warn", "No record selected for delete.");
      return;
    }
    const idValue = this.state.selectedRecord[this.config.primaryKey];
    if (!idValue) {
      this.log("warn", "Selected record does not have a primary key value.");
      return;
    }
    this.setLoading(true);
    this.updatePageInfo();
    try {
      await this.apiCall(this.getEndpoint(idValue), {
        method: "DELETE",
      });
      this.log("success", `${this.config.label} ${idValue} deleted.`);
      const nextPage = this.state.records.length > 1 ? this.state.page : Math.max(1, this.state.page - 1);
      await this.loadRecords(nextPage);
      this.resetDetail();
    } catch (error) {
      this.log("error", `Failed to delete ${this.config.label}: ${error.message}`);
    } finally {
      this.setLoading(false);
      this.updatePageInfo();
    }
  }
}

export function initDataViewers(options = {}) {
  if (typeof options.apiCall !== "function") {
    throw new Error("initDataViewers requires an apiCall function.");
  }
  const containers = Array.from(document.querySelectorAll(".data-viewer"));
  const viewers = containers.map((container) => new DataViewer(container, options));
  return viewers;
}
