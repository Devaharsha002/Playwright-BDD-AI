import '../tests/support/loadEnv.js';
import { cryptoUtil } from '../tests/support/cryptoUtil.js';

/**
 * CLI Tool to encrypt any secret using AES-256-CBC.
 * Usage:
 *   npm run azure:encrypt "MySecretPassword123!"
 *   tsx src/azure/encryptValue.ts "user@enterprise.internal"
 */
function runEncrypt(): void {
  const plainText = process.argv[2];

  if (!plainText) {
    console.log(`\nUsage: npm run azure:encrypt "<plaintext-string>"\n`);
    console.log(`Example: npm run azure:encrypt "SuperSecretPassword123!"`);
    process.exit(1);
  }

  console.log(`\n--- AES-256 Value Encryption Utility ---`);
  console.log(`Input Plaintext : ${plainText}`);

  try {
    const encrypted = cryptoUtil.encrypt(plainText);
    const decrypted = cryptoUtil.decrypt(encrypted);

    if (decrypted !== plainText) {
      throw new Error('Decryption self-check failed! Verification mismatch.');
    }

    console.log(`Encrypted Value : ${encrypted}`);
    console.log(`Format          : ivHex:cipherHex (Verified round-trip decryption)`);
    console.log(`\nCopy into cmeInfo.ts or .env:`);
    console.log(`"${encrypted}"\n`);
  } catch (err: any) {
    console.error(`Encryption error: ${err.message}`);
    process.exit(1);
  }
}

runEncrypt();
