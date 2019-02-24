module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**/*.ts'],
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
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
