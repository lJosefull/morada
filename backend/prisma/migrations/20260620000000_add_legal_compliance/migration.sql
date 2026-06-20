-- Migration: Add legal compliance tables
-- Description: Tables for consent tracking, legal audit logs, and data subject requests

-- Table: UserConsent
-- Stores evidence of user consent for data treatment, terms acceptance, and marketing
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,          -- 'terms', 'data_treatment', 'commercial', 'cookies'
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- Index for quick lookups by user
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");
CREATE INDEX "UserConsent_type_idx" ON "UserConsent"("type");
CREATE UNIQUE INDEX "UserConsent_userId_type_key" ON "UserConsent"("userId", "type");

-- Table: LegalAuditLog
-- Records all actions with legal significance for audit trail
CREATE TABLE "LegalAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,         -- 'account_created', 'account_deleted', 'consent_given', 'consent_revoked', 'data_exported', 'content_reported', 'account_suspended', 'password_changed', 'profile_updated'
    "entityType" TEXT,              -- 'User', 'Property', 'Inquiry', 'Review', 'Consent'
    "entityId" TEXT,                -- ID of the affected entity
    "details" JSONB,                -- Arbitrary metadata about the action
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LegalAuditLog_userId_idx" ON "LegalAuditLog"("userId");
CREATE INDEX "LegalAuditLog_action_idx" ON "LegalAuditLog"("action");
CREATE INDEX "LegalAuditLog_createdAt_idx" ON "LegalAuditLog"("createdAt");
CREATE INDEX "LegalAuditLog_entityType_entityId_idx" ON "LegalAuditLog"("entityType", "entityId");

-- Table: DataSubjectRequest
-- Tracks GDPR/Law 1581 data subject requests (access, deletion, rectification)
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,          -- Email of the requester (in case account is deleted)
    "requestType" TEXT NOT NULL,    -- 'access', 'deletion', 'rectification', 'restriction', 'portability'
    "status" TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'rejected'
    "details" TEXT,                 -- Description of the request
    "adminNotes" TEXT,              -- Internal notes from ViewSoft
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");
CREATE INDEX "DataSubjectRequest_email_idx" ON "DataSubjectRequest"("email");
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- Table: ContentReport
-- Tracks reports of inappropriate/fraudulent content
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,              -- User who reported (nullable for anonymous)
    "reporterEmail" TEXT,
    "entityType" TEXT NOT NULL,     -- 'Property', 'Review', 'User', 'Inquiry'
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,         -- 'fraudulent', 'false_info', 'copyright', 'inappropriate', 'other'
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'reviewing', 'resolved', 'dismissed'
    "resolution" TEXT,              -- Notes on how it was resolved
    "resolvedById" TEXT,            -- Admin who resolved it
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentReport_entityType_entityId_idx" ON "ContentReport"("entityType", "entityId");
CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");

-- Add foreign key constraints
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAuditLog" ADD CONSTRAINT "LegalAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
