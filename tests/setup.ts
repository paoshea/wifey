// Configure longer timeout for all tests
jest.setTimeout(60000);

beforeAll(() => {
  // Verify test environment setup
  expect(global).toBeDefined();
});

afterAll(() => {
  // Cleanup any remaining test state
  jest.restoreAllMocks();
});
