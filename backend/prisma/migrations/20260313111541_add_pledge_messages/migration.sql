-- CreateTable
CREATE TABLE "PledgeMessage" (
    "id" TEXT NOT NULL,
    "pledgeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PledgeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PledgeMessage_pledgeId_idx" ON "PledgeMessage"("pledgeId");

-- CreateIndex
CREATE INDEX "PledgeMessage_createdAt_idx" ON "PledgeMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "PledgeMessage" ADD CONSTRAINT "PledgeMessage_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "Pledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PledgeMessage" ADD CONSTRAINT "PledgeMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
