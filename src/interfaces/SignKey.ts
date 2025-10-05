export interface SignKey {
  keyType: 'rsa' | 'ec';
  modulusLength?: number; // RSA specific
  namedCurve?: string;   // EC specific
  cryptoAlgorithm: string; // e.g., 'RS256', 'ES256', for Signing/Verification JWT
  privateKey: string; // PEM formatted key
  publicKey: string;  // PEM formatted key
  fingerprint: string; // SHA-256 fingerprint of the public key
}

