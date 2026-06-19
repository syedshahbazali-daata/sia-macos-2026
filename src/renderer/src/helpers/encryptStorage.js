import { EncryptStorage } from 'encrypt-storage';

// export  const encryptStorage = new EncryptStorage(process.env.REACT_APP_Encrypt_Storage_SECRET_KEY, {

// git ignores .env variables that's why using key directly here until deployment
  export  const encryptStorage = new EncryptStorage('a3ff29af1279f52221acf5943a447b3f974126b1988f5f1bcbc5e79447ec61b1', {
    prefix: '@v.1.0',
    storageType: 'localStorage',
  });
