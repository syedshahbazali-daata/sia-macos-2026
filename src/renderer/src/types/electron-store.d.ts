// Declare the API exposed by the preload script
interface ElectronAPI {
  getStoreValue: (key: string, defaultValue?: any) => any;
  setStoreValue: (key: string, value: any) => void;
}

// Extend the window interface to include electron API
interface Window {
  api: ElectronAPI;
}
