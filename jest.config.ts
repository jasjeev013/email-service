module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.test.ts',         // Exclude test files
    '!**/node_modules/**',   // Exclude dependencies
    '!**/dist/**',           // Exclude build output
    '!**/coverage/**',       // Exclude coverage output
  ],
  coverageReporters: ['text', 'lcov', 'html'], // text shows summary, lcov/html for deeper inspection
};
