<script setup>
import { computed, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { formatBoolean, formatDateTime } from '../utils/format.js';

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  apiCall: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['log']);

const rows = ref([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const message = ref('');
const formState = reactive({});
const formModalOpen = ref(false);
const modalMode = ref('create');
const modalLoading = ref(false);
const editingRecord = ref(null);
const bulkModalOpen = ref(false);
const bulkInput = ref('');
const bulkStatus = reactive({
  total: 0,
  completed: 0,
  errors: [],
  running: false,
});

const pageSize = computed(() => props.config?.pageSize || 20);
const ready = computed(() => typeof props.apiCall === 'function');
const isEditMode = computed(() => modalMode.value === 'edit');
const bulkProgressText = computed(() => {
  if (!bulkStatus.running || bulkStatus.total === 0) {
    return '';
  }
  return `Processed ${bulkStatus.completed}/${bulkStatus.total}`;
});

const tableColumns = computed(() => {
  const base = (props.config?.columns || []).map((column) => ({
    title: column.label,
    dataIndex: column.key,
    key: column.key,
  }));
  base.push({
    title: 'Actions',
    key: 'actions',
    dataIndex: '__actions',
    width: 140,
    align: 'right',
  });
  return base;
});

function emitLog(level, text) {
  emit('log', { level, message: text });
}

function initForm() {
  (props.config?.fields || []).forEach((field) => {
    if (field.type === 'checkbox') {
      formState[field.key] = false;
    } else if (field.type === 'datetime') {
      formState[field.key] = null;
    } else {
      formState[field.key] = '';
    }
  });
}

function populateForm(record) {
  (props.config?.fields || []).forEach((field) => {
    const value = record ? record[field.key] : null;
    if (field.type === 'checkbox') {
      formState[field.key] = Boolean(value);
    } else if (field.type === 'datetime') {
      const parsed = value ? dayjs(value) : null;
      formState[field.key] = parsed && parsed.isValid() ? parsed : null;
    } else {
      formState[field.key] = value ?? '';
    }
  });
}

function formattedCell(column, record) {
  const raw = record?.[column.key];
  switch (column.format) {
    case 'boolean':
      return formatBoolean(raw);
    case 'datetime':
      return formatDateTime(raw);
    default:
      return raw ?? '';
  }
}

function getEndpoint(id) {
  if (!id) {
    return props.config.path;
  }
  return `${props.config.path}/${encodeURIComponent(id)}`;
}

async function loadRecords(targetPage = 1) {
  if (!ready.value) {
    message.value = 'API client not configured.';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const params = new URLSearchParams({
      page: String(Math.max(1, targetPage)),
      pageSize: String(pageSize.value),
    });
    const response = await props.apiCall(`${props.config.path}?${params.toString()}`, { method: 'GET' });
    const data = Array.isArray(response?.data) ? response.data : [];
    const pagination = response?.pagination || {};
    rows.value = data;
    page.value = Number(pagination.page) || targetPage;
    totalPages.value = Math.max(1, Number(pagination.totalPages) || 1);
    const count = Number(pagination.totalCount);
    totalCount.value = Number.isFinite(count) ? count : data.length;

    if (data.length === 0) {
      message.value = 'No records.';
    }
    emitLog('success', `Loaded ${data.length} rows from ${props.config.label}.`);
  } catch (error) {
    rows.value = [];
    message.value = error.message;
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

function buildPayload() {
  const payload = {};
  (props.config?.fields || []).forEach((field) => {
    const value = formState[field.key];
    if (field.type === 'checkbox') {
      payload[field.key] = Boolean(value);
    } else if (field.type === 'datetime') {
      payload[field.key] = value && dayjs(value).isValid() ? dayjs(value).toISOString() : null;
    } else if (value === '') {
      payload[field.key] = null;
    } else {
      payload[field.key] = value;
    }
  });
  return payload;
}

function primaryKeyValue() {
  if (editingRecord.value) {
    return editingRecord.value[props.config.primaryKey];
  }
  const candidate = formState[props.config.primaryKey];
  return candidate || null;
}

async function handleUpdate() {
  const id = primaryKeyValue();
  if (!id) {
    emitLog('warn', 'Nothing selected.');
    return;
  }
  loading.value = true;
  try {
    await props.apiCall(getEndpoint(id), {
      method: 'PUT',
      body: JSON.stringify(buildPayload()),
    });
    emitLog('success', `${props.config.label} updated (${id}).`);
    await loadRecords(page.value);
  } catch (error) {
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  loading.value = true;
  try {
    await props.apiCall(props.config.path, {
      method: 'POST',
      body: JSON.stringify(buildPayload()),
    });
    emitLog('success', `${props.config.label} created.`);
    await loadRecords(1);
  } catch (error) {
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

async function handleDelete(record) {
  const target = record || editingRecord.value;
  if (!target) {
    emitLog('warn', 'Select a record to delete.');
    return;
  }
  const id = target[props.config.primaryKey];
  loading.value = true;
  try {
    await props.apiCall(getEndpoint(id), { method: 'DELETE' });
    emitLog('success', `${props.config.label} deleted (${id}).`);
    await loadRecords(page.value);
  } catch (error) {
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

function fieldDisabled(field) {
  if (field.readOnly && !(props.config.allowManualPrimaryKey && field.key === props.config.primaryKey && !isEditMode.value)) {
    return true;
  }
  if (field.key === props.config.primaryKey && props.config.allowManualPrimaryKey) {
    return isEditMode.value;
  }
  return modalLoading.value;
}

watch(
  () => props.config,
  () => {
    initForm();
    if (ready.value) {
      loadRecords(1);
    }
  },
  { immediate: true },
);

watch(ready, (isReady) => {
  if (isReady) {
    loadRecords(1);
  }
});

function openCreateModal() {
  modalMode.value = 'create';
  editingRecord.value = null;
  populateForm(null);
  formModalOpen.value = true;
}

function openEditModal(record) {
  if (!record) {
    emitLog('warn', 'Record not found.');
    return;
  }
  modalMode.value = 'edit';
  editingRecord.value = record;
  populateForm(record);
  formModalOpen.value = true;
}

async function submitModal() {
  modalLoading.value = true;
  try {
    if (modalMode.value === 'edit') {
      await handleUpdate();
    } else {
      await handleCreate();
    }
    formModalOpen.value = false;
  } finally {
    modalLoading.value = false;
  }
}

const modalTitle = computed(() => (modalMode.value === 'edit' ? `Edit ${props.config.label}` : `Create ${props.config.label}`));
const bulkModalTitle = computed(() => `Bulk import to ${props.config.label}`);

function resetBulkState() {
  bulkInput.value = '';
  bulkStatus.total = 0;
  bulkStatus.completed = 0;
  bulkStatus.errors = [];
  bulkStatus.running = false;
}

function openBulkModal() {
  resetBulkState();
  bulkModalOpen.value = true;
}

function parseBulkRecords(rawText) {
  if (!rawText.trim()) {
    throw new Error('Provide JSON array or newline-delimited JSON objects.');
  }
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('JSON must be an array.');
  } catch (_error) {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      throw new Error('Provide JSON array or newline-delimited JSON objects.');
    }
    return lines.map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Line ${idx + 1}: ${error.message}`);
      }
    });
  }
}

async function executeBulkImport() {
  if (!ready.value) {
    throw new Error('API client unavailable.');
  }
  const records = parseBulkRecords(bulkInput.value);
  if (!records.length) {
    throw new Error('No records found.');
  }
  bulkStatus.total = records.length;
  bulkStatus.completed = 0;
  bulkStatus.errors = [];
  bulkStatus.running = true;
  for (const [index, record] of records.entries()) {
    try {
      await props.apiCall(props.config.path, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      bulkStatus.completed += 1;
    } catch (error) {
      bulkStatus.errors.push(`Item ${index + 1}: ${error.message}`);
    }
  }
}

async function handleBulkSubmit() {
  try {
    await executeBulkImport();
    if (bulkStatus.errors.length === 0) {
      emitLog('success', `Bulk imported ${bulkStatus.completed} records to ${props.config.label}.`);
    } else {
      emitLog('warn', `Bulk import partially completed (${bulkStatus.completed}/${bulkStatus.total}).`);
    }
    await loadRecords(1);
  } catch (error) {
    emitLog('error', error.message);
    bulkStatus.errors.push(error.message);
  } finally {
    bulkStatus.running = false;
  }
}
</script>

<template>
  <div class="viewer">
    <div class="viewer-header">
      <div>
        <h3>{{ config.label }}</h3>
        <p>{{ config.description }}</p>
      </div>
      <div class="viewer-controls">
        <a-space>
          <a-button size="small" @click="loadRecords(page)" :loading="loading">Refresh</a-button>
          <a-button size="small" type="primary" @click="openCreateModal">New</a-button>
          <a-button size="small" @click="openBulkModal">Bulk import</a-button>
        </a-space>
      </div>
    </div>

    <div class="viewer-body single">
      <div class="panel table-panel">
        <div class="table-scroll">
          <a-table
            :columns="tableColumns"
            :data-source="rows"
            :loading="loading"
            :pagination="false"
            :row-key="(row) => row[config.primaryKey] ?? JSON.stringify(row)"
            size="small"
            class="viewer-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <a-space size="small">
                  <a-button type="link" size="small" @click="openEditModal(record)">Edit</a-button>
                  <a-popconfirm
                    title="Delete this record?"
                    ok-text="Delete"
                    ok-type="danger"
                    @confirm="() => handleDelete(record)"
                  >
                    <a-button type="link" size="small" danger>Delete</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
              <template v-else>
                <span>{{ formattedCell(column, record) }}</span>
              </template>
            </template>
          </a-table>
        </div>
        <span v-if="message" class="viewer-message">{{ message }}</span>
        <div class="viewer-footer">
          <a-pagination
            size="small"
            :current="page"
            :total="totalCount || rows.length"
            :page-size="pageSize"
            :show-size-changer="false"
            @change="loadRecords"
          />
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="formModalOpen"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      @ok="submitModal"
      @cancel="formModalOpen = false"
    >
      <a-form layout="vertical">
        <a-row :gutter="[12, 12]">
          <a-col
            v-for="field in config.fields"
            :key="field.key"
            :xs="24"
            :sm="12"
          >
            <a-form-item :label="field.label">
              <template v-if="field.type === 'checkbox'">
                <a-switch v-model:checked="formState[field.key]" :disabled="fieldDisabled(field)" />
              </template>
              <template v-else-if="field.type === 'textarea'">
                <a-textarea
                  v-model:value="formState[field.key]"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                  :disabled="fieldDisabled(field)"
                />
              </template>
              <template v-else-if="field.type === 'datetime'">
                <a-date-picker
                  show-time
                  style="width: 100%"
                  v-model:value="formState[field.key]"
                  :disabled="fieldDisabled(field)"
                />
              </template>
              <template v-else>
                <a-input
                  v-model:value="formState[field.key]"
                  :disabled="fieldDisabled(field)"
                />
              </template>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="bulkModalOpen"
      :title="bulkModalTitle"
      :confirm-loading="bulkStatus.running"
      ok-text="Run import"
      @ok="handleBulkSubmit"
      @cancel="bulkModalOpen = false"
    >
      <a-alert
        type="info"
        show-icon
        message="Paste JSON array or newline-delimited JSON objects. Records will be POSTed sequentially."
        class="mb"
      />
      <a-textarea
        v-model:value="bulkInput"
        :auto-size="{ minRows: 8, maxRows: 14 }"
        placeholder='[{"field":"value"}]'
        :disabled="bulkStatus.running"
      />
      <p v-if="bulkProgressText" class="bulk-progress">{{ bulkProgressText }}</p>
      <a-alert
        v-if="bulkStatus.errors.length"
        type="error"
        show-icon
        class="mt"
        :message="`${bulkStatus.errors.length} errors encountered`"
      >
        <template #description>
          <ul class="bulk-error-list">
            <li v-for="error in bulkStatus.errors" :key="error">{{ error }}</li>
          </ul>
        </template>
      </a-alert>
    </a-modal>
  </div>
</template>
