import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';

@Module({
  controllers: [LoginController],
  providers: [LoginService,PrismaService,JwtService,HeaderAuthService]
})
export class LoginModule {}
