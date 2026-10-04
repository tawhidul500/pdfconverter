import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { compare, hash } from "bcryptjs";
import { IsNull, Repository } from "typeorm";
import { createOpaqueToken, sha256 } from "../common/crypto";
import { AuthSessionEntity, UserEntity } from "../database/entities";
import type { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AuthSessionEntity) private readonly sessions: Repository<AuthSessionEntity>,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } })) throw new ConflictException("An account already exists for this email.");
    const user = await this.users.save(this.users.create({ email, displayName: dto.displayName.trim(), passwordHash: await hash(dto.password, 12) }));
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException("Email or password is incorrect.");
    return this.createSession(user);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.sessions.update({ tokenHash: sha256(rawToken), revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private async createSession(user: UserEntity) {
    const token = createOpaqueToken();
    const ttlHours = this.config.getOrThrow<number>("sessionTtlHours");
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await this.sessions.save(this.sessions.create({ tokenHash: sha256(token), userId: user.id, user, expiresAt, revokedAt: null, lastSeenAt: new Date() }));
    return { token, expiresAt, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }
}
