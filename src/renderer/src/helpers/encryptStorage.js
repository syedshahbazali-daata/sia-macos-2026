import { EncryptStorage } from 'encrypt-storage'

// This key obfuscates localStorage data on the user's own machine.
// It is not a server secret — Electron apps have no server-side key storage.
// Rotate this value and bump the prefix when migrating stored data formats.
const STORAGE_KEY = 'a3ff29af1279f52221acf5943a447b3f974126b1988f5f1bcbc5e79447ec61b1'

export const encryptStorage = new EncryptStorage(STORAGE_KEY, {
  prefix: '@v.1.0',
  storageType: 'localStorage',
})
