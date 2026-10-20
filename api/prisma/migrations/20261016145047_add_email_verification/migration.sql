/*
  Warnings:

  - You are about to drop the column `verificationToken` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_verificationToken_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "verificationToken",
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCodeHash" TEXT;
