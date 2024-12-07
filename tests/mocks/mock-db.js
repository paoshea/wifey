const mockDB = {
    stores: new Map(),
    objectStoreNames: {
        contains: (name) => mockDB.stores.has(name)
    },
    createObjectStore: (name, options) => {
        const store = new Map();
        mockDB.stores.set(name, store);
        return {
            createIndex: () => ({})
        };
    },
    transaction: (storeNames, mode) => {
        return {
            objectStore: (name) => {
                const store = mockDB.stores.get(name);
                if (!store) throw new Error(`Store ${name} not found`);
                return {
                    put: (value) => {
                        store.set(value.id, { ...value });
                        const request = { result: undefined };
                        request.onsuccess?.({ target: request });
                        return request;
                    },
                    get: (key) => {
                        const result = store.get(key) || null;
                        const request = { result };
                        request.onsuccess?.({ target: request });
                        return request;
                    },
                    getAll: () => {
                        const result = Array.from(store.values());
                        const request = { result };
                        request.onsuccess?.({ target: request });
                        return request;
                    },
                    delete: (key) => {
                        store.delete(key);
                        const request = { result: undefined };
                        request.onsuccess?.({ target: request });
                        return request;
                    },
                    clear: () => {
                        store.clear();
                        const request = { result: undefined };
                        request.onsuccess?.({ target: request });
                        return request;
                    }
                };
            },
            oncomplete: null
        };
    },
    close: () => {
        mockDB.stores.clear();
    }
};

function createMockIndexedDB() {
    return {
        open: (name, version) => {
            const request = {
                onerror: null,
                onupgradeneeded: null,
                onsuccess: null,
                result: mockDB
            };

            // Execute callbacks synchronously
            request.onupgradeneeded?.({ target: request });
            request.onsuccess?.({ target: request });

            return request;
        },

        deleteDatabase: (name) => {
            const request = {
                onerror: null,
                onsuccess: null,
                result: undefined
            };

            mockDB.stores.clear();
            request.onsuccess?.({ target: request });

            return request;
        },

        cmp: (a, b) => 0,
        databases: () => Promise.resolve([])
    };
}

module.exports = { createMockIndexedDB };
