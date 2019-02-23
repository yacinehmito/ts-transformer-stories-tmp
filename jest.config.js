module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**/*.ts'],
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
};
