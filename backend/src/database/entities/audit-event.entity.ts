import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AuditActorType } from "../../common/enums";
import { RecipientEntity } from "./recipient.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("signature_request_audit_events")
@Index(["requestId", "createdAt"])
export class AuditEventEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "request_id", type: "uuid" }) requestId: string;
  @ManyToOne(() => SignatureRequestEntity, (request) => request.auditEvents, { onDelete: "CASCADE" }) @JoinColumn({ name: "request_id" }) request: SignatureRequestEntity;
  @Column({ name: "recipient_id", type: "uuid", nullable: true }) recipientId: string | null;
  @ManyToOne(() => RecipientEntity, (recipient) => recipient.auditEvents, { onDelete: "SET NULL", nullable: true }) @JoinColumn({ name: "recipient_id" }) recipient: RecipientEntity | null;
  @Column({ name: "actor_type", type: "enum", enum: AuditActorType, enumName: "audit_actor_type_enum" }) actorType: AuditActorType;
  @Column({ name: "actor_id", type: "varchar", length: 120, nullable: true }) actorId: string | null;
  @Column({ name: "event_type", type: "varchar", length: 100 }) eventType: string;
  @Column({ name: "ip_hash", type: "varchar", length: 64, nullable: true }) ipHash: string | null;
  @Column({ name: "user_agent", type: "varchar", length: 500, nullable: true }) userAgent: string | null;
  @Column({ type: "jsonb", default: () => "'{}'::jsonb" }) metadata: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
}
