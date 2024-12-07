describe('Mock IndexedDB', () => {
    console.log('Starting mock DB test');
    let db: any;

    beforeAll(() => {
        console.log('beforeAll: Setting up mock IndexedDB');
        const { createMockIndexedDB } = require('../mocks/mock-db');
        const mockIDB = createMockIndexedDB();

        // Replace global indexedDB
        Object.defineProperty(global, 'indexedDB', {
            value: mockIDB,
            writable: true
        });
    });

    beforeEach((done) => {
        console.log('Setting up test database');
        const request = indexedDB.open('test-db', 1);

        request.onerror = (event: any) => {
            console.error('Database open error:', event.target.error);
            done(event.target.error);
        };

        request.onupgradeneeded = (event: any) => {
            console.log('Upgrade needed event fired');
            const database = request.result;
            const store = database.createObjectStore('test-store', { keyPath: 'id' });
            store.createIndex('testIndex', 'testField');
        };

        request.onsuccess = (event: any) => {
            console.log('Database opened successfully');
            db = request.result;
            done();
        };
    });

    afterEach(() => {
        if (db) {
            db.close();
        }
    });

    it('should open a database', () => {
        expect(db).toBeTruthy();
        expect(db.objectStoreNames.contains('test-store')).toBe(true);
    });

    it('should store and retrieve data', (done) => {
        const testData = { id: '1', testField: 'test value' };

        const transaction = db.transaction(['test-store'], 'readwrite');
        const store = transaction.objectStore('test-store');

        const putRequest = store.put(testData);

        putRequest.onerror = (event: any) => {
            done(event.target.error);
        };

        putRequest.onsuccess = () => {
            // Now try to read it back
            const getTransaction = db.transaction(['test-store'], 'readonly');
            const getStore = getTransaction.objectStore('test-store');
            const getRequest = getStore.get('1');

            getRequest.onerror = (event: any) => {
                done(event.target.error);
            };

            getRequest.onsuccess = (event: any) => {
                const result = event.target.result;
                expect(result).toEqual(testData);
                done();
            };
        };
    });

    it('should handle multiple operations', (done) => {
        const items = [
            { id: '1', testField: 'value 1' },
            { id: '2', testField: 'value 2' },
            { id: '3', testField: 'value 3' }
        ];

        const transaction = db.transaction(['test-store'], 'readwrite');
        const store = transaction.objectStore('test-store');

        Promise.all(items.map(item => new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        }))).then(() => {
            // Now get all items
            const getAllTransaction = db.transaction(['test-store'], 'readonly');
            const getAllStore = getAllTransaction.objectStore('test-store');
            const getAllRequest = getAllStore.getAll();

            getAllRequest.onsuccess = (event: any) => {
                const results = event.target.result;
                expect(results).toHaveLength(3);
                expect(results).toEqual(expect.arrayContaining(items));
                done();
            };

            getAllRequest.onerror = (event: any) => {
                done(event.target.error);
            };
        }).catch(done);
    });
});
