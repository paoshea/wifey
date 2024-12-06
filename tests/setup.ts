import './mocks/indexedDB.mock';

// Mock process.env for test environment
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    clone: () => ({
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(new Blob())
    })
  } as Response)
);

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid'
  }
});

// Mock MessageChannel
class MockMessageChannel {
  port1: MessagePort;
  port2: MessagePort;

  constructor() {
    this.port1 = {
      onmessage: null,
      postMessage: jest.fn()
    } as unknown as MessagePort;
    this.port2 = {
      onmessage: null,
      postMessage: jest.fn()
    } as unknown as MessagePort;
  }
}

global.MessageChannel = MockMessageChannel as any;

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

// Set longer timeout for all tests
jest.setTimeout(30000);
