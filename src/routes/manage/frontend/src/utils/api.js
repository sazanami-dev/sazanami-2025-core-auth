export function createApiClient({ baseUrl, apiKey }) {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  const key = String(apiKey || '');

  async function apiCall(endpoint, options = {}) {
    if (!normalizedBase || !key) {
      throw new Error('API base URL or key is missing');
    }
    const url = `${normalizedBase}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-manage-key': key,
      ...(options.headers || {}),
    };
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Request failed (${response.status}) ${body}`.trim());
    }
    if (response.status === 204) {
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    return response.text();
  }

  return apiCall;
}
