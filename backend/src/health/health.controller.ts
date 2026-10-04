import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get("live")
  live() { return { ok: true, service: "novapdf-request-signatures", version: "0.12.8" }; }

  @Get("ready")
  async ready() {
    await this.dataSource.query("SELECT 1");
    return { ok: true, database: "ready" };
  }
}
