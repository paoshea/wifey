const mockDB = {
    stores: new Map(),
    objectStoreNames: {
        contains: (name) => mockDB.stores.has(name),
        length: 0
    },
    createObjectStore: (name, options = {}) => {
        console.log(`Creating object store: ${name}`);
        const store = {
            name,
            keyPath: options.keyPath,
            autoIncrement: options.autoIncrement,
            data: new Map(),
            indexes: new Map(),
            createIndex: (indexName, keyPath, options = {}) => {
                console.log(`Creating index: ${indexName} for store: ${name}`);
                const index = {
                    name: indexName,
                    keyPath,
                    unique: options.unique,
                    multiEntry: options.multiEntry
                };
                store.indexes.set(indexName, index);
                return index;
            }
        };
        mockDB.stores.set(name, store);
        return store;
    },
    transaction: (storeNames, mode = 'readonly') => {
        console.log(`Starting transaction for stores: ${storeNames}, mode: ${mode}`);
        const transaction = {
            objectStore: (name) => {
                console.log(`Accessing object store: ${name}`);
                const store = mockDB.stores.get(name);
                if (!store) {
                    console.error(`Store ${name} not found`);
                    throw new Error(`Store ${name} not found`);
                }
                return {
                    put: (value) => {
                        console.log(`Putting value in store: ${name}`, value);
                        // Simulate random storage errors for testing
                        if (process.env.MOCK_STORAGE_ERROR === 'true') {
                            const request = {
                                error: new Error('Storage error')
                            };
                            setTimeout(() => {
                                request.onerror?.({ target: request });
                            }, 0);
                            return request;
                        }

                        store.data.set(value[store.keyPath], value);
                        const request = {
                            result: value[store.keyPath]
                        };
                        setTimeout(() => {
                            request.onsuccess?.({ target: request });
                            // Ensure transaction.oncomplete is called after all operations
                            if (mode === 'readwrite') {
                                setTimeout(() => {
                                    transaction.oncomplete?.();
                                }, 0);
                            }
                        }, 0);
                        return request;
                    },
                    get: (key) => {
                        console.log(`Getting value from store: ${name}, key: ${key}`);
                        const value = store.data.get(key);
                        const request = {
                            result: value
                        };
                        setTimeout(() => {
                            request.onsuccess?.({ target: request });
                        }, 0);
                        return request;
                    },
                    getAll: () => {
                        console.log(`Getting all values from store: ${name}`);
                        const values = Array.from(store.data.values());
                        const request = {
                            result: values
                        };
                        setTimeout(() => {
                            request.onsuccess?.({ target: request });
                        }, 0);
                        return request;
                    },
                    delete: (key) => {
                        console.log(`Deleting key from store: ${name}, key: ${key}`);
                        store.data.delete(key);
                        const request = {
                            result: undefined
                        };
                        setTimeout(() => {
                            request.onsuccess?.({ target: request });
                            // Ensure transaction.oncomplete is called after all operations
                            if (mode === 'readwrite') {
                                setTimeout(() => {
                                    transaction.oncomplete?.();
                                }, 0);
                            }
                        }, 0);
                        return request;
                    },
                    clear: () => {
                        console.log(`Clearing store: ${name}`);
                        store.data.clear();
                        const request = {
                            result: undefined
                        };
                        setTimeout(() => {
                            request.onsuccess?.({ target: request });
                            if (mode === 'readwrite') {
                                setTimeout(() => {
                                    transaction.oncomplete?.();
                                }, 0);
                            }
                        }, 0);
                        return request;
                    }
                };
            },
            oncomplete: null,
            onerror: null,
            onabort: null
        };
        return transaction;
    },
    close: () => {
        console.log('Closing database');
        mockDB.stores.clear();
    }
};

function createMockIndexedDB() {
    console.log('Creating mock IndexedDB');
    return {
        open: (name, version) => {
            console.log(`Opening database: ${name}, version: ${version}`);
            const request = {
                result: mockDB,
                error: null,
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            };

            setTimeout(() => {
                try {
                    if (request.onupgradeneeded) {
                        console.log('Triggering onupgradeneeded');
                        request.onupgradeneeded({
                            target: request,
                            oldVersion: 0,
                            newVersion: version
                        });
                    }
                    if (request.onsuccess) {
                        console.log('Triggering onsuccess');
                        request.onsuccess({ target: request });
                    }
                } catch (error) {
                    console.error(`Error in open operation: ${error}`);
                    if (request.onerror) request.onerror({ target: { error } });
                }
            }, 0);

            return request;
        },
        deleteDatabase: (name) => {
            console.log(`Deleting database: ${name}`);
            const request = {
                result: undefined,
                error: null,
                onsuccess: null,
                onerror: null
            };

            setTimeout(() => {
                mockDB.stores.clear();
                request.onsuccess?.({ target: request });
            }, 0);

            return request;
        }
    };
}

module.exports = { createMockIndexedDB };
