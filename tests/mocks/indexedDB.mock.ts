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
        const transaction = new MockIDBTransaction(storeNames.map(name => {
            const store = this.stores.get(name);
            if (!store) throw new Error(`Store ${name} not found`);
            return [name, store] as [string, Map<string, any>];
        }));
        return transaction;
    }

    close() {
        this.stores.clear();
    }
}

class MockIDBObjectStore {
    constructor(private store: Map<string, any>, private keyPath: string) { }

    createIndex(name: string, keyPath: string) {
        return {};
    }

    put(value: any) {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any,
            transaction: {
                oncomplete: null as (() => void) | null
            }
        };

        Promise.resolve().then(() => {
            try {
                const key = value[this.keyPath];
                this.store.set(key, { ...value });
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: undefined } });
                }
                if (request.transaction.oncomplete) {
                    request.transaction.oncomplete();
                }
            } catch (error) {
                if (request.onerror) {
                    request.onerror({ target: { error } });
                }
            }
        });

        return request;
    }

    get(key: string) {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any
        };

        Promise.resolve().then(() => {
            try {
                const value = this.store.get(key);
                request.result = value ? { ...value } : null;
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: request.result } });
                }
            } catch (error) {
                if (request.onerror) {
                    request.onerror({ target: { error } });
                }
            }
        });

        return request;
    }

    getAll() {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any
        };

        Promise.resolve().then(() => {
            try {
                const values = Array.from(this.store.values()).map(value => ({ ...value }));
                request.result = values;
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: values } });
                }
            } catch (error) {
                if (request.onerror) {
                    request.onerror({ target: { error } });
                }
            }
        });

        return request;
    }

    delete(key: string) {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any,
            transaction: {
                oncomplete: null as (() => void) | null
            }
        };

        Promise.resolve().then(() => {
            try {
                this.store.delete(key);
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: undefined } });
                }
                if (request.transaction.oncomplete) {
                    request.transaction.oncomplete();
                }
            } catch (error) {
                if (request.onerror) {
                    request.onerror({ target: { error } });
                }
            }
        });

        return request;
    }

    clear() {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any,
            transaction: {
                oncomplete: null as (() => void) | null
            }
        };

        Promise.resolve().then(() => {
            try {
                this.store.clear();
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: undefined } });
                }
                if (request.transaction.oncomplete) {
                    request.transaction.oncomplete();
                }
            } catch (error) {
                if (request.onerror) {
                    request.onerror({ target: { error } });
                }
            }
        });

        return request;
    }
}

class MockIDBTransaction {
    public oncomplete: (() => void) | null = null;

    constructor(private stores: [string, Map<string, any>][]) { }

    objectStore(name: string) {
        const store = this.stores.find(([storeName]) => storeName === name);
        if (!store) throw new Error(`Store ${name} not found`);
        const objectStore = new MockIDBObjectStore(store[1], 'id');
        return objectStore;
    }
}

export const mockIndexedDB = {
    open: (name: string, version: number) => {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onupgradeneeded: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any
        };

        Promise.resolve().then(() => {
            const db = new MockIDBDatabase();
            request.result = db;

            if (request.onupgradeneeded) {
                request.onupgradeneeded({ target: { result: db } });
            }
            if (request.onsuccess) {
                request.onsuccess({ target: { result: db } });
            }
        });

        return request;
    },

    deleteDatabase: (name: string) => {
        const request = {
            onerror: null as ((event: any) => void) | null,
            onsuccess: null as ((event: any) => void) | null,
            result: undefined as any
        };

        Promise.resolve().then(() => {
            if (request.onsuccess) {
                request.onsuccess({ target: { result: undefined } });
            }
        });

        return request;
    }
};

// Setup mock IndexedDB
Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true
});
