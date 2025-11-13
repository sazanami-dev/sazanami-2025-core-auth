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

const pageSize = computed(() => props.config?.pageSize || 20);
const ready = computed(() => typeof props.apiCall === 'function');
const modalTitle = computed(() => (modalMode.value === 'edit' ? `Edit ${props.config.label}` : `Create ${props.config.label}`));

const tableColumns = computed(() => {
  const base = (props.config?.columns || []).map((column) => ({
    title: column.label,
    dataIndex: column.key,
    key: column.key,
  }));
  base.push({
    title: 'Actions',
    key: '__actions',
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
  const format = column.format || column.type;
  switch (format) {
    case 'boolean':
      return formatBoolean(raw);
    case 'datetime':
      return formatDateTime(raw);
    default:
      return raw ?? '';
  }
}

function getEndpoint(id) {
  const base = props.config.path || '';
  if (!id) {
    return base;
  }
  return `${base}/${encodeURIComponent(id)}`;
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
    const response = await props.apiCall(`${props.config.path}?${params.toString()}`, {
      method: 'GET',
    });
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
  if (field.readOnly && !(props.config.allowManualPrimaryKey && field.key === props.config.primaryKey && modalMode.value === 'create')) {
    return true;
  }
  if (field.key === props.config.primaryKey && props.config.allowManualPrimaryKey) {
    return modalMode.value === 'edit';
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

const tableRowKey = (row) => row?.[props.config.primaryKey] ?? JSON.stringify(row || {});
</script>

<template>
  <div class="viewer">
    <div class="viewer-header">
      <div>
        <h3>{{ config.label }}</h3>
        <p>{{ config.description }}</p>
      </div>
      <div class="viewer-controls">
        <a-button size="small" @click="loadRecords(page)" :loading="loading">Refresh</a-button>
        <a-button size="small" type="primary" @click="openCreateModal">New</a-button>
      </div>
    </div>

    <div class="viewer-body single">
      <div class="panel table-panel">
        <div class="table-scroll data-table-scroll">
          <a-table
            :columns="tableColumns"
            :data-source="rows"
            :loading="loading"
            :pagination="false"
            size="small"
            :row-key="tableRowKey"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === '__actions'">
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
        <a-pagination
          size="small"
          :current="page"
          :total="totalCount || rows.length"
          :page-size="pageSize"
          :show-size-changer="false"
          class="mt"
          @change="loadRecords"
        />
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
  </div>
</template>
