<script setup>
import { computed, ref, watch } from 'vue';
import { formatDateTime } from '../utils/format.js';

const EVENT_PAGE_SIZE = 20;

const props = defineProps({
  apiCall: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['log']);

const entries = ref([]);
const loading = ref(false);
const page = ref(1);
const totalCount = ref(0);
const message = ref('');
const ready = computed(() => typeof props.apiCall === 'function');

const columns = [
  { title: 'Category', dataIndex: 'category', key: 'category' },
  { title: 'Reporter', dataIndex: 'reporter', key: 'reporter' },
  { title: 'Payload', dataIndex: 'payload', key: 'payload' },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
];

function emitLog(level, text) {
  emit('log', { level, message: text });
}

function categoryTag(entry) {
  const map = {
    security: 'red',
    performance: 'blue',
    usability: 'gold',
  };
  return map[String(entry?.category || '').toLowerCase()] || 'default';
}

function rowKey(row) {
  return row?.id ?? row?.createdAt ?? JSON.stringify(row || {});
}

function formatPayload(payload) {
  if (payload === null || payload === undefined) {
    return '-';
  }
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (_error) {
      return payload;
    }
  }
  if (typeof payload === 'object') {
    try {
      return JSON.stringify(payload, null, 2);
    } catch (_error) {
      return String(payload);
    }
  }
  return String(payload);
}

async function loadLogs(targetPage = 1) {
  if (!ready.value) {
    message.value = 'API client is not configured.';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const params = new URLSearchParams({
      page: String(Math.max(1, targetPage)),
      pageSize: String(EVENT_PAGE_SIZE),
    });
    const response = await props.apiCall(`/manage/api/event?${params.toString()}`, { method: 'GET' });
    const logs = Array.isArray(response?.data) ? response.data : [];
    const pagination = response?.pagination || {};
    entries.value = logs;
    page.value = Number(pagination.page) || targetPage;
    const count = Number(pagination.totalCount);
    totalCount.value = Number.isFinite(count) ? count : logs.length;
    if (logs.length === 0) {
      message.value = 'No events.';
    }
    emitLog('success', `Loaded ${logs.length} event entries.`);
  } catch (error) {
    entries.value = [];
    message.value = error.message;
    emitLog('error', error.message);
  } finally {
    loading.value = false;
  }
}

watch(
  ready,
  (isReady) => {
    if (isReady) {
      loadLogs(1);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="viewer">
    <div class="viewer-header">
      <div>
        <h3>Event Log</h3>
        <p>Recent audit events</p>
      </div>
      <div class="viewer-controls">
        <a-button size="small" @click="loadLogs(page)" :loading="loading">Refresh</a-button>
      </div>
    </div>

    <div class="viewer-body single">
      <div class="panel table-panel">
        <div class="table-scroll">
          <a-table
            :columns="columns"
            :data-source="entries"
            :pagination="false"
            :loading="loading"
            size="small"
            :row-key="rowKey"
            class="viewer-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'category'">
                <a-tag :color="categoryTag(record)">{{ record.category || 'other' }}</a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'payload'">
                <pre class="payload-json">{{ formatPayload(record.payload) }}</pre>
              </template>
              <template v-else-if="column.dataIndex === 'createdAt'">
                {{ formatDateTime(record.createdAt) }}
              </template>
              <template v-else>
                {{ record[column.dataIndex] || '-' }}
              </template>
            </template>
          </a-table>
        </div>
        <span v-if="message" class="viewer-message">{{ message }}</span>
        <a-pagination
          size="small"
          :current="page"
          :total="totalCount"
          :page-size="EVENT_PAGE_SIZE"
          :show-size-changer="false"
          class="mt"
          @change="loadLogs"
        />
      </div>
    </div>
  </div>
</template>
