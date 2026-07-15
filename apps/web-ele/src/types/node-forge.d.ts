declare module 'node-forge' {
  interface PublicKey {
    encrypt(
      value: string,
      scheme: 'RSA-OAEP',
      options: { md: unknown; mgf1: { md: unknown } },
    ): string;
  }

  const forge: {
    md: { sha256: { create(): unknown } };
    pki: { publicKeyFromPem(pem: string): PublicKey };
    util: { encode64(value: string): string };
  };

  export default forge;
}
