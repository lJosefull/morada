-- AlterTable: add Google OAuth fields
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
