/*
  Warnings:

  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parent_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_folder_id_fkey";

-- DropTable
DROP TABLE "Folder";

-- DropTable
DROP TABLE "Note";

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "parent_page_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Page_workspace_id_idx" ON "Page"("workspace_id");

-- CreateIndex
CREATE INDEX "Page_parent_page_id_idx" ON "Page"("parent_page_id");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parent_page_id_fkey" FOREIGN KEY ("parent_page_id") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
