import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AuthSessionEntity } from "./auth-session.entity";
import { SignatureRequestEntity } from "./signature-request.entity";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "citext", unique: true }) email: string;
  @Column({ name: "display_name", type: "varchar", length: 120 }) displayName: string;
  @Column({ name: "password_hash", type: "varchar", length: 100 }) passwordHash: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
  @OneToMany(() => AuthSessionEntity, (session) => session.user) sessions: AuthSessionEntity[];
  @OneToMany(() => SignatureRequestEntity, (request) => request.sender) signatureRequests: SignatureRequestEntity[];
}
