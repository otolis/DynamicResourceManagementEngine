-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockoutUntil" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "verificationExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");
