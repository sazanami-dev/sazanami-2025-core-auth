import { fetchJwks } from './fetch-jwks';
import { verifyToken } from './verify-token';

async function main() {
  try {
    const jwks = await fetchJwks();
    console.log('Fetched JWKS:', JSON.stringify(jwks, null, 2));
  } catch (err) {
    console.error('Failed to fetch JWKS:', err);
    process.exitCode = 1;
    return;
  }

  const tokenFromCli = process.argv[2];
  const tokenFromEnv = process.env.CORE_AUTH_SAMPLE_TOKEN;
  const token = tokenFromCli ?? tokenFromEnv;

  if (!token) {
    console.log('No token provided. Set CORE_AUTH_SAMPLE_TOKEN or pass one as an argument to verify.');
    return;
  }

  try {
    const verification = await verifyToken(token);
    console.log('Verification response:', JSON.stringify(verification, null, 2));
  } catch (err) {
    console.error('Failed to verify token:', err);
    process.exitCode = 1;
  }
}

main();
