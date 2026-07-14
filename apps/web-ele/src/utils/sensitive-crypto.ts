import { getPublicKeyApi } from '#/api';

let publicKeyPromise: Promise<CryptoKey> | undefined;

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function publicKey() {
  publicKeyPromise ??= getPublicKeyApi().then(({ publicKey }) =>
    crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(publicKey),
      { hash: 'SHA-256', name: 'RSA-OAEP' },
      false,
      ['encrypt'],
    ),
  );
  return publicKeyPromise;
}

export async function encryptSensitiveText(value: string) {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    await publicKey(),
    new TextEncoder().encode(value),
  );
  const bytes = new Uint8Array(encrypted);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
