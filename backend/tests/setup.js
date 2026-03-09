/**
 * Global Jest setup — runs before every test file.
 * Sets env vars so modules load correctly without a real DB / mail server.
 */

// Must be set before any module import so logger & app read the right values
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-jest-only-32ch';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:4001';

// Redirect log files to a temp dir so tests don't create /app/logs on Windows
process.env.LOG_DIR = '/tmp/nexa-test-logs';
// Silence everything below 'error' to keep test output clean
process.env.LOG_LEVEL = 'error';

// Fake mail creds (nodemailer is mocked anyway but these prevent config errors)
process.env.MAIL_USER = 'jest@test.local';
process.env.MAIL_PASS = 'jest-test-pass';

// Fake DB URL so Sequelize constructor doesn't throw on bad URL
process.env.DATABASE_URL = 'postgres://jest:jest@localhost:5432/jest_test';
