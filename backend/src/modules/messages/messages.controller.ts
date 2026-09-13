import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MESSAGING_BLOCK_TYPES,
  assertAccountUsable,
  assertNoRestriction,
  blockedIds,
  displayNameOf,
  initialsOf,
  isVerifiedMember,
} from '../social/social-access';

class StartDto {
  @IsString() userId!: string;
}

class SendDto {
  @IsString() body!: string;
}

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private prisma: PrismaService) {}

  private card(user: { id: string; email?: string; member?: { displayName?: string; memberCode?: string } | null }) {
    const name = displayNameOf(user.email, user.member?.displayName);
    return { id: user.id, displayName: name, memberCode: user.member?.memberCode ?? '', initials: initialsOf(name) };
  }

  private async requireVerified(userId: string, roles: string[]) {
    await assertAccountUsable(this.prisma, userId);
    if (!(await isVerifiedMember(this.prisma, userId, roles))) {
      throw new ForbiddenException('Verify your identity to message members.');
    }
    await assertNoRestriction(this.prisma, userId, MESSAGING_BLOCK_TYPES);
  }

  private async areFriends(a: string, b: string): Promise<boolean> {
    const row = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: a, addresseeId: b }, { requesterId: b, addresseeId: a }],
      },
    });
    return Boolean(row);
  }

  @Get('conversations')
  async conversations(@CurrentUser() user: { sub: string }) {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.sub },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, email: true, member: { select: { displayName: true, memberCode: true } } } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    return Promise.all(
      parts.map(async (p) => {
        const others = p.conversation.participants.filter((x) => x.userId !== user.sub);
        const unread = await this.prisma.directMessage.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: user.sub },
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });
        const last = p.conversation.messages[0];
        return {
          id: p.conversationId,
          kind: p.conversation.kind,
          title: p.conversation.title ?? others.map((o) => displayNameOf(o.user.email, o.user.member?.displayName)).join(', '),
          peers: others.map((o) => this.card(o.user)),
          lastMessage: last ? { id: last.id, senderId: last.senderId, body: last.body, createdAt: last.createdAt } : null,
          unread,
          updatedAt: p.conversation.updatedAt,
        };
      }),
    );
  }

  /** Friends-only direct conversation (reuses the existing one). */
  @Post('conversations')
  async start(@Body() dto: StartDto, @CurrentUser() user: { sub: string; email: string; roles: string[] }) {
    await this.requireVerified(user.sub, user.roles);
    if (dto.userId === user.sub) throw new BadRequestException('You cannot message yourself.');
    if (!(await this.areFriends(user.sub, dto.userId))) {
      throw new ForbiddenException('You can only message friends. Send a friend request first.');
    }
    const blocked = await blockedIds(this.prisma, user.sub);
    if (blocked.includes(dto.userId)) throw new ForbiddenException('Not allowed');
    const target = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!target) throw new NotFoundException('Member not found');
    const existing = await this.prisma.conversation.findFirst({
      where: {
        kind: 'DIRECT',
        participants: { every: { userId: { in: [user.sub, dto.userId] } } },
      },
      include: { participants: true },
    });
    const withBoth = existing && existing.participants.length === 2 ? existing : null;
    if (withBoth) return { id: withBoth.id };
    const convo = await this.prisma.conversation.create({
      data: {
        kind: 'DIRECT',
        participants: { create: [{ userId: user.sub }, { userId: dto.userId }] },
      },
    });
    return { id: convo.id };
  }

  @Get('conversations/:id')
  async thread(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Query('after') after?: string,
    @Query('take') take?: string,
  ) {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.sub } },
    });
    if (!part) throw new NotFoundException('Conversation not found');
    const limit = Math.min(Math.max(Number(take) || 50, 1), 100);
    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
      include: { sender: { select: { id: true, email: true, member: { select: { displayName: true } } } } },
      orderBy: { createdAt: after ? 'asc' : 'desc' },
      take: limit,
    });
    const ordered = after ? messages : [...messages].reverse();
    await this.prisma.conversationParticipant.update({ where: { id: part.id }, data: { lastReadAt: new Date() } });
    return ordered.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: displayNameOf(m.sender.email, m.sender.member?.displayName),
      mine: m.senderId === user.sub,
      body: m.body,
      createdAt: m.createdAt,
    }));
  }

  @Post('conversations/:id/messages')
  async send(
    @Param('id') id: string,
    @Body() dto: SendDto,
    @CurrentUser() user: { sub: string; email: string; roles: string[] },
  ) {
    await this.requireVerified(user.sub, user.roles);
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.sub } },
      include: { conversation: { include: { participants: true } } },
    });
    if (!part) throw new NotFoundException('Conversation not found');
    if (!dto.body?.trim()) throw new BadRequestException('Write a message first.');
    const msg = await this.prisma.directMessage.create({
      data: { conversationId: id, senderId: user.sub, body: dto.body.trim().slice(0, 4000) },
    });
    await this.prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    const others = part.conversation.participants.filter((p) => p.userId !== user.sub);
    for (const o of others) {
      await this.prisma.notification.create({
        data: { userId: o.userId, category: 'Social', title: 'New message', body: `${displayNameOf(user.email)} sent you a message.` },
      }).catch(() => null);
    }
    return { id: msg.id, createdAt: msg.createdAt };
  }
}
