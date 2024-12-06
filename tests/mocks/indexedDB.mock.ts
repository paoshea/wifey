interface SimpleMockEvent {
    type: string;
    target?: any;
}

interface SimpleMockVersionChangeEvent extends SimpleMockEvent {
    oldVersion: number;
    newVersion: number | null;
}

class MockIDBRequest {
    result: any = null;
    error: Error | null = null;
    source: any = null;
    transaction: MockIDBTransaction | null = null;
    readyState: string = 'pending';
    onerror: ((event: SimpleMockEvent) => void) | null = null;
    onsuccess: ((event: SimpleMockEvent) => void) | null = null;
    onupgradeneeded: ((event: SimpleMockVersionChangeEvent) => void) | null = null;

    _triggerSuccess() {
        if (this.onsuccess) {
            this.onsuccess({ type: 'success', target: this });
        }
    }

    _triggerError(error: Error) {
        this.error = error;
        if (this.onerror) {
            this.onerror({ type: 'error', target: this });
        }
    }
}

class MockIDBTransaction {
    db: MockIDBDatabase;
    mode: IDBTransactionMode;
    objectStoreNames: string[];
    error: Error | null = null;
    oncomplete: ((event: SimpleMockEvent) => void) | null = null;
    onerror: ((event: SimpleMockEvent) => void) | null = null;

    constructor(db: MockIDBDatabase, storeNames: string[], mode: IDBTransactionMode) {
        this.db = db;
        this.mode = mode;
        this.objectStoreNames = storeNames;
    }

    objectStore(name: string): MockIDBObjectStore {
        return this.db.objectStores[name];
    }

    _complete() {
        if (this.oncomplete) {
            this.oncomplete({ type: 'complete' });
        }
    }
}

class MockIDBObjectStore {
    name: string;
    keyPath: string;
    data: Map<string, any>;
    indexes: { [key: string]: MockIDBIndex } = {};

    constructor(name: string, keyPath: string) {
        this.name = name;
        this.keyPath = keyPath;
        this.data = new Map();
    }

    add(value: any): MockIDBRequest {
        const request = new MockIDBRequest();
        const key = value[this.keyPath];

        if (this.data.has(key)) {
            request._triggerError(new Error('Key already exists'));
        } else {
            this.data.set(key, value);
            request.result = key;
            request._triggerSuccess();
        }

        return request;
    }

    put(value: any): MockIDBRequest {
        const request = new MockIDBRequest();
        const key = value[this.keyPath];
        this.data.set(key, value);
        request.result = key;
        request._triggerSuccess();
        return request;
    }

    get(key: string): MockIDBRequest {
        const request = new MockIDBRequest();
        request.result = this.data.get(key) || null;
        request._triggerSuccess();
        return request;
    }

    delete(key: string): MockIDBRequest {
        const request = new MockIDBRequest();
        this.data.delete(key);
        request._triggerSuccess();
        return request;
    }

    clear(): MockIDBRequest {
        const request = new MockIDBRequest();
        this.data.clear();
        request._triggerSuccess();
        return request;
    }

    getAll(): MockIDBRequest {
        const request = new MockIDBRequest();
        request.result = Array.from(this.data.values());
        request._triggerSuccess();
        return request;
    }

    createIndex(name: string, keyPath: string): MockIDBIndex {
        const index = new MockIDBIndex(this, name, keyPath);
        this.indexes[name] = index;
        return index;
    }

    index(name: string): MockIDBIndex {
        return this.indexes[name];
    }
}

class MockIDBIndex {
    objectStore: MockIDBObjectStore;
    name: string;
    keyPath: string;

    constructor(objectStore: MockIDBObjectStore, name: string, keyPath: string) {
        this.objectStore = objectStore;
        this.name = name;
        this.keyPath = keyPath;
    }

    openCursor(range?: IDBKeyRange): MockIDBRequest {
        const request = new MockIDBRequest();
        const values = Array.from(this.objectStore.data.values());
        let index = 0;

        const advanceCursor = () => {
            if (index < values.length) {
                const value = values[index++];
                if (!range || this.isInRange(value[this.keyPath], range)) {
                    request.result = {
                        value,
                        key: value[this.keyPath],
                        delete: () => this.objectStore.delete(value[this.objectStore.keyPath]),
                        continue: advanceCursor
                    };
                    request._triggerSuccess();
                } else {
                    advanceCursor();
                }
            } else {
                request.result = null;
                request._triggerSuccess();
            }
        };

        advanceCursor();
        return request;
    }

    private isInRange(value: any, range: IDBKeyRange): boolean {
        if (range.lower !== undefined && value < range.lower) return false;
        if (range.upper !== undefined && value > range.upper) return false;
        return true;
    }
}

class MockDOMStringList {
    private items: string[] = [];

    constructor(items: string[] = []) {
        this.items = items;
    }

    contains(str: string): boolean {
        return this.items.includes(str);
    }

    item(index: number): string | null {
        return this.items[index] || null;
    }

    get length(): number {
        return this.items.length;
    }
}

class MockIDBDatabase {
    name: string;
    version: number;
    objectStores: { [key: string]: MockIDBObjectStore } = {};
    objectStoreNames: MockDOMStringList;

    constructor(name: string, version: number) {
        this.name = name;
        this.version = version;
        this.objectStoreNames = new MockDOMStringList();
    }

    createObjectStore(name: string, { keyPath }: { keyPath: string }): MockIDBObjectStore {
        const store = new MockIDBObjectStore(name, keyPath);
        this.objectStores[name] = store;
        (this.objectStoreNames as any).items.push(name);
        return store;
    }

    transaction(storeNames: string[], mode: IDBTransactionMode): MockIDBTransaction {
        const transaction = new MockIDBTransaction(this, storeNames, mode);
        transaction._complete();
        return transaction;
    }
}

const mockIndexedDB = {
    databases: new Map<string, MockIDBDatabase>(),

    open(name: string, version: number): MockIDBRequest {
        const request = new MockIDBRequest();
        let db = this.databases.get(name);
        const isNewDb = !db;

        if (!db) {
            db = new MockIDBDatabase(name, version);
            this.databases.set(name, db);
        }

        request.result = db;

        if (isNewDb && request.onupgradeneeded) {
            request.onupgradeneeded({
                type: 'upgradeneeded',
                oldVersion: 0,
                newVersion: version,
                target: { result: db }
            });
        }

        request._triggerSuccess();
        return request;
    },

    deleteDatabase(name: string): MockIDBRequest {
        const request = new MockIDBRequest();
        this.databases.delete(name);
        request._triggerSuccess();
        return request;
    }
};

// Mock the global indexedDB
(global as any).indexedDB = mockIndexedDB;

// Mock IDBKeyRange
(global as any).IDBKeyRange = {
    upperBound: (value: any) => ({ upper: value }),
    lowerBound: (value: any) => ({ lower: value }),
    bound: (lower: any, upper: any) => ({ lower, upper })
};

export { mockIndexedDB };
