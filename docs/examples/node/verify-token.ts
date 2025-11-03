const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';

export async function verifyToken(token: string) {
  const res = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error(`verify failed: ${res.status}`);
  }

  return res.json();
}
