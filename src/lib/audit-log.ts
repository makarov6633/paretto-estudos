import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type AuditAction =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'access.denied'
  | 'access.granted'
  | 'user.login'
  | 'user.logout'
  | 'content.accessed';

export type AuditMetadata = Record<string, unknown>;

/**
 * Audit logging system
 * Logs security-relevant events for compliance and debugging
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  metadata?: AuditMetadata
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO audit_log (id, "userId", action, metadata, "createdAt")
      VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${action},
        ${JSON.stringify(metadata || {})},
        NOW()
      )
    `);
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break the app
    console.error('Audit log failed:', error);
  }
}

/**
 * Create audit_log table if it doesn't exist
 * Run this migration separately or add to drizzle migrations
 */
export const auditLogMigration = `
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log("userId");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log("createdAt");
`;
