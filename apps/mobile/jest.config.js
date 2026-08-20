module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '@mediloop/shared': '<rootDir>/../../packages/shared/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  globals: {
    'ts-jest': {
      tsconfig: { jsx: 'react' },
    },
  },
};
