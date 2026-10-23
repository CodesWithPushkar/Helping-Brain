-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "last_summary_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "summary" TEXT;
