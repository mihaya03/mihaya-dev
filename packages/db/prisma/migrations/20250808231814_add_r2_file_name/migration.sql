/*
  Warnings:

  - A unique constraint covering the columns `[r2FileName]` on the table `post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `post` ADD COLUMN `r2FileName` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `post_r2FileName_key` ON `post`(`r2FileName`);
