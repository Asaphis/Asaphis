import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { RiskLevel } from '@prisma/client';

export interface RiskInput {
  userId?: string;
  sessionId?: string;
  isNewDevice?: boolean;
  isNewCountry?: boolean;
  vpn?: boolean;
  datacenterIp?: boolean;
  failedAttemptsRecent?: number;
  impossibleTravel?: boolean;
  travelAuthorized?: boolean;
  verificationStatus?: string;
}

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  evaluate(input: RiskInput): { level: RiskLevel; score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const add = (pts: number, reason: string) => { score += pts; reasons.push(reason); };
    if (input.isNewDevice) add(20, 'new_device');
    if (input.isNewCountry) add(25, 'new_country');
    if (input.vpn) add(20, 'vpn_proxy');
    if (input.datacenterIp) add(25, 'datacenter_ip');
    if ((input.failedAttemptsRecent ?? 0) >= 5) add(30, 'repeated_failed_auth');
    if (input.impossibleTravel) add(40, 'impossible_travel');
    if (input.travelAuthorized) score -= 15;
    if (input.verificationStatus === 'VERIFIED') score -= 10;
    score = Math.max(0, Math.min(100, score));
    const level: RiskLevel = score >= 80 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
    return { level, score, reasons };
  }

  async record(input: RiskInput & { type: string; signals?: Record<string, unknown> }) {
    const { level, score, reasons } = this.evaluate(input);
    if (input.userId) {
      await this.prisma.riskScore.create({ data: { userId: input.userId, sessionId: input.sessionId, level, score, reasons } });
      await this.prisma.riskEvent.create({
        data: { userId: input.userId, sessionId: input.sessionId, type: input.type, signals: (input.signals ?? {}) as never, level },
      });
    }
    // Automated containment (never permanent ban): caller maps level -> MFA/session/reviews.
    return { level, score, reasons };
  }
}
