import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { Repository } from "typeorm";
import { sha256 } from "../common/crypto";
import { AuthSessionEntity } from "../database/entities";
import type { AuthenticatedRequest } from "./current-user.decorator";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(AuthSessionEntity) private readonly sessions: Repository<AuthSessionEntity>,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieName = this.config.getOrThrow<string>("sessionCookieName");
    const rawToken = (request.cookies as Record<string, string> | undefined)?.[cookieName];
    if (!rawToken) throw new UnauthorizedException("Sign in is required.");
    const session = await this.sessions.findOne({ where: { tokenHash: sha256(rawToken) }, relations: { user: true } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException("Your session has expired.");
    session.lastSeenAt = new Date();
    await this.sessions.save(session);
    (request as AuthenticatedRequest).user = session.user;
    return true;
  }
}
