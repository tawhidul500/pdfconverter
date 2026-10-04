import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { CurrentUser } from "./current-user.decorator";
import { SessionAuthGuard } from "./session-auth.guard";
import type { UserEntity } from "../database/entities";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post("register") async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(dto); this.setCookie(response, session.token, session.expiresAt); return session.user;
  }
  @Post("login") async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto); this.setCookie(response, session.token, session.expiresAt); return session.user;
  }
  @Post("logout") async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const name = this.config.getOrThrow<string>("sessionCookieName");
    await this.auth.logout((request.cookies as Record<string, string> | undefined)?.[name]);
    response.clearCookie(name, { path: "/api/v1", sameSite: "lax", secure: this.config.getOrThrow<boolean>("cookieSecure") });
    return { ok: true };
  }
  @Get("me") @UseGuards(SessionAuthGuard) @ApiCookieAuth()
  me(@CurrentUser() user: UserEntity) { return { id: user.id, email: user.email, displayName: user.displayName }; }

  private setCookie(response: Response, token: string, expires: Date) {
    response.cookie(this.config.getOrThrow<string>("sessionCookieName"), token, {
      httpOnly: true, secure: this.config.getOrThrow<boolean>("cookieSecure"), sameSite: "lax", path: "/api/v1", expires,
    });
  }
}
