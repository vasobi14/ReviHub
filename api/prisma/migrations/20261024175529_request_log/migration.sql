-- CreateTable
CREATE TABLE "request_log" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "route" TEXT,
    "status" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "userId" INTEGER,
    "visitorId" TEXT NOT NULL,
    "ipEncrypted" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "request_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_log_createdAt_idx" ON "request_log"("createdAt");

-- CreateIndex
CREATE INDEX "request_log_userId_createdAt_idx" ON "request_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "request_log_visitorId_createdAt_idx" ON "request_log"("visitorId", "createdAt");

-- AddForeignKey
ALTER TABLE "request_log" ADD CONSTRAINT "request_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
