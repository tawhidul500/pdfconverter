import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SignatureFieldType } from "../../common/enums";
import { RecipientEntity } from "./recipient.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("signature_request_fields")
@Index(["requestId", "pageNumber"])
export class SignatureFieldEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "request_id", type: "uuid" }) requestId: string;
  @ManyToOne(() => SignatureRequestEntity, (request) => request.fields, { onDelete: "CASCADE" }) @JoinColumn({ name: "request_id" }) request: SignatureRequestEntity;
  @Column({ name: "recipient_id", type: "uuid" }) recipientId: string;
  @ManyToOne(() => RecipientEntity, (recipient) => recipient.fields, { onDelete: "CASCADE" }) @JoinColumn({ name: "recipient_id" }) recipient: RecipientEntity;
  @Column({ name: "page_number", type: "integer" }) pageNumber: number;
  @Column({ type: "enum", enum: SignatureFieldType, enumName: "signature_field_type_enum" }) type: SignatureFieldType;
  @Column({ type: "double precision" }) x: number;
  @Column({ type: "double precision" }) y: number;
  @Column({ type: "double precision" }) width: number;
  @Column({ type: "double precision" }) height: number;
  @Column({ type: "double precision", default: 0 }) rotation: number;
  @Column({ type: "boolean", default: false }) required: boolean;
  @Column({ type: "varchar", length: 120, nullable: true }) label: string | null;
  @Column({ name: "default_value", type: "text", nullable: true }) defaultValue: string | null;
  @Column({ type: "jsonb", default: () => "'{}'::jsonb" }) style: Record<string, unknown>;
}
