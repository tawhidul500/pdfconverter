import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RecipientStatus } from "../../common/enums";
import { AuditEventEntity } from "./audit-event.entity";
import { EmailDeliveryEntity } from "./email-delivery.entity";
import { SignatureFieldEntity } from "./signature-field.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("signature_request_recipients")
@Index(["requestId", "email"], { unique: true })
@Index(["requestId", "orderIndex"], { unique: true })
export class RecipientEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "request_id", type: "uuid" }) requestId: string;
  @ManyToOne(() => SignatureRequestEntity, (request) => request.recipients, { onDelete: "CASCADE" }) @JoinColumn({ name: "request_id" }) request: SignatureRequestEntity;
  @Column({ type: "varchar", length: 120 }) name: string;
  @Column({ type: "citext" }) email: string;
  @Column({ name: "order_index", type: "integer" }) orderIndex: number;
  @Index() @Column({ type: "enum", enum: RecipientStatus, enumName: "recipient_status_enum", default: RecipientStatus.WAITING }) status: RecipientStatus;
  @Index({ unique: true, where: '"token_hash" IS NOT NULL' }) @Column({ name: "token_hash", type: "varchar", length: 64, nullable: true }) tokenHash: string | null;
  @Column({ name: "token_expires_at", type: "timestamptz", nullable: true }) tokenExpiresAt: Date | null;
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt: Date | null;
  @Column({ name: "delivered_at", type: "timestamptz", nullable: true }) deliveredAt: Date | null;
  @Column({ name: "viewed_at", type: "timestamptz", nullable: true }) viewedAt: Date | null;
  @Column({ name: "completed_at", type: "timestamptz", nullable: true }) completedAt: Date | null;
  @Column({ name: "declined_at", type: "timestamptz", nullable: true }) declinedAt: Date | null;
  @Column({ name: "decline_reason", type: "text", nullable: true }) declineReason: string | null;
  @Column({ name: "reminder_count", type: "integer", default: 0 }) reminderCount: number;
  @Column({ name: "last_reminder_at", type: "timestamptz", nullable: true }) lastReminderAt: Date | null;
  @Column({ name: "completion_data", type: "jsonb", nullable: true }) completionData: Record<string, unknown> | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
  @OneToMany(() => SignatureFieldEntity, (field) => field.recipient) fields: SignatureFieldEntity[];
  @OneToMany(() => AuditEventEntity, (event) => event.recipient) auditEvents: AuditEventEntity[];
  @OneToMany(() => EmailDeliveryEntity, (delivery) => delivery.recipient) emailDeliveries: EmailDeliveryEntity[];
}
