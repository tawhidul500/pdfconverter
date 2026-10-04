import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSignatureRequestBackend1721800000000 implements MigrationInterface {
  name = "CreateSignatureRequestBackend1721800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`CREATE TYPE signing_mode_enum AS ENUM ('PARALLEL','SEQUENTIAL')`);
    await queryRunner.query(`CREATE TYPE signature_request_status_enum AS ENUM ('DRAFT','SENT','DELIVERED','VIEWED','PARTIALLY_SIGNED','COMPLETED','DECLINED','EXPIRED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE recipient_status_enum AS ENUM ('WAITING','READY','SENT','DELIVERED','VIEWED','COMPLETED','DECLINED','EXPIRED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE signature_field_type_enum AS ENUM ('SIGNATURE','INITIALS','NAME','DATE','TEXT','INPUT','CHECKBOX','STAMP')`);
    await queryRunner.query(`CREATE TYPE audit_actor_type_enum AS ENUM ('SENDER','RECIPIENT','SYSTEM','EMAIL_PROVIDER')`);
    await queryRunner.query(`CREATE TYPE email_kind_enum AS ENUM ('INVITATION','REMINDER','COMPLETED','DECLINED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE email_delivery_status_enum AS ENUM ('QUEUED','SENT','DELIVERED','BOUNCED','FAILED')`);

    await queryRunner.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email citext NOT NULL UNIQUE, display_name varchar(120) NOT NULL,
      password_hash varchar(100) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE auth_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash varchar(64) NOT NULL UNIQUE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL, revoked_at timestamptz, last_seen_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name varchar(255) NOT NULL, mime_type varchar(100) NOT NULL, size bigint NOT NULL, sha256 varchar(64) NOT NULL,
      storage_key varchar(500) NOT NULL UNIQUE, completed_storage_key varchar(500), completed_sha256 varchar(64), completed_size bigint,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE signature_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id uuid NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE, title varchar(180) NOT NULL, message text,
      signing_mode signing_mode_enum NOT NULL, status signature_request_status_enum NOT NULL DEFAULT 'DRAFT', expires_at timestamptz NOT NULL,
      sent_at timestamptz, completed_at timestamptz, declined_at timestamptz, cancelled_at timestamptz,
      version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX idx_signature_requests_sender ON signature_requests(sender_id)`);
    await queryRunner.query(`CREATE INDEX idx_signature_requests_status ON signature_requests(status)`);
    await queryRunner.query(`CREATE TABLE signature_request_recipients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
      name varchar(120) NOT NULL, email citext NOT NULL, order_index integer NOT NULL, status recipient_status_enum NOT NULL DEFAULT 'WAITING',
      token_hash varchar(64), token_expires_at timestamptz, sent_at timestamptz, delivered_at timestamptz, viewed_at timestamptz,
      completed_at timestamptz, declined_at timestamptz, decline_reason text, reminder_count integer NOT NULL DEFAULT 0,
      last_reminder_at timestamptz, completion_data jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_recipient_email UNIQUE(request_id,email), CONSTRAINT uq_recipient_order UNIQUE(request_id,order_index)
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_recipient_token_hash ON signature_request_recipients(token_hash) WHERE token_hash IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_recipient_status ON signature_request_recipients(status)`);
    await queryRunner.query(`CREATE TABLE signature_request_fields (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
      recipient_id uuid NOT NULL REFERENCES signature_request_recipients(id) ON DELETE CASCADE, page_number integer NOT NULL,
      type signature_field_type_enum NOT NULL, x double precision NOT NULL, y double precision NOT NULL,
      width double precision NOT NULL, height double precision NOT NULL, rotation double precision NOT NULL DEFAULT 0,
      required boolean NOT NULL DEFAULT false, label varchar(120), default_value text, style jsonb NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT ck_field_page CHECK (page_number > 0), CONSTRAINT ck_field_x CHECK (x >= 0 AND x <= 1),
      CONSTRAINT ck_field_y CHECK (y >= 0 AND y <= 1), CONSTRAINT ck_field_width CHECK (width > 0 AND width <= 1),
      CONSTRAINT ck_field_height CHECK (height > 0 AND height <= 1)
    )`);
    await queryRunner.query(`CREATE INDEX idx_signature_fields_request_page ON signature_request_fields(request_id,page_number)`);
    await queryRunner.query(`CREATE TABLE signature_request_audit_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
      recipient_id uuid REFERENCES signature_request_recipients(id) ON DELETE SET NULL, actor_type audit_actor_type_enum NOT NULL,
      actor_id varchar(120), event_type varchar(100) NOT NULL, ip_hash varchar(64), user_agent varchar(500),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX idx_audit_request_created ON signature_request_audit_events(request_id,created_at)`);
    await queryRunner.query(`CREATE TABLE signature_request_email_deliveries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
      recipient_id uuid REFERENCES signature_request_recipients(id) ON DELETE CASCADE, kind email_kind_enum NOT NULL,
      status email_delivery_status_enum NOT NULL DEFAULT 'QUEUED', provider_message_id varchar(255), last_error text,
      sent_at timestamptz, delivered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX idx_email_delivery_status ON signature_request_email_deliveries(status)`);
    await queryRunner.query(`CREATE INDEX idx_email_provider_message ON signature_request_email_deliveries(provider_message_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_completed_email_per_request ON signature_request_email_deliveries(request_id,kind) WHERE recipient_id IS NULL AND kind = 'COMPLETED'`);
    await queryRunner.query(`CREATE OR REPLACE FUNCTION reject_audit_event_mutation() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'signature request audit events are append-only'; END; $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON signature_request_audit_events FOR EACH ROW EXECUTE FUNCTION reject_audit_event_mutation()`);
    await queryRunner.query(`CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON signature_request_audit_events FOR EACH ROW EXECUTE FUNCTION reject_audit_event_mutation()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_events_no_delete ON signature_request_audit_events`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_events_no_update ON signature_request_audit_events`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS reject_audit_event_mutation`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_request_email_deliveries`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_request_audit_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_request_fields`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_request_recipients`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS auth_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS email_delivery_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS email_kind_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_actor_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS signature_field_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS recipient_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS signature_request_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS signing_mode_enum`);
  }
}
