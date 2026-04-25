-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB,
ADD COLUMN     "jumuiaId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "jumuia_chat_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "jumuiaId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "jumuia_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumuia_chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "attachments" JSONB,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" JSONB,

    CONSTRAINT "jumuia_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumuia_chat_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jumuia_chat_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumuia_mentions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jumuia_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumuia_read_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jumuia_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jumuia_chat_rooms_jumuiaId_idx" ON "jumuia_chat_rooms"("jumuiaId");

-- CreateIndex
CREATE UNIQUE INDEX "jumuia_chat_rooms_jumuiaId_name_key" ON "jumuia_chat_rooms"("jumuiaId", "name");

-- CreateIndex
CREATE INDEX "jumuia_chat_messages_roomId_createdAt_idx" ON "jumuia_chat_messages"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "jumuia_chat_messages_userId_idx" ON "jumuia_chat_messages"("userId");

-- CreateIndex
CREATE INDEX "jumuia_chat_messages_replyToId_idx" ON "jumuia_chat_messages"("replyToId");

-- CreateIndex
CREATE INDEX "jumuia_chat_messages_isDeleted_idx" ON "jumuia_chat_messages"("isDeleted");

-- CreateIndex
CREATE INDEX "jumuia_chat_reactions_messageId_idx" ON "jumuia_chat_reactions"("messageId");

-- CreateIndex
CREATE INDEX "jumuia_chat_reactions_userId_idx" ON "jumuia_chat_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "jumuia_chat_reactions_messageId_userId_reaction_key" ON "jumuia_chat_reactions"("messageId", "userId", "reaction");

-- CreateIndex
CREATE INDEX "jumuia_mentions_userId_readAt_idx" ON "jumuia_mentions"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "jumuia_mentions_messageId_userId_key" ON "jumuia_mentions"("messageId", "userId");

-- CreateIndex
CREATE INDEX "jumuia_read_receipts_messageId_idx" ON "jumuia_read_receipts"("messageId");

-- CreateIndex
CREATE INDEX "jumuia_read_receipts_userId_idx" ON "jumuia_read_receipts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "jumuia_read_receipts_messageId_userId_key" ON "jumuia_read_receipts"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_jumuiaId_fkey" FOREIGN KEY ("jumuiaId") REFERENCES "Jumuia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_rooms" ADD CONSTRAINT "jumuia_chat_rooms_jumuiaId_fkey" FOREIGN KEY ("jumuiaId") REFERENCES "Jumuia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_messages" ADD CONSTRAINT "jumuia_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_messages" ADD CONSTRAINT "jumuia_chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "jumuia_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_messages" ADD CONSTRAINT "jumuia_chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "jumuia_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_reactions" ADD CONSTRAINT "jumuia_chat_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "jumuia_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_chat_reactions" ADD CONSTRAINT "jumuia_chat_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_mentions" ADD CONSTRAINT "jumuia_mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "jumuia_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_mentions" ADD CONSTRAINT "jumuia_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_read_receipts" ADD CONSTRAINT "jumuia_read_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "jumuia_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuia_read_receipts" ADD CONSTRAINT "jumuia_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
