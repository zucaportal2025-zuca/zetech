/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Jumuia` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Jumuia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "jumuiaId" TEXT;

-- AlterTable
ALTER TABLE "Jumuia" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MassProgram" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "jumuiaId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedJumuiaId" TEXT,
ADD COLUMN     "lastRoleLogin" TIMESTAMP(3),
ADD COLUMN     "specialRole" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Jumuia_code_key" ON "Jumuia"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedJumuiaId_fkey" FOREIGN KEY ("assignedJumuiaId") REFERENCES "Jumuia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_jumuiaId_fkey" FOREIGN KEY ("jumuiaId") REFERENCES "Jumuia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MassProgram" ADD CONSTRAINT "MassProgram_jumuiaId_fkey" FOREIGN KEY ("jumuiaId") REFERENCES "Jumuia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MassProgram" ADD CONSTRAINT "MassProgram_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
