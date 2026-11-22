import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

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
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { keyid: 'identity-1' },
    );
    return { accessToken };
  }
}
