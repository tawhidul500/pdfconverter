import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { SigningMode, SignatureRequestStatus } from "../../common/enums";
import { AuditEventEntity } from "./audit-event.entity";
import { DocumentEntity } from "./document.entity";
import { RecipientEntity } from "./recipient.entity";
import { SignatureFieldEntity } from "./signature-field.entity";
import { UserEntity } from "./user.entity";

@Entity("signature_requests")
export class SignatureRequestEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "sender_id", type: "uuid" }) senderId: string;
  @ManyToOne(() => UserEntity, (user) => user.signatureRequests, { onDelete: "CASCADE" }) @JoinColumn({ name: "sender_id" }) sender: UserEntity;
  @Column({ name: "document_id", type: "uuid", unique: true }) documentId: string;
  @OneToOne(() => DocumentEntity, (document) => document.request, { onDelete: "CASCADE" }) @JoinColumn({ name: "document_id" }) document: DocumentEntity;
  @Column({ type: "varchar", length: 180 }) title: string;
  @Column({ type: "text", nullable: true }) message: string | null;
  @Column({ name: "signing_mode", type: "enum", enum: SigningMode, enumName: "signing_mode_enum" }) signingMode: SigningMode;
  @Index() @Column({ type: "enum", enum: SignatureRequestStatus, enumName: "signature_request_status_enum", default: SignatureRequestStatus.DRAFT }) status: SignatureRequestStatus;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt: Date;
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt: Date | null;
  @Column({ name: "completed_at", type: "timestamptz", nullable: true }) completedAt: Date | null;
  @Column({ name: "declined_at", type: "timestamptz", nullable: true }) declinedAt: Date | null;
  @Column({ name: "cancelled_at", type: "timestamptz", nullable: true }) cancelledAt: Date | null;
  @VersionColumn({ type: "integer" }) version: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
  @OneToMany(() => RecipientEntity, (recipient) => recipient.request, { cascade: true }) recipients: RecipientEntity[];
  @OneToMany(() => SignatureFieldEntity, (field) => field.request, { cascade: true }) fields: SignatureFieldEntity[];
  @OneToMany(() => AuditEventEntity, (event) => event.request) auditEvents: AuditEventEntity[];
}
