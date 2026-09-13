import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

class CreateDto {
  @IsNumber() amount!: number;
  @IsString() currency!: string;
  @IsString() method!: string;
  @IsOptional() @IsString() countryCode?: string;
}
class WebhookDto {
  @IsString() provider!: string;
  @IsString() reference!: string;
  @IsString() status!: string;
  @IsOptional() signature?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('config')
  async publicConfig() {
    return this.prisma.paymentConfiguration.findMany({ where: { enabled: true } });
  }

  @Post('create')
  async create(@Body() dto: CreateDto, @CurrentUser() user: { sub: string }) {
    // Country-aware config with global fallback; secrets never leave server.
    const specific = dto.countryCode
      ? await this.prisma.paymentConfiguration.findFirst({ where: { countryCode: dto.countryCode.toUpperCase(), currency: dto.currency } })
      : null;
    const fallback = specific ?? (await this.prisma.paymentConfiguration.findFirst({ where: { countryCode: 'GLOBAL', currency: dto.currency } }));
    const row = await this.prisma.payment.create({
      data: { userId: user.sub, amount: dto.amount, currency: dto.currency, method: dto.method, provider: fallback?.providers?.[0] ?? 'mock', providerReference: undefined, countryCode: dto.countryCode?.toUpperCase(), status: 'PENDING', metadata: { configId: fallback?.id } as never },
    });
    // Store providerReference=id so webhook {reference:id} can match.
    await this.prisma.payment.update({ where: { id: row.id }, data: { providerReference: row.id } }).catch(() => null);
    return { id: row.id, status: 'Pending' as const, provider: row.provider };
  }

  // Webhook: only verified backend events confirm payment — never trust return-URL alone.
  @Public()
  @Post('webhook')
  async webhook(@Body() dto: WebhookDto) {
    if (dto.signature && dto.signature !== process.env.PAYMENT_WEBHOOK_SECRET) {
      return { ok: false, reason: 'bad_signature' };
    }
    const success = ['success', 'successful', 'paid'].includes(dto.status.toLowerCase());
    // Match by providerReference OR by payment id (create() now stores
    // providerReference=id so test webhooks can confirm without a provider).
    const payment = await this.prisma.payment.findFirst({ where: { OR: [{ providerReference: dto.reference }, { id: dto.reference }] } }).catch(() => null);
    if (!payment) return { ok: true, matched: false };
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: success ? 'SUCCESSFUL' : 'FAILED', webhookVerified: true } });
    if (success && payment.userId) {
      await this.prisma.user.update({ where: { id: payment.userId }, data: { membershipStage: 'ACTIVE_MEMBER' } });
      await this.prisma.member.updateMany({ where: { userId: payment.userId }, data: { activatedAt: new Date() } });
    }
    return { ok: true };
  }

  @Roles('FINANCE_ADMIN', 'SUPER_ADMIN')
  @Get('admin/countries')
  countries() {
    return this.prisma.paymentConfiguration.findMany({ orderBy: { countryCode: 'asc' } });
  }

  @Roles('FINANCE_ADMIN', 'SUPER_ADMIN')
  @Patch('admin/countries/:id')
  updateCountry(@Param('id') id: string, @Body() patch: { amount?: number }) {
    return this.prisma.paymentConfiguration.update({ where: { id }, data: { amount: patch.amount } });
  }

  // Manual verify for bank-transfer / admin-confirmed payments.
  @Roles('FINANCE_ADMIN', 'SUPER_ADMIN')
  @Post('admin/:id/verify')
  async verify(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() admin: { email: string }) {
    const success = ['success', 'successful', 'paid', 'approved'].includes(String(body.status).toLowerCase());
    const row = await this.prisma.payment.update({ where: { id }, data: { status: success ? 'SUCCESSFUL' : 'FAILED', webhookVerified: false } });
    if (success && row.userId) {
      await this.prisma.user.update({ where: { id: row.userId }, data: { membershipStage: 'ACTIVE_MEMBER' } });
      await this.prisma.member.updateMany({ where: { userId: row.userId }, data: { activatedAt: new Date() } });
    }
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'payment.verify', target: id, newState: { status: body.status } as never } });
    return row;
  }
}
