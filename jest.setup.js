const { createMockIndexedDB } = require('./tests/mocks/mock-db');
require('@testing-library/jest-dom');

// Setup mock IndexedDB
const mockIndexedDB = createMockIndexedDB();

// Setup mock IndexedDB for Node environment
if (typeof window === 'undefined') {
  if (!global.indexedDB) {
    Object.defineProperty(global, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
      configurable: true
    });
  }
} else {
  if (!window.indexedDB) {
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
      configurable: true
    });
  }
}
