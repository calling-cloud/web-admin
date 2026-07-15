import { getPublicKeyApi } from '#/api';

import forge from 'node-forge';

let publicKeyPromise:
  | Promise<ReturnType<typeof forge.pki.publicKeyFromPem>>
  | undefined;

async function publicKey() {
  publicKeyPromise ??= getPublicKeyApi().then(({ publicKey }) =>
    forge.pki.publicKeyFromPem(publicKey),
  );
  return publicKeyPromise;
}

export async function encryptSensitiveText(value: string) {
  const encrypted = (await publicKey()).encrypt(value, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });
  return forge.util.encode64(encrypted);
}
