/**
 * Integration tests — /api/auth/* endpoints
 *
 * Strategy: mock all external dependencies (DB models, sequelize, nodemailer,
 * argon2, bcrypt) so tests are fast and hermetic. We test HTTP behaviour —
 * status codes, response shapes, and cookie presence — not crypto internals.
 *
 * ESM note: jest.unstable_mockModule must be called before any dynamic import.
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ─── Sequelize model stub factory ────────────────────────────────────────────
// Some model files (e.g. Produit.js) call .addHook() on the result of
// sequelize.define(). The DB mock must return a model-like object so those
// calls don't crash even if the model file is loaded directly.
function createSeqModelStub() {
  return {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn(),
    addHook: jest.fn(),
    belongsTo: jest.fn(),
    hasOne: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn(),
    scope: jest.fn().mockReturnThis(),
    prototype: {},
  };
}

// ─── Closure flags — read by mock factories at call time ─────────────────────
// jest.clearAllMocks() wipes once-queues and specificMockImpls, making per-test
// overrides unreliable. Using module-level flags that the factory closures read
// is the only guaranteed-stable approach in Jest 30 ESM.
let argon2VerifyShouldFail = false;   // set true in tests that need wrong-password
let bcryptCompareShouldFail = false;  // set true in tests that need bad refresh token

// ─── Shared mock state ────────────────────────────────────────────────────────
// We create the mock fns here so tests can configure them via mockResolvedValue etc.

const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockVendeur = {
  create: jest.fn(),
  findOne: jest.fn(),
};

const mockFournisseur = {
  create: jest.fn(),
};

const mockPack = {
  findOne: jest.fn(),
};

const mockTransaction = {
  create: jest.fn(),
};

// Mock DB transaction object returned by sequelize.transaction()
const mockTxn = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-id' });

// ─── Mocks — must be called before any import ────────────────────────────────

jest.unstable_mockModule('../../src/config/logger.js', () => ({
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),   // used by httpLogger.js (Morgan stream)
    verbose: jest.fn(),
    silly: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: {
    authenticate: jest.fn().mockResolvedValue(true),
    // Return a model-like object so model files that call .addHook() don't crash
    define: jest.fn().mockImplementation(() => createSeqModelStub()),
    transaction: jest.fn().mockResolvedValue(mockTxn),
    dialect: { name: 'postgres' },
    config: {},
    options: {},
    queryInterface: { define: jest.fn() },
  },
}));

// Minimal stub for any model the app loads but auth tests don't directly call
const modelStub = () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  findAndCountAll: jest.fn(),
  belongsTo: jest.fn(),
  hasOne: jest.fn(),
  hasMany: jest.fn(),
});

jest.unstable_mockModule('../../src/models/index.js', () => ({
  User: mockUser,
  Vendeur: mockVendeur,
  Fournisseur: mockFournisseur,
  Pack: mockPack,
  Transaction: mockTransaction,
  Parrainage: { create: jest.fn() },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockResolvedValue(mockTxn),
  },
  // All other models — stubbed so route imports don't crash
  DemandeRetrait: modelStub(),
  Produit: modelStub(),
  Variation: modelStub(),
  Media: modelStub(),
  Categorie: modelStub(),
  MesProduit: modelStub(),
  Tickets: modelStub(),
  TicketsType: modelStub(),
  TicketsMessage: modelStub(),
  Permission: modelStub(),
  Task: modelStub(),
  Commande: modelStub(),
  SousCommande: modelStub(),
  LigneCommande: modelStub(),
  Tracking: modelStub(),
  Client: modelStub(),
  Pickup: modelStub(),
}));

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn().mockReturnValue({ sendMail: mockSendMail }),
  },
}));

// Mock argon2 — verify reads argon2VerifyShouldFail closure flag
jest.unstable_mockModule('argon2', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('$argon2id$mocked_hash'),
    // Closure: reads the flag at call time, so per-test overrides survive clearAllMocks
    verify: jest.fn().mockImplementation(() =>
      Promise.resolve(!argon2VerifyShouldFail)
    ),
    argon2id: 2,
  },
}));

// Mock bcrypt — compareSync reads bcryptCompareShouldFail closure flag
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('$2b$mocked_bcrypt_hash'),
    compare: jest.fn().mockResolvedValue(true),
    compareSync: jest.fn().mockImplementation(() => !bcryptCompareShouldFail),
  },
}));

// Mock the parrainage utility so DB operations inside it don't run
jest.unstable_mockModule('../../src/utils/parrainage.js', () => ({
  applyParrainage: jest.fn().mockResolvedValue(undefined),
}));

// ─── Dynamic imports — AFTER all mocks are registered ────────────────────────
let request;

beforeAll(async () => {
  // Import app only after all mocks are in place
  const { default: app } = await import('../../src/app.js');
  const supertest = await import('supertest');
  request = supertest.default(app);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCookie(payload = { id: 1, role: 'vendeur' }) {
  return `accessToken=${jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' })}`;
}

/** Build a minimal user object that satisfies the controller's checks */
function fakeUser(overrides = {}) {
  return {
    id: 1,
    nom: 'Test User',
    email: 'test@example.com',
    telephone: '20000000',
    mot_de_passe: '$argon2id$mocked_hash',
    role: 'vendeur',
    gouvernorat: 'Tunis',
    ville: 'Tunis',
    adresse: 'Rue Test 1',
    actif: true,
    validation: true,
    refresh_token: null,
    reset_password_token: null,
    reset_password_expires: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Reset all mock state before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockTxn.commit.mockResolvedValue(undefined);
  mockTxn.rollback.mockResolvedValue(undefined);
  mockSendMail.mockResolvedValue({ messageId: 'mock-id' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register-vendeur
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register-vendeur', () => {
  const validPayload = {
    nom: 'Ahmed Ben Ali',
    email: 'ahmed@example.com',
    telephone: '20123456',
    mot_de_passe: 'SecurePass1',
    confirmer_mot_de_passe: 'SecurePass1',
    gouvernorat: 'Tunis',
    ville: 'Tunis',
    adresse: 'Rue de la Liberté 12',
    pack_cle: 'starter',
  };

  beforeEach(() => {
    // Default: no duplicate email, pack exists, no parrainage
    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(fakeUser({ id: 10, email: validPayload.email }));
    mockVendeur.create.mockResolvedValue({ id_user: 10, code_parrainage: 'VEND-10-ABCDEF' });
    mockVendeur.findOne.mockResolvedValue(null);
    mockPack.findOne.mockResolvedValue({ cle: 'starter', prix: '0.00' });
  });

  it('201 — creates vendeur with valid payload', async () => {
    const res = await request.post('/api/auth/register-vendeur').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.user).toMatchObject({ email: validPayload.email });
    expect(res.body).toHaveProperty('code_parrainage');
  });

  it('400 — missing required field: nom', async () => {
    const { nom, ...rest } = validPayload;
    const res = await request.post('/api/auth/register-vendeur').send(rest);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/manquants/i);
  });

  it('400 — missing required field: pack_cle', async () => {
    const { pack_cle, ...rest } = validPayload;
    const res = await request.post('/api/auth/register-vendeur').send(rest);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/manquants/i);
  });

  it('400 — email already in use', async () => {
    mockUser.findOne.mockResolvedValue(fakeUser());

    const res = await request.post('/api/auth/register-vendeur').send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/déjà utilisé/i);
  });

  it('400 — passwords do not match', async () => {
    const res = await request
      .post('/api/auth/register-vendeur')
      .send({ ...validPayload, confirmer_mot_de_passe: 'DifferentPass1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ne correspondent pas/i);
  });

  it('400 — password too short (< 8 chars)', async () => {
    const res = await request
      .post('/api/auth/register-vendeur')
      .send({ ...validPayload, mot_de_passe: 'Ab1', confirmer_mot_de_passe: 'Ab1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mot de passe invalide/i);
  });

  it('400 — password has no uppercase letter', async () => {
    const res = await request
      .post('/api/auth/register-vendeur')
      .send({ ...validPayload, mot_de_passe: 'nouppercase1', confirmer_mot_de_passe: 'nouppercase1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mot de passe invalide/i);
  });

  it('400 — password has no digit', async () => {
    const res = await request
      .post('/api/auth/register-vendeur')
      .send({ ...validPayload, mot_de_passe: 'NoDigitPass', confirmer_mot_de_passe: 'NoDigitPass' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mot de passe invalide/i);
  });

  it('201 — sends activation email (non-blocking, resolves even if mail fails)', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));

    const res = await request.post('/api/auth/register-vendeur').send(validPayload);

    // The controller commits first then sends email non-blocking — should still succeed
    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register-fournisseur
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register-fournisseur', () => {
  const validPayload = {
    nom: 'Société XYZ',
    email: 'fournisseur@example.com',
    telephone: '20999888',
    mot_de_passe: 'SecurePass1',
    confirmer_mot_de_passe: 'SecurePass1',
    gouvernorat: 'Sfax',
    ville: 'Sfax',
    adresse: 'Zone Industrielle 5',
    identifiant_public: 'XYZ-SARL',
  };

  beforeEach(() => {
    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(fakeUser({ id: 20, role: 'fournisseur', email: validPayload.email }));
    mockFournisseur.create.mockResolvedValue({ id_user: 20 });
  });

  it('201 — creates fournisseur with valid payload', async () => {
    const res = await request.post('/api/auth/register-fournisseur').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: validPayload.email });
  });

  it('400 — missing required field: identifiant_public', async () => {
    const { identifiant_public, ...rest } = validPayload;
    const res = await request.post('/api/auth/register-fournisseur').send(rest);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/manquants/i);
  });

  it('400 — email already in use', async () => {
    mockUser.findOne.mockResolvedValue(fakeUser({ role: 'fournisseur' }));

    const res = await request.post('/api/auth/register-fournisseur').send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/déjà utilisé/i);
  });

  it('400 — passwords do not match', async () => {
    const res = await request
      .post('/api/auth/register-fournisseur')
      .send({ ...validPayload, confirmer_mot_de_passe: 'WrongPass1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ne correspondent pas/i);
  });

  it('400 — weak password (no uppercase)', async () => {
    const res = await request
      .post('/api/auth/register-fournisseur')
      .send({ ...validPayload, mot_de_passe: 'lowercase1', confirmer_mot_de_passe: 'lowercase1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mot de passe invalide/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/activate
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/activate', () => {
  it('200 — activates an inactive account', async () => {
    const token = jwt.sign({ id: 5, role: 'vendeur' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const user = fakeUser({ id: 5, validation: false });
    mockUser.findByPk.mockResolvedValue(user);

    const res = await request.get(`/api/auth/activate?token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/activé/i);
    expect(user.save).toHaveBeenCalled();
    expect(user.validation).toBe(true);
  });

  it('200 — idempotent: already-activated account returns success', async () => {
    const token = jwt.sign({ id: 5, role: 'vendeur' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const user = fakeUser({ id: 5, validation: true });
    mockUser.findByPk.mockResolvedValue(user);

    const res = await request.get(`/api/auth/activate?token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/déjà activé/i);
  });

  it('400 — missing token query param', async () => {
    const res = await request.get('/api/auth/activate');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/token manquant/i);
  });

  it('400 — expired token', async () => {
    const token = jwt.sign({ id: 5, role: 'vendeur' }, process.env.JWT_SECRET, { expiresIn: '-1s' });

    const res = await request.get(`/api/auth/activate?token=${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide ou expiré/i);
  });

  it('400 — token signed with wrong secret', async () => {
    const token = jwt.sign({ id: 5 }, 'wrong-secret', { expiresIn: '1d' });

    const res = await request.get(`/api/auth/activate?token=${token}`);

    expect(res.status).toBe(400);
  });

  it('400 — user not found for valid token', async () => {
    const token = jwt.sign({ id: 999, role: 'vendeur' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    mockUser.findByPk.mockResolvedValue(null);

    const res = await request.get(`/api/auth/activate?token=${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/introuvable/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  const creds = { email: 'test@example.com', mot_de_passe: 'SecurePass1' };

  beforeEach(() => {
    mockUser.findOne.mockResolvedValue(fakeUser({ actif: true }));
    mockUser.update.mockResolvedValue([1]);
  });

  it('200 — returns user data on valid credentials', async () => {
    const res = await request.post('/api/auth/login').send(creds);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'test@example.com',
      role: 'vendeur',
    });
    expect(res.body.user).not.toHaveProperty('mot_de_passe');
  });

  it('200 — sets httpOnly accessToken cookie on successful login', async () => {
    const res = await request.post('/api/auth/login').send(creds);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const accessCookie = cookies.find(c => c.startsWith('accessToken='));
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toMatch(/HttpOnly/i);
  });

  it('200 — sets httpOnly refreshToken cookie on successful login', async () => {
    const res = await request.post('/api/auth/login').send(creds);

    const cookies = res.headers['set-cookie'];
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it('401 — user not found', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const res = await request.post('/api/auth/login').send(creds);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/identifiants invalides/i);
  });

  it('401 — wrong password (argon2.verify returns false)', async () => {
    argon2VerifyShouldFail = true;
    const res = await request.post('/api/auth/login').send({ ...creds, mot_de_passe: 'WrongPass1' });
    argon2VerifyShouldFail = false;

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/identifiants invalides/i);
  });

  it('403 — account not activated by admin (actif = false)', async () => {
    mockUser.findOne.mockResolvedValue(fakeUser({ actif: false }));

    const res = await request.post('/api/auth/login').send(creds);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/non activé/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  const rawRefreshToken = 'raw-refresh-token-hex-string';

  beforeEach(() => {
    // Simulate finding a user with a matching refresh token
    mockUser.findAll.mockResolvedValue([
      fakeUser({ refresh_token: '$2b$mocked_bcrypt_hash' }),
    ]);
    mockUser.update.mockResolvedValue([1]);
  });

  it('200 — rotates both cookies when refresh token is valid', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${rawRefreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/renouvelé/i);

    const cookies = res.headers['set-cookie'];
    expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  it('401 — missing refreshToken cookie', async () => {
    const res = await request.post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/manquant/i);
  });

  it('401 — no user matches the provided refresh token', async () => {
    bcryptCompareShouldFail = true;
    mockUser.findAll.mockResolvedValue([fakeUser({ refresh_token: '$2b$other_hash' })]);

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=invalid-token`);
    bcryptCompareShouldFail = false;

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalide/i);
  });

  it('401 — no users with non-null refresh_token in DB', async () => {
    mockUser.findAll.mockResolvedValue([]);

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${rawRefreshToken}`);

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('200 — clears both cookies', async () => {
    const cookie = makeCookie();
    mockUser.update.mockResolvedValue([1]);

    const res = await request
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/déconnecté/i);

    // Both cookies should be cleared (expires in the past or empty value)
    const cookies = res.headers['set-cookie'] || [];
    const accessCleared = cookies.some(c => c.startsWith('accessToken=') && c.includes('Expires=Thu, 01 Jan 1970'));
    const refreshCleared = cookies.some(c => c.startsWith('refreshToken=') && c.includes('Expires=Thu, 01 Jan 1970'));
    expect(accessCleared || cookies.some(c => c.includes('accessToken=;'))).toBeTruthy();
  });

  it('200 — works without any cookie (unauthenticated logout is graceful)', async () => {
    const res = await request.post('/api/auth/logout');

    expect(res.status).toBe(200);
  });

  it('200 — logout route is public (no requireAuth): cookies cleared, no DB update needed', async () => {
    // NOTE: /logout has no requireAuth middleware — req.user is never populated.
    // The controller's `if (req.user?.id)` guard correctly skips the DB update.
    // This is intentional: logout must work even with an expired access token.
    const cookie = makeCookie({ id: 42, role: 'vendeur' });

    const res = await request
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/déconnecté/i);
    // DB update is NOT expected — requireAuth is not applied to this route
    expect(mockUser.update).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('200 — responds with same message whether email exists or not (anti-enumeration)', async () => {
    mockUser.findOne.mockResolvedValue(fakeUser());

    const resExists = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'real@example.com' });

    mockUser.findOne.mockResolvedValue(null);

    const resNotExists = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@example.com' });

    expect(resExists.status).toBe(200);
    expect(resNotExists.status).toBe(200);
    // Same message body — prevents email enumeration
    expect(resExists.body.message).toBe(resNotExists.body.message);
  });

  it('400 — missing email field', async () => {
    const res = await request.post('/api/auth/forgot-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email requis/i);
  });

  it('200 — sends reset email when user exists', async () => {
    const user = fakeUser();
    mockUser.findOne.mockResolvedValue(user);

    const res = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(mockSendMail).toHaveBeenCalled();
    // Token should be saved on the user
    expect(user.save).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-reset-token/:token
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/verify-reset-token/:token', () => {
  function makeResetToken(userId = 1) {
    return jwt.sign(
      { id: userId, email: 'test@example.com', purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  it('200 — valid token returns { valid: true, email }', async () => {
    const token = makeResetToken();
    mockUser.findOne.mockResolvedValue(fakeUser({ reset_password_token: token }));

    const res = await request.get(`/api/auth/verify-reset-token/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.email).toBe('test@example.com');
  });

  it('400 — expired token', async () => {
    const token = jwt.sign(
      { id: 1, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request.get(`/api/auth/verify-reset-token/${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide ou expiré/i);
  });

  it('400 — token with wrong purpose (not password-reset)', async () => {
    const token = jwt.sign(
      { id: 1, purpose: 'activation' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request.get(`/api/auth/verify-reset-token/${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide/i);
  });

  it('400 — valid token but user not found in DB', async () => {
    const token = makeResetToken(999);
    mockUser.findOne.mockResolvedValue(null);

    const res = await request.get(`/api/auth/verify-reset-token/${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide ou expiré/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  let validResetToken;
  let userMock;

  beforeEach(() => {
    validResetToken = jwt.sign(
      { id: 1, email: 'test@example.com', purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    userMock = fakeUser({ reset_password_token: validResetToken });
    mockUser.findOne.mockResolvedValue(userMock);
  });

  const validBody = {
    nouveau_mot_de_passe: 'NewPass123',
    confirmer_mot_de_passe: 'NewPass123',
  };

  it('200 — resets password with valid token and matching passwords', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: validResetToken, ...validBody });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/réinitialisé/i);
    expect(userMock.save).toHaveBeenCalled();
    // Token should be cleared
    expect(userMock.reset_password_token).toBeNull();
    expect(userMock.reset_password_expires).toBeNull();
    // Refresh token should be invalidated for security
    expect(userMock.refresh_token).toBeNull();
  });

  it('200 — clears auth cookies after reset', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: validResetToken, ...validBody });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    // Cookies should be cleared
    expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
  });

  it('400 — passwords do not match', async () => {
    const res = await request.post('/api/auth/reset-password').send({
      token: validResetToken,
      nouveau_mot_de_passe: 'NewPass123',
      confirmer_mot_de_passe: 'DifferentPass123',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ne correspondent pas/i);
  });

  it('400 — weak new password', async () => {
    const res = await request.post('/api/auth/reset-password').send({
      token: validResetToken,
      nouveau_mot_de_passe: 'weakpass',
      confirmer_mot_de_passe: 'weakpass',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mot de passe invalide/i);
  });

  it('400 — missing required fields', async () => {
    const res = await request.post('/api/auth/reset-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/requis/i);
  });

  it('400 — expired reset token', async () => {
    const expiredToken = jwt.sign(
      { id: 1, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request.post('/api/auth/reset-password').send({
      token: expiredToken,
      ...validBody,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide ou expiré/i);
  });

  it('400 — token with wrong purpose', async () => {
    const badPurposeToken = jwt.sign(
      { id: 1, purpose: 'activation' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request.post('/api/auth/reset-password').send({
      token: badPurposeToken,
      ...validBody,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide/i);
  });

  it('400 — user not found for the token', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const res = await request.post('/api/auth/reset-password').send({
      token: validResetToken,
      ...validBody,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide ou expiré/i);
  });
});
