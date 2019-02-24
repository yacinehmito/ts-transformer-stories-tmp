module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**/*.ts'],
  coverageDirectory: '<rootDir>/.temp/test-coverage',
  // Silences a warning caused by a bug in ts-jest
  // (See https://github.com/kulshekhar/ts-jest/issues/748)
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
};
