import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const STAFF_ROLES = new Set([
  'TRUSTED_MEMBER',
  'MODERATOR',
  'CONTENT_ADMIN',
  'FINANCE_ADMIN',
  'SECURITY_ADMIN',
  'SUPER_ADMIN',
]);

const BLOCKED_ACCOUNT_STATUSES = new Set(['SUSPENDED', 'BANNED']);

/** Anyone with a verified identity, trusted+ status, or a staff role. */
export async function isVerifiedMember(prisma: PrismaService, userId: string, roles: string[] = []): Promise<boolean> {
  if ((roles ?? []).some((r) => STAFF_ROLES.has(r))) return true;
  const profile = await prisma.identityProfile.findUnique({ where: { userId } });
  return profile?.status === 'VERIFIED';
}

export async function assertAccountUsable(prisma: PrismaService, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || BLOCKED_ACCOUNT_STATUSES.has(String(user.accountStatus))) {
    throw new ForbiddenException('This account cannot perform this action.');
  }
}

/** Throws when the user carries an active restriction of one of the given types. */
export async function assertNoRestriction(prisma: PrismaService, userId: string, types: string[]): Promise<void> {
  const hit = await prisma.restriction.findFirst({
    where: { userId, active: true, type: { in: types as never[] } },
  });
  if (hit) throw new ForbiddenException('This action is limited on your account. Contact support.');
}

export const POSTING_BLOCK_TYPES = ['SUBMISSION_RESTRICTED', 'SECURITY_HOLD', 'SUSPENDED', 'BANNED'];
export const COMMENT_BLOCK_TYPES = ['COMMENT_RESTRICTED', 'SECURITY_HOLD', 'SUSPENDED', 'BANNED'];
export const MESSAGING_BLOCK_TYPES = ['SECURITY_HOLD', 'SUSPENDED', 'BANNED'];

/** Accepted friend user-ids in both directions. */
export async function friendIds(prisma: PrismaService, userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/** User-ids blocked in either direction (for hiding content and DMs). */
export async function blockedIds(prisma: PrismaService, userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: {
      status: 'BLOCKED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

export async function activeGroupIds(prisma: PrismaService, userId: string): Promise<string[]> {
  const rows = await prisma.groupMember.findMany({
    where: { userId, status: 'active' },
    select: { groupId: true },
  });
  return rows.map((r) => r.groupId);
}

export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'M';
}

export function displayNameOf(email?: string | null, displayName?: string | null): string {
  if (displayName?.trim()) return displayName.trim();
  const local = (email ?? '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return local || 'Member';
}
