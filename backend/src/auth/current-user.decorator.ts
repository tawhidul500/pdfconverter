import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { UserEntity } from "../database/entities";

export type AuthenticatedRequest = Request & { user: UserEntity };

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserEntity => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
});
