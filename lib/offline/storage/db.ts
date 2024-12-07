export interface CoveragePoint {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    signalStrength: number;
    reliability: number;
    type: 'wifi' | 'cellular';
    averageStrength: number;
    lastUpdated: number;
}

export interface PendingSyncItem {
    id: string;
    type: 'coverage_point' | 'map_tile';
    data: any;
    timestamp: number;
    retryCount: number;
}

export interface MapTile {
    id: string;
    x: number;
    y: number;
    zoom: number;
    data: Blob;
    timestamp: number;
}

let dbInstance: OfflineDB | null = null;

export class OfflineDB {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;
    private initialized: boolean = false;

    constructor() {
        if (dbInstance) {
            return dbInstance;
        }
        dbInstance = this;
    }

    static getInstance(): OfflineDB {
        if (!dbInstance) {
            dbInstance = new OfflineDB();
        }
        return dbInstance;
    }

    static resetInstance(): void {
        if (dbInstance?.db) {
            dbInstance.db.close();
        }
        dbInstance = null;
    }

    async isInitialized(): Promise<boolean> {
        return this.initialized;
    }

    async initialize(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise<void>((resolve, reject) => {
            if (this.db) {
                this.initialized = true;
                resolve();
                return;
            }

            const request = indexedDB.open('offline_system', 1);

            request.onerror = () => {
                this.initPromise = null;
                this.initialized = false;
                reject(new Error('Failed to open database'));
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.createObjectStores(db);
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.initialized = true;
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

    async getCoveragePoints(): Promise<CoveragePoint[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<CoveragePoint[]>((resolve, reject) => {
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

    async getCoveragePoint(id: string): Promise<CoveragePoint | null> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<CoveragePoint | null>((resolve, reject) => {
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

    async storeCoveragePoint(point: CoveragePoint): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<void>((resolve, reject) => {
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

    async removeCoveragePoint(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<void>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['coverage_points'], 'readwrite');
                const store = transaction.objectStore('coverage_points');
                const request = store.delete(id);

                request.onerror = () => {
                    reject(new Error('Failed to remove coverage point'));
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async addPendingSync(item: PendingSyncItem): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<void>((resolve, reject) => {
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

        return new Promise<PendingSyncItem[]>((resolve, reject) => {
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

        return new Promise<void>((resolve, reject) => {
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

    async storeMapTile(tile: MapTile): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<void>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['map_tiles'], 'readwrite');
                const store = transaction.objectStore('map_tiles');
                const request = store.put(tile);

                request.onerror = () => {
                    reject(new Error('Failed to store map tile'));
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearOldMapTiles(maxAge: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<void>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(['map_tiles'], 'readwrite');
                const store = transaction.objectStore('map_tiles');
                const index = store.index('timestamp');
                const cutoffTime = Date.now() - maxAge;

                const request = index.openCursor();

                request.onerror = () => {
                    reject(new Error('Failed to clear old map tiles'));
                };

                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor) {
                        if (cursor.value.timestamp < cutoffTime) {
                            cursor.delete();
                        }
                        cursor.continue();
                    }
                };

                transaction.oncomplete = () => {
                    resolve();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteDatabase(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.initPromise = null;
        this.initialized = false;

        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase('offline_system');

            request.onerror = () => {
                reject(new Error('Failed to delete database'));
            };

            request.onsuccess = () => {
                resolve();
            };
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

// Export for CommonJS compatibility
module.exports = { OfflineDB };
