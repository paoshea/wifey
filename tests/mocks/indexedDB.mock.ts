class MockIDBDatabase {
    private stores: Map<string, Map<string, any>> = new Map();
    public objectStoreNames = {
        contains: (name: string) => this.stores.has(name)
    };

    createObjectStore(name: string, options: { keyPath: string }) {
        const store = new Map();
        this.stores.set(name, store);
        return new MockIDBObjectStore(store, options.keyPath);
    }

    transaction(storeNames: string[], mode: string) {
        return new MockIDBTransaction(storeNames.map(name => {
            const store = this.stores.get(name);
            if (!store) throw new Error(`Store ${name} not found`);
            return [name, store] as [string, Map<string, any>];
        }));
    }

    close() {
        this.stores.clear();
    }
}

class MockIDBObjectStore {
    constructor(private store: Map<string, any>, private keyPath: string) { }

    createIndex(name: string, keyPath: string) {
        // No-op for mock
        return {};
    }

    put(value: any) {
        const key = value[this.keyPath];
        this.store.set(key, value);
        return {
            onerror: null,
            onsuccess: null
        };
    }

    get(key: string) {
        const value = this.store.get(key);
        return {
            onerror: null,
            onsuccess: null,
            result: value
        };
    }

    getAll() {
        return {
            onerror: null,
            onsuccess: null,
            result: Array.from(this.store.values())
        };
    }

    delete(key: string) {
        this.store.delete(key);
        return {
            onerror: null,
            onsuccess: null
        };
    }

    clear() {
        this.store.clear();
        return {
            onerror: null,
            onsuccess: null
        };
    }
}

class MockIDBTransaction {
    constructor(private stores: [string, Map<string, any>][]) { }

    objectStore(name: string) {
        const store = this.stores.find(([storeName]) => storeName === name);
        if (!store) throw new Error(`Store ${name} not found`);
        return new MockIDBObjectStore(store[1], 'id');
    }

    oncomplete: (() => void) | null = null;
}

export const mockIndexedDB = {
    open: (name: string, version: number) => {
        const db = new MockIDBDatabase();
        return {
            onerror: null,
            onupgradeneeded: null,
            onsuccess: null,
            result: db
        };
    },
    deleteDatabase: (name: string) => {
        return {
            onerror: null,
            onsuccess: null
        };
    }
};

// Setup mock IndexedDB
Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true
});
