import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("auth_sessions")
export class AuthSessionEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index({ unique: true }) @Column({ name: "token_hash", type: "varchar", length: 64 }) tokenHash: string;
  @Column({ name: "user_id", type: "uuid" }) userId: string;
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" }) user: UserEntity;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt: Date | null;
  @Column({ name: "last_seen_at", type: "timestamptz" }) lastSeenAt: Date;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
}
