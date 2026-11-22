import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keysDirectory = resolve(projectRoot, 'services/identity/keys');
mkdirSync(keysDirectory, { recursive: true });
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
writeFileSync(resolve(keysDirectory, 'private.pem'), privateKey, { mode: 0o600 });
writeFileSync(resolve(keysDirectory, 'public.pem'), publicKey);
console.log(`RSA keys generated in ${keysDirectory}`);
