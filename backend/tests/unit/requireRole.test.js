/**
 * Unit tests — requireRole middleware (authMiddleware.js)
 *
 * Tests the requireRole(...roles) factory as a pure function by injecting
 * mock req / res / next objects. No HTTP server needed.
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

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
let requireRole;

beforeAll(async () => {
  const middleware = await import('../../src/middlewares/authMiddleware.js');
  requireRole = middleware.requireRole;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockReq(user = null) {
  return {
    cookies: {},
    ip: '127.0.0.1',
    originalUrl: '/api/test',
    user,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// requireRole
// ─────────────────────────────────────────────────────────────────────────────
describe('requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Single allowed role ───────────────────────────────────────────────────

  it('calls next() when user role matches single allowed role', () => {
    const req = mockReq({ id: 1, role: 'vendeur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user role does NOT match single allowed role', () => {
    const req = mockReq({ id: 2, role: 'fournisseur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
  });

  // ── Multiple allowed roles ────────────────────────────────────────────────

  it('calls next() when user role is first of multiple allowed roles', () => {
    const req = mockReq({ id: 3, role: 'vendeur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user role is second of multiple allowed roles', () => {
    const req = mockReq({ id: 4, role: 'admin' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user role is last of three allowed roles', () => {
    const req = mockReq({ id: 5, role: 'fournisseur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'fournisseur', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not in multiple allowed roles', () => {
    const req = mockReq({ id: 6, role: 'specialiste' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'fournisseur')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // ── Edge cases: no user ───────────────────────────────────────────────────

  it('returns 401 when req.user is null', () => {
    const req = mockReq(null);
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non authentifié' });
  });

  it('returns 401 when req.user is undefined', () => {
    const req = mockReq();
    delete req.user;
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ── Role-specific guards — all platform roles ─────────────────────────────

  it('blocks vendeur from fournisseur-only route', () => {
    const req = mockReq({ id: 7, role: 'vendeur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('fournisseur', 'admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('blocks fournisseur from vendeur-only route', () => {
    const req = mockReq({ id: 8, role: 'fournisseur' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('blocks specialiste from vendeur/fournisseur route', () => {
    const req = mockReq({ id: 9, role: 'specialiste' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('vendeur', 'fournisseur')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('admin passes through any role list that includes admin', () => {
    const req = mockReq({ id: 10, role: 'admin' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('specialiste', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  // ── Factory returns a new function each time ──────────────────────────────

  it('returns a middleware function (typeof function)', () => {
    const mw = requireRole('vendeur');
    expect(typeof mw).toBe('function');
  });

  it('each call to requireRole returns an independent middleware', () => {
    const mwVendeur = requireRole('vendeur');
    const mwAdmin = requireRole('admin');

    const req = mockReq({ id: 11, role: 'admin' });
    const res1 = mockRes();
    const next1 = jest.fn();
    mwVendeur(req, res1, next1);

    const res2 = mockRes();
    const next2 = jest.fn();
    mwAdmin(req, res2, next2);

    expect(next1).not.toHaveBeenCalled();  // admin does NOT pass vendeur guard
    expect(next2).toHaveBeenCalledTimes(1); // admin passes admin guard
  });
});
