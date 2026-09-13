import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PhoneModule } from './modules/phone/phone.module';
import { CountriesModule } from './modules/countries/countries.module';
import { IdentityModule } from './modules/identity/identity.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RiskModule } from './modules/risk/risk.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { GeoModule } from './modules/geo/geo.module';
import { TravelModule } from './modules/travel/travel.module';
import { RestrictionsModule } from './modules/restrictions/restrictions.module';
import { ContentModule } from './modules/content/content.module';
import { CommunityModule } from './modules/community/community.module';
import { SocialModule } from './modules/social/social.module';
import { FriendsModule } from './modules/friends/friends.module';
import { MessagesModule } from './modules/messages/messages.module';
import { GroupsModule } from './modules/groups/groups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SupportModule } from './modules/support/support.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { SecurityModule } from './modules/security/security.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { FilesModule } from './modules/files/files.module';
import { QueuesModule } from './queues/queues.module';
import { HealthController } from './health.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Global JwtService: APP_GUARDs (JwtAuthGuard) are instantiated in the root
    // injector, so the JwtService they depend on must be visible there — not
    // only inside AuthModule's JwtModule.register({}).
    JwtModule.register({ global: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
      prefix: process.env.BULLMQ_PREFIX ?? 'asaphis',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PhoneModule,
    CountriesModule,
    IdentityModule,
    DevicesModule,
    SessionsModule,
    RiskModule,
    AuthorizationModule,
    GeoModule,
    TravelModule,
    RestrictionsModule,
    ContentModule,
    CommunityModule,
    SocialModule,
    FriendsModule,
    MessagesModule,
    GroupsModule,
    NotificationsModule,
    PaymentsModule,
    SupportModule,
    AnalyticsModule,
    AuditModule,
    SecurityModule,
    AdminModule,
    SettingsModule,
    FilesModule,
    QueuesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
