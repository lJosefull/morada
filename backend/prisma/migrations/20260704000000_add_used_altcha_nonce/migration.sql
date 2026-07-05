-- Migration: Add UsedAltchaNonce table for one-time use altcha challenges
-- Prevents replay attacks by ensuring each challenge can only be used once

CREATE TABLE "UsedAltchaNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedAltchaNonce_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsedAltchaNonce_nonce_key" ON "UsedAltchaNonce"("nonce");
CREATE INDEX "UsedAltchaNonce_createdAt_idx" ON "UsedAltchaNonce"("createdAt");
