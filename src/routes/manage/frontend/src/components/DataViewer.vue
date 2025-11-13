<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { PAGE_SIZE } from '../models.js';
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
const selectedId = ref(null);
const formData = reactive({});
const pageSize = computed(() => props.config.pageSize || PAGE_SIZE);
const ready = computed(() => typeof props.apiCall === 'function');

function emitLog(level, text) {
  emit('log', {
    level,
    message: text,
  });
}

function initForm() {
  props.config.fields.forEach((field) => {
    if (field.type === 'checkbox') {
      formData[field.key] = false;
    } else {
      formData[field.key] = '';
    }
  });
}

function toLocalInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalInput(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
}

function populateForm(record) {
  props.config.fields.forEach((field) => {
    const value = record ? record[field.key] : null;
    if (field.type === 'checkbox') {
      formData[field.key] = Boolean(value);
    } else if (field.type === 'datetime') {
      formData[field.key] = value ? toLocalInput(value) : '';
    } else {
      formData[field.key] = value ?? '';
    }
  });
}

function resetDetail(record = null) {
  selectedId.value = record ? record[props.config.primaryKey] ?? null : null;
  populateForm(record);
}

function getEndpoint(id) {
  if (!id) {
    return props.config.path;
  }
  return `${props.config.path}/${encodeURIComponent(id)}`;
}

function formatCell(column, record) {
  const value = record?.[column.key];
  if (column.formatter) {
    try {
      return column.formatter(value, record);
    } catch (_error) {
      return value;
    }
  }
  if (column.key.toLowerCase().includes('date')) {
    return formatDateTime(value);
  }
  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }
  return value ?? '';
}

async function loadRecords(targetPage = 1) {
  if (!ready.value) {
    message.value = 'API client is not configured.';
    return;
  }
  loading.value = true;
  message.value = 'Loading records...';
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

    if (selectedId.value) {
      const next = data.find((row) => row[props.config.primaryKey] === selectedId.value);
      if (next) {
        resetDetail(next);
      } else {
        resetDetail(null);
      }
    }
    if (!selectedId.value && data.length > 0) {
      resetDetail(data[0]);
    }
    message.value = data.length === 0 ? 'No records yet.' : '';
    emitLog('success', `Loaded ${data.length} ${props.config.label.toLowerCase()}`);
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
  props.config.fields.forEach((field) => {
    const value = formData[field.key];
    if (field.type === 'checkbox') {
      payload[field.key] = Boolean(value);
    } else if (field.type === 'datetime') {
      payload[field.key] = value ? fromLocalInput(value) : null;
    } else if (value === '') {
      payload[field.key] = null;
    } else {
      payload[field.key] = value;
    }
  });
  return payload;
}

function primaryKeyValue() {
  if (selectedId.value) {
    return selectedId.value;
  }
  const candidate = formData[props.config.primaryKey];
  return candidate || null;
}

async function handleUpdate() {
  const id = primaryKeyValue();
  if (!id) {
    emitLog('warn', 'Nothing selected for update.');
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

async function handleDelete() {
  if (!selectedId.value) {
    emitLog('warn', 'Select a record before deleting.');
    return;
  }
  loading.value = true;
  const id = selectedId.value;
  try {
    await props.apiCall(getEndpoint(id), {
      method: 'DELETE',
    });
    emitLog('success', `${props.config.label} deleted (${id}).`);
    resetDetail(null);
    await loadRecords(page.value);
  } catch (error) {
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

function fieldDisabled(field) {
  if (field.readOnly && !(props.config.allowManualPrimaryKey && field.key === props.config.primaryKey)) {
    return true;
  }
  if (field.key === props.config.primaryKey && props.config.allowManualPrimaryKey) {
    return loading.value || Boolean(selectedId.value);
  }
  return loading.value;
}

watch(
  () => props.config,
  () => {
    initForm();
    resetDetail(null);
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

const pageLabel = computed(() => `Page ${page.value} / ${totalPages.value}` + (Number.isFinite(totalCount.value) ? ` (${totalCount.value})` : ''));
</script>

<template>
  <div class="viewer-card">
    <header class="viewer-header">
      <div>
        <h3>{{ config.label }}</h3>
        <p>{{ config.description }}</p>
      </div>
      <div class="viewer-actions">
        <button type="button" @click="loadRecords(page)" :disabled="loading || !ready">Refresh</button>
        <div class="pager">
          <button type="button" @click="loadRecords(page - 1)" :disabled="loading || page <= 1">Prev</button>
          <span>{{ pageLabel }}</span>
          <button type="button" @click="loadRecords(page + 1)" :disabled="loading || page >= totalPages">Next</button>
        </div>
      </div>
    </header>

    <div class="viewer-body">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-for="column in config.columns" :key="column.key">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row[config.primaryKey] ?? JSON.stringify(row)"
              :class="{ selected: selectedId === (row[config.primaryKey] ?? null) }"
              @click="resetDetail(row)"
            >
              <td v-for="column in config.columns" :key="column.key">
                {{ formatCell(column, row) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="message" class="viewer-message">{{ message }}</p>
      </div>

      <form class="detail-form" @submit.prevent="handleUpdate">
        <h4>Detail</h4>
        <div class="fields">
          <label v-for="field in config.fields" :key="field.key">
            <span>{{ field.label }}</span>
            <textarea
              v-if="field.type === 'textarea'"
              v-model="formData[field.key]"
              :disabled="fieldDisabled(field)"
            />
            <input
              v-else-if="field.type === 'checkbox'"
              type="checkbox"
              v-model="formData[field.key]"
              :disabled="fieldDisabled(field)"
            />
            <input
              v-else-if="field.type === 'datetime'"
              type="datetime-local"
              v-model="formData[field.key]"
              :disabled="fieldDisabled(field)"
            />
            <input
              v-else
              type="text"
              v-model="formData[field.key]"
              :disabled="fieldDisabled(field)"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="loading || !selectedId">Update</button>
          <button type="button" @click="handleCreate" :disabled="loading">Create</button>
          <button type="button" @click="handleDelete" :disabled="loading || !selectedId">Delete</button>
          <button type="button" @click="resetDetail(null)" :disabled="loading">Clear</button>
        </div>
      </form>
    </div>
  </div>
</template>
