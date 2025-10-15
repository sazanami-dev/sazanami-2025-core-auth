import express from 'express';

const CORE_AUTH_BASE_URL = process.env.CORE_AUTH_BASE_URL ?? 'http://localhost:3000';
const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(express.json());

app.get('/login', (_req, res) => {
  const url = new URL(`${CORE_AUTH_BASE_URL}/authenticate`);
  url.searchParams.set('redirectUrl', `http://localhost:${PORT}/callback`);
  url.searchParams.set('postbackUrl', `http://localhost:${PORT}/postback`);
  url.searchParams.set('state', 'demo-state');
  res.redirect(url.toString());
});

app.post('/postback', async (req, res) => {
  const { token, state } = req.body ?? {};
  console.log('postback received', { state });

  if (!token) {
    res.status(400).json({ message: 'token missing' });
    return;
  }

  const verifyRes = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const result = await verifyRes.json();
  console.log('verification result (postback):', result);
  res.status(204).end();
});

app.get('/callback', async (req, res) => {
  const token = req.query.token?.toString();
  const state = req.query.state?.toString();

  if (!token) {
    res.status(400).send('token missing');
    return;
  }

  const verifyRes = await fetch(`${CORE_AUTH_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const result = await verifyRes.json();
  res.json({ via: 'callback', state, verification: result });
});

app.listen(PORT, () => {
  console.log(`Node auth-flow example listening on http://localhost:${PORT}`);
  console.log('Visit /login to start the flow.');
});
