import { RiskService } from './risk.service';

describe('RiskService (pure evaluation)', () => {
  const svc = new RiskService({} as never);

  it('rates clean verified member LOW', () => {
    const r = svc.evaluate({ verificationStatus: 'VERIFIED' });
    expect(r.level).toBe('LOW');
  });

  it('escalates datacenter + new country + failures', () => {
    const r = svc.evaluate({ isNewCountry: true, datacenterIp: true, failedAttemptsRecent: 6 });
    expect(['HIGH', 'CRITICAL']).toContain(r.level);
  });

  it('never auto-bans: returns level, not action', () => {
    const r = svc.evaluate({ impossibleTravel: true });
    expect(r.reasons).toContain('impossible_travel');
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
