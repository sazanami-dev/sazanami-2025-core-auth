export interface SignKey {
  keyType: 'rsa' | 'ec';
  modulusLength?: number; // RSA specific
  namedCurve?: string;   // EC specific
  cryptoAlgorithm: 'RS256' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
  privateKey: string; // PEM formatted key
  publicKey: string;  // PEM formatted key
  fingerprint: string; // SHA-256 fingerprint of the public key
  jwk?: {
    n?: string; // RSA modulus
    e?: string; // RSA public exponent
    crv?: string; // EC curve
    x?: string; // EC x coordinate
    y?: string; // EC y coordinate
  };
}

