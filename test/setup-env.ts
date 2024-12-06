// Mock process.env values used in tests
process.env = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
    NODE_ENV: 'test',
};

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        status: 200,
        statusText: 'OK',
    })
) as jest.Mock;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
});

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    (global.fetch as jest.Mock).mockClear();
});

// Add custom environment variables needed for tests
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'mock-mapbox-token';
process.env.NEXT_PUBLIC_SENTRY_DSN = 'mock-sentry-dsn';

// Mock canvas context
const mockContext2D = {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
        colorSpace: 'srgb'
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    measureText: jest.fn(() => ({
        width: 0,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: 0,
        fontBoundingBoxAscent: 0,
        fontBoundingBoxDescent: 0,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0,
        emHeightAscent: 0,
        emHeightDescent: 0,
        hangingBaseline: 0,
        alphabeticBaseline: 0,
        ideographicBaseline: 0
    }))
};

// Override getContext
const getContextMock = jest.fn((contextId: string) => {
    if (contextId === '2d') {
        return mockContext2D;
    }
    return null;
});

// Apply mock to HTMLCanvasElement prototype
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: getContextMock
});
