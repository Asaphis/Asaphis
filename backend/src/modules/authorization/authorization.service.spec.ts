import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  const prismaMock = { country: { findFirst: async () => null }, accessDecisionLog: { create: async () => ({}) } } as never;
  const svc = new AuthorizationService(prismaMock);

  it('denies unauthenticated', async () => {
    const r = await svc.evaluate({ roles: [], action: 'read:member' });
    expect(r.decision).toBe('DENY');
  });

  it('denies banned accounts', async () => {
    const r = await svc.evaluate({ userId: 'u1', roles: ['MEMBER'], accountStatus: 'BANNED', action: 'read:member' });
    expect(r.decision).toBe('DENY');
  });

  it('requires MFA on critical risk, never silent allow', async () => {
    const svc2 = new AuthorizationService({ country: { findFirst: async () => null }, accessDecisionLog: { create: async () => ({}) } } as never);
    const r = await svc2.evaluate({ userId: 'u1', roles: ['MEMBER'], accountStatus: 'ACTIVE', riskLevel: 'CRITICAL', action: 'read:member' });
    expect(r.decision).toBe('MANUAL_REVIEW');
  });

  it('allows clean member read', async () => {
    const svc2 = new AuthorizationService({ country: { findFirst: async () => null }, accessDecisionLog: { create: async () => ({}) } } as never);
    const r = await svc2.evaluate({ userId: 'u1', roles: ['MEMBER'], accountStatus: 'ACTIVE', riskLevel: 'LOW', action: 'read:member' });
    expect(r.decision).toBe('ALLOW');
  });
});
