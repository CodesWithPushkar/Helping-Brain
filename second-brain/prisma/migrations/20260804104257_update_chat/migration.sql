/*
  Warnings:

  - You are about to drop the column `workspace_id` on the `Chat` table. All the data in the column will be lost.
  - Added the required column `page_id` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_workspace_id_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "workspace_id",
ADD COLUMN     "page_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
