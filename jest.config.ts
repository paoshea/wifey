import type { Config } from 'jest';
import nextJest from 'next/jest';

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
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@ui/(.*)$': '<rootDir>/components/ui/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/tests/e2e/', // Ignore e2e tests as they require playwright
    '/coverage/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
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
  // Mock files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Mock paths
  modulePaths: ['<rootDir>'],
  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // An array of regexp pattern strings that are matched against all source file paths before re-running tests in watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/e2e/'
  ],
  // Automatically restore mock state between every test
  restoreMocks: true,
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  // An array of directory names to be searched recursively up from the requiring module's location
  roots: [
    '<rootDir>'
  ],
  // Indicates whether each individual test should be reported during the run
  verbose: true
};
