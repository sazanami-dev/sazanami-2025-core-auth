<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataViewer from './components/DataViewer.vue';
import EventLog from './components/EventLog.vue';
import { createApiClient } from './utils/api.js';

const STORAGE_KEY = 'adminApiKey';
const STORAGE_BASE = 'adminApiBaseUrl';

const savedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
const savedBase = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_BASE) : '';

const apiKey = ref(savedKey || '');
const apiBaseUrl = ref(savedBase || (typeof window !== 'undefined' ? window.location.origin : ''));
const activeTab = ref('overview');
const logs = ref([]);
const settingsModalOpen = ref(false);
const consoleDrawerOpen = ref(false);

const settingsForm = reactive({
  apiKey: apiKey.value,
  apiBaseUrl: apiBaseUrl.value,
});

const authStatus = reactive({
  label: 'Unknown',
  tone: 'default',
  detail: 'Not checked yet',
});

const schemaState = reactive({
  models: [],
  loading: false,
  error: '',
  updatedAt: '',
});

const isConfigured = computed(() => Boolean(apiKey.value && apiBaseUrl.value));
const apiClient = computed(() => {
  if (!isConfigured.value) {
    return null;
  }
  try {
    return createApiClient({
      baseUrl: apiBaseUrl.value,
      apiKey: apiKey.value,
    });
  } catch (_error) {
    return null;
  }
});

const viewerModels = computed(() => schemaState.models || []);
const tabItems = computed(() => [
  { id: 'overview', label: 'Overview', type: 'overview' },
  ...viewerModels.value.map((model) => ({ id: model.key, label: model.label, type: 'viewer' })),
  { id: 'events', label: 'Events', type: 'events' },
]);
const activeModel = computed(() => viewerModels.value.find((model) => model.key === activeTab.value) || null);
const isOverviewTab = computed(() => activeTab.value === 'overview');
const isEventsTab = computed(() => activeTab.value === 'events');

watch(tabItems, (items) => {
  if (!items.some((item) => item.id === activeTab.value)) {
    activeTab.value = 'overview';
  }
});

watch(settingsModalOpen, (open) => {
  if (open) {
    settingsForm.apiKey = apiKey.value;
    settingsForm.apiBaseUrl = apiBaseUrl.value;
  }
});

function pushLog(level, message) {
  const entry = {
    id: `${Date.now()}-${Math.random()}`,
    level,
    message,
    time: new Date().toLocaleTimeString('ja-JP'),
  };
  logs.value = [entry, ...logs.value].slice(0, 80);
}

function handleChildLog(entry) {
  if (entry?.level && entry?.message) {
    pushLog(entry.level, entry.message);
  }
}

function persistSettings() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, apiKey.value);
  localStorage.setItem(STORAGE_BASE, apiBaseUrl.value);
}

function saveSettings() {
  apiKey.value = settingsForm.apiKey.trim();
  apiBaseUrl.value = settingsForm.apiBaseUrl.trim().replace(/\/$/, '');
  persistSettings();
  pushLog('info', 'API settings saved.');
  settingsModalOpen.value = false;
  verifyKey();
  loadSchema();
}

async function verifyKey() {
  if (!apiClient.value) {
    authStatus.label = 'Missing config';
    authStatus.tone = 'warning';
    authStatus.detail = 'Set API key / Base URL';
    return;
  }
  authStatus.label = 'Checking...';
  authStatus.tone = 'processing';
  authStatus.detail = 'Contacting API';
  try {
    const response = await apiClient.value('/manage/api/checkKey', { method: 'GET' });
    if (response?.valid) {
      authStatus.label = 'Verified';
      authStatus.tone = 'success';
      authStatus.detail = `Checked at ${new Date().toLocaleTimeString('ja-JP')}`;
      pushLog('success', 'API key verified.');
    } else {
      authStatus.label = 'Invalid';
      authStatus.tone = 'error';
      authStatus.detail = 'API rejected the key';
      pushLog('error', 'API key rejected.');
    }
  } catch (error) {
    authStatus.label = 'Error';
    authStatus.tone = 'error';
    authStatus.detail = error.message;
    pushLog('error', error.message);
  }
}

async function loadSchema() {
  if (!apiClient.value) {
    schemaState.models = [];
    schemaState.error = '';
    return;
  }
  schemaState.loading = true;
  schemaState.error = '';
  try {
    const response = await apiClient.value('/manage/api/schema', { method: 'GET' });
    schemaState.models = Array.isArray(response?.models) ? response.models : [];
    schemaState.updatedAt = response?.updatedAt || '';
    pushLog('success', `Loaded ${schemaState.models.length} model definitions.`);
  } catch (error) {
    schemaState.models = [];
    schemaState.error = error.message;
    pushLog('error', `Failed to load schema: ${error.message}`);
  } finally {
    schemaState.loading = false;
  }
}

onMounted(() => {
  if (isConfigured.value) {
    verifyKey();
    loadSchema();
  }
});

watch(
  () => apiClient.value,
  (client) => {
    if (client) {
      loadSchema();
    }
  },
);
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand-block">
        <h1>Management Console</h1>
      </div>
      <div class="header-actions">
        <a-tag :color="authStatus.tone">{{ authStatus.label }}</a-tag>
        <span class="status-text">{{ authStatus.detail }}</span>
        <a-button size="small" @click="consoleDrawerOpen = true">Console</a-button>
        <a-button type="primary" size="small" @click="settingsModalOpen = true">Settings</a-button>
      </div>
    </header>

    <main class="app-main">
      <nav class="tab-bar">
        <button
          v-for="tab in tabItems"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          type="button"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <section class="tab-surface">
        <div v-if="isOverviewTab" class="overview-panel">
          <h2>Overview</h2>
          <p>Schema powered front-end. Add/modify viewers by updating the server-side schema response.</p>
          <ul>
            <li>Use the header menu to open API settings.</li>
            <li>Each viewer lists paged records with inline CRUD.</li>
            <li>Console output lives in the toggleable drawer.</li>
          </ul>
          <a-alert
            v-if="schemaState.updatedAt"
            type="info"
            show-icon
            :message="`Schema refreshed at ${schemaState.updatedAt}`"
          />
          <a-alert
            v-if="schemaState.error"
            type="error"
            show-icon
            :message="schemaState.error"
            class="mt"
          />
        </div>

        <template v-else-if="activeModel">
          <KeepAlive>
            <DataViewer
              :key="activeModel.key"
              :config="activeModel"
              :api-call="apiClient"
              @log="handleChildLog"
            />
          </KeepAlive>
        </template>

        <EventLog v-else-if="isEventsTab" :api-call="apiClient" @log="handleChildLog" />
      </section>
    </main>

    <a-modal
      v-model:open="settingsModalOpen"
      title="API Connection"
      ok-text="Save"
      @ok="saveSettings"
    >
      <a-form layout="vertical">
        <a-form-item label="API Base URL">
          <a-input v-model:value="settingsForm.apiBaseUrl" placeholder="https://example.com" />
        </a-form-item>
        <a-form-item label="Manage API Key">
          <a-input-password v-model:value="settingsForm.apiKey" placeholder="••••••••" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="consoleDrawerOpen"
      title="Console"
      placement="right"
      width="360"
    >
      <a-list
        :data-source="logs"
        size="small"
        :locale="{ emptyText: 'No log entries yet.' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="log-entry" :class="item.level">
              <span class="log-time">{{ item.time }}</span>
              <span class="log-level">{{ item.level }}</span>
              <span class="log-message">{{ item.message }}</span>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </a-drawer>
  </div>
</template>
