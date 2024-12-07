import { mockIndexedDB } from './mocks/indexedDB.mock';

// Setup mock IndexedDB
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
  configurable: true
});
