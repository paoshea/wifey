interface CoveragePoint {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    signalStrength: number;
    reliability: number;
    type: 'wifi' | 'cellular';
}

interface PendingSyncItem {
    id: string;
    type: 'coverage_point' | 'map_tile';
    data: any;
    timestamp: number;
    retryCount: number;
}

interface MapTile {
    id: string;
    x: number;
    y: number;
    zoom: number;
    data: Blob;
    timestamp: number;
}

export class OfflineDB {
    private static instance: OfflineDB;
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): OfflineDB {
        if (!OfflineDB.instance) {
            OfflineDB.instance = new OfflineDB();
        }
        return OfflineDB.instance;
    }

    // For testing purposes
    public static resetInstance(): void {
        if (OfflineDB.instance?.db) {
            OfflineDB.instance.db.close();
        }
        OfflineDB.instance = new OfflineDB();
    }

    async initialize(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            if (this.db) {
                resolve();
                return;
            }

            const request = indexedDB.open('offline_system', 1);

            request.onerror = () => {
                this.initPromise = null;
                reject(new Error('Failed to open database'));
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.createObjectStores(db);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
        });

        return this.initPromise;
    }

    private createObjectStores(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('coverage_points')) {
            const coverageStore = db.createObjectStore('coverage_points', { keyPath: 'id' });
            coverageStore.createIndex('timestamp', 'timestamp');
            coverageStore.createIndex('type', 'type');
        }

        if (!db.objectStoreNames.contains('pending_sync')) {
            db.createObjectStore('pending_sync', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('map_tiles')) {
            const tileStore = db.createObjectStore('map_tiles', { keyPath: 'id' });
            tileStore.createIndex('timestamp', 'timestamp');
        }
    }

    async deleteDatabase(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.initPromise = null;

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase('offline_system');

            request.onerror = () => {
                reject(new Error('Failed to delete database'));
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async storeCoveragePoint(point: CoveragePoint): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['coverage_points'], 'readwrite');
                const store = transaction.objectStore('coverage_points');

                const request = store.put(point);

                request.onerror = () => {
                    reject(new Error('Failed to store coverage point'));
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCoveragePoint(id: string): Promise<CoveragePoint | null> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['coverage_points'], 'readonly');
                const store = transaction.objectStore('coverage_points');

                const request = store.get(id);

                request.onerror = () => {
                    reject(new Error('Failed to retrieve coverage point'));
                };

                request.onsuccess = () => {
                    resolve(request.result || null);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCoveragePoints(): Promise<CoveragePoint[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['coverage_points'], 'readonly');
                const store = transaction.objectStore('coverage_points');
                const request = store.getAll();

                request.onerror = () => {
                    reject(new Error('Failed to retrieve coverage points'));
                };

                request.onsuccess = () => {
                    resolve(request.result || []);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async addPendingSync(item: PendingSyncItem): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['pending_sync'], 'readwrite');
                const store = transaction.objectStore('pending_sync');

                const request = store.put(item);

                request.onerror = () => {
                    reject(new Error('Failed to add pending sync item'));
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPendingSyncItems(): Promise<PendingSyncItem[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['pending_sync'], 'readonly');
                const store = transaction.objectStore('pending_sync');
                const request = store.getAll();

                request.onerror = () => {
                    reject(new Error('Failed to retrieve pending sync items'));
                };

                request.onsuccess = () => {
                    resolve(request.result || []);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async removePendingSyncItem(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['pending_sync'], 'readwrite');
                const store = transaction.objectStore('pending_sync');

                const request = store.delete(id);

                request.onerror = () => {
                    reject(new Error('Failed to remove pending sync item'));
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearAllData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const stores = ['coverage_points', 'pending_sync', 'map_tiles'];
        const promises = stores.map(storeName => {
            return new Promise<void>((resolve, reject) => {
                try {
                    const transaction = this.db!.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onerror = () => {
                        reject(new Error(`Failed to clear ${storeName}`));
                    };

                    transaction.oncomplete = () => {
                        resolve();
                    };
                } catch (error) {
                    reject(error);
                }
            });
        });

        await Promise.all(promises);
    }
}
