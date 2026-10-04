import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { UserEntity } from "../database/entities";
import { SignatureRequestsService } from "./signature-requests.service";

@ApiTags("signature requests")
@ApiCookieAuth()
@UseGuards(SessionAuthGuard)
@Controller("signature-requests")
export class SignatureRequestsController {
  constructor(private readonly service: SignatureRequestsService) {}
  @Post() @ApiConsumes("multipart/form-data") @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } }))
  create(@CurrentUser() user: UserEntity, @UploadedFile() file: Express.Multer.File | undefined, @Body("metadata") metadata: string | undefined, @Req() request: Request) {
    return this.service.create(user, file, metadata, context(request));
  }
  @Get() list(@CurrentUser() user: UserEntity) { return this.service.list(user.id); }
  @Get(":id") get(@Param("id") id: string, @CurrentUser() user: UserEntity) { return this.service.get(id, user.id); }
  @Post(":id/send") send(@Param("id") id: string, @CurrentUser() user: UserEntity, @Req() request: Request) { return this.service.send(id, user, context(request)); }
  @Post(":id/remind") remind(@Param("id") id: string, @Body("recipientId") recipientId: string | undefined, @CurrentUser() user: UserEntity, @Req() request: Request) { return this.service.remind(id, user, recipientId, context(request)); }
  @Post(":id/cancel") cancel(@Param("id") id: string, @CurrentUser() user: UserEntity, @Req() request: Request) { return this.service.cancel(id, user, context(request)); }
  @Get(":id/audit") audit(@Param("id") id: string, @CurrentUser() user: UserEntity) { return this.service.auditTimeline(id, user.id); }
  @Get(":id/completed-download") download(@Param("id") id: string, @CurrentUser() user: UserEntity) { return this.service.completedDownload(id, user.id); }
}
function context(request: Request) { return { ip: request.ip, userAgent: request.get("user-agent") }; }
