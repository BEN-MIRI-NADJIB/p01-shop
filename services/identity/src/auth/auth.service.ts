import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity.js';
import { RefreshToken } from './refresh-token.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(RefreshToken) private tokens: Repository<RefreshToken>,
    private jwt: JwtService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(user: User) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { keyid: 'identity-1', expiresIn: '15m' },
    );
    const refreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.tokens.save(
      this.tokens.create({ userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt }),
    );
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string) {
    if (await this.users.findOneBy({ email })) {
      throw new ConflictException('Email déjà utilisé');
    }
    const passwordHash = await argon2.hash(password);
    const user = await this.users.save(this.users.create({ email, passwordHash }));
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOneBy({ email });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.issueTokens(user);
  }

  async refresh(rawToken: string) {
    const stored = await this.tokens.findOne({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
    if (stored.revoked) {
      await this.tokens.update({ userId: stored.userId }, { revoked: true });
      throw new UnauthorizedException('Réutilisation détectée : sessions révoquées');
    }
    const user = await this.users.findOneBy({ id: stored.userId });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    stored.revoked = true;
    await this.tokens.save(stored);
    return this.issueTokens(user);
  }
}