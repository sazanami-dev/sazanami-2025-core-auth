<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import DataViewer from './components/DataViewer.vue';
import EventLog from './components/EventLog.vue';
import { createApiClient } from './utils/api.js';
import { modelConfigs } from './models.js';

const STORAGE_KEY = 'adminApiKey';
const STORAGE_BASE = 'adminApiBaseUrl';

const savedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
const savedBase = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_BASE) : '';

const apiKey = ref(savedKey || '');
const apiBaseUrl = ref(savedBase || (typeof window !== 'undefined' ? window.location.origin : ''));

const settingsForm = reactive({
  apiKey: apiKey.value,
  apiBaseUrl: apiBaseUrl.value,
});

const authStatus = reactive({
  label: 'Unknown',
  tone: 'neutral',
  details: 'Not checked yet.',
});

const tabs = [
  { id: 'overview', label: 'Overview', type: 'overview' },
  ...modelConfigs.map((config) => ({
    id: config.key,
    label: config.label,
    type: 'viewer',
    config,
  })),
  { id: 'events', label: 'Events', type: 'events' },
];

const activeTab = ref(tabs[0].id);
const logs = ref([]);

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

function pushLog(level, message) {
  const entry = {
    id: `${Date.now()}-${Math.random()}`,
    level,
    message,
    time: new Date().toLocaleTimeString('ja-JP'),
  };
  logs.value = [entry, ...logs.value].slice(0, 60);
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
  verifyKey();
}

async function verifyKey() {
  if (!apiClient.value) {
    authStatus.label = 'Missing config';
    authStatus.tone = 'warn';
    authStatus.details = 'Set API key / Base URL';
    return;
  }
  authStatus.label = 'Checking...';
  authStatus.tone = 'loading';
  authStatus.details = 'Contacting API';
  try {
    const response = await apiClient.value('/manage/api/checkKey', { method: 'GET' });
    if (response?.valid) {
      authStatus.label = 'Verified';
      authStatus.tone = 'ok';
      authStatus.details = `Checked at ${new Date().toLocaleTimeString('ja-JP')}`;
      pushLog('success', 'API key verified.');
    } else {
      authStatus.label = 'Invalid';
      authStatus.tone = 'error';
      authStatus.details = 'API rejected the key';
      pushLog('error', 'API key rejected.');
    }
  } catch (error) {
    authStatus.label = 'Error';
    authStatus.tone = 'error';
    authStatus.details = error.message;
    pushLog('error', error.message);
  }
}

onMounted(() => {
  if (isConfigured.value) {
    verifyKey();
  }
});

const viewerTabs = tabs.filter((tab) => tab.type === 'viewer');
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <h1>Management Console</h1>
        <p>Simple admin surface powered by the manage API</p>
      </div>
      <div class="status" :class="authStatus.tone">
        <strong>{{ authStatus.label }}</strong>
        <small>{{ authStatus.details }}</small>
      </div>
    </header>

    <section class="settings-card">
      <form @submit.prevent="saveSettings" class="settings-form">
        <label>
          <span>API Base URL</span>
          <input v-model="settingsForm.apiBaseUrl" type="text" placeholder="https://example.com" />
        </label>
        <label>
          <span>Manage API Key</span>
          <input v-model="settingsForm.apiKey" type="password" placeholder="••••••" />
        </label>
        <div class="settings-actions">
          <button type="submit">Save</button>
          <button type="button" @click="verifyKey">Recheck</button>
        </div>
      </form>
    </section>

    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        type="button"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="content-grid">
      <section class="tab-area">
        <div v-if="activeTab === 'overview'" class="card">
          <h2>Overview</h2>
          <p>Use the tabs to inspect and mutate data models. The console reads whatever the API returns, so schema tweaks rarely require frontend changes.</p>
          <ul>
            <li>Save an API key + Base URL to unlock data viewers.</li>
            <li>Each viewer lists 20 records per page with CRUD actions.</li>
            <li>The event log shows the freshest audit entries.</li>
          </ul>
        </div>

        <DataViewer
          v-for="tab in viewerTabs"
          v-show="activeTab === tab.id"
          :key="tab.id"
          :config="tab.config"
          :api-call="apiClient"
          @log="handleChildLog"
        />

        <EventLog
          v-show="activeTab === 'events'"
          :api-call="apiClient"
          @log="handleChildLog"
        />
      </section>

      <aside class="log-panel card">
        <div class="log-header">
          <h3>Console</h3>
          <small>latest {{ logs.length }} entries</small>
        </div>
        <div class="log-body">
          <p v-if="logs.length === 0" class="muted">No log entries yet.</p>
          <ul>
            <li v-for="entry in logs" :key="entry.id" :class="entry.level">
              <span>{{ entry.time }}</span>
              <strong>{{ entry.level }}</strong>
              <span>{{ entry.message }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
