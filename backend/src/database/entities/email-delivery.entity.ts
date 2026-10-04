import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EmailDeliveryStatus, EmailKind } from "../../common/enums";
import { RecipientEntity } from "./recipient.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("signature_request_email_deliveries")
export class EmailDeliveryEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "request_id", type: "uuid" }) requestId: string;
  @ManyToOne(() => SignatureRequestEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "request_id" }) request: SignatureRequestEntity;
  @Column({ name: "recipient_id", type: "uuid", nullable: true }) recipientId: string | null;
  @ManyToOne(() => RecipientEntity, (recipient) => recipient.emailDeliveries, { onDelete: "CASCADE", nullable: true }) @JoinColumn({ name: "recipient_id" }) recipient: RecipientEntity | null;
  @Column({ type: "enum", enum: EmailKind, enumName: "email_kind_enum" }) kind: EmailKind;
  @Index() @Column({ type: "enum", enum: EmailDeliveryStatus, enumName: "email_delivery_status_enum", default: EmailDeliveryStatus.QUEUED }) status: EmailDeliveryStatus;
  @Index() @Column({ name: "provider_message_id", type: "varchar", length: 255, nullable: true }) providerMessageId: string | null;
  @Column({ name: "last_error", type: "text", nullable: true }) lastError: string | null;
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt: Date | null;
  @Column({ name: "delivered_at", type: "timestamptz", nullable: true }) deliveredAt: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
}
