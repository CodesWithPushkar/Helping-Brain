-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
