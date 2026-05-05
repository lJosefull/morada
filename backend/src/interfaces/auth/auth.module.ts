import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { UserModule } from '../users/users.module';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
