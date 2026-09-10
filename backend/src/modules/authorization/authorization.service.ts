import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AccessDecision } from '@prisma/client';

export interface PolicyInput {
  userId?: string;
  roles: string[];
  verificationStatus?: string;
  accountStatus?: string;
  citizenshipCountry?: string | null;
  currentCountry?: string | null;
  travelAuthorized?: boolean;
  deviceTrusted?: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: string;
  resource?: string;
}

export interface PolicyOutput {
  decision: AccessDecision;
  reasons: string[];
}

/**
 * Centralized authorization engine. Frontend NEVER decides access.
 * Flow: auth -> identity -> account -> country -> travel -> device -> risk -> policy -> audit.
 */
@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  async evaluate(input: PolicyInput): Promise<PolicyOutput> {
    const reasons: string[] = [];

    if (!input.userId) return this.log(input, 'DENY', ['unauthenticated']);
    if (input.accountStatus === 'BANNED' || input.accountStatus === 'SUSPENDED') {
      return this.log(input, 'DENY', [`account_${input.accountStatus?.toLowerCase()}`]);
    }
    if (input.accountStatus === 'SECURITY_HOLD') {
      return this.log(input, 'MANUAL_REVIEW', ['security_hold']);
    }
    if (['LIMITED', 'COMMENT_RESTRICTED', 'SUBMISSION_RESTRICTED', 'UPLOAD_RESTRICTED', 'PAYMENT_RESTRICTED'].includes(input.accountStatus ?? '')) {
      reasons.push(`restricted_${input.accountStatus?.toLowerCase()}`);
    }

    // Africa-only policy (configurable, never hard-coded)
    const africaOnly = (process.env.AFRICA_ONLY_MEMBERS ?? 'false') === 'true';
    if (africaOnly && input.currentCountry && !(await this.isAfrican(input.currentCountry)) && !input.travelAuthorized) {
      return this.log(input, 'DENY', ['africa_only_no_travel_grant']);
    }

    if (input.riskLevel === 'CRITICAL') return this.log(input, 'MANUAL_REVIEW', ['risk_critical', ...reasons]);
    if (input.riskLevel === 'HIGH') return this.log(input, 'REQUIRE_MFA', ['risk_high', ...reasons]);
    if (input.verificationStatus && ['NOT_STARTED', 'SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW'].includes(input.verificationStatus)) {
      if (this.requiresVerified(input.action)) return this.log(input, 'REQUIRE_VERIFICATION', ['identity_not_verified', ...reasons]);
    }
    if (!input.deviceTrusted && this.isSensitive(input.action)) {
      return this.log(input, 'REQUIRE_MFA', ['untrusted_device_sensitive_action', ...reasons]);
    }
    if (reasons.length > 0) return this.log(input, 'LIMITED_ACCESS', reasons);
    return this.log(input, 'ALLOW', ['ok']);
  }

  private requiresVerified(action: string): boolean {
    return ['submit:community', 'download:document', 'request:travel', 'upload:file'].includes(action);
  }

  private isSensitive(action: string): boolean {
    return ['payment:create', 'admin:*', 'identity:submit', 'device:revoke'].includes(action) || action.startsWith('admin:');
  }

  private async isAfrican(country: string): Promise<boolean> {
    const row = await this.prisma.country.findFirst({ where: { OR: [{ code: country }, { name: country }] } });
    if (row) return true; // all rows in countries table are African or explicitly enabled diaspora rules
    const african = ['NG', 'GH', 'KE', 'ZA', 'ZM', 'RW', 'SN', 'CM', 'ET', 'TZ', 'UG', 'ZW', 'BW', 'NA', 'MZ'];
    return african.includes(country.toUpperCase().slice(0, 2));
  }

  private async log(input: PolicyInput, decision: AccessDecision, reasons: string[]): Promise<PolicyOutput> {
    if (input.userId) {
      await this.prisma.accessDecisionLog.create({
        data: { userId: input.userId, action: input.action, resource: input.resource, decision, reasons, context: { ...input, userId: undefined } as never },
      });
    }
    return { decision, reasons };
  }
}
