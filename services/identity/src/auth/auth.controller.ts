import { Body, Controller, Get, Post } from '@nestjs/common';
import { createPublicKey } from 'crypto';
import { readFileSync } from 'fs';
import { AuthService } from './auth.service.js';
import { CredentialsDto } from './dto/credentials.dto.js';

@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('auth/register')
  register(@Body() dto: CredentialsDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('auth/login')
  login(@Body() dto: CredentialsDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('auth/refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  @Get('.well-known/jwks.json')
  jwks() {
    const jwk = createPublicKey(readFileSync('keys/public.pem')).export({ format: 'jwk' });
    return { keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'identity-1' }] };
  }
}