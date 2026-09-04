import { cryptoUtil } from '../support/cryptoUtil.js';

export interface UserCredentials {
  encryptedUsername: string;
  encryptedPassword: string;
  role: string;
  description: string;
}

export interface DecryptedCredentials {
  username: string;
  password: string;
  role: string;
  description: string;
}

/**
 * Enterprise user registry with AES-256 encrypted credential blobs.
 * Format: "ivHex:cipherHex"
 */
export const cmeUsers: Record<string, UserCredentials> = {
  StandardUser: {
    encryptedUsername: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:0ce4cc4ca18df2d9656e510bb326c6134cc225d838cfecaf2fd36dac62dffe72308f90b3c57c21c0f7ebff96e5cdd4f9',
    encryptedPassword: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:7c31eea6518a340a0ebae0ad83df007da37c9e36ca002bd3b9a92df234f091fa',
    role: 'Standard CME Operations User',
    description: 'Read and write access to customer records and accounts'
  },
  AdminUser: {
    encryptedUsername: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:10c2236e7f60dd88d87f13de5417ec49a32cc865c9cf4bf0f4d330d1e25bd91ad84c97a5ba9a412a71f32548f142e302',
    encryptedPassword: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:a27f9a4f5cbc76f157d707e57f68cbd4b9a4abdd84587a28168132b9eb3df774',
    role: 'System Administrator',
    description: 'Full administrative access to settings, security roles, and auditing'
  },
  CmeOfficer: {
    encryptedUsername: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:b2b1ff3c9d7a5568c152c41d26e5b2e43d12d284f3796f581a7facb1b4624033',
    encryptedPassword: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:8d1dab110ca086fbeef1740eb3bdc1856269c6b551624d1d1349777205494d5a',
    role: 'Compliance & Approval Officer',
    description: 'Specialized approval permissions for high-value transactions'
  }
};

/**
 * Returns decrypted credentials for a given user alias.
 */
export function getDecryptedCredentials(userAlias: string): DecryptedCredentials {
  const user = cmeUsers[userAlias];
  if (!user) {
    throw new Error(`User alias '${userAlias}' was not found in cmeInfo registry.`);
  }

  return {
    username: cryptoUtil.decrypt(user.encryptedUsername),
    password: cryptoUtil.decrypt(user.encryptedPassword),
    role: user.role,
    description: user.description
  };
}
