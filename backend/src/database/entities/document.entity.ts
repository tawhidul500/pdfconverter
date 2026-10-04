import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("documents")
export class DocumentEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "owner_id", type: "uuid" }) ownerId: string;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "owner_id" }) owner: UserEntity;
  @Column({ name: "original_name", type: "varchar", length: 255 }) originalName: string;
  @Column({ name: "mime_type", type: "varchar", length: 100 }) mimeType: string;
  @Column({ type: "bigint" }) size: string;
  @Column({ type: "varchar", length: 64 }) sha256: string;
  @Column({ name: "storage_key", type: "varchar", length: 500, unique: true }) storageKey: string;
  @Column({ name: "completed_storage_key", type: "varchar", length: 500, nullable: true }) completedStorageKey: string | null;
  @Column({ name: "completed_sha256", type: "varchar", length: 64, nullable: true }) completedSha256: string | null;
  @Column({ name: "completed_size", type: "bigint", nullable: true }) completedSize: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @OneToOne(() => SignatureRequestEntity, (request) => request.document) request: SignatureRequestEntity;
}
