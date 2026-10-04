import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthSessionEntity, UserEntity } from "../database/entities";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionAuthGuard } from "./session-auth.guard";

@Module({ imports: [TypeOrmModule.forFeature([UserEntity, AuthSessionEntity])], controllers: [AuthController], providers: [AuthService, SessionAuthGuard], exports: [SessionAuthGuard] })
export class AuthModule {}
