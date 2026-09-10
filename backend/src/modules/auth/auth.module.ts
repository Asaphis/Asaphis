import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MeController } from './me.controller';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, MeController, OnboardingController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
