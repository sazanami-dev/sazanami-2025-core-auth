const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';

export async function fetchJwks() {
  const res = await fetch(`${CORE_AUTH_BASE_URL}/.well-known/jwks.json`);

  if (!res.ok) {
    throw new Error(`jwks fetch failed: ${res.status}`);
  }

  return res.json();
}
