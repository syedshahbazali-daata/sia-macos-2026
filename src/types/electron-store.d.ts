declare module 'electron-store' {
  interface Store<T> {
    set(key: string, value: any): void;
    get(key: string, defaultValue?: any): any;
    delete(key: string): void;
    clear(): void;
    has(key: string): boolean;
    size: number;
    store: T;
    path: string;
    openInEditor(): Promise<void>;
  }

  export default class Store<T> {
    constructor(settings?: T);
    set(key: string, value: any): void;
    get(key: string, defaultValue?: any): any;
    // Other methods...
  }
}
