import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { SignerService } from "./signer.service";

@ApiTags("signer")
@Controller("signer")
export class SignerController {
  constructor(private readonly service: SignerService) {}
  @Get(":token") review(@Param("token") token: string, @Req() request: Request) { return this.service.review(token, context(request)); }
  @Post(":token/complete") complete(@Param("token") token: string, @Body() body: unknown, @Req() request: Request) { return this.service.complete(token, body, context(request)); }
  @Post(":token/decline") decline(@Param("token") token: string, @Body("reason") reason: string | undefined, @Req() request: Request) { return this.service.decline(token, reason, context(request)); }
}
function context(request: Request) { return { ip: request.ip, userAgent: request.get("user-agent") }; }
