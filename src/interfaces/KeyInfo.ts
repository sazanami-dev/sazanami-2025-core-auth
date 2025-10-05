export interface KeyInfo {
  type: 'private' | 'public';
  keyType: 'rsa' | 'ec';
  modulusLength?: number; // RSA specific
  namedCurve?: string;   // EC specific
  fingerprint?: string; // SHA-256 fingerprint for public keys
  cryptoAlgorithm: string; // e.g., 'RS256', 'ES256', for Signing/Verification JWT
}
