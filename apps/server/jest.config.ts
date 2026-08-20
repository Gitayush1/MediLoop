import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '@mediloop/shared': '<rootDir>/../../packages/shared/src/index.ts',
  },
  globalSetup: '<rootDir>/src/tests/setup.ts',
  globalTeardown: '<rootDir>/src/tests/teardown.ts',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/index.ts',
    '!src/**/*.d.ts',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testTimeout: 30000,
};

export default config;
