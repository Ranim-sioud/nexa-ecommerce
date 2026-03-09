export default {
  testEnvironment: 'node',
  // No Babel transform — use native ESM via --experimental-vm-modules
  // .js is automatically ESM because package.json has "type":"module"
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 15000,
  // Prevent dangling handles from crashing the suite
  forceExit: true,
  verbose: true,
  // Show coverage from src/ only
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageDirectory: 'coverage',
};
