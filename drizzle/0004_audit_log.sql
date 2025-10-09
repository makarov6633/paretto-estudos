-- Audit log table for security events
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log("userId");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log("createdAt");
