# Backend Tests

## Running Tests

```bash
npm test               # run all tests
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

## Structure

```
tests/
  setup.js                          # Global env vars (runs before every test file)
  unit/
    authMiddleware.test.js           # Pure unit tests: requireAuth, requireAdmin
  integration/
    auth.test.js                     # HTTP integration tests: all /api/auth/* endpoints
```

## Key Design Decisions

### ESM + Jest 30 mocking (important)

This project uses `"type": "module"` (native ESM). Tests run with
`node --experimental-vm-modules` and use `jest.unstable_mockModule()`.

**Critical gotcha**: `jest.clearAllMocks()` clears BOTH `specificReturnValues`
(from `mockResolvedValueOnce`) AND `specificMockImpls` (from `mockImplementationOnce`).
This means per-test mock overrides set AFTER `clearAllMocks` in `beforeEach` are wiped
if `clearAllMocks` runs in a beforeEach somewhere else.

**Solution used**: Closure-flag pattern. Module-level boolean flags are read by the
mock factory's `mockImplementation` closure at call time:

```js
let argon2VerifyShouldFail = false;

jest.unstable_mockModule('argon2', () => ({
  default: {
    verify: jest.fn().mockImplementation(() =>
      Promise.resolve(!argon2VerifyShouldFail)
    ),
  },
}));

// In test:
argon2VerifyShouldFail = true;
const res = await request.post('/api/auth/login').send(creds);
argon2VerifyShouldFail = false;
```

### Database mock

All Sequelize models and the `sequelize` instance are mocked via
`jest.unstable_mockModule('../../src/models/index.js', ...)`.

The `config/database.js` mock makes `sequelize.define()` return a model-like stub
with `addHook`, `findOne`, `create`, etc. — needed because some model files
(e.g. `Produit.js`) call `Model.addHook()` directly.

### NODE_ENV=test

`app.js` skips the DB connectivity IIFE when `NODE_ENV=test`. This prevents
`process.exit(1)` from killing Jest when no real DB is available.
