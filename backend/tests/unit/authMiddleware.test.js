/**
 * Unit tests — authMiddleware.js
 *
 * Tests requireAuth and requireAdmin as pure functions by injecting
 * mock req / res / next objects. No HTTP server needed.
 *
 * ESM note: jest.unstable_mockModule must appear before dynamic imports.
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ─── Mock the logger so no files are written during tests ────────────────────
jest.unstable_mockModule('../../src/config/logger.js', () => ({
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  },
}));

// ─── Dynamic imports AFTER mocking ───────────────────────────────────────────
let requireAuth, requireAdmin, logger;

beforeAll(async () => {
  const middleware = await import('../../src/middlewares/authMiddleware.js');
  requireAuth = middleware.requireAuth;
  requireAdmin = middleware.requireAdmin;

  const logModule = await import('../../src/config/logger.js');
  logger = logModule.default;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal mock Express request */
function mockReq(overrides = {}) {
  return {
    cookies: {},
    ip: '127.0.0.1',
    originalUrl: '/api/test',
    user: null,
    ...overrides,
  };
}

/** Build a mock Express response that captures status + json calls */
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const validPayload = { id: 42, role: 'vendeur' };

function makeToken(payload = validPayload, secret = process.env.JWT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth
// ─────────────────────────────────────────────────────────────────────────────
describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() when a valid token is in the cookie', () => {
    const token = makeToken();
    const req = mockReq({ cookies: { accessToken: token } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 42, role: 'vendeur' });
  });

  it('returns 401 when no cookie is present', () => {
    const req = mockReq({ cookies: {} });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non authentifié' });
  });

  it('returns 401 when cookie value is null', () => {
    const req = mockReq({ cookies: { accessToken: null } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when the token is signed with a different secret', () => {
    const token = makeToken(validPayload, 'wrong-secret');
    const req = mockReq({ cookies: { accessToken: token } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
  });

  it('returns 401 when the token is expired', () => {
    const token = jwt.sign(validPayload, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq({ cookies: { accessToken: token } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
  });

  it('returns 401 when the token string is malformed', () => {
    const req = mockReq({ cookies: { accessToken: 'not.a.real.jwt' } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('decodes all payload fields onto req.user', () => {
    const payload = { id: 7, role: 'admin', extra: 'data' };
    const token = makeToken(payload);
    const req = mockReq({ cookies: { accessToken: token } });
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(req.user.id).toBe(7);
    expect(req.user.role).toBe('admin');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireAdmin
// ─────────────────────────────────────────────────────────────────────────────
describe('requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() when req.user.role is "admin"', () => {
    const req = mockReq({ user: { id: 1, role: 'admin' } });
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user.role is "vendeur"', () => {
    const req = mockReq({ user: { id: 2, role: 'vendeur' } });
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès admin requis' });
  });

  it('returns 403 when req.user.role is "fournisseur"', () => {
    const req = mockReq({ user: { id: 3, role: 'fournisseur' } });
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when req.user.role is "specialiste"', () => {
    const req = mockReq({ user: { id: 4, role: 'specialiste' } });
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 401 when req.user is null (requireAuth was not applied first)', () => {
    const req = mockReq({ user: null });
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non authentifié' });
  });

  it('returns 401 when req.user is undefined', () => {
    const req = mockReq();
    delete req.user;
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
