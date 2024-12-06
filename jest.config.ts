import type { Config } from 'jest';
import nextJest from 'next/jest';
import path from 'path';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.tsx',
    '<rootDir>/test/setup-env.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': path.join(__dirname, '$1'),
    '^@components/(.*)$': path.join(__dirname, 'components/$1'),
    '^@lib/(.*)$': path.join(__dirname, 'lib/$1'),
    '^@ui/(.*)$': path.join(__dirname, 'components/ui/$1'),
    '^@hooks/(.*)$': path.join(__dirname, 'hooks/$1'),
    '^@tests/(.*)$': path.join(__dirname, 'tests/$1'),
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/tests/e2e/', // Ignore e2e tests as they require playwright
    '/coverage/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: ['TS151001']
      }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/tests/e2e/',
    '\\.d\\.ts$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['<rootDir>'],
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/e2e/'
  ],
  restoreMocks: true,
  maxWorkers: '50%',
  roots: [
    '<rootDir>'
  ],
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true
    }
  },
  resolver: undefined,
  rootDir: '.'
};

// Export the merged config
export default createJestConfig(customJestConfig);
