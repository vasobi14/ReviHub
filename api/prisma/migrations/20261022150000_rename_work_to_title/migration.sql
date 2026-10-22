
ALTER TABLE "work" RENAME TO "title";
ALTER TABLE "title" RENAME COLUMN "title" TO "name";
ALTER SEQUENCE "work_id_seq" RENAME TO "title_id_seq";
ALTER TABLE "title" RENAME CONSTRAINT "work_pkey" TO "title_pkey";
ALTER TABLE "title" RENAME CONSTRAINT "work_createdById_fkey" TO "title_createdById_fkey";

ALTER TABLE "review" RENAME COLUMN "workId" TO "titleId";
ALTER TABLE "review" RENAME CONSTRAINT "review_workId_fkey" TO "review_titleId_fkey";
ALTER INDEX "review_workId_userId_key" RENAME TO "review_titleId_userId_key";

ALTER TABLE "title" RENAME CONSTRAINT "work_id_not_null" TO "title_id_not_null";
ALTER TABLE "title" RENAME CONSTRAINT "work_title_not_null" TO "title_name_not_null";
ALTER TABLE "title" RENAME CONSTRAINT "work_type_not_null" TO "title_type_not_null";
ALTER TABLE "title" RENAME CONSTRAINT "work_createdAt_not_null" TO "title_createdAt_not_null";
ALTER TABLE "title" RENAME CONSTRAINT "work_createdById_not_null" TO "title_createdById_not_null";
ALTER TABLE "review" RENAME CONSTRAINT "review_workId_not_null" TO "review_titleId_not_null";
