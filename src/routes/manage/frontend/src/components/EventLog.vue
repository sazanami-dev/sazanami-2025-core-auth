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
const totalPages = ref(1);
const totalCount = ref(0);
const message = ref('');
const ready = computed(() => typeof props.apiCall === 'function');

function emitLog(level, text) {
  emit('log', { level, message: text });
}

function badgeClass(category) {
  return `badge-${String(category || 'other').toLowerCase()}`;
}

async function loadLogs(targetPage = 1) {
  if (!ready.value) {
    message.value = 'API client is not configured.';
    return;
  }
  loading.value = true;
  message.value = 'Fetching events...';
  try {
    const params = new URLSearchParams({
      page: String(Math.max(1, targetPage)),
      pageSize: String(EVENT_PAGE_SIZE),
    });
    const response = await props.apiCall(`/manage/api/event?${params.toString()}`, {
      method: 'GET',
    });
    const logs = Array.isArray(response?.data) ? response.data : [];
    const pagination = response?.pagination || {};
    entries.value = logs;
    page.value = Number(pagination.page) || targetPage;
    totalPages.value = Math.max(1, Number(pagination.totalPages) || 1);
    const count = Number(pagination.totalCount);
    totalCount.value = Number.isFinite(count) ? count : logs.length;
    message.value = logs.length === 0 ? 'No events.' : '';
    emitLog('success', `Loaded ${logs.length} events`);
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

const pageLabel = computed(() => `Page ${page.value} / ${totalPages.value}` + (Number.isFinite(totalCount.value) ? ` (${totalCount.value})` : ''));
</script>

<template>
  <div class="viewer-card">
    <header class="viewer-header">
      <div>
        <h3>Event Log</h3>
        <p>Recent audit events</p>
      </div>
      <div class="viewer-actions">
        <button type="button" @click="loadLogs(page)" :disabled="loading || !ready">Refresh</button>
        <div class="pager">
          <button type="button" @click="loadLogs(page - 1)" :disabled="loading || page <= 1">Prev</button>
          <span>{{ pageLabel }}</span>
          <button type="button" @click="loadLogs(page + 1)" :disabled="loading || page >= totalPages">Next</button>
        </div>
      </div>
    </header>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Reporter</th>
            <th>Payload</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id ?? entry.createdAt">
            <td>
              <span class="badge" :class="badgeClass(entry.category)">{{ entry.category || 'other' }}</span>
            </td>
            <td>{{ entry.reporter || '-' }}</td>
            <td class="payload">{{ entry.payload || '-' }}</td>
            <td>{{ formatDateTime(entry.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="message" class="viewer-message">{{ message }}</p>
    </div>
  </div>
</template>
